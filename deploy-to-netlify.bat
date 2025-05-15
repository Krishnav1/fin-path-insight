@echo off
echo ===== FinPath Insight Netlify Deployment Preparation =====
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Node.js is not installed or not in your PATH.
  echo Please install Node.js from https://nodejs.org/
  pause
  exit /b 1
)

echo Setting up production environment...
echo.

REM Copy production environment file
if exist .env.production (
  echo - Using .env.production file
  copy .env.production .env /Y >nul
) else (
  echo - No .env.production file found, deployment may not work correctly
  pause
)

echo.
echo Building the project for production...
echo.

REM Run production build
call npm run build

if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Build failed. Please fix the errors and try again.
  pause
  exit /b 1
)

echo.
echo Build successful! Your project is ready for Netlify deployment.
echo.
echo You can deploy to Netlify using one of these methods:
echo 1. Netlify CLI: Run 'netlify deploy' if you have the Netlify CLI installed
echo 2. Netlify Drop: Drag and drop the 'dist' folder to https://app.netlify.com/drop
echo 3. GitHub Integration: Push to your GitHub repository connected to Netlify
echo.

REM Check if Netlify CLI is installed
where netlify >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  echo Netlify CLI is installed. Would you like to deploy now? (Y/N)
  set /p deploy_now=
  if /i "%deploy_now%"=="Y" (
    echo.
    echo Running 'netlify deploy'...
    netlify deploy
  )
) else (
  echo Netlify CLI is not installed. To install it, run: npm install -g netlify-cli
)

echo.
echo Done! Press any key to exit...
pause >nul
