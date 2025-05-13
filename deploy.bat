@echo off
echo ===== FinPath Insight Deployment Script =====
echo.

echo Step 1: Testing API connections...
node test-api-connections.mjs

if %ERRORLEVEL% NEQ 0 (
  echo Error: API connection tests failed!
  echo Please fix the issues before deploying.
  echo.
  pause
  exit /b 1
)

echo.
echo Step 2: Pushing changes to GitHub...
echo Would you like to push changes to GitHub before deploying? (Y/N)
set /p push_choice="Choice: "

if /i "%push_choice%"=="Y" (
  echo.
  echo Adding all changes to staging...
  git add .
  
  echo.
  echo Committing changes...
  set /p commit_message="Enter commit message: "
  git commit -m "%commit_message%"
  
  echo.
  echo Pushing to GitHub...
  git push origin main
  
  if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Warning: Failed to push to GitHub!
    echo Continuing with deployment anyway...
  ) else (
    echo.
    echo Successfully pushed changes to GitHub.
  )
)

echo.
echo Step 3: Building the project for production...
call npm run build

if %ERRORLEVEL% NEQ 0 (
  echo Error: Build failed!
  pause
  exit /b %ERRORLEVEL%
)

echo.
echo Step 4: Checking if Netlify CLI is installed...
where netlify >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo Netlify CLI is not installed. Installing now...
  call npm install -g netlify-cli
  if %ERRORLEVEL% NEQ 0 (
    echo Failed to install Netlify CLI. Please install it manually with 'npm install -g netlify-cli'.
    pause
    exit /b 1
  )
  echo Netlify CLI installed successfully.
)

echo.
echo Step 4: Deploying to Netlify...
echo.
echo You'll need a Netlify account to continue.
echo If you're not logged in, you'll be prompted to do so.
echo.
pause

netlify deploy --prod --dir=dist

if %ERRORLEVEL% NEQ 0 (
  echo Deployment failed! Please check the error message above.
  pause
  exit /b %ERRORLEVEL%
)

echo.
echo Deployment complete! Your site is now live on Netlify.
echo.
pause
