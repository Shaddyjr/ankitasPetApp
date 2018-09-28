const express = require('express');
const router = express.Router();
const DbHandler = require("../dbHandler");
const dbHandler = new DbHandler;

const getShelter = function(req,res,next){
    const shelterId = req.params.id;
    dbHandler.findById("sheltersByApiId",shelterId)
        .then(shelter=>{
            res.locals.shelter = shelter;
            next();
        })
        .catch(err=>{
            res.render("/shelters",{
                err:err
            })
        })
}

router.get("/",(req,res)=>{
    res.render("shelters");
})

router.get('/:id', getShelter, function (req, res) {
    res.render("shelter");
});

module.exports = router;