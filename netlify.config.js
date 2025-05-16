// netlify.config.js
module.exports = {
  // Specify the directory where your Netlify Functions are located
  functions: {
    directory: 'netlify/functions'
  },
  
  // Configure build settings
  build: {
    environment: {
      NODE_VERSION: '18'
    },
    publish: 'dist',
    command: 'npm run netlify-build'
  }
};
