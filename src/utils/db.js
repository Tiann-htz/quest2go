import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  connectionLimit: 10,
  waitForConnections: true,
  timezone: 'Asia/Manila',
  dateStrings: false, // This ensures we get JS Date objects instead of strings  
  queueLimit: 0,
  connectTimeout: 60000 // Add this line (60 seconds timeout)
});

export async function query(sql, values) {
  try {
    console.log('Database Connection Details:', {
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT,
      database: process.env.MYSQL_DATABASE,
      user: process.env.MYSQL_USER
    });

    const [results] = await pool.query(sql, values);
    return results;
  } catch (error) {
    console.error('Detailed Database Query Error:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    throw error;
  }
}

export default pool;