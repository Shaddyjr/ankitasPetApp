module.exports = class DbHandler {
    constructor(db) {
        this.db = db;
        this.createTables();
        this.addDummyData();
    }

    createTables() {
        this.db.run("CREATE TABLE 'users' ( `id` INTEGER PRIMARY KEY AUTOINCREMENT, `username` TEXT NOT NULL UNIQUE, `salt` TEXT, `password` TEXT NOT NULL )");
        this.db.run("CREATE TABLE `shelters` ( `id` INTEGER PRIMARY KEY AUTOINCREMENT, `name` TEXT, `url` TEXT, `formUrl` TEXT NOT NULL )");
        this.db.run("CREATE TABLE `questions` ( `id` INTEGER PRIMARY KEY AUTOINCREMENT, `shelterId` INTEGER NOT NULL, `formInputName` TEXT NOT NULL, `metaAnswerId` INTEGER NOT NULL );");
        this.db.run("CREATE TABLE `metaAnswers` ( `id` INTEGER PRIMARY KEY AUTOINCREMENT, `name` TEXT NOT NULL, `inputType` INTEGER DEFAULT 'text' )");
    }
    
    insert_into_users() {
        return this.db.prepare("INSERT INTO users (username, salt, password) VALUES (?,?,?);");
    }

    insert_into_shelters() {
        return this.db.prepare("INSERT INTO shelters (name, url, formUrl) VALUES (?,?,?)");
    }

    insert_into_questions() {
        return this.db.prepare("INSERT INTO questions (shelterId, formInputName, metaAnswerId) VALUES (?,?,?)");
    }

    insert_into_metaAnswers() {
        return this.db.prepare("INSERT INTO metaAnswers (name, inputType) VALUES (?,?)");
    }

    insertData(table, ...data) {
        let statement;
        switch (table) {
            case "users":
                statement = this.insert_into_users();
                break;
            case "shelters":
                statement = this.insert_into_shelters();
                break;
            case "questions":
                statement = this.insert_into_questions();
                break;
            case "metaAnswers":
                statement = this.insert_into_metaAnswers();
                break;
            default:
                console.log(`Could not find table: ${table}`)
                return;
        }
        statement.run(data);
        statement.finalize();
    }

    addDummyData() {
        this.db.serialize(()=>{
            this.insertData("users", "Bob", 123, "something");
            this.insertData("users", "Elwood", 456, "toast");
            this.insertData("users", "Jake", 789, "4_whole_chickens");
            this.insertData("shelters", "Bob's Shelter", "www.example.com", "www.example.com/form");
            this.insertData("shelters", "Anne's Shelter", "www.example.com", "www.example.com/form");
            this.insertData("shelters", "Awesome Shelter", "www.example.com", "www.example.com/form");
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
        });
    };
}