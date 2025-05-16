// Simple build script for Netlify deployment
import { execSync } from 'child_process';

console.log('Starting build process...');

// Install main dependencies
console.log('Installing main dependencies...');
execSync('npm install', { stdio: 'inherit' });

// Install function dependencies
console.log('Installing function dependencies...');
try {
  // getInvestmentReport function
  console.log('Installing getInvestmentReport dependencies...');
  execSync('cd netlify/functions/getInvestmentReport && npm install', { stdio: 'inherit' });
  
  // fingenieChat function
  console.log('Installing fingenieChat dependencies...');
  execSync('cd netlify/functions/fingenieChat && npm install', { stdio: 'inherit' });
  
  // finGenieOracle function
  console.log('Installing finGenieOracle dependencies...');
  execSync('cd netlify/functions/finGenieOracle && npm install', { stdio: 'inherit' });
} catch (error) {
  console.error('Error installing function dependencies:', error.message);
  // Continue with the build even if function dependencies fail
}

// Build the frontend
console.log('Building frontend...');
try {
  execSync('npx vite build', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
