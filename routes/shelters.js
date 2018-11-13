const express = require('express');
const router = express.Router();
const fetch = require("node-fetch");
const API_KEY = process.env.API_KEY;

const parseApiData = json => {
    if(json.petfinder.shelters){
        return json.petfinder.shelters.shelter;
    }else if(json.petfinder.shelter){
        return json.petfinder.shelter;
    }
}

module.exports = dbHandler => {
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
                                blacklisted: shelter.blacklist===1
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
        console.log(req.body);
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

    router.put("/:shelter_id",(req,res)=>{
        const shelter_id = req.params.shelter_id;
        const sqlParams = {};
        if(req.query.reviewed) sqlParams.reviewed = req.query.reviewed;
        if(req.query.blacklist) sqlParams.blacklist = req.query.blacklist;
        dbHandler.updateShelter(shelter_id,sqlParams)
            .then(result=>{
                if(result){
                    res.status(200).send();
                }else{
                    console.log("Error updating shelter (Admin)");
                    res.status(400).send();
                }
            })
    })

    return router;
}