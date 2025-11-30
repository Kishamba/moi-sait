const Database = require('better-sqlite3');
const path = require('path');

// Initialize database
const db = new Database(path.join(__dirname, 'analytics.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS visitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT,
    country TEXT,
    city TEXT,
    language TEXT,
    referrer TEXT,
    user_agent TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    ip TEXT,
    country TEXT,
    city TEXT,
    language TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS downloads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT,
    country TEXT,
    city TEXT,
    language TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Visitor tracking
const addVisitor = db.prepare(`
  INSERT INTO visitors (ip, country, city, language, referrer, user_agent)
  VALUES (?, ?, ?, ?, ?, ?)
`);

// Message tracking
const addMessage = db.prepare(`
  INSERT INTO messages (name, email, message, ip, country, city, language)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

// Download tracking
const addDownload = db.prepare(`
  INSERT INTO downloads (ip, country, city, language)
  VALUES (?, ?, ?, ?)
`);

// Statistics queries
const getStats = {
    totalVisitors: db.prepare('SELECT COUNT(*) as count FROM visitors'),
    uniqueVisitors: db.prepare('SELECT COUNT(DISTINCT ip) as count FROM visitors'),
    totalMessages: db.prepare('SELECT COUNT(*) as count FROM messages'),
    totalDownloads: db.prepare('SELECT COUNT(*) as count FROM downloads'),

    topCountries: db.prepare(`
    SELECT country, COUNT(*) as count 
    FROM visitors 
    WHERE country IS NOT NULL AND country != 'Unknown'
    GROUP BY country 
    ORDER BY count DESC 
    LIMIT 5
  `),

    topReferrers: db.prepare(`
    SELECT referrer, COUNT(*) as count 
    FROM visitors 
    WHERE referrer IS NOT NULL AND referrer != '' AND referrer != 'direct'
    GROUP BY referrer 
    ORDER BY count DESC 
    LIMIT 10
  `),

    visitsByDay: db.prepare(`
    SELECT DATE(timestamp) as date, COUNT(*) as count 
    FROM visitors 
    WHERE timestamp >= datetime('now', '-30 days')
    GROUP BY DATE(timestamp) 
    ORDER BY date DESC
  `),

    recentMessages: db.prepare(`
    SELECT name, email, message, timestamp 
    FROM messages 
    ORDER BY timestamp DESC 
    LIMIT 10
  `),

    visitsByHour: db.prepare(`
    SELECT strftime('%H', timestamp) as hour, COUNT(*) as count 
    FROM visitors 
    GROUP BY hour 
    ORDER BY hour
  `)
};

module.exports = {
    db,
    addVisitor,
    addMessage,
    addDownload,
    getStats
};
