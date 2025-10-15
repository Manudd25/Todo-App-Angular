import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:4200', // Angular dev server (frontend folder)
    'http://localhost:3000',
    'https://todolistangular1.netlify.app' // Removed trailing slash
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Database setup
const dbPath = join(__dirname, 'todos.db');
const db = new sqlite3.Database(dbPath);

// Create tasks table
db.serialize(() => {
  db.run(`
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
});

// Routes

// Get all tasks
app.get('/api/tasks', (req, res) => {
  const { date, eventType } = req.query;
  let query = 'SELECT * FROM tasks WHERE 1=1';
  const params = [];

  if (date) {
    query += ' AND date = ?';
    params.push(date);
  }

  if (eventType) {
    query += ' AND eventType = ?';
    params.push(eventType);
  }

  query += ' ORDER BY date ASC, createdAt ASC';

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching tasks:', err);
      return res.status(500).json({ error: 'Failed to fetch tasks' });
    }

    // Convert date strings back to Date objects
    const tasks = rows.map(row => ({
      ...row,
      date: new Date(row.date),
      originalDate: row.originalDate ? new Date(row.originalDate) : undefined,
      completed: Boolean(row.completed),
      isRecurring: Boolean(row.isRecurring)
    }));

    res.json(tasks);
  });
});

// Get tasks for a specific date
app.get('/api/tasks/date/:date', (req, res) => {
  const { date } = req.params;
  
  db.all(
    'SELECT * FROM tasks WHERE date = ? ORDER BY createdAt ASC',
    [date],
    (err, rows) => {
      if (err) {
        console.error('Error fetching tasks for date:', err);
        return res.status(500).json({ error: 'Failed to fetch tasks for date' });
      }

      const tasks = rows.map(row => ({
        ...row,
        date: new Date(row.date),
        originalDate: row.originalDate ? new Date(row.originalDate) : undefined,
        completed: Boolean(row.completed),
        isRecurring: Boolean(row.isRecurring)
      }));

      res.json(tasks);
    }
  );
});

// Create a new task
app.post('/api/tasks', (req, res) => {
  const { id, text, completed, date, color, isRecurring, recurringDays, originalDate, eventType } = req.body;

  const query = `
    INSERT INTO tasks (id, text, completed, date, color, isRecurring, recurringDays, originalDate, eventType)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [id, text, completed, date, color, isRecurring, recurringDays, originalDate, eventType], function(err) {
    if (err) {
      console.error('Error creating task:', err);
      return res.status(500).json({ error: 'Failed to create task' });
    }

    res.status(201).json({ 
      id: this.lastID,
      message: 'Task created successfully' 
    });
  });
});

// Update a task
app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { text, completed, date, color, isRecurring, recurringDays, originalDate, eventType } = req.body;

  const query = `
    UPDATE tasks 
    SET text = ?, completed = ?, date = ?, color = ?, isRecurring = ?, 
        recurringDays = ?, originalDate = ?, eventType = ?, updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(query, [text, completed, date, color, isRecurring, recurringDays, originalDate, eventType, id], function(err) {
    if (err) {
      console.error('Error updating task:', err);
      return res.status(500).json({ error: 'Failed to update task' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task updated successfully' });
  });
});

// Delete a task
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting task:', err);
      return res.status(500).json({ error: 'Failed to delete task' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  });
});

// Delete all recurring tasks with same text and originalDate
app.delete('/api/tasks/recurring/:text/:originalDate', (req, res) => {
  const { text, originalDate } = req.params;

  db.run(
    'DELETE FROM tasks WHERE text = ? AND originalDate = ? AND isRecurring = 1',
    [text, originalDate],
    function(err) {
      if (err) {
        console.error('Error deleting recurring tasks:', err);
        return res.status(500).json({ error: 'Failed to delete recurring tasks' });
      }

      res.json({ 
        message: 'Recurring tasks deleted successfully',
        deletedCount: this.changes 
      });
    }
  );
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Todo API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Todo API server is running on port ${PORT}`);
  console.log(`📊 Database: ${dbPath}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('✅ Database connection closed');
    }
    process.exit(0);
  });
});
