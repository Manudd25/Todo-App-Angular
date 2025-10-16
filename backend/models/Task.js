import db from '../config/database.js';

export class Task {
  static async create(taskData) {
    const { id, userId, text, completed, date, color, isRecurring, recurringDays, originalDate, eventType } = taskData;

    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO tasks (id, userId, text, completed, date, color, isRecurring, recurringDays, originalDate, eventType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, userId, text, completed, date, color, isRecurring, recurringDays, originalDate, eventType],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, message: 'Task created successfully' });
          }
        }
      );
    });
  }

  static async findByUserId(userId, filters = {}) {
    const { date, eventType } = filters;
    let query = 'SELECT * FROM tasks WHERE userId = ?';
    const params = [userId];

    if (date) {
      query += ' AND date = ?';
      params.push(date);
    }

    if (eventType) {
      query += ' AND eventType = ?';
      params.push(eventType);
    }

    query += ' ORDER BY date ASC, createdAt ASC';

    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Convert date strings back to Date objects
          const tasks = rows.map(row => ({
            ...row,
            date: new Date(row.date),
            originalDate: row.originalDate ? new Date(row.originalDate) : undefined,
            completed: Boolean(row.completed),
            isRecurring: Boolean(row.isRecurring)
          }));
          resolve(tasks);
        }
      });
    });
  }

  static async findByUserIdAndDate(userId, date) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM tasks WHERE userId = ? AND date = ? ORDER BY createdAt ASC',
        [userId, date],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            const tasks = rows.map(row => ({
              ...row,
              date: new Date(row.date),
              originalDate: row.originalDate ? new Date(row.originalDate) : undefined,
              completed: Boolean(row.completed),
              isRecurring: Boolean(row.isRecurring)
            }));
            resolve(tasks);
          }
        }
      );
    });
  }

  static async update(id, userId, taskData) {
    const { text, completed, date, color, isRecurring, recurringDays, originalDate, eventType } = taskData;

    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE tasks SET text = ?, completed = ?, date = ?, color = ?, isRecurring = ?, recurringDays = ?, originalDate = ?, eventType = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND userId = ?',
        [text, completed, date, color, isRecurring, recurringDays, originalDate, eventType, id, userId],
        function(err) {
          if (err) {
            reject(err);
          } else if (this.changes === 0) {
            reject(new Error('Task not found'));
          } else {
            resolve({ message: 'Task updated successfully' });
          }
        }
      );
    });
  }

  static async delete(id, userId) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM tasks WHERE id = ? AND userId = ?', [id, userId], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Task not found'));
        } else {
          resolve({ message: 'Task deleted successfully' });
        }
      });
    });
  }

  static async deleteRecurring(text, originalDate, userId) {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM tasks WHERE text = ? AND originalDate = ? AND isRecurring = 1 AND userId = ?',
        [text, originalDate, userId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              message: 'Recurring tasks deleted successfully',
              deletedCount: this.changes
            });
          }
        }
      );
    });
  }
}
