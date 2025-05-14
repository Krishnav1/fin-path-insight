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

echo Setting up development environment...
echo.

REM Check for .env.development file
if exist .env.development (
  echo - Using .env.development file
  copy .env.development .env /Y >nul
) else (
  echo - No .env.development file found, using default values
)

echo.
echo Testing API connections...
node test-api-connections.js
echo.

echo Starting development server...
echo.
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
