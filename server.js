var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
// listen for requests :)
const port = 3000;
app.listen(port,() => console.log(`'Example app listening on port: ${port}`));

// init sqlite db
var fs = require('fs');
var dbFile = './.data/petApp.db';
var exists = fs.existsSync(dbFile);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);

const BASE_URL = "http://api.petfinder.com/";
const API_KEY = process.env.API_KEY;

const insert_into_users = ()=>{
  return db.prepare();
}
const insert_into_shelters = ()=>{
  return db.prepare();
}
const insert_into_questions = ()=>{
  return db.prepare();
}
const insert_into_metaAnswers = ()=>{
  return db.prepare();
}

const insertData = (table, ...data)=>{
  let statement;
  switch(table){
    case "users":
      insert_into_users(data);
      break;
    case "shelters":
      insert_into_shelters(data);
      break;
    case "questions":
      insert_into_questions(data);
      break;
    case "metaAnswers":
      insert_into_metaAnswers(data);
      break;
    default:
      console.log(`Could not find table: ${table}`)
      return;
  }
  statement.run(data);
  statement.finalize();
}

const addDummyData = function(){
  db.serialize(function(){

  });
}

(()=>{
  if(!exists){
    db.run("CREATE TABLE 'users' ( `id` INTEGER PRIMARY KEY AUTOINCREMENT, `username` TEXT NOT NULL UNIQUE, `salt` TEXT, `password` TEXT NOT NULL )");
    db.run("CREATE TABLE `shelters` ( `id` INTEGER PRIMARY KEY AUTOINCREMENT, `name` TEXT, `url` TEXT, `formUrl` TEXT NOT NULL )");
    db.run("CREATE TABLE `questions` ( `id` INTEGER PRIMARY KEY AUTOINCREMENT, `shelterId` INTEGER NOT NULL, `formInputName` TEXT NOT NULL, `metaAnswerId` INTEGER NOT NULL );");
    db.run("CREATE TABLE `metaAnswers` ( `id` INTEGER PRIMARY KEY AUTOINCREMENT, `name` TEXT NOT NULL, `inputType` INTEGER DEFAULT 'text' )");
    addDummyData();
  }
})();

// ROUTES
app.get('/', function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

