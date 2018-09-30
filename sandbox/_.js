require('dotenv').load(); // required for using .env file
const db = require("../db");
const _ = require("../controllers/shelterController");
_.mountDb(db);