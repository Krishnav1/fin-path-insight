@echo off
echo Deploying to Deno Deploy...
echo.

REM Check if deployctl is installed
where deployctl >nul 2>&1
if %errorlevel% neq 0 (
  echo deployctl not found. Installing...
  deno install --allow-all --no-check -r -f https://deno.land/x/deploy/deployctl.ts
)

REM Deploy to Deno Deploy
echo Deploying to Deno Deploy...
deployctl deploy --project=finpath-api --prod ./main.ts

echo.
echo Deployment complete!
