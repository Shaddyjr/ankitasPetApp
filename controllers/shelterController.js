var fetch = require("node-fetch");
const { JSDOM } = require("jsdom");
const dom = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
console.log(dom.window.document.querySelector("p").textContent);
module.exports = function (app, dbHandler) {
    const BASE_URL = "http://api.petfinder.com/";
    const API_KEY = process.env.API_KEY;

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
            const api_id = shelter.id.$t;
            dbHandler.findById("shelters",api_id).then(row => {
                if(row) res(row);
                dbHandler.insertData(
                    "shelters",
                    shelter.id.$t,
                    shelter.name.$t,
                    `${shelter.zip.$t} ${shelter.city.$t}, ${shelter.state.$t}`,
                    shelter.email.$t,
                    null,
                    null
                ).then(dbShelter=>res(dbShelter));
            });
        });
    }
    
    const parseFormUrl = URL => {
        return new Promise((res,rej)=>{
            fetch(URL)
                .then(response=>response.text())
                .then(htmlText=>{
                    const start = htmlText.search(/<form/);
                    const end = htmlText.search(/form>/);
                    if(start < 0 || end < 0) rej("Could not find a form tag");
                    res(htmlText.slice(start, end+1));
                }, err=>errorHandler(err))
        });
    }

    const createShelterQuestions = (shelterId, formUrl)=>{
        return new Promise((res,rej)=>{
            parseFormUrl(formUrl)
                .then(str=>{
                    console.log(str)
                    res(str);
                });
        });
    }

    const createShelterFromForm = shelterArr => {
        return new Promise((res,rej)=>{
            dbHandler.insertData(
                "shelters",
                shelterArr[0],
                shelterArr[1],
                shelterArr[2],
                shelterArr[3],
                shelterArr[4],
                shelterArr[5]
            ).then(dbShelter=>{
                if(!shelterArr){
                    createShelterQuestions(dbShelter.id, dbShelter.formUrl)
                        .then(data=>{
                            res(dbShelter);
                        });
                }else{
                    res(dbShelter);
                }
            });
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

    const getFormUrl = shelterId => {
        return new Promise((res, rej)=>{
            dbHandler.findById("shelters",shelterId).then(row => {
                if(row){
                    res(row.formUrl);
                }else{
                    rej(`Shelter Id: ${shelterId} could not be found`);
                }
            })
        })
    }

    const updateShelter = function(api_id, body){
        /**
         * Find previous formUrl
         *  if changed:
         *      delete all questions for shelter
         *      create questions for new formUrl
         */
        return new Promise((res,rej)=>{
            createShelterQuestions(api_id, body.formUrl);
            dbHandler.updateData("shelters",[
                body.name,
                body.location,
                body.contact,
                body.url,
                body.formUrl,
                api_id
            ])
        })
    }
    app.get("/shelters", (req, res) => {
        dbHandler.getShelters().then(
            data => {
                res.render("shelters", {
                    "shelters": data
                })
            },
            err => res.render("error", {
                error: err
            })
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
                err => res.render("error", {
                    error: err
                })
            );
    });

    app.post("/shelters/zip", (req, res) => {
        const zip = req.body.zip;
        getApiShelters(zip)
            .then(array => getDbShelters(array));
        res.redirect(`/shelters/zip/${zip}`);
    });

    app.route("/shelters/id/:id")
        .get((req, res) => {
            const api_id = req.params.id;
            dbHandler.findById("shelters",api_id).then(row => {
                if(row){
                    res.render(
                        "shelter",
                        {"shelter":row}
                    )
                }else{
                    res.render(
                        "error",
                        {error:`ID: ${api_id} not found`}
                    )
                }
            })
        })
        .put((req, res) => {
            const api_id = req.params.id;
            dbHandler.findById("shelters",api_id).then(row => {
                getFormUrl(api_id).then()
                if(row){
                    updateShelter(api_id, req.body)
                        .then(()=>{
                            res.redirect(`/shelters/id/${api_id}`);
                        });
                }else{
                    res.render(
                        "error",
                        {error:`ID: ${api_id} not found`}
                    );
                }
            });
        })
        .delete((req, res) => {
            const api_id = req.params.id;
            dbHandler.findById("shelters",api_id).then(row => {
                if(row){
                    dbHandler.deleteData("shelters",api_id)
                        .then(()=>{
                            res.redirect(`/shelters`);
                        });
                }else{
                    res.render(
                        "error",
                        {error:`ID: ${api_id} not found`}
                    );
                }
            });
        });
}