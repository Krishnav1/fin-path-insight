// deploy-render.js - Script to prepare FastAPI backend for Render deployment
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

console.log(`${colors.bright}${colors.cyan}=== FinPath Insight FastAPI Backend Preparation for Render Deployment ===${colors.reset}\n`);

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

// Create render.yaml file for Render deployment
console.log(`${colors.yellow}Creating render.yaml file for Render deployment...${colors.reset}`);

const renderYaml = `
# render.yaml
services:
  - type: web
    name: fin-path-insight-fastapi
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: GEMINI_API_KEY
        sync: false
      - key: PINECONE_API_KEY
        sync: false
      - key: PINECONE_INDEX_NAME
        sync: false
      - key: PINECONE_CLOUD
        sync: false
      - key: ALPHA_VANTAGE_API_KEY
        sync: false
      - key: NEWS_API_KEY
        sync: false
      - key: PORT
        value: 10000
`;

fs.writeFileSync(path.join(__dirname, 'render.yaml'), renderYaml);
console.log(`${colors.green}✓ Created render.yaml file${colors.reset}`);

// Create a start script for Render
console.log(`${colors.yellow}Creating start.sh script for Render deployment...${colors.reset}`);

const startSh = `#!/bin/bash
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
`;

fs.writeFileSync(path.join(__dirname, 'start.sh'), startSh);
console.log(`${colors.green}✓ Created start.sh file${colors.reset}`);

// Check if requirements.txt exists
const requirementsPath = path.join(__dirname, 'requirements.txt');
if (!fs.existsSync(requirementsPath)) {
  console.error(`${colors.red}✗ requirements.txt file not found at ${requirementsPath}${colors.reset}`);
  process.exit(1);
}

console.log(`${colors.green}✓ requirements.txt file found${colors.reset}`);

console.log(`\n${colors.bright}${colors.cyan}=== Deployment Preparation Complete ===${colors.reset}`);
console.log(`${colors.yellow}Next steps for Render deployment:${colors.reset}`);
console.log(`${colors.yellow}1. Push your changes to GitHub${colors.reset}`);
console.log(`${colors.yellow}2. Create a new Web Service on Render${colors.reset}`);
console.log(`${colors.yellow}3. Connect your GitHub repository${colors.reset}`);
console.log(`${colors.yellow}4. Configure the following settings:${colors.reset}`);
console.log(`   ${colors.cyan}- Name:${colors.reset} fin-path-insight-fastapi`);
console.log(`   ${colors.cyan}- Environment:${colors.reset} Python`);
console.log(`   ${colors.cyan}- Build Command:${colors.reset} pip install -r requirements.txt`);
console.log(`   ${colors.cyan}- Start Command:${colors.reset} python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`);
console.log(`${colors.yellow}5. Add the following environment variables:${colors.reset}`);
console.log(`   ${colors.cyan}- GEMINI_API_KEY${colors.reset}`);
console.log(`   ${colors.cyan}- PINECONE_API_KEY${colors.reset}`);
console.log(`   ${colors.cyan}- PINECONE_INDEX_NAME${colors.reset}`);
console.log(`   ${colors.cyan}- PINECONE_CLOUD${colors.reset}`);
console.log(`   ${colors.cyan}- ALPHA_VANTAGE_API_KEY${colors.reset}`);
console.log(`   ${colors.cyan}- NEWS_API_KEY${colors.reset}`);
console.log(`${colors.yellow}6. Click 'Create Web Service' to deploy${colors.reset}`);
console.log(`${colors.yellow}7. Your API will be available at https://fin-path-insight-fastapi.onrender.com${colors.reset}`);
console.log(`${colors.yellow}8. Update the Express backend .env file with this URL${colors.reset}`);

rl.close();
