var fetch = require("node-fetch");
const API_KEY = process.env.API_KEY;
const ShelterFormatter = require("../shelterFormatter");
const KEY_ITERATION_SEPERATOR = "-!-";

module.exports = function (app, dbHandler) {
    const BASE_URL = "http://api.petfinder.com/";

    const errorHandler = (err,response) => {
        response.render("error",{error:err});
    }

    const validResponse = json => {
        return json.petfinder.header.status.code.$t === "100";
    }

    const getApiShelters = zipcode => {
        return new Promise((res, rej) => {
            // http://api.petfinder.com/shelter.find?key=b09136ae175601f59d62680261eded26&format=json&location=11221
            const URL = `${BASE_URL}shelter.find?key=${API_KEY}&format=json&location=${zipcode}`;
            fetch(URL)
                .then(res => res.json())
                .then(json => {
                    if (validResponse(json)) {
                        const data = json.petfinder.shelters.shelter;
                        res(data);
                    } else {
                        const message = json.petfinder.header.status.message.$t;
                        rej(message);
                    }
                }, err => rej(err));
        });
    }

    const findOrCreateShelterFromAPI = shelter => {
        return new Promise((res,rej)=>{
            const shelterApiId = shelter.id.$t;
            validShelter(shelterApiId)
                .then(res)
                .catch(err=>{
                    dbHandler.insertData(
                        "shelters",
                        shelter.id.$t,
                        shelter.name.$t,
                        `${shelter.zip.$t} ${shelter.city.$t}, ${shelter.state.$t}`,
                        shelter.email.$t,
                        null,
                        null
                    )
                    .then(data=>{
                        if(typeof data === "number"){
                            dbHandler.findById("shelters",data).then(res);
                        }else if(typeof data === "object"){
                            res(data)
                        }else{
                            rej(`Data found was of wrong type: ${typeof data}`);
                        }
                    })
                    .catch(rej)
                });
        });
    }

    const createShelterQuestions = (shelterId, params)=>{
        const data = [];
        for(const key in params){
            const values = params[key];
            if(Array.isArray(values)){
                for(let i = 0; i<values.length; i++){
                    data.push([
                        shelterId,
                        key + KEY_ITERATION_SEPERATOR + i
                    ])
                }
            }else{
                data.push([
                    shelterId,
                    key
                ]);
            }
        }
        return dbHandler.insertMultiple("questions",data);
    }

    const getShelterQuestions = shelter =>{
        return new Promise((res,rej)=>{
            dbHandler.findById("questionsByShelterId",shelter.id)
                .then(rows=>res(rows.length))
                .catch(rej)
        })
    }

    /**
     * Takes array of api shelter objects and returns array of db shelter obj.
     */
    function getDbShelters(shelters){
        return new Promise((res, rej) => {

            const output = [];
            
            const addShelter = shelter => {
                return new Promise((res,rej)=>{
                    findOrCreateShelterFromAPI(shelter)
                    .then(res)
                    .catch(rej)
                })
            }

            (async () => {
                for (const shelter of shelters) {
                    const data = await addShelter(shelter);
                    output.push(data);
                }
                res(output);
            })();
        });
    }

    const validShelter = shelterApiId =>{
        return new Promise((res, rej)=>{
            dbHandler.findById("sheltersByApiId",shelterApiId).then(row => {
                if(row) res(row);
                rej(`Shelter Id: ${shelterApiId} could not be found`);
            })
        })
    }

    const updateShelter = function(shelter,newShelterData){
        const shelterId = shelter.id;
        return new Promise((res,rej)=>{
            dbHandler.updateData("shelters",[
                newShelterData.name,
                newShelterData.location,
                newShelterData.contact,
                newShelterData.url,
                newShelterData.formUrl,
                shelterId
            ])
                .then(numOfRowsChanged=>dbHandler.findById("shelters",shelterId))
                .then(res)
                .catch(rej);
        })
    }

    const handleForm = shelter => {
        return new Promise((res,rej)=>{
            if(!shelter) res([null,shelter]);
            if(shelter.formUrl){
                if(shelter.formUrl.length===0) res([null,shelter])
                getShelterQuestions(shelter)
                    .then(questions=>res([questions,shelter]))
                    .catch(rej)
            }else{
                res([null,shelter]);
            }
        });
    }

    app.get("/shelters", (req, res) => {
        dbHandler.getShelters()
            .then(
                data => {
                    res.render("shelters", {
                        "shelters": data
                    })
                },
                err => errorHandler(err,res)
            );
    });

    app.get("/shelters/zip/:zip", (req, res) => {
        const zip = Number(req.params.zip);
        getApiShelters(zip)
            .then(getDbShelters)
            .then(
                data => res.render("shelters", {
                    "shelters": data
                })
            )
            .catch(err => errorHandler(err,res))
    });

    app.post("/shelters/zip", (req, res) => {
        const zip = req.body.zip;
        res.redirect(`/shelters/zip/${zip}`);
    });

    const showShelter = (row,res) =>{
        res.render(
            "shelter",
            {"shelter":row}
        )
    }

    app.route("/shelters/id/:id")
        .get((req, res) => {
            // SHOULD INCLUDE QUESTIONS
            const shelterApiId = req.params.id;
            validShelter(shelterApiId)
                .then(row=>showShelter(row,res))
                .catch(err=>errorHandler(err,res));
        })
        .post((req,res)=>{
            const shelterApiId = req.params.id;
            validShelter(shelterApiId)
                .then(getShelterQuestions,err=>errorHandler(err,res))
                .then(data=>{
                    if(data) res.redirect(`shelters/id/${shelterApiId}`);
                    return dbHandler.findById("sheltersByApiId",shelterApiId)
                        .then(shelter=>createShelterQuestions(shelter.id, req.body))
                }).catch(err=>errorHandler(err, res))
                .then(()=>{
                    res.redirect(`/shelters/id/${shelterApiId}`);
                })
        })
        .put((req, res) => {
            const shelterApiId = req.params.id;
            validShelter(shelterApiId)
                .then(row=>updateShelter(row,req.body))
                .then(handleForm)
                .then(
                    shelterQuestions=>{
                        const [questions, shelter] = shelterQuestions;
                        const shelterApiId = shelter.api_id;
                        if(questions===0){
                            const shelterFormatter = new ShelterFormatter(shelter.formUrl, shelterApiId);
                            shelterFormatter.getCleanPage()
                                .then(data=>res.send(data)) // https://stackoverflow.com/questions/41801723/express-js-cannot-read-property-req-of-undefined
                                .catch(err=>errorHandler(err,res))
                        }else{
                            showShelter(shelter,res);
                        }
                    },
                    err=>errorHandler(err,res)
                )
        })
        .delete((req, res) => {
            const shelterApiId = req.params.id;
            validShelter(shelterApiId)
                .then(row=>{
                    return dbHandler.deleteData("shelters",shelterApiId)
                }).catch(err=>errorHandler(err, res))
                .then(num=>{
                    console.log(`${num} selter(s) deleted`);
                    return dbHandler.deleteData("questionsByShelterApiId",shelterApiId);
                }).catch(err=>errorHandler(err, res))
                .then(num=>{
                    console.log(`${num} questions(s) deleted`);
                    res.redirect(`/shelters`);
                }).catch(err=>errorHandler(err, res))
        });
}