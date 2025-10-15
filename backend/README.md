# Notes - Todo Calendar Backend API 


- **SQLite Database** - Lightweight, file-based database
- **RESTful API** - Full CRUD operations for tasks
- **Recurring Tasks** - Support for recurring task management
- **Event Types** - Different types of events (tasks, birthdays, vacations, etc.)
- **CORS Support** - Configured for Angular frontend

## Setup

1. **Install dependencies:**
   ```bash
   cd todo-app/backend
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

3. **The API will be available at:**
   - `http://localhost:3001`

## API Endpoints

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/date/:date` - Get tasks for specific date
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `DELETE /api/tasks/recurring/:text/:originalDate` - Delete all recurring tasks

### Health Check
- `GET /api/health` - API health status

## Database Schema

The SQLite database automatically creates a `tasks` table with the following structure:

```sql
CREATE TABLE tasks (
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
);
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=3001
NODE_ENV=development
```

## CORS Configuration

The API is configured to accept requests from:
- `http://localhost:4200` (Angular dev server)
- `http://localhost:3000`
- Your Netlify domain (update in server.js)

## Development

- **Database file:** `todos.db` (created automatically)
- **Logs:** Check console for API requests and errors
- **Hot reload:** Use `npm run dev` for development

## Production Deployment

For production deployment:
1. Set `NODE_ENV=production` in environment variables
2. Update CORS origins to include the production domain
3. For production, switch to a more robust database (PostgreSQL, MySQL) 

