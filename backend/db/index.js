const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'rsvp_tracker',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

async function initDbWithRetry(retries = 5, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempting to connect to database (attempt ${i + 1}/${retries})...`);
      const tempPool = mysql.createPool(dbConfig);
      // Test the connection
      await tempPool.query('SELECT 1');
      pool = tempPool;
      console.log('Database connected successfully.');
      return pool;
    } catch (err) {
      console.error(`Database connection failed: ${err.message}`);
      if (i === retries - 1) {
        console.error('All database connection retries failed. Exiting.');
        process.exit(1);
      }
      console.log(`Waiting ${delay}ms before retrying...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

// Start DB connection process
initDbWithRetry();

// Export a proxy or wrapper so that routes can use the pool before it's fully initialized
module.exports = {
  query: async (...args) => {
    if (!pool) {
      throw new Error('Database is not initialized yet');
    }
    return pool.query(...args);
  },
  execute: async (...args) => {
    if (!pool) {
      throw new Error('Database is not initialized yet');
    }
    return pool.execute(...args);
  }
};
