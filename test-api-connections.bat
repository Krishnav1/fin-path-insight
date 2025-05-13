@echo off
echo ===== FinPath Insight API Connection Test =====
echo.

echo Running API connection tests...
node test-api-connections.mjs

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo API connection tests failed! Please fix the issues before deploying.
  pause
  exit /b %ERRORLEVEL%
)

echo.
echo All API connections are working properly!
echo You can now proceed with the deployment.
echo.
pause
