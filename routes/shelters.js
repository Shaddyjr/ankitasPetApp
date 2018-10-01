const express = require('express');
const router = express.Router();
const fetch = require("node-fetch");
const API_KEY = process.env.API_KEY;

// const validResponse = json => {
//     return json.petfinder.header.status.code.$t === "100";
// }

const verifyZip = function (req) {
    req.checkBody("zip", "Must provide a valid zip code").isInt({
        min: 0,
        max: 99999
    });
    req.checkBody("zip", "Must provide a valid zip code").isLength({
        min: 5,
        max: 5
    });
}

module.exports = dbHandler => {
    const shelterController = require("../controllers/shelterController");
    shelterController.mountDb(dbHandler.db);

    const getShelter = function (req, res, next) {
        const shelterId = req.params.id;
        // Check DB first
        shelterController.getShelterFromDB(shelterId)
            .then(shelter=>{
                if(shelter){
                    shelter.inDB = true;
                    res.locals.shelter = shelter;
                    next();
                }else{
                    // Check API is not in DB
                    shelterController.getShelterFromAPI(shelterId)        
                        .then(shelter => {
                            if (!shelter) {
                                res.redirect("/shelters");
                            } else {
                                res.locals.shelter = shelter;
                                next();
                            }
                        })
                        .catch(err => {
                            console.log(`Error finding shelter: ${shelterId}`);
                            console.log(err);
                            res.render("shelters", {
                                errors: ["Error finding shelter"]
                            })
                        })
                }
            })
    }

    const getSheltersFromApi = function (req, res, next) {
        const zipcode = req.body.zip;
        shelterController.getSheltersFromAPI(zipcode)
            .then(shelters=>{
                res.locals.shelters = shelters;
                next();
            })
            .catch(err=>{
                console.log("Problem accessing API: ", err);
                res.render("shelters", {
                    errors: [`Problem accessing shelters at zip: ${zipcode}`]
                })
            });
    }

    router.get("/", (req, res) => {
        res.render("shelters");
    })

    router.get('/:id', getShelter, function (req, res) {
        res.render("shelter");
    });

    router.post("/zip", (req, res, next) => {
        verifyZip(req);
        const errors = req.validationErrors();

        if (errors) {
            return res.render("shelters", {
                errors: errors.map(error => error.msg)
            })
        }
        next();
    }, getSheltersFromApi, (req, res) => {
        res.render("shelters");
    });

    return router;
}