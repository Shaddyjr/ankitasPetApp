var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(process.env.DB_FILENAME);
module.exports = db;