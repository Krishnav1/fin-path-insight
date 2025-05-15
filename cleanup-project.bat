@echo off
echo FinPath Insight Project Cleanup Script
echo =======================================
echo.
echo This script will:
echo 1. Back up the Express backend to the backup folder
echo 2. Remove unnecessary files
echo 3. Clean up temporary files
echo.
echo IMPORTANT: Run this script ONLY after verifying that your FastAPI backend
echo and frontend are working correctly with the new integration.
echo.
pause

echo.
echo Creating backup folder...
if not exist backup mkdir backup

echo.
echo Backing up Express backend...
if exist backend (
  xcopy /E /I /Y backend backup\express-backend
  echo Express backend backed up to backup\express-backend
)

echo.
echo Cleaning up temporary files...
if exist vite.config.ts.fixed del vite.config.ts.fixed
if exist README.md.new del README.md.new
if exist api-test-results-*.json del api-test-results-*.json

echo.
echo Cleanup complete!
echo.
echo Next steps:
echo 1. Start the FastAPI backend: cd fastapi-backend ^& python -m uvicorn app.main:app --reload --port 8000
echo 2. In another terminal, start the frontend: npm run dev
echo 3. Test the APIs as mentioned in the README.md
echo.
pause
