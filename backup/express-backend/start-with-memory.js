// This script launches the server with increased memory allocation
const { spawn } = require('child_process');
const path = require('path');

console.log('Starting server with increased memory allocation...');

// Launch node with increased memory limits
const nodeProcess = spawn('node', [
  '--max-old-space-size=4096', // Allocate 4GB of memory
  path.join(__dirname, 'index.js')
], {
  stdio: 'inherit',
  shell: true
});

nodeProcess.on('error', (error) => {
  console.error('Failed to start server process:', error);
});

nodeProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});
