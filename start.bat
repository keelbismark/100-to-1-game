@echo off
echo Starting 100 to 1 Game System...
echo.

echo Starting Server...
start cmd /k "cd server && npm install && npm start"

echo Starting Client...
start cmd /k "cd client && npm install && npm run dev"

echo.
echo Server runs on: http://localhost:5000
echo Client runs on: http://localhost:3000
echo.
echo Press any key to close this window...
pause > nul
