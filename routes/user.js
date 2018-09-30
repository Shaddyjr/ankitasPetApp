const express = require('express');
const router = express.Router();

/**
 * Checks if user is an admin.
 */
const userIsAdmin = function(req){
    return req.user.admin === 1;
}

/**
 * Checks if user is viewing own profile or someone elses.
 */
const userViewingSelf = function(req){
    if(userIsAdmin(req)) return true;
    const profile_username = req.params.username;
    const user_username = req.user.username;
    return profile_username === user_username;
}

module.exports = dbHandler => {
    router.get('/:username', function (req, res) {
        if(userViewingSelf(req)){
            res.render("profile");
        }else{
            res.redirect("/profile");
        }
    });

    router.get("/:username/metaForm", function (req, res) {
        res.send("metaForm");
    });

    return router;
}