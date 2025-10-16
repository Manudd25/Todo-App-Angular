import express from 'express';

const router = express.Router();

// Health check
router.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Todo API is running' });
});

export default router;
