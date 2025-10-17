import { db, getInMemoryTasks, addInMemoryTask, updateInMemoryTask, deleteInMemoryTask } from '../config/database.js';

const isProduction = process.env.NODE_ENV === 'production';

export class Task {
  static async create(taskData) {
    const { id, text, completed, date, color, isRecurring, recurringDays, originalDate, eventType } = taskData;

    try {
      if (isProduction) {
        // Use in-memory storage
        const task = {
          id,
          text,
          completed: Boolean(completed),
          date: new Date(date),
          color,
          isRecurring: Boolean(isRecurring),
          recurringDays,
          originalDate: originalDate ? new Date(originalDate) : null,
          eventType,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        addInMemoryTask(task);
        return { id, message: 'Task created successfully' };
      } else {
        // Use SQLite database
        const stmt = db.prepare(
          'INSERT INTO tasks (id, text, completed, date, color, isRecurring, recurringDays, originalDate, eventType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        stmt.run(id, text, completed, date, color, isRecurring, recurringDays, originalDate, eventType);
        return { id, message: 'Task created successfully' };
      }
    } catch (err) {
      throw err;
    }
  }

  static async findAll(filters = {}) {
    const { date, eventType } = filters;

    try {
      if (isProduction) {
        // Use in-memory storage
        let tasks = getInMemoryTasks();
        
        // Apply filters
        if (date) {
          const dateStr = new Date(date).toISOString().split('T')[0];
          tasks = tasks.filter(task => task.date.toISOString().split('T')[0] === dateStr);
        }
        
        if (eventType) {
          tasks = tasks.filter(task => task.eventType === eventType);
        }
        
        // Sort by date and creation time
        tasks.sort((a, b) => {
          if (a.date.getTime() !== b.date.getTime()) {
            return a.date.getTime() - b.date.getTime();
          }
          return a.createdAt.getTime() - b.createdAt.getTime();
        });
        
        return tasks;
      } else {
        // Use SQLite database
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
      }
    } catch (err) {
      throw err;
    }
  }

  static async findByDate(date) {
    try {
      if (isProduction) {
        // Use in-memory storage
        const tasks = getInMemoryTasks();
        const dateStr = new Date(date).toISOString().split('T')[0];
        const filteredTasks = tasks.filter(task => task.date.toISOString().split('T')[0] === dateStr);
        
        // Sort by creation time
        filteredTasks.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        
        return filteredTasks;
      } else {
        // Use SQLite database
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
      }
    } catch (err) {
      throw err;
    }
  }

  static async update(id, taskData) {
    const { text, completed, date, color, isRecurring, recurringDays, originalDate, eventType } = taskData;

    try {
      if (isProduction) {
        // Use in-memory storage
        const updatedTask = {
          text,
          completed: Boolean(completed),
          date: new Date(date),
          color,
          isRecurring: Boolean(isRecurring),
          recurringDays,
          originalDate: originalDate ? new Date(originalDate) : null,
          eventType,
          updatedAt: new Date()
        };
        
        const success = updateInMemoryTask(id, updatedTask);
        if (!success) {
          throw new Error('Task not found');
        }
        
        return { message: 'Task updated successfully' };
      } else {
        // Use SQLite database
        const stmt = db.prepare(
          'UPDATE tasks SET text = ?, completed = ?, date = ?, color = ?, isRecurring = ?, recurringDays = ?, originalDate = ?, eventType = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?'
        );
        const result = stmt.run(text, completed, date, color, isRecurring, recurringDays, originalDate, eventType, id);
        
        if (result.changes === 0) {
          throw new Error('Task not found');
        }
        
        return { message: 'Task updated successfully' };
      }
    } catch (err) {
      throw err;
    }
  }

  static async delete(id) {
    try {
      if (isProduction) {
        // Use in-memory storage
        const success = deleteInMemoryTask(id);
        if (!success) {
          throw new Error('Task not found');
        }
        
        return { message: 'Task deleted successfully' };
      } else {
        // Use SQLite database
        const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
        const result = stmt.run(id);
        
        if (result.changes === 0) {
          throw new Error('Task not found');
        }
        
        return { message: 'Task deleted successfully' };
      }
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
