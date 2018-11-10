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
                res.locals.shelter = parseApiData(json);
                res.render("shelter",{title: `Shelter ${shelter_id}`});
            })
            .catch(err=>{
                req.session.msg = {
                    error: "Error: Could not find shelter"
                }
                res.redirect("/shelters");
            })
    });
    return router;
}