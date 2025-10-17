import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase, closeDatabase } from './config/database.js';
import taskRoutes from './routes/tasks.js';
import healthRoutes from './routes/health.js';

dotenv.config();

const app = express();

const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:4200', 
    'https://onlinecalendarandtodolist.netlify.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.options('*', cors());

// Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/health', healthRoutes);

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Todo API server is running on port ${PORT}`);
      console.log(`📊 Database: SQLite`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  try {
    await closeDatabase();
    console.log('✅ Database connection closed');
  } catch (err) {
    console.error('Error closing database:', err);
  }
  process.exit(0);
});

startServer();
