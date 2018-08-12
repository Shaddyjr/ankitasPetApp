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
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port: ${port}`));


const ShelterFormatter = require("./shelterFormatter");
const DbHandler = require("./dbHandler");
// const URL = "http://www.badassbrooklynanimalrescue.com/adoption-app";

let dbHandler = new DbHandler;

// loading controllers
const shelterController = require("./controllers/shelterController");
shelterController(app,dbHandler);

// ROUTES
app.get('/', function (request, response) {
  response.render("index",{blah:"something"});
});