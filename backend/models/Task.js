import { db } from '../config/database.js';

export class Task {
  static async create(taskData) {
    const { id, text, completed, date, color, isRecurring, recurringDays, originalDate, eventType } = taskData;

    try {
      const stmt = db.prepare(
        'INSERT INTO tasks (id, text, completed, date, color, isRecurring, recurringDays, originalDate, eventType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );
      stmt.run(id, text, completed, date, color, isRecurring, recurringDays, originalDate, eventType);
      return { id, message: 'Task created successfully' };
    } catch (err) {
      throw err;
    }
  }

  static async findAll(filters = {}) {
    const { date, eventType } = filters;
    let queryText = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];

    if (date) {
      queryText += ' AND date = ?';
      params.push(date);
    }

    if (eventType) {
      queryText += ' AND eventType = ?';
      params.push(eventType);
    }

    queryText += ' ORDER BY date ASC, createdAt ASC';

    try {
      const stmt = db.prepare(queryText);
      const rows = stmt.all(...params);
      const tasks = rows.map(row => ({
        ...row,
        date: new Date(row.date),
        originalDate: row.originalDate ? new Date(row.originalDate) : undefined,
        completed: Boolean(row.completed),
        isRecurring: Boolean(row.isRecurring)
      }));
      return tasks;
    } catch (err) {
      throw err;
    }
  }

  static async findByDate(date) {
    try {
      const stmt = db.prepare('SELECT * FROM tasks WHERE date = ? ORDER BY createdAt ASC');
      const rows = stmt.all(date);
      const tasks = rows.map(row => ({
        ...row,
        date: new Date(row.date),
        originalDate: row.originalDate ? new Date(row.originalDate) : undefined,
        completed: Boolean(row.completed),
        isRecurring: Boolean(row.isRecurring)
      }));
      return tasks;
    } catch (err) {
      throw err;
    }
  }

  static async update(id, taskData) {
    const { text, completed, date, color, isRecurring, recurringDays, originalDate, eventType } = taskData;

    try {
      const stmt = db.prepare(
        'UPDATE tasks SET text = ?, completed = ?, date = ?, color = ?, isRecurring = ?, recurringDays = ?, originalDate = ?, eventType = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?'
      );
      const result = stmt.run(text, completed, date, color, isRecurring, recurringDays, originalDate, eventType, id);
      
      if (result.changes === 0) {
        throw new Error('Task not found');
      }
      
      return { message: 'Task updated successfully' };
    } catch (err) {
      throw err;
    }
  }

  static async delete(id) {
    try {
      const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
      const result = stmt.run(id);
      
      if (result.changes === 0) {
        throw new Error('Task not found');
      }
      
      return { message: 'Task deleted successfully' };
    } catch (err) {
      throw err;
    }
  }

  static async deleteRecurring(text, originalDate) {
    try {
      const stmt = db.prepare('DELETE FROM tasks WHERE text = ? AND originalDate = ? AND isRecurring = 1');
      const result = stmt.run(text, originalDate);
      
      return {
        message: 'Recurring tasks deleted successfully',
        deletedCount: result.changes
      };
    } catch (err) {
      throw err;
    }
  }
}
