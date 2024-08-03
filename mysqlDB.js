const mysql = require("mysql2");

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'manohar@2004',
  database: 'mydatabase',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

  module.exports = pool.promise();