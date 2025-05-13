@echo off
echo ===== FinPath Insight Build Test =====
echo.

echo Step 1: Testing API connections...
node test-api-connections.mjs

if %ERRORLEVEL% NEQ 0 (
  echo Error: API connection tests failed!
  echo Please fix the API connection issues before proceeding.
  pause
  exit /b %ERRORLEVEL%
)

echo.
echo Step 2: Building the project for production...
call npm run build

if %ERRORLEVEL% NEQ 0 (
  echo Error: Build failed!
  pause
  exit /b %ERRORLEVEL%
)

echo.
echo Step 3: Starting local preview server...
echo.
echo This will start a local server to preview the production build.
echo Press Ctrl+C to stop the server when you're done testing.
echo.
pause

npx vite preview --port 3000

echo.
echo Test complete! If everything looks good, you can deploy to Netlify.
echo.
pause
