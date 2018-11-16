const express = require('express');
const router = express.Router();
const fetch = require("node-fetch");
const API_KEY = process.env.API_KEY;
const ShelterFormHandler = require("./helpers/shelterFormHandler");

const parseApiData = json => {
    if(json.petfinder.shelters){
        return json.petfinder.shelters.shelter;
    }else if(json.petfinder.shelter){
        return json.petfinder.shelter;
    }
}

module.exports = (dbHandler,admingAuthentication) => {
    router.get('/',(req,res)=>{
        res.render("shelters",{title: "Shelters"});
    });

    router.post("/",(req,res)=>{
        const zip = req.body.zip;
        const url = `http://api.petfinder.com/shelter.find?key=${API_KEY}&format=json&location=${zip}`;
        fetch(url)
            .then(data=>data.json())
            .then(json=>{
                res.locals.shelters = parseApiData(json);
                res.render("shelters",{title: "Shelters"});
            })
            .catch(err=>{
                req.session.msg = {
                    error: "Error: Could not find shelters for zip code"
                }
                res.redirect("/shelters");
            })
    });

    router.get('/:shelter_id',(req,res)=>{
        const shelter_id = req.params.shelter_id;
        const url = `http://api.petfinder.com/shelter.get?key=${API_KEY}&format=json&id=${shelter_id}`;
        fetch(url)
            .then(data=>data.json())
            .then(json=>{
                if(!json.petfinder.shelter && !json.petfinder.shelters){
                    req.session.msg = {
                        error: "Error: Could not find shelter"
                    }
                    return res.redirect("/shelters");
                }
                dbHandler.getShelterByApiId(shelter_id)
                    .then(shelter=>{
                        if(shelter){
                            res.locals.shelterInfo = {
                                reviewed: shelter.reviewed===1,
                                blacklisted: shelter.blacklist===1,
                                formUrl: shelter.formUrl,
                                actionUrl: shelter.actionUrl
                            }
                        }
                        res.locals.shelter = parseApiData(json);
                        res.render("shelter",{title: `Shelter ${shelter_id}`});
                    })
                    .catch(err=>{
                        req.session.msg = {
                            error: "Error: Could not find shelter"
                        }
                        res.redirect("/shelters");
                    })
            })
            .catch(err=>{
                req.session.msg = {
                    error: "Error: Could not find shelter"
                }
                res.redirect("/shelters");
            })
    });

    router.post("/:shelter_id",(req,res)=>{
        // POTENTIAL PROBLEM TRUSTING SHELTER_ID PARAM TO CREATE SHELTER IN DB
        const shelter_id = req.params.shelter_id;
        const user_id = req.user.id;
        dbHandler.requestShelterReview(shelter_id,user_id)
            .then(()=>{
                res.status(200).send();
            })
            .catch(err=>{
                console.log(`Error requesting shelter review: ${shelter_id} User: ${user_id} Error:${err}`);
                res.status(400).send("Error: Could request review for shelter");
            })
    });

    router.put("/:shelter_id",admingAuthentication,(req,res)=>{
        const shelter_id = req.params.shelter_id;
        const sqlParams = {};
        if(req.query.reviewed) sqlParams.reviewed = req.query.reviewed;
        if(req.query.blacklist) sqlParams.blacklist = req.query.blacklist;
        if(req.query.formUrl) sqlParams.formUrl = req.query.formUrl;
        if(req.query.actionUrl) sqlParams.actionUrl = req.query.actionUrl;
        dbHandler.updateShelter(shelter_id,sqlParams)
            .then(result=>{
                if(result){
                    res.status(200).send();
                }else{
                    console.log("Error updating shelter (Admin)");
                    res.status(400).send();
                }
            })
    });

    const addShelterFormInputs = async function(shelter_id, formData){
        const shelterExists = await dbHandler.shelterFormInputsExists(shelter_id);
        if(shelterExists) return;
        const keys = Object.keys(formData);
        for(const key of keys){
            const arr = formData[key];
            switch(key){
                case "input":
                    let counter = 1;
                    for(const input of arr){
                        if(input.name.length===0) input.name = `{Empty ${counter++}}`;
                        await dbHandler.insertShelterFormInput(shelter_id, key, input.type, input.name);
                    }
                    break;
                default:
                    throw new Error;
            }
        }
    }

    router.get("/:shelter_id/formUrl",admingAuthentication,(req,res)=>{
        const shelter_id = req.params.shelter_id;
        dbHandler.getShelterByApiId(shelter_id)
            .then(shelter=>{
                if(shelter){
                    if(!shelter.formUrl) return res.send("Shelter does not have formUrl");
                    const shelterFormHandler = new ShelterFormHandler(shelter.formUrl, shelter_id);
                    shelterFormHandler.getCleanPage()
                        .then(data=>{
                            const {html, formData} = data;
                            addShelterFormInputs(shelter_id, formData).then(()=>{
                                res.send(html);
                            })
                        })
                        .catch(err=>{
                            res.send(err);
                        })
                }else{
                    res.send("Could not find shelter");
                }
            })
            .catch(err=>{
                console.log("Err: ", err);
                res.send(err);
            })        
    });

    return router;
}