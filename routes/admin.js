const express = require('express');
const router = express.Router();

const verifyAdmin = user =>{
    return user.admin === 1;
}

module.exports = dbHandler => {
    router.get('/',(req,res)=>{
        res.render("admin_index",{title: "Admin"});
    });
    return router;
}
