@echo off
echo ===== FinPath Insight Deployment Script =====
echo ===== Production Deployment to Netlify =====
echo.

echo Step 1: Testing API connections...
echo Setting up environment for production testing...

set NODE_ENV=production
set VITE_API_BASE_URL=https://fininsight.onrender.com
set VITE_FASTAPI_URL=https://fininsight.onrender.com
set VITE_ENABLE_FALLBACK_APIS=true
set VITE_ENABLE_ERROR_MONITORING=true
set NETLIFY_URL=https://fin-insight.netlify.app

echo Running API connection tests...
node test-api-connections.mjs

if %ERRORLEVEL% NEQ 0 (
  echo Warning: Some API connection tests failed.
  echo This may be expected if certain endpoints are not available.
  echo Continuing with deployment...
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
  git push krishna main
  
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

echo Setting up production environment variables...
echo Ensuring .env.production is properly configured...

if not exist .env.production (
  echo Creating .env.production file...
  echo # API Configuration > .env.production
  echo VITE_API_BASE_URL=https://fininsight.onrender.com >> .env.production
  echo VITE_API_ENVIRONMENT=production >> .env.production
  echo VITE_FASTAPI_URL=https://fininsight.onrender.com >> .env.production
  echo # Feature Flags >> .env.production
  echo VITE_ENABLE_FALLBACK_APIS=true >> .env.production
  echo VITE_ENABLE_ERROR_MONITORING=true >> .env.production
)

echo Running production build...
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
echo Step 5: Verifying netlify.toml configuration...
if not exist netlify.toml (
  echo ERROR: netlify.toml is missing! Cannot deploy without proper configuration.
  pause
  exit /b 1
)

echo Checking netlify.toml content...
findstr /C:"from = \"/api/\*\"" netlify.toml >nul
if %ERRORLEVEL% NEQ 0 (
  echo WARNING: netlify.toml may not have proper API redirects configured.
  echo Please verify the netlify.toml file before continuing.
  pause
)

echo.
echo Step 6: Deploying to Netlify...
echo.
echo You'll need a Netlify account to continue.
echo If you're not logged in, you'll be prompted to do so.
echo.
echo IMPORTANT: Make sure your site is already created on Netlify.
echo If this is your first deployment, you'll need to link to an existing site.
echo.
pause

echo Checking Netlify login status...
netlify status

echo.
echo Starting deployment to Netlify production...
netlify deploy --prod --dir=dist --message="Production deployment from script"

if %ERRORLEVEL% NEQ 0 (
  echo Deployment failed! Please check the error message above.
  pause
  exit /b %ERRORLEVEL%
)

echo.
echo Deployment complete! Your site is now live on Netlify.
echo.
echo IMPORTANT POST-DEPLOYMENT STEPS:
echo 1. Verify your site is working correctly by visiting it
echo 2. Test the API connections on the live site
echo 3. Check that both Node.js and FastAPI backends are accessible
echo.
echo If you encounter any issues, check the following:
echo - Netlify environment variables (should match .env.production)
echo - API redirects in netlify.toml
echo - CORS settings on both backends
echo.
pause
