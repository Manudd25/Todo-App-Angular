import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'todos.db');
const db = new Database(dbPath);

// Initialize database tables
export const initializeDatabase = () => {
  try {
    // Create tasks table (simplified without authentication)
    db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        completed BOOLEAN DEFAULT 0,
        date TEXT NOT NULL,
        color TEXT NOT NULL,
        isRecurring BOOLEAN DEFAULT 0,
        recurringDays INTEGER,
        originalDate TEXT,
        eventType TEXT DEFAULT 'task',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Database tables initialized successfully');
    return Promise.resolve();
  } catch (err) {
    console.error('Error creating tables:', err);
    return Promise.reject(err);
  }
};

export const closeDatabase = () => {
  try {
    db.close();
    console.log('✅ Database connection closed');
    return Promise.resolve();
  } catch (err) {
    console.error('Error closing database:', err);
    return Promise.reject(err);
  }
};

export { db };
export default db;
