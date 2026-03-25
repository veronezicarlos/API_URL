const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'urls.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS urls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_url TEXT NOT NULL,
    short_code TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT (datetime('now')),
    clicks INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url_id INTEGER NOT NULL,
    clicked_at TEXT DEFAULT (datetime('now')),
    ip TEXT,
    user_agent TEXT,
    referer TEXT,
    FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_short_code ON urls(short_code);
`);

module.exports = db;
