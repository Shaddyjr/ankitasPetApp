require('dotenv').load(); // required for using .env file
var express = require('express');
var validator = require("express-validator"); // NEED TO IMPLEMENT NEW API
// https://express-validator.github.io/docs/check-api.html
var bodyParser = require('body-parser');
var path = require('path');
var app = express();
var methodOverride = require('method-override');
// Authentication packages
var session = require("express-session");
var passport = require("passport");
LocalStrategy = require('passport-local').Strategy;
var SQLiteStore = require('connect-sqlite3')(session);
const bcrypt = require("bcrypt");
const dbHandler = require("./dbHandler");
// Pathing for public directory
app.use("/static",express.static(path.join(__dirname, 'public')));

// View Engine
app.set('view engine', 'ejs');
app.set("views","./views/pages");
app.use(bodyParser.urlencoded({
  extended: true
}));
// must come immediately after bodyParser (adds "checkBody" method to request object)
app.use(validator());

// setting & storing session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,  // only want to store for logged in users
  store: new SQLiteStore,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 1 week
  // cookie: { secure: true }
}))
app.use(passport.initialize()); // adds .login, .serializeUser, and .deserializeUser, .user, .isAuthenticated()
app.use(passport.session());

const clean = str => {
  return str.trim().toLowerCase();
}
async function verifyUser(username, password) {
  const user = await dbHandler.findById("usersByUsername", clean(username));
  if (!user) return false;
  return await new Promise((res, rej) => {
      bcrypt.compare(password, user.password, function (err, result) {
          if (err) return rej(err);
          if (result) {
              res(user)
          } else {
              res(false);
          }
      })
  })
}

// allows PUT and DELETE routes w/modified form
// https://www.npmjs.com/package/method-override
app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    var method = req.body._method
    delete req.body._method
    return method
  }
}))
// listen for requests
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port: ${port}`));


// passing authentication status to views
app.use((req,res, next)=>{
  res.locals.isAuthenticated = req.isAuthenticated();
  res.locals.user = req.user;
  next();
})

// ROUTES
require("./routes/routesHandler")(app, dbHandler);

// LOCAL STRATEGY
passport.use(new LocalStrategy(
  function (username, password, done) {
      verifyUser(username, password).
        then(user => {
                if (user) return done(null, {
                    "user":user
                });
                done(null, false);
            })
            .catch(err => {
                done(err);
            })
  }
));

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (userID, done) {
  dbHandler.findById("users",userID)
    .then(user=>{
      done(null, user);
    })
    .catch(err=>{
      done(err);
    })
});
// Catching last route as 404 - unsuccessful
app.use((req, res, next)=>{
  res.status = 404;
  res.render("404",{err:new Error("Not found")});
})