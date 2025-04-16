const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Yetorini!1',
  database: 'booking_db'
});

module.exports = pool.promise();