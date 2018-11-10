const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const saltRounds = 10;
const passport = require("passport");

const clean = str => str.trim().toLowerCase();

const validateSignup = req => {
    req.checkBody('username', 'Username field cannot be empty.').notEmpty();
    req.checkBody('username', 'Username must be between 4-15 characters long.').len(4, 15);
    req.checkBody('email', 'The email you entered is invalid, please try again.').isEmail();
    req.checkBody('email', 'Email address must be between 4-100 characters long, please try again.').len(4, 100);
    req.checkBody('password', 'Password must be between 8-100 characters long.').len(8, 100);
    req.checkBody("password", "Password must include one lowercase character, one uppercase character, a number, and a special character.").matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.* )(?=.*[^a-zA-Z0-9]).{8,}$/, "i");
    req.checkBody('password2', 'Passwords do not match, please try again.').equals(req.body.password);
}

module.exports = (dbHandler,authenticationHandler) => {
    router.get('/',(req,res)=>{
        res.render("index",{title: "Landing Page"});
    });
    
    router.get('/login',(req,res)=>{
        res.render("login",{title: "Log In"});
    });
    
    router.get('/signup',(req,res)=>{
        res.render("login",{title: "Sign Up", signup: true});
    });
    
    // Authenticated after this point
    router.get('/account',(req,res)=>{
        res.render("account",{title: "Account"});
    });

    return router;
};