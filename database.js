const path = require('path');
require('dotenv').config();

let db;
let type = 'sqlite';

// Check if we are in a production environment with a Postgres URL
if (process.env.DATABASE_URL) {
  const { Pool } = require('pg');
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  type = 'postgres';
  console.log('🔌 Connected to PostgreSQL database');
} else {
  const Database = require('better-sqlite3');
  db = new Database(path.join(__dirname, 'analytics.db'));
  type = 'sqlite';
  console.log('📂 Connected to local SQLite database');
}

// Initialize tables
async function initDB() {
  const queries = [
    `CREATE TABLE IF NOT EXISTS visitors (
      id SERIAL PRIMARY KEY,
      ip TEXT,
      country TEXT,
      city TEXT,
      language TEXT,
      referrer TEXT,
      user_agent TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      ip TEXT,
      country TEXT,
      city TEXT,
      language TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS downloads (
      id SERIAL PRIMARY KEY,
      ip TEXT,
      country TEXT,
      city TEXT,
      language TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  // Adjust syntax for SQLite
  if (type === 'sqlite') {
    queries[0] = queries[0].replace('SERIAL PRIMARY KEY', 'INTEGER PRIMARY KEY AUTOINCREMENT').replace('TIMESTAMP', 'DATETIME');
    queries[1] = queries[1].replace('SERIAL PRIMARY KEY', 'INTEGER PRIMARY KEY AUTOINCREMENT').replace('TIMESTAMP', 'DATETIME');
    queries[2] = queries[2].replace('SERIAL PRIMARY KEY', 'INTEGER PRIMARY KEY AUTOINCREMENT').replace('TIMESTAMP', 'DATETIME');
  }

  for (const query of queries) {
    if (type === 'postgres') {
      await db.query(query);
    } else {
      db.exec(query);
    }
  }
}

// Initialize on start
initDB().catch(console.error);

// Wrapper functions to handle both DB types
const dbOps = {
  addVisitor: async (ip, country, city, language, referrer, user_agent) => {
    const query = `INSERT INTO visitors (ip, country, city, language, referrer, user_agent) VALUES ($1, $2, $3, $4, $5, $6)`;
    if (type === 'postgres') {
      await db.query(query, [ip, country, city, language, referrer, user_agent]);
    } else {
      db.prepare(query.replace(/\$\d+/g, '?')).run(ip, country, city, language, referrer, user_agent);
    }
  },

  checkRecentVisit: async (ip) => {
    // Postgres uses NOW(), SQLite uses datetime('now')
    // We'll use a standardized query approach or just logic
    let query;
    if (type === 'postgres') {
      query = `SELECT id FROM visitors WHERE ip = $1 AND timestamp > NOW() - INTERVAL '30 minutes' LIMIT 1`;
      const res = await db.query(query, [ip]);
      return res.rows[0];
    } else {
      query = `SELECT id FROM visitors WHERE ip = ? AND timestamp > datetime('now', '-30 minutes') LIMIT 1`;
      return db.prepare(query).get(ip);
    }
  },

  addMessage: async (name, email, message, ip, country, city, language) => {
    const query = `INSERT INTO messages (name, email, message, ip, country, city, language) VALUES ($1, $2, $3, $4, $5, $6, $7)`;
    if (type === 'postgres') {
      await db.query(query, [name, email, message, ip, country, city, language]);
    } else {
      db.prepare(query.replace(/\$\d+/g, '?')).run(name, email, message, ip, country, city, language);
    }
  },

  addDownload: async (ip, country, city, language) => {
    const query = `INSERT INTO downloads (ip, country, city, language) VALUES ($1, $2, $3, $4)`;
    if (type === 'postgres') {
      await db.query(query, [ip, country, city, language]);
    } else {
      db.prepare(query.replace(/\$\d+/g, '?')).run(ip, country, city, language);
    }
  },

  getStats: async () => {
    const queries = {
      totalVisitors: 'SELECT COUNT(*) as count FROM visitors',
      uniqueVisitors: 'SELECT COUNT(DISTINCT ip) as count FROM visitors',
      totalMessages: 'SELECT COUNT(*) as count FROM messages',
      totalDownloads: 'SELECT COUNT(*) as count FROM downloads',
      topCountries: `SELECT country, COUNT(*) as count FROM visitors WHERE country IS NOT NULL AND country != 'Unknown' GROUP BY country ORDER BY count DESC LIMIT 5`,
      topReferrers: `SELECT referrer, COUNT(*) as count FROM visitors WHERE referrer IS NOT NULL AND referrer != '' AND referrer != 'direct' GROUP BY referrer ORDER BY count DESC LIMIT 10`,
      visitsByDay: type === 'postgres'
        ? `SELECT DATE(timestamp) as date, COUNT(*) as count FROM visitors WHERE timestamp >= NOW() - INTERVAL '30 days' GROUP BY DATE(timestamp) ORDER BY date DESC`
        : `SELECT DATE(timestamp) as date, COUNT(*) as count FROM visitors WHERE timestamp >= datetime('now', '-30 days') GROUP BY DATE(timestamp) ORDER BY date DESC`,
      recentMessages: `SELECT name, email, message, timestamp FROM messages ORDER BY timestamp DESC LIMIT 10`,
      visitsByHour: type === 'postgres'
        ? `SELECT EXTRACT(HOUR FROM timestamp) as hour, COUNT(*) as count FROM visitors GROUP BY hour ORDER BY hour`
        : `SELECT strftime('%H', timestamp) as hour, COUNT(*) as count FROM visitors GROUP BY hour ORDER BY hour`
    };

    const results = {};

    for (const [key, query] of Object.entries(queries)) {
      if (type === 'postgres') {
        const res = await db.query(query);
        // For count queries, pg returns string for bigint, so we might need parsing, but for simple counts it's usually fine or we handle it in frontend
        // Also pg returns rows array
        if (key.startsWith('total') || key.startsWith('unique')) {
          results[key] = res.rows[0];
        } else {
          results[key] = res.rows;
        }
      } else {
        if (key.startsWith('total') || key.startsWith('unique')) {
          results[key] = db.prepare(query).get();
        } else {
          results[key] = db.prepare(query).all();
        }
      }
    }

    return results;
  }
};

module.exports = dbOps;
