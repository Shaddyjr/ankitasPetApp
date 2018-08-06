require('dotenv').load();
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static('public'));
// listen for requests :)
const port = 3000;
app.listen(port, () => console.log(`Listening on port: ${port}`));

// init sqlite db
var fs = require('fs');
var dbFile = './.data/petApp.db';
var exists = fs.existsSync(dbFile);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);
var fetch = require("node-fetch");

// const petContract = require("petContract");
const ShelterFormatter = require("./shelterFormatter");
const DbHandler = require("./dbHandler");
// const URL = "http://www.badassbrooklynanimalrescue.com/adoption-app";


let dbHandler;
if (!exists) {
  dbHandler = new DbHandler(db);
}

// loading controllers
const shelterController = require("./controllers/shelterController");
shelterController(app,fetch);

// ROUTES
app.get('/', function (request, response) {
  response.render("index",{blah:"something"});
});