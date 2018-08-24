require('dotenv').load();
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var app = express();
var methodOverride = require('method-override');

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({
  extended: true
}));
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
app.use("/static",express.static(path.join(__dirname, 'public')));
// listen for requests :)
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port: ${port}`));


// const ShelterFormatter = require("./shelterFormatter");
const DbHandler = require("./dbHandler");
const URL = "http://www.badassbrooklynanimalrescue.com/adoption-app";
// new ShelterFormatter(URL);

let dbHandler = new DbHandler;

// loading controllers - SHOULD BE ABSTRACTED
const shelterController = require("./controllers/shelterController");
shelterController(app,dbHandler);
const metaAnswerController = require("./controllers/metaAnswerController");
metaAnswerController(app,dbHandler);
const questionController = require("./controllers/questionController");
questionController(app,dbHandler);

// ROUTES
app.get('/', function (request, response) {
  response.render("index");
});
