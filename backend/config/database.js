import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use in-memory storage for Azure, file database for local development
const isProduction = process.env.NODE_ENV === 'production';
let db;
let inMemoryTasks = []; // Global array to store tasks in production

if (isProduction) {
  // Use in-memory storage for Azure (no file system issues)
  console.log('📁 Using in-memory storage for production');
  db = null; // No database needed
} else {
  // Use file database for local development
  const dbPath = join(__dirname, '..', 'todos.db');
  console.log(`📁 Database path: ${dbPath}`);
  db = new Database(dbPath);
}

// Initialize database tables
export const initializeDatabase = () => {
  try {
    if (isProduction) {
      // Initialize in-memory storage
      inMemoryTasks = [];
      console.log('✅ In-memory storage initialized successfully');
    } else {
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
    }
    return Promise.resolve();
  } catch (err) {
    console.error('Error creating tables:', err);
    return Promise.reject(err);
  }
};

export const closeDatabase = () => {
  try {
    if (db) {
      db.close();
      console.log('✅ Database connection closed');
    } else {
      console.log('✅ In-memory storage cleared');
    }
    return Promise.resolve();
  } catch (err) {
    console.error('Error closing database:', err);
    return Promise.reject(err);
  }
};

// Helper functions for in-memory operations
export const getInMemoryTasks = () => inMemoryTasks;
export const setInMemoryTasks = (tasks) => { inMemoryTasks = tasks; };
export const addInMemoryTask = (task) => { inMemoryTasks.push(task); };
export const updateInMemoryTask = (id, updatedTask) => {
  const index = inMemoryTasks.findIndex(task => task.id === id);
  if (index !== -1) {
    inMemoryTasks[index] = { ...inMemoryTasks[index], ...updatedTask };
    return true;
  }
  return false;
};
export const deleteInMemoryTask = (id) => {
  const index = inMemoryTasks.findIndex(task => task.id === id);
  if (index !== -1) {
    inMemoryTasks.splice(index, 1);
    return true;
  }
  return false;
};

export { db };
export default db;
