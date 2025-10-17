import express from 'express';
import { Task } from '../models/Task.js';

const router = express.Router();

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const { date, eventType } = req.query;
    const tasks = await Task.findAll({ date, eventType });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get tasks for a specific date
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const tasks = await Task.findByDate(date);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks for date:', error);
    res.status(500).json({ error: 'Failed to fetch tasks for date' });
  }
});

// Create a new task
router.post('/', async (req, res) => {
  try {
    const { id, text, completed, date, color, isRecurring, recurringDays, originalDate, eventType } = req.body;

    const result = await Task.create({
      id,
      text,
      completed,
      date,
      color,
      isRecurring,
      recurringDays,
      originalDate,
      eventType
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update a task
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, completed, date, color, isRecurring, recurringDays, originalDate, eventType } = req.body;

    const result = await Task.update(id, {
      text,
      completed,
      date,
      color,
      isRecurring,
      recurringDays,
      originalDate,
      eventType
    });

    res.json(result);
  } catch (error) {
    console.error('Error updating task:', error);
    if (error.message === 'Task not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete a task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Task.delete(id);
    res.json(result);
  } catch (error) {
    console.error('Error deleting task:', error);
    if (error.message === 'Task not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Delete all recurring tasks with same text and originalDate
router.delete('/recurring/:text/:originalDate', async (req, res) => {
  try {
    const { text, originalDate } = req.params;
    const result = await Task.deleteRecurring(text, originalDate);
    res.json(result);
  } catch (error) {
    console.error('Error deleting recurring tasks:', error);
    res.status(500).json({ error: 'Failed to delete recurring tasks' });
  }
});

export default router;
