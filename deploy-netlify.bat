@echo off
echo Installing dependencies for main project...
call npm install

echo Installing dependencies for getInvestmentReport function...
cd netlify\functions\getInvestmentReport
call npm install

echo Installing dependencies for fingenieChat function...
cd ..\..\..
cd netlify\functions\fingenieChat
call npm install

echo Installing dependencies for finGenieOracle function...
cd ..\..\..
cd netlify\functions\finGenieOracle
call npm install

echo Building the project...
cd ..\..\..
call npx vite build

echo Deploying to Netlify...
call netlify deploy --prod

echo Deployment process completed!
