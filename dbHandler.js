// init sqlite db
var fs = require('fs');
var dbFile = './.data/petApp.db';
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);


module.exports = class DbHandler {
    constructor() {
        this.db = db;
        if(!fs.existsSync(dbFile)){
            this.createTables();
            this.addDummyData();
        }
    }

    createTables() {
        this.db.run("CREATE TABLE 'users' ( `id` INTEGER PRIMARY KEY AUTOINCREMENT, `username` TEXT NOT NULL UNIQUE, `salt` TEXT, `password` TEXT NOT NULL )");
        this.db.run("CREATE TABLE `shelters` ( `api_id` TEXT, `name` TEXT, `location` TEXT, `contact` TEXT, `url` TEXT, `formUrl` TEXT )");
        this.db.run("CREATE TABLE `questions` ( `id` INTEGER PRIMARY KEY AUTOINCREMENT, `shelterId` INTEGER NOT NULL, `formInputName` TEXT NOT NULL, `metaAnswerId` INTEGER NOT NULL );");
        this.db.run("CREATE TABLE `metaAnswers` ( `id` INTEGER PRIMARY KEY AUTOINCREMENT, `name` TEXT NOT NULL, `inputType` INTEGER DEFAULT 'text' )");
        this.db.run("CREATE TABLE `answers` ( `userId` INTEGER NOT NULL, `metaId` INTEGER, `value` BLOB)"); 
    }
    
    answers_insert_statement() {
        return "INSERT INTO answers (userId, metaId, value) VALUES (?,?,?);";
    }

    users_insert_statement() {
        return "INSERT INTO users (username, salt, password) VALUES (?,?,?);";
    }

    shelters_insert_statement() {
        return "INSERT INTO shelters (api_id, name, location, contact, url, formUrl) VALUES (?,?,?,?,?,?)";
    }

    questions_insert_statement() {
        return "INSERT INTO questions (shelterId, formInputName, metaAnswerId) VALUES (?,?,?)";
    }

    metaAnswers_insert_statement() {
        return "INSERT INTO metaAnswers (name, inputType) VALUES (?,?)";
    }

    insertData(table, ...data) {
        let query;
        switch (table) {
            case "users":
                query = this.users_insert_statement();
                break;
            case "shelters":
                query = this.shelters_insert_statement();
                break;
            case "questions":
                query = this.questions_insert_statement();
                break;
            case "metaAnswers":
                query = this.metaAnswers_insert_statement();
                break;
            case "answers":
                query = this.answers_insert_statement();
                break;
            default:
                console.log(`Could not find table: ${table}`)
                return;
        }
        return this.queryDb(query, data);
    }

    users_update_statement(){
        return "UPDATE answers SET username=?, salt=?, password=? WHERE id=?;";
    }
    shelters_update_statement(){
        return "UPDATE shelters SET name=?, location=?, contact=?, url=?, formUrl=? WHERE api_id=? ;";
    }
    questions_update_statement(){
        return "UPDATE questions SET shelterId=?, formInputName=?, metaAnswerId=? WHERE id=?;";
    }
    metaAnswers_update_statement(){
        return "UPDATE metaAnswers SET name=?, inputType=? WHERE id=?;";
    }
    answers_update_statement(){
        return "UPDATE users SET userId=?, metaId=?, value=? WHERE id=?;";

    }

    updateData(table, data){
        let query;
        switch (table) {
            case "users":
                query = this.users_update_statement();
                break;
            case "shelters":
                query = this.shelters_update_statement();
                break;
            case "questions":
                query = this.questions_update_statement();
                break;
            case "metaAnswers":
                query = this.metaAnswers_update_statement();
                break;
            case "answers":
                query = this.answers_update_statement();
                break;
            default:
                console.log(`Could not find table: ${table}`)
                return;
        }
        return this.queryDb(query, data);
    }

    getShelters(){
        const query = "SELECT * FROM shelters;";
        return this.queryDb(query);
    }

    queryDb(str, data){
        return new Promise((res, rej)=>{
            this.db.all(
                str,
                data,
                function(err, row){
                    if(err) rej(err);
                    res(row);
                }
            );
        });
    }

    findShelterByApiId(api_id){
        return new Promise((res, rej)=>{
            this.db.get(
                "SELECT * FROM shelters WHERE api_id=?",
                api_id,
                function(err, row){
                    if(err) rej(err);
                    res(row);
                }
            );
        });
    }

    addDummyData() {
        this.db.serialize(()=>{
            this.insertData("users", "Bob", 123, "something");
            this.insertData("users", "Elwood", 456, "toast");
            this.insertData("users", "Jake", 789, "4_whole_chickens");
            this.insertData("shelters", "NY803", "North Brooklyn Cats", "Broklyn NY 11221","norhbkcats@gmail.com", "www.example.com","www.example.com/form");
            this.insertData("shelters", "NY1367", "Anne's Shelter", "116 Nostrand Ave", "brooklyns.finest.ac@gmail.com","www.example.com", "www.example.com/form");
            this.insertData("shelters","NY765" ,"Barbara the Cat Lady","P.O. Box 22948", "barbrose@optonline.net","www.example.com", "www.example.com/form");
            this.insertData("questions", 1, "bobFormId1", 1);
            this.insertData("questions", 1, "bobFormId2", 2);
            this.insertData("questions", 1, "bobFormId3", 3);
            this.insertData("questions", 2, "anneFormId1", 4);
            this.insertData("questions", 2, "anneFormId2", 5);
            this.insertData("questions", 2, "anneFormId3", 6);
            this.insertData("questions", 3, "awesomeFormId1", 7);
            this.insertData("metaAnswers", "firstName", "text");
            this.insertData("metaAnswers", "lastName", "text");
            this.insertData("metaAnswers", "allergic?", "radio");
            this.insertData("answers", 1, 1,"Bob");
            this.insertData("answers", 1, 2,"Bobbington");
            this.insertData("answers", 1, 3,"Yes");
            this.insertData("answers", 2, 1,"Elwood");
            this.insertData("answers", 2, 2,"Blues");
            this.insertData("answers", 2, 3,"No");
            this.insertData("answers", 3, 1,"Jake");
            this.insertData("answers", 3, 2,"Blues");
            this.insertData("answers", 3, 3,"Yes");
        });
    };
}