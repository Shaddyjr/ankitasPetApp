var fs = require('fs');
var dbFile = './.data/petApp.db';

module.exports = new class DbHandler {
    constructor() {
        this.db = require("./db");

        if(!fs.existsSync(dbFile)){
            this.createTables();
        }
    }

    createTables() {
        this.db.run("CREATE TABLE 'users' ( `id` INTEGER PRIMARY KEY AUTOINCREMENT, `username` TEXT NOT NULL UNIQUE, `salt` TEXT, `password` TEXT NOT NULL, `email` TEXT, `admin` INTEGER DEFAULT 0 )");
        this.db.run("CREATE TABLE `shelters` ( `id` INTEGER PRIMARY KEY AUTOINCREMENT, `api_id` TEXT UNIQUE, `name` TEXT, `location` TEXT, `contact` TEXT, `url` TEXT, `formUrl` TEXT , `reviewed` INTEGER DEFAULT 0)");
        this.db.run("CREATE TABLE `shelterBlacklist` ( `id` INTEGER PRIMARY KEY AUTOINCREMENT, `api_id` TEXT UNIQUE)");
        this.db.run("CREATE TABLE `questions` ( `id` INTEGER PRIMARY KEY AUTOINCREMENT, `shelterId` INTEGER NOT NULL, `formInputName` TEXT NOT NULL, `metaAnswerId` INTEGER);");
        this.db.run("CREATE TABLE `metaAnswers` ( `id` INTEGER PRIMARY KEY AUTOINCREMENT, `name` TEXT NOT NULL, `inputType` TEXT DEFAULT 'text', `description` TEXT )");
        this.db.run("CREATE TABLE `answers` ( `userId` INTEGER NOT NULL, `metaId` INTEGER, `value` BLOB)"); 
    }
    
    // CREATE //
    answers_insert_statement() {
        return "INSERT INTO answers (userId, metaId, value) VALUES (?,?,?);";
    }

    users_insert_statement() {
        return "INSERT INTO users (username, salt, password, email) VALUES (?,?,?,?);";
    }

    shelters_insert_statement() {
        return "INSERT INTO shelters (api_id, name, location, contact, url, formUrl) VALUES (?,?,?,?,?,?)";
    }

    questions_insert_statement() {
        return "INSERT INTO questions (shelterId, formInputName, metaAnswerId) VALUES (?,?,?)";
    }
    questions_insert_base_statement() {
        return "INSERT INTO questions (shelterId, formInputName) VALUES ";
    }

    metaAnswers_insert_statement() {
        return "INSERT INTO metaAnswers (name, inputType) VALUES (?,?)";
    }

    insertMultiple(table,data){
        // data is a 2D array of values for each insert
        let statementBase;
        switch(table){
            case "questions":
                statementBase = this.questions_insert_base_statement();
                break;
            default:
                console.log(`Couldn't find table ${table}`);
                return;
        }
        const valueArr = [];
        const flatData = [];
        for(const value of data){
            const valueString = value.map(val=>"?").join(",");
            valueArr.push(`(${valueString})`);
            value.forEach(val=>flatData.push(val));
        }
        const statement = statementBase + valueArr.join(",");
        return this.queryDb(statement,flatData);
    }

    /**
     * Returns promise that resolves id of row added.
     */
    insertDb(query, data){
        return new Promise((res, rej)=>{
            this.db.run(
                query,
                data,
                function(err){
                    if(err) rej(err);
                    res(this.lastID);
                }
            );
        });
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
        return this.insertDb(query, data);
    }

    // READ //
    getShelters(){
        const query = "SELECT * FROM shelters;";
        return this.queryDb(query);
    }
    getMetaAnswers(){
        const query = "SELECT * FROM metaAnswers;";
        return this.queryDb(query);
    }

    getQuestions(){
        const query = "SELECT * FROM questions;";
        return this.queryDb(query);
    }

    getFullQuestions(){
        const query = "SELECT metaAnswers.name AS mName, questions.metaAnswerId, questions.shelterId, shelters.name AS sName, shelters.id, formInputName  FROM questions LEFT JOIN metaAnswers ON questions.metaAnswerId=metaAnswers.id JOIN shelters ON shelters.id=questions.shelterId;";
        return this.queryDb(query);
    }
    getUsers(){
        const query = "SELECT * FROM users;";
        return this.queryDb(query);
    }

    find_answers_by_id_statement(){
        return "SELECT * FROM answers WHERE id=? LIMIT 1";
    }
    find_users_by_id_statement(){
        return "SELECT * FROM users WHERE id=? LIMIT 1";
    }
    find_users_by_username(){
        return "SELECT * FROM users WHERE username=? LIMIT 1";
    }

    find_shelters_by_id_statement(){
        return "SELECT * FROM shelters WHERE id=? LIMIT 1";
    }
    find_shelters_by_api_id_statement(){
        return "SELECT * FROM shelters WHERE api_id=? LIMIT 1";
    }
    find_questions_by_id_statement(){
        return "SELECT * FROM questions WHERE id=? LIMIT 1";
    }
    find_questions_by_shelterId_statement(){
        return "SELECT * FROM questions WHERE shelterId=?";
    }
    find_questions_by_with_shelter_statement(){
        return "SELECT * FROM questions JOIN shelters ON questions.shelterId=shelters.id WHERE questions.id=?;";
    }
    find_metaAnswers_by_id_statement(){
        return "SELECT * FROM metaAnswers WHERE id=? LIMIT 1";
    }

    findById(table, id){
        let query;
        switch (table) {
            case "users":
                query = this.find_users_by_id_statement();
                break;
            case "usersByUsername":
                query = this.find_users_by_username();
                break;
            case "shelters":
                query = this.find_shelters_by_id_statement();
                break;
            case "sheltersByApiId":
                query = this.find_shelters_by_api_id_statement();
                break;
            case "questions":
                query = this.find_questions_by_id_statement();
                break;
            case "questionsByShelterId":
                query = this.find_questions_by_shelterId_statement();
                return this.queryDb(query,id);
            case "questionsWithShelter":
                query = this.find_questions_by_with_shelter_statement();
                break;
            case "metaAnswers":
                query = this.find_metaAnswers_by_id_statement();
                break;
            case "answers":
                query = this.find_answers_by_id_statement();
                break;
            default:
                console.log(`Could not find table: ${table}`)
                return;
        }
        return this.queryDbById(query, id);
    }

    queryDbById(query, id){
        return new Promise((res, rej)=>{
            this.db.get(
                query,
                id,
                function(err, row){
                    if(err) rej(err);
                    res(row);
                }
            );
        });
    }

    // UPDATE //
    users_update_statement(){
        return "UPDATE users SET username=?, salt=?, password=? WHERE id=?;";
    }
    shelters_update_statement(){
        return "UPDATE shelters SET name=?, location=?, contact=?, url=?, formUrl=? WHERE id=?;";
    }
    shelters_update_by_api_id_statement(){
        return "UPDATE shelters SET name=?, location=?, contact=?, url=?, formUrl=? WHERE api_id=?;";
    }
    questions_update_statement(){
        return "UPDATE questions SET shelterId=?, formInputName=?, metaAnswerId=? WHERE id=?;";
    }
    questions_update_metaAnswerId_statement(){
        return "UPDATE questions SET metaAnswerId=? WHERE id=?;";
    }
    metaAnswers_update_statement(){
        return "UPDATE metaAnswers SET name=?, inputType=? WHERE id=?;";
    }
    answers_update_statement(){
        return "UPDATE answers SET userId=?, metaId=?, value=? WHERE id=?;";
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
            case "sheltersByApiId":
                query = this.shelters_update_by_api_id_statement();
                break;
            case "questions":
                query = this.questions_update_statement();
                break;
            case "questionsMetaAnswerId":
                query = this.questions_update_metaAnswerId_statement();
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
        return this.updateDb(query, data);
    }

    /**
     * Returns promise that resolves lastID of rows changed.
     */
    updateDb(query, data){
        return new Promise((res, rej)=>{
            this.db.run(
                query,
                data,
                function(err){
                    if(err) rej(err);
                    res(this.changes);
                }
            );
        });
    }

    // DELETE //
    users_delete_statement(){
        return "DELETE FROM answers WHERE id=?;";
    }
    shelters_delete_statement(){
        return "DELETE FROM shelters WHERE api_id=?;";
    }
    questions_delete_statement(){
        return "DELETE FROM questions WHERE id=?;";
    }
    metaAnswers_delete_statement(){
        return "DELETE FROM metaAnswers WHERE id=?;";
    }
    answers_delete_statement(){
        return "DELETE FROM users WHERE id=?;";
    }
    questions_delete_by_shelterApiId_statement(){
        return "DELETE FROM questions JOIN shelters ON shelters.id=questions.shelterId WHERE shelters.api_id=?;";
    }

    deleteData(table, data){
        let query;
        switch (table) {
            case "users":
                query = this.users_delete_statement();
                break;
            case "shelters":
                query = this.shelters_delete_statement();
                break;
            case "questions":
                query = this.questions_delete_statement();
                break;
            case "metaAnswers":
                query = this.metaAnswers_delete_statement();
                break;
            case "answers":
                query = this.answers_delete_statement();
                break;
            case "questionsByShelterApiId":
                query = this.questions_delete_by_shelterApiId_statement();
                break;
            default:
                console.log(`Could not find table: ${table}`)
                return;
        }
        return this.updateDb(query, data);
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