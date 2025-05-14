@echo off
echo ===== FinPath Insight Git Push Script =====
echo.

echo Step 1: Adding all changes to staging...
git add .

echo.
echo Step 2: Committing changes...
set /p commit_message="Enter commit message: "
git commit -m "%commit_message%"

echo.
echo Step 3: Pushing to GitHub...
git push krishna main

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo Error: Failed to push to GitHub!
  echo Please check your internet connection and GitHub credentials.
  echo.
  pause
  exit /b 1
) else (
  echo.
  echo Success! All changes have been pushed to GitHub.
  echo You can now proceed with deploying to Netlify.
  echo.
  pause
)
