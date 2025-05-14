@echo off
echo ===== FinPath Insight API Connection Test =====
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Node.js is not installed or not in your PATH.
  echo Please install Node.js from https://nodejs.org/
  pause
  exit /b 1
)

echo Loading environment variables...
if exist .env (
  echo - Using .env file
) else (
  echo - No .env file found, using default values
)

echo.
echo Running API connection tests...
node test-api-connections.js

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo Some critical API connections failed!
  echo Review the test results above and check:
  echo 1. If Render.com services are running
  echo 2. Your network connection
  echo 3. MongoDB connection settings
  echo.
  echo You can still run the application with fallbacks enabled.
  pause
  exit /b %ERRORLEVEL%
)

echo.
echo API connection tests completed successfully!
echo You can now proceed with running the application.
echo.
pause
