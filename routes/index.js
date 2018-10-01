const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const saltRounds = 10;
const passport = require("passport");

const clean = str => {
    return str.trim().toLowerCase();
}

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

    /**
     * Returns user if username exists, otherwise null.
     */
    const findUsername = username => {
        return dbHandler.findById("usersByUsername", username);
    }

    const createUser = (username, email, password) => {
        return new Promise((resolve, reject) => {
            findUsername(username)
                .then(user => {
                    if (user) return reject(`User ${username} already exists.`);
                    bcrypt.genSalt(saltRounds, function (err, salt) {
                        if (err) return reject(err);
                        bcrypt.hash(password, salt, function (err, hash) {
                            if (err) return reject(err);
                            dbHandler.insertData("users", username, salt, hash, email)
                                .then(newUserID => {
                                    dbHandler.findById("users", newUserID)
                                    .then(newUser=>{
                                        resolve(newUser)
                                    })
                                    .catch(err=>reject(err))
                                })
                                .catch(err => reject(err))
                        });
                    });
                })
        });
    }
    
    router.get('/', function (request, response) {
        response.render("index");
    });

    router.get('/login', function (request, response) {
        response.render("login");
    });

    router.post('/login', function (req, res, next) {
        passport.authenticate("local", (err, userObj, info) => {
            if (err) return next(err);
            
            const user = userObj.user;
            if (!user) {
                req.checkBody("username", "Username is required").notEmpty();
                req.checkBody("password", "Password is required").notEmpty();

                const errors = req.validationErrors();
                if (errors) {
                    return res.render("login", {
                        errors: errors.map(error => error.msg)
                    });
                } else {
                    return res.render("login", {
                        errors: ["Incorrect username or password"]
                    });
                }
            } else {
                // must log in user
                req.logIn(user, function (err) {
                    if (err) {
                        return next(err);
                    }
                    res.redirect(`/user/${clean(user.username)}`);
                });
            }
        })(req, res, next)
    });

    router.get('/logout', function (req, res) {
        req.logout();
        req.session.destroy();
        res.redirect("/");
    });

    router.get('/signup', function (request, response) {
        response.render("signup");
    });

    router.post('/signup', function (req, res) {
        validateSignup(req);

        const errors = req.validationErrors();

        if (errors) {
            return res.render("signup", {
                errors: errors.map(error => error.msg)
            })
        }

        const username = clean(req.body.username);
        const email = req.body.email;
        const password = req.body.password;

        createUser(username, email, password)
            .then(user => {
                req.login(user, function (err) {
                    res.redirect("/");
                })
            })
            .catch(err => {
                console.log("Problem creating new user: ", username);
                console.error(err);
                res.render("signup", {
                    errors: ["Problem creating new user"]
                });
            });
    });

    router.get("/profile", authenticationHandler, function(req,res){
        const user = req.user;
        if(user){
            res.redirect(`/user/${user.username}`);
        }else{
            res.redirect('/');
        }
    })

    return router;
};