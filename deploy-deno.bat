@echo off
echo ===== FinPath Insight - Deno API Deployment =====
echo.

cd deno

echo Loading environment variables from .env.deploy...
set /p DENO_DEPLOY_TOKEN=<.env.deploy

echo Deploying to Deno Deploy...
deno run -A deploy.ts --project finpath-api --entrypoint main.ts

echo.
echo Deployment process completed!
echo Your API should be available at: https://finpath-api.deno.dev
echo.
pause
