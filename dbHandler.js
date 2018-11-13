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
    
    findUserByUsername(username){
        return new Promise((res, rej)=>{
            const sql = "SELECT * FROM users WHERE username=?;";
            this.db.get(sql,username,(err,row)=>{
                if(err) return rej(err);
                res(row);
            })
        })
    }

    findUserById(id){
        return new Promise((res, rej)=>{
            const sql = "SELECT * FROM users WHERE id=?;";
            this.db.get(sql,id,(err,row)=>{
                if(err) return rej(err);
                res(row);
            })
        })
    }

    insertNewUser({username,email, password}){
        const self = this;
        return new Promise((res, rej)=>{
            const sql = "INSERT INTO users (username, email, password) VALUES (?,?,?)";
            this.db.run(sql, [username,email, password], function(err){
                if(err) rej(err);
                self.findUserById(this.lastID)
                    .then(user=>res(user))
                    .catch(err=>rej(err))
            });
        });
    }

    requestShelterReview(api_id, user_id){
        return new Promise((res,rej)=>{
            const sql="INSERT INTO shelters (api_id, user_id) VALUES (?,?);";
            this.db.run(sql,[api_id,user_id],(err)=>{
                if(err) return rej(err);
                res();
            })
        })
    }

    getShelterByApiId(api_id){
        return new Promise((res,rej)=>{
            const sql="SELECT * FROM shelters WHERE api_id=?";
            this.db.get(sql,api_id,(err,row)=>{
                if(err) return rej(err);
                res(row);
            })
        })
    }

    getShelters(){
        return new Promise((res,rej)=>{
            const sql="SELECT * FROM shelters";
            this.db.all(sql,(err,rows)=>{
                if(err) return rej(err);
                res(rows);
            })
        })
    }

    updateShelter(shelter_id,sqlParams){
        let sql="UPDATE shelters SET";
        const _sqlParams = [];
        const keys = Object.keys(sqlParams);
        for(const key of keys){
            sql += ` ${key}=?`;
            _sqlParams.push(sqlParams[key]);
        }
        sql += " WHERE api_id=?";
        _sqlParams.push(shelter_id);
        return new Promise((res,rej)=>{
            this.db.run(sql,_sqlParams,function(err){
                if(err) return rej(err);
                res(this.changes>0);
            })
        })
    }
}