// Simple build script for Netlify deployment
const { execSync } = require('child_process');

console.log('Starting build process...');

// Install main dependencies
console.log('Installing main dependencies...');
execSync('npm install', { stdio: 'inherit' });

// Install function dependencies
console.log('Installing function dependencies...');
try {
  // Install each function's dependencies separately
  console.log('Installing getInvestmentReport dependencies...');
  execSync('cd netlify/functions/getInvestmentReport && npm install', { stdio: 'inherit' });
  
  console.log('Installing fingenieChat dependencies...');
  execSync('cd netlify/functions/fingenieChat && npm install', { stdio: 'inherit' });
  
  console.log('Installing finGenieOracle dependencies...');
  execSync('cd netlify/functions/finGenieOracle && npm install', { stdio: 'inherit' });
} catch (error) {
  console.error('Error installing function dependencies:', error.message);
  // Continue with the build even if function dependencies fail
}

// Build the frontend
console.log('Building frontend...');
try {
  // Use a more direct approach to build
  execSync('npx vite build --emptyOutDir', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
