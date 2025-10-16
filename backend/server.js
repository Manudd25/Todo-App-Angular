import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase, closeDatabase } from './config/database.js';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import healthRoutes from './routes/health.js';

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:4200', 
    'http://localhost:4201', 
    'http://localhost:3000',
    'https://onlinecalendar.z6.web.core.windows.net', // Azure Static Web App frontend
    'https://todolistangular1.netlify.app' // Netlify frontend (backup)
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.options('*', cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/health', healthRoutes);

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
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
