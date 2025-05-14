@echo off
echo ===== FinPath Insight Development Environment Setup =====
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Node.js is not installed or not in your PATH.
  echo Please install Node.js from https://nodejs.org/
  pause
  exit /b 1
)

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Python is not installed or not in your PATH.
  echo Please install Python 3.9+ from https://www.python.org/
  pause
  exit /b 1
)

echo Setting up development environment...
echo.

REM Check for .env file
if exist .env (
  echo - Using existing .env file
) else if exist .env.example (
  echo - Creating .env from .env.example
  copy .env.example .env /Y >nul
  echo - Please edit the .env file with your actual API keys and configuration
  echo - Press any key to continue after editing...
  pause
) else (
  echo - No .env or .env.example file found, using default values
)

echo.
echo Starting FastAPI backend and frontend development servers...
echo.

REM Start FastAPI backend in a new window
start cmd /k "echo Starting FastAPI backend... & cd fastapi-backend & python -m uvicorn app.main:app --reload --port 8000"

REM Wait a moment for the backend to start
timeout /t 5 /nobreak >nul

REM Start frontend development server
echo Starting frontend development server...
start cmd /k "npm run dev"

echo.
echo Development environment started!
echo - FastAPI backend: http://localhost:8000
echo - Frontend: http://localhost:8080
echo - API Documentation: http://localhost:8000/docs
echo.
echo Press any key to open the application in your browser...
pause >nul

start http://localhost:8080
echo This will start the Vite development server with API fallbacks enabled.
echo Your application will be available at http://localhost:8080
echo.
echo Press Ctrl+C to stop the server when you're done.
echo.
pause

REM Start the development server with the proper environment
npm run dev

echo.
echo Development server stopped.
echo.
pause
