@echo off
setlocal enabledelayedexpansion
echo ===== FinPath Insight - Deno API Deployment =====
echo.

cd deno

echo Loading environment variables...
set /p DENO_DEPLOY_TOKEN=<.env.deploy

echo Token: %DENO_DEPLOY_TOKEN:~0,5%... (first 5 chars shown for security)

REM Check if token is empty or invalid
if "%DENO_DEPLOY_TOKEN%"=="" (
    echo ERROR: DENO_DEPLOY_TOKEN is empty. Please check your .env.deploy file.
    goto :error
)

REM Set the token as an environment variable for deployctl
set DENO_DEPLOY_TOKEN=%DENO_DEPLOY_TOKEN%

echo Deploying to Deno Deploy...
echo This will deploy the API to https://finpath-api.deno.dev

REM Check if deployctl is installed
where deployctl >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Installing deployctl...
    deno install --allow-all --no-check -r -f https://deno.land/x/deploy/deployctl.ts
)

echo Running deployment...
deployctl deploy --project=finpath-api --prod main.ts

echo.
echo Deployment process completed!
echo Your API should be available at: https://finpath-api.deno.dev
echo.
goto :end

:error
echo.
echo Deployment failed! Please check the error messages above.
echo.

:end
pause
