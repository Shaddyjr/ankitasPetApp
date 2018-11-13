const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');

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

const errorCreatingUser = (req,res) =>{
    req.session.msg={
        errors: [{msg:"Could not create new user"}],
        view: "signup"
    }
    return res.redirect("/login");
}

module.exports = (dbHandler,authenticationHandler) => {
    const addNewUser = async userData =>{
        const rawPassword = userData.password;
        const hash = await new Promise((res,rej)=>{
            bcrypt.hash(rawPassword, saltRounds, function(err, hash){
                if(err) return rej(err);
                res(hash);
            })
        });

        const user = await dbHandler.insertNewUser({
                username : clean(userData.username),
                email    : userData.email,
                password : hash
            });
        return user;
    }
    router.get('/',(req,res)=>{
        res.render("index",{title: "Landing Page"});
    });
    
    router.get('/logout',(req,res)=>{
        req.logout();
        req.session.destroy();
        res.redirect("/");
    });

    router.get('/login',(req,res)=>{
        res.render("login",{title: "Log In"});
    });

    router.post('/login', function(req, res, next) {
        passport.authenticate('local', function(err, user, info) {
            if (err) { 
                console.log(`Error authenticating: ${err}`);
                return next(err);
            }
            if (!user) {
                req.session.msg={
                    errors: [{msg:"Incorrect username or password"}],
                    view: "login"
                }
                return res.redirect('/login'); 
            }
            req.logIn(user, function(err) {
                if (err) { 
                    console.log(`Error logging user in - User: ${user} Error: ${err}`);
                    return next(err);
                }
                return res.redirect('/users/' + user.username);
            });
        })(req, res, next);
      });

    router.post('/signup', [
        check("username").not().isEmpty().trim().escape().withMessage("Username must be provided"),
        check("email").not().isEmpty().withMessage("Email must be provided"),
        check("password").not().isEmpty().withMessage("Password must be provided"),
        check("password2").not().isEmpty().withMessage("Password confirmation must be provided"),
        check("username").isLength({min:4, max:14}).withMessage("Username must be betwee 4 and 14 characters"),
        check("username").matches(/^[A-Za-z0-9_-]+$/, 'i').withMessage("Username can only contain letters, numbers, or underscores."),
        check("email").isEmail().normalizeEmail().withMessage("Email should be valid email"),
        check("password").matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.* )(?=.*[^a-zA-Z0-9]).{8,}$/, "i").withMessage("Password must include one lowercase character, one uppercase character, a number, and a special character."),
        check("password2", "Passwords do not match. Please try again.").custom((value, { req }) => value === req.body.password),
        check("username").custom(username=> {
            return dbHandler.findUserByUsername(username).then(user => {
              if (user) {
                return Promise.reject('Username already in use');
              }
              return Promise.resolve();
            });
          })
    ],(req,res)=>{
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errorCreatingUser(req,res);
        } else {
            addNewUser({
                username : req.body.username,
                email    : req.body.email,
                password : req.body.password
            })
                .then(user=>{
                    if(!user){
                        return errorCreatingUser(req,res);
                    }
                    //LOGIN USER
                    req.logIn(user, err => {
                        if(err){
                            console.log(`Error Logging in user: ${err}`);
                            return errorCreatingUser(req,res);
                        }
                        res.redirect("/");
                    });
                })
                .catch(err=>{
                    console.log(`Error Creating user: ${err}`);
                    return errorCreatingUser(req,res);                    
                })
        }
    });
    
    // Authenticated after this point
    router.get('/account',(req,res)=>{
        res.render("account",{title: "Account"});
    });

    return router;
};