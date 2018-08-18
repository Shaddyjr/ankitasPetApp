var fetch = require("node-fetch");
const API_KEY = process.env.API_KEY;
const ShelterFormatter = require("../shelterFormatter");

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
            const shelterId = shelter.id.$t;
            dbHandler.findById("shelters",shelterId).then(row => {
                if(row) res(row);
                dbHandler.insertData(
                    "shelters",
                    shelter.id.$t,
                    shelter.name.$t,
                    `${shelter.zip.$t} ${shelter.city.$t}, ${shelter.state.$t}`,
                    shelter.email.$t,
                    null,
                    null
                )
                .then(dbShelter=>res(dbShelter));
            });
        });
    }
    
    // const parseFormUrl = URL => {
    //     return new Promise((res,rej)=>{
    //         fetch(URL)
    //             .then(response=>response.text())
    //             .then(htmlText=>{
    //                 const start = htmlText.search(/<form/);
    //                 const end = htmlText.search(/form>/);
    //                 if(start < 0 || end < 0) rej("Could not find a form tag");
    //                 res(htmlText.slice(start, end+1));
    //             }, err=>errorHandler(err))
    //     });
    // }

    const createShelterQuestions = (shelterId, params)=>{
        // shelterValidity already checked
        // SHOULD ADD to META ANSWERS
        return new Promise((res,rej)=>{
            for(const i in params){

            }
        });
    }

    const getShelterQuestions = shelter =>{
        console.log(shelter);
        const shelterId = shelter.api_id;
        return new Promise((res,rej)=>{
            const statement = dbHandler.find_questions_by_shelterId_statement();
            dbHandler.queryDb(statement,shelterId)
                .then(res)
                .catch(rej);
        });
    }

    /**
     * Takes array of api shelter objects and returns array of db shelter obj.
     */
    async function getDbShelters(shelters){
        const output = [];
        
        const addShelter = shelter => {
            return new Promise((res,rej)=>{
                findOrCreateShelterFromAPI(shelter)
                    .then(data => {
                        output.push(data)
                        res();
                    });
            })
        }
        
        async function loopShelters(){
            for (const shelter of shelters) {
                await addShelter(shelter);
            }
        }

        await loopShelters();
        return new Promise((res, rej) => {
            res(output);
        });
    }

    const validShelter = shelterId =>{
        return new Promise((res, rej)=>{
            dbHandler.findById("shelters",shelterId).then(row => {
                if(row) res(row);
                rej(`Shelter Id: ${shelterId} could not be found`);
            })
        })
    }

    const updateShelter = function(shelter,newShelterData){
        const shelterId = shelter.api_id;
        return new Promise((res,rej)=>{
            dbHandler.updateData("shelters",[
                newShelterData.name,
                newShelterData.location,
                newShelterData.contact,
                newShelterData.url,
                newShelterData.formUrl,
                shelterId
            ]).then(data=>{
                res(shelter,data)
            }).catch(rej);
        })
    }

    const handleForm = (shelter,data) => {
        return new Promise((res,rej)=>{
            if(data!=1) res(shelter,data);
            if(shelter.formUrl){
                getShelterQuestions(shelter)
                    .then(data=>res(shelter,data))
                    .catch(rej);
            }else{
                res(shelter);
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
                }),
                err => errorHandler(err,res)
            );
    });

    app.post("/shelters/zip", (req, res) => {
        const zip = req.body.zip;
        getApiShelters(zip)
            .then(array => getDbShelters(array));
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
            const shelterId = req.params.id;
            validShelter(shelterId)
                .then(row=>showShelter(row,res))
                .catch(err=>errorHandler(err,res));
        })
        .post((req,res)=>{
            const shelterId = req.params.id;
            validShelter(shelterId)
                .then(getShelterQuestions,err=>errorHandler(err,res))
                .then(data=>{
                    if(data) res.redirect(`shelters/id/${shelterId}`);
                    createShelterQuestions(shelterId, req.body)
                        .then(()=>{
                            res.redirect(`shelters/id/${shelterId}`);
                        })
                })
        })
        .put((req, res) => {
            const shelterId = req.params.id;
            validShelter(shelterId)
                .then(row=>updateShelter(row,req.body),err=>errorHandler(err,res))
                .then(handleForm,err=>errorHandler(err,res))
                .then(
                    (shelter,data)=>{
                        console.log("shelter: ", shelter)
                        console.log("data: ", data);
                        if(data){
                            const shelterFormatter = new ShelterFormatter(formUrl, shelterId);
                            shelterFormatter.getCleanPage()
                                .then(res.send);
                        }else{
                            showShelter(shelter,res);
                        }
                    },
                    err=>errorHandler(err,res)
                )
        })
        .delete((req, res) => {
            // NEEDS TO ALSO REMOVE SHELTER QUESTIONS
            const shelterId = req.params.id;
            validShelter(shelterId)
                .then(row=>{
                    dbHandler.deleteData("shelters",shelterId)
                        .then(()=>{
                            res.redirect(`/shelters`);
                        });
                })
                .catch(err=>errorHandler(err, res));
        });
}