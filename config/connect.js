const mysql = require('mysql2/promise');

// Creating a MySQL connection pool
const db = mysql.createPool({
    host: 'localhost',
    user: 'kuldeep',
    password: 'kuldeep',
    database: 'social-medi'
});

module.exports = db;
