// deploy.js - Script to prepare Express backend for Render deployment
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

// Get current file path (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.cyan}=== FinPath Insight Express Backend Preparation for Render Deployment ===${colors.reset}\n`);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error(`${colors.red}✗ .env file not found at ${envPath}${colors.reset}`);
  process.exit(1);
}

// Read current .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');

// Ask for FastAPI URL
rl.question(`${colors.yellow}Enter your FastAPI backend URL from Vercel or other provider: ${colors.reset}`, (fastApiUrl) => {
  if (!fastApiUrl) {
    console.error(`${colors.red}✗ FastAPI URL is required${colors.reset}`);
    rl.close();
    process.exit(1);
  }

  // Update .env file with FastAPI URL
  let updatedEnvContent = '';
  let fastApiUrlFound = false;

  for (const line of envLines) {
    if (line.startsWith('FASTAPI_URL=')) {
      updatedEnvContent += `FASTAPI_URL=${fastApiUrl}\n`;
      fastApiUrlFound = true;
    } else if (line.startsWith('# FASTAPI_URL=')) {
      updatedEnvContent += `FASTAPI_URL=${fastApiUrl}\n`;
      fastApiUrlFound = true;
    } else {
      updatedEnvContent += line + '\n';
    }
  }

  // If FASTAPI_URL wasn't found, add it
  if (!fastApiUrlFound) {
    updatedEnvContent += `\n# FastAPI Backend URL\nFASTAPI_URL=${fastApiUrl}\n`;
  }

  // Write updated .env file
  fs.writeFileSync(envPath, updatedEnvContent);
  console.log(`${colors.green}✓ Updated .env file with FastAPI URL: ${fastApiUrl}${colors.reset}`);

  // Ask for MongoDB URI
  rl.question(`${colors.yellow}Enter your MongoDB Atlas URI (leave blank to keep current): ${colors.reset}`, (mongoDbUri) => {
    if (mongoDbUri) {
      // Update .env file with MongoDB URI
      let updatedEnvContent = '';
      let mongoDbUriFound = false;

      for (const line of envLines) {
        if (line.startsWith('MONGODB_URI=')) {
          updatedEnvContent += `MONGODB_URI=${mongoDbUri}\n`;
          mongoDbUriFound = true;
        } else {
          updatedEnvContent += line + '\n';
        }
      }

      // If MONGODB_URI wasn't found, add it
      if (!mongoDbUriFound) {
        updatedEnvContent += `\n# MongoDB Atlas URI\nMONGODB_URI=${mongoDbUri}\n`;
      }

      // Write updated .env file
      fs.writeFileSync(envPath, updatedEnvContent);
      console.log(`${colors.green}✓ Updated .env file with MongoDB URI${colors.reset}`);
    }

    // Set NODE_ENV to production
    let updatedEnvContent = fs.readFileSync(envPath, 'utf8');
    updatedEnvContent = updatedEnvContent.replace(/NODE_ENV=development/g, 'NODE_ENV=production');
    fs.writeFileSync(envPath, updatedEnvContent);
    console.log(`${colors.green}✓ Set NODE_ENV to production${colors.reset}`);

    console.log(`\n${colors.bright}${colors.cyan}=== Deployment Preparation Complete ===${colors.reset}`);
    console.log(`${colors.yellow}Next steps for Render deployment:${colors.reset}`);
    console.log(`${colors.yellow}1. Push your changes to GitHub${colors.reset}`);
    console.log(`${colors.yellow}2. Create a new Web Service on Render${colors.reset}`);
    console.log(`${colors.yellow}3. Connect your GitHub repository${colors.reset}`);
    console.log(`${colors.yellow}4. Configure the following settings:${colors.reset}`);
    console.log(`   ${colors.cyan}- Name:${colors.reset} fin-path-insight-backend`);
    console.log(`   ${colors.cyan}- Environment:${colors.reset} Node`);
    console.log(`   ${colors.cyan}- Build Command:${colors.reset} npm install`);
    console.log(`   ${colors.cyan}- Start Command:${colors.reset} npm start`);
    console.log(`${colors.yellow}5. Add the following environment variables:${colors.reset}`);
    console.log(`   ${colors.cyan}- MONGODB_URI${colors.reset}`);
    console.log(`   ${colors.cyan}- JWT_SECRET${colors.reset}`);
    console.log(`   ${colors.cyan}- FASTAPI_URL${colors.reset} (the URL you just entered)`);
    console.log(`   ${colors.cyan}- GEMINI_API_KEY${colors.reset}`);
    console.log(`   ${colors.cyan}- PINECONE_API_KEY${colors.reset}`);
    console.log(`   ${colors.cyan}- PINECONE_INDEX_NAME${colors.reset}`);
    console.log(`   ${colors.cyan}- ALPHA_VANTAGE_API_KEY${colors.reset}`);
    console.log(`   ${colors.cyan}- NEWS_API_KEY${colors.reset}`);
    console.log(`   ${colors.cyan}- NODE_ENV${colors.reset} = production`);
    console.log(`${colors.yellow}6. Click 'Create Web Service' to deploy${colors.reset}`);
    console.log(`${colors.yellow}7. Your API will be available at https://fin-path-insight-backend.onrender.com${colors.reset}`);

    rl.close();
  });
});
