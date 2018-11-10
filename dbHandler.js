var fs = require('fs');
var dbFile = './.data/petApp.db';

module.exports = new class DbHandler {
    constructor() {
        if(!fs.existsSync(dbFile)){
            this.db = require("./db");
            this.createTables();
        }else{
            this.db = require("./db");
        }
    }

    createTables() {
        this.db.run("CREATE TABLE 'users' ( `id` INTEGER PRIMARY KEY AUTOINCREMENT, `username` TEXT NOT NULL UNIQUE, `password` TEXT NOT NULL, `email` TEXT, `admin` INTEGER DEFAULT 0 )");
        this.db.run("CREATE TABLE `shelters` ( `id` INTEGER PRIMARY KEY AUTOINCREMENT, `api_id` TEXT UNIQUE, `reviewed` INTEGER DEFAULT 0, `blacklist` INTEGER DEFAULT 0, `user_id` INTEGER)");
        this.db.run("CREATE TABLE `shelterFormInputs` ( `shelter_id` INTEGER NOT NULL, `form_input_name` TEXT NOT NULL, `meta_answer_id` INTEGER);");
        this.db.run("CREATE TABLE `metaAnswers` ( `id` INTEGER PRIMARY KEY AUTOINCREMENT, `common_name` TEXT NOT NULL, `input_type` TEXT DEFAULT 'text', `description` TEXT )");
        this.db.run("CREATE TABLE `userMetaAnswers` ( `user_id` INTEGER NOT NULL, `meta_answer_id` INTEGER, `value` BLOB)"); 
    }
    
}