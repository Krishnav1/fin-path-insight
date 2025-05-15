@echo off
echo ===== Pushing FinInsight Enhanced Platform to GitHub =====

echo.
echo Step 1: Adding all changes to git...
git add .

echo.
echo Step 2: Committing changes...
set /p commit_message="Enter commit message (default: 'Enhanced FinInsight with FMP, NewsAPI and Gemini AI'): "
if "%commit_message%"=="" set commit_message=Enhanced FinInsight with FMP, NewsAPI and Gemini AI
git commit -m "%commit_message%"

echo.
echo Step 3: Pushing to GitHub...
git push

echo.
echo ===== Push completed! =====
echo.
echo Next steps:
echo 1. Update your .env file with the required API keys
echo 2. Run 'python test_api.py' to test the API functionality
echo 3. Deploy to Render following the instructions in RENDER_DEPLOYMENT.md
echo.
pause
