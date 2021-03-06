require('dotenv').load(); // required for using .env file
var express = require('express');
var path = require('path');
// var validator = require("express-validator"); // NEED TO IMPLEMENT NEW API
var session = require("express-session");
var methodOverride = require('method-override');
// Authentication packages
var passport = require("passport");
LocalStrategy = require('passport-local').Strategy;
var SQLiteStore = require('connect-sqlite3')(session);
const bcrypt = require("bcrypt");
const dbHandler = require("./dbHandler");

var app = express();

app.set('view engine', 'ejs');
app.set("views","./views/pages");
// View Engine
app.use("/static",express.static(path.join(__dirname, 'public')));
app.use(express.json()); // does body parsing
app.use(express.urlencoded({ extended: true }));
// setting & storing session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,  // storing for all users
  store: new SQLiteStore,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 1 week
  // cookie: { secure: true }
}))
app.use(passport.initialize()); // adds .login, .serializeUser, and .deserializeUser, .user, .isAuthenticated()
app.use(passport.session());

const clean = str => str.trim().toLowerCase();

async function verifyUser(username, password) {
  const user = await dbHandler.findUserByUsername(clean(username));
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
// app.use(methodOverride(function (req, res) {
//   if (req.body && typeof req.body === 'object' && '_method' in req.body) {
//     // look in urlencoded POST bodies and delete it
//     var method = req.body._method
//     delete req.body._method
//     return method
//   }
// }))
app.use(methodOverride('_method'))

// LOCAL Authentication STRATEGY
passport.use(new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password'
  },
  function (username, password, done) {
    verifyUser(username, password).
      then(user => {
        if (user){
          return done(null, user);
        };
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

passport.deserializeUser(function (user_id, done) {
  dbHandler.findUserById(user_id)
    .then(user=>{
      done(null, user);
    })
    .catch(err=>{
      done(err);
    })
});

// ROUTES
app.use(require("./routes/routesHandler")(dbHandler));

// Catching last route as 404 - unsuccessful
app.use((req, res, next)=>{
  res.status = 404;
  res.render("error");
})

// listen for requests
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port: ${port}`));
