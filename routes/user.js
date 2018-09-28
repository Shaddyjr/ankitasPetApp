const express = require('express');
const router = express.Router();
const DbHandler = require("../dbHandler");
const dbHandler = new DbHandler;

router.get('/:username', function (req, res) {
    const username = req.params.username;
    dbHandler.findById("usersByUsername", username)
        .then(user => {
            res.render("profile", {
                username: user.username
            })
        })
        .catch(err => {
            console.log(err);
            res.redirect('/logout');
        })
});

router.get("/:username/metaForm",function(req,res){
    res.send("metaForm");
});

module.exports = router;