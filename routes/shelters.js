const express = require('express');
const router = express.Router();
const DbHandler = require("../dbHandler");
const dbHandler = new DbHandler;
const fetch = require("node-fetch");
const API_KEY = process.env.API_KEY;

const getShelter = function(req, res, next){
    const shelterId = req.params.id;
    dbHandler.findById("sheltersByApiId",shelterId)
        .then(shelter=>{
            if(!shelter){
                res.redirect("/shelters");
            }else{
                res.locals.shelter = shelter;
                next();
            }
        })
        .catch(err=>{
            console.log(`Error finding shelter: ${shelterId}`);
            console.log(err);
            res.render("shelters",{
                errors:["Error finding shelter"]
            })
        })
}

const verifyZip = function(req){
    req.checkBody("zip","Must provide a valid zip code").isInt({ min: 0, max: 99999 });
    req.checkBody("zip","Must provide a valid zip code").isLength({min:5, max: 5});
}

router.get("/",(req,res)=>{
    res.render("shelters");
})

router.get('/:id', getShelter, function (req, res) {
    res.render("shelter");
});

const validResponse = json => {
    return json.petfinder.header.status.code.$t === "100";
}

const getSheltersFromApi = function(req, res, next){
    const BASE_URL = "http://api.petfinder.com/";
    const zipcode = req.body.zip;

    const URL = `${BASE_URL}shelter.find?key=${API_KEY}&format=json&location=${zipcode}`;
    fetch(URL)
        .then(res => res.json())
        .then(json => {
            if (validResponse(json)) {
                const data = json.petfinder.shelters.shelter;

                res.locals.shelters = data.map(shelter=>{
                    return {
                        api_id:shelter.id.$t,
                        name:shelter.name.$t,
                        location:`${shelter.zip.$t} ${shelter.city.$t}, ${shelter.state.$t}`,
                        contact: shelter.email.$t
                    }
                });
                next();
            } else {
                const message = json.petfinder.header.status.message.$t;
                console.log("Problem accessing API: ", message);
                res.render("shelters",{
                    errors: [`Problem accessing shelters at zip: ${zipcode}`]
                })
            }
        })
        .catch(err=>{
            console.log("Problem accessing API: ", err);
            res.render("shelters",{
                errors: [`Problem accessing shelters at zip: ${zipcode}`]
            })
        });
}

router.post("/zip", (req, res, next)=>{
    verifyZip(req);
    const errors = req.validationErrors();

    if (errors) {
        return res.render("shelters", {
            errors: errors.map(error => error.msg)
        })
    }
    next();
},getSheltersFromApi,(req,res)=>{
    res.render("shelters");
});

module.exports = router;