import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function directories to create
const functionDirs = [
  'getInvestmentReport',
  'fingenieChat',
  'finGenieOracle'
];

// Base directory for Netlify functions
const basePath = path.join(__dirname, '..', 'netlify', 'functions');

// Create the base directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, '..', 'netlify'))) {
  fs.mkdirSync(path.join(__dirname, '..', 'netlify'));
}

if (!fs.existsSync(basePath)) {
  fs.mkdirSync(basePath);
}

// Create each function directory
functionDirs.forEach(dir => {
  const dirPath = path.join(basePath, dir);
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dirPath}`);
    fs.mkdirSync(dirPath);
  } else {
    console.log(`Directory already exists: ${dirPath}`);
  }
});

console.log('All function directories created successfully!');
