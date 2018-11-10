const express = require('express');
const router = express.Router();

module.exports = dbHandler => {
    router.get('/',(req,res)=>{
        res.render("metaForm",{title: "Meta Form"});
    });
    return router;
}