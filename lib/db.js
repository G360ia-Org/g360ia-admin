import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "mysql",
  user: "admin",
  password: "user123",
  database: "g360ia",
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool;
