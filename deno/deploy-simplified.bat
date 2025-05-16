@echo off
echo ===== FinPath Insight - Deno API Deployment =====
echo.

cd %~dp0

echo Loading environment variables from .env.deploy...
set /p DENO_DEPLOY_TOKEN=<.env.deploy

echo Deploying to Deno Deploy...
deno deploy --project=finpath-api --prod main.ts

echo.
echo Deployment process completed!
echo Your API should be available at: https://finpath-api.deno.dev
echo.
pause
