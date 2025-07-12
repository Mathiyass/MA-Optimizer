const path = require('path');
const BetterSqlite3 = require('better-sqlite3');
const fs = require('fs');

let db;

/**
 * Initialize the database
 * @param {string} userDataPath - Path to the user data directory
 * @returns {Object} - Database instance
 */
function initDatabase(userDataPath) {
  const dbPath = path.join(userDataPath, 'ma-optimizer.db');
  
  // Create database directory if it doesn't exist
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  // Initialize database
  db = new BetterSqlite3(dbPath);
  
  // Create tables if they don't exist
  createTables();
  
  return db;
}

/**
 * Create database tables
 */
function createTables() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP,
      settings TEXT
    )
  `);
  
  // Projects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      config TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);
  
  // Variables table
  db.exec(`
    CREATE TABLE IF NOT EXISTS variables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      min_value REAL,
      max_value REAL,
      step REAL,
      options TEXT,
      FOREIGN KEY (project_id) REFERENCES projects (id)
    )
  `);
  
  // Constraints table
  db.exec(`
    CREATE TABLE IF NOT EXISTS constraints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      expression TEXT NOT NULL,
      description TEXT,
      FOREIGN KEY (project_id) REFERENCES projects (id)
    )
  `);
  
  // Objectives table
  db.exec(`
    CREATE TABLE IF NOT EXISTS objectives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      name TEXT NOT NULL,
      expression TEXT NOT NULL,
      direction TEXT NOT NULL,
      weight REAL DEFAULT 1.0,
      FOREIGN KEY (project_id) REFERENCES projects (id)
    )
  `);
  
  // Optimization runs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS optimization_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      algorithm TEXT NOT NULL,
      parameters TEXT,
      start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      end_time TIMESTAMP,
      status TEXT,
      FOREIGN KEY (project_id) REFERENCES projects (id)
    )
  `);
  
  // Solutions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS solutions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id INTEGER,
      iteration INTEGER,
      variables TEXT NOT NULL,
      objective_values TEXT NOT NULL,
      fitness REAL,
      is_best BOOLEAN DEFAULT 0,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (run_id) REFERENCES optimization_runs (id)
    )
  `);
  
  // Plugins table
  db.exec(`
    CREATE TABLE IF NOT EXISTS plugins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      version TEXT,
      author TEXT,
      description TEXT,
      path TEXT NOT NULL,
      type TEXT NOT NULL,
      enabled BOOLEAN DEFAULT 1,
      installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Get the database instance
 * @returns {Object} - Database instance
 */
function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase first.');
  }
  return db;
}

/**
 * Close the database connection
 */
function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = {
  initDatabase,
  getDb,
  closeDb,
};