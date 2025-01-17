const mysql = require("mysql");
const dotenv = require("dotenv");
dotenv.config({ path: "Config/.env" });

const mysqlconnection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
    
});

mysqlconnection.connect((error) => {
    if (error) {
        console.error('This error is coming when database connection is working: ' + JSON.stringify(error, undefined, 2));
    } else {
        console.log('DB connection successfully');
    }
});

module.exports = mysqlconnection;
