#!/bin/bash

echo "🚀 Starting Todo Calendar App Development Environment"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the todo-app directory"
    exit 1
fi

# Install dependencies if needed
echo "📦 Checking dependencies..."
if [ ! -d "frontend/node_modules" ] || [ ! -d "backend/node_modules" ]; then
    echo "Installing dependencies..."
    npm run install:all
fi

echo "✅ Dependencies ready"
echo ""

# Start the backend
echo "🔧 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start the frontend
echo "🎨 Starting frontend server..."
cd ../frontend
ng serve &
FRONTEND_PID=$!

echo ""
echo "🎉 Development servers started!"
echo "Frontend: http://localhost:4200"
echo "Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait
