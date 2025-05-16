// Netlify-specific build script
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting Netlify build process...');

// Function to safely execute commands
function runCommand(command, cwd = process.cwd()) {
  try {
    console.log(`Running: ${command}`);
    execSync(command, { stdio: 'inherit', cwd });
    return true;
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Install main project dependencies
console.log('Installing main dependencies...');
runCommand('npm install');

// Install Netlify function dependencies
console.log('Installing Netlify function dependencies...');

// Define function directories
const functionDirs = [
  'netlify/functions/getInvestmentReport',
  'netlify/functions/fingenieChat',
  'netlify/functions/finGenieOracle'
];

// Install dependencies for each function
functionDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`Installing dependencies for ${dir}...`);
    runCommand('npm install', dir);
  } else {
    console.warn(`Function directory not found: ${dir}`);
  }
});

// Build the frontend using our simplified config
console.log('Building frontend...');
if (runCommand('npx vite build --config vite.config.simple.js')) {
  console.log('Build completed successfully!');
} else {
  console.error('Build failed');
  process.exit(1);
}
