const express = require('express');
const router = express.Router();

const verifyAdmin = user =>{
    return user.admin === 1;
}

module.exports = dbHandler => {
    const adminAuthenticationHandler = function(req, res, next){
        const userID = req.user.id;
        dbHandler.findById("users",userID)
            .then(user=>{
                if(verifyAdmin(user)){
                    next();
                }else{
                    console.log(`User ${user.username} tried to access restricted admin route`)
                    res.redirect("/logout");
                }
            })
    }

    router.use(adminAuthenticationHandler);
    
    router.get("/", (req, res)=>{
        res.send("Admin stuff");
    })

    return router;
}
