const express = require('express');
const router = express.Router();

const verifyAdmin = user =>{
    return user.admin === 1;
}

module.exports = dbHandler => {
    router.get('/',(req,res)=>{
        dbHandler.getShelters()
            .then(shelters=>{
                res.locals.shelters = shelters;
                res.render("admin_index",{title: "Admin"});
            })
    });
    return router;
}
