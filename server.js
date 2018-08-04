var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
// listen for requests :)
app.listen(process.env.PORT);

// init sqlite db
var fs = require('fs');
var dbFile = './.data/petApp.db';
var exists = fs.existsSync(dbFile);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);

const BASE_URL = "http://api.petfinder.com/";
const API_KEY = process.env.API_KEY;

const createTables = ()=>{
  db.run("CREATE TABLE 'users' ( `id` INTEGER PRIMARY KEY AUTOINCREMENT, `username` TEXT NOT NULL UNIQUE, `salt` TEXT, `password` TEXT NOT NULL )");
  db.run("CREATE TABLE `shelters` ( `id` INTEGER PRIMARY KEY AUTOINCREMENT, `name` TEXT, `url` TEXT, `formUrl` TEXT NOT NULL )");
  db.run("CREATE TABLE `questions` ( `id` INTEGER PRIMARY KEY AUTOINCREMENT, `shelterId` INTEGER NOT NULL, `formInputName` TEXT NOT NULL, `metaAnswerId` INTEGER NOT NULL );");
  db.run("CREATE TABLE `metaAnswers` ( `id` INTEGER PRIMARY KEY AUTOINCREMENT, `name` TEXT NOT NULL, `inputType` INTEGER DEFAULT 'text' )");
}


db.serialize(function(){
  if (!exists) {
    createTables();
  }
});

// ROUTES
app.get('/', function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

