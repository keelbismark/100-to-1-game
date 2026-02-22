#!/bin/bash

echo "Starting 100 to 1 Game System..."
echo ""

echo "Starting Server..."
cd server && npm install && npm start &
SERVER_PID=$!

echo "Starting Client..."
cd client && npm install && npm run dev &
CLIENT_PID=$!

echo ""
echo "Server runs on: http://localhost:5000"
echo "Client runs on: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

wait $SERVER_PID $CLIENT_PID
