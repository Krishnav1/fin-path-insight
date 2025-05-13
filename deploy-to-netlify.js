const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const siteName = 'fin-path-insight';
const teamName = ''; // Leave empty for personal account

// Check if Netlify CLI is installed
try {
  execSync('netlify --version', { stdio: 'ignore' });
  console.log('✅ Netlify CLI is installed');
} catch (error) {
  console.log('❌ Netlify CLI is not installed. Installing...');
  try {
    execSync('npm install -g netlify-cli', { stdio: 'inherit' });
    console.log('✅ Netlify CLI installed successfully');
  } catch (installError) {
    console.error('❌ Failed to install Netlify CLI:', installError.message);
    process.exit(1);
  }
}

// Check if the user is logged in to Netlify
try {
  execSync('netlify status', { stdio: 'ignore' });
  console.log('✅ Already logged in to Netlify');
} catch (error) {
  console.log('❌ Not logged in to Netlify. Please login:');
  try {
    execSync('netlify login', { stdio: 'inherit' });
    console.log('✅ Successfully logged in to Netlify');
  } catch (loginError) {
    console.error('❌ Failed to login to Netlify:', loginError.message);
    process.exit(1);
  }
}

// Check if site exists
let siteExists = false;
try {
  const siteInfo = execSync(`netlify sites:list --json`).toString();
  const sites = JSON.parse(siteInfo);
  siteExists = sites.some(site => site.name === siteName);
  
  if (siteExists) {
    console.log(`✅ Site '${siteName}' exists`);
  } else {
    console.log(`❌ Site '${siteName}' does not exist. Creating...`);
    const createCommand = teamName 
      ? `netlify sites:create --name ${siteName} --team ${teamName}`
      : `netlify sites:create --name ${siteName}`;
    
    execSync(createCommand, { stdio: 'inherit' });
    console.log(`✅ Site '${siteName}' created successfully`);
  }
} catch (error) {
  console.error('❌ Error checking/creating site:', error.message);
  process.exit(1);
}

// Build the project
console.log('🔨 Building the project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Deploy to Netlify
console.log('🚀 Deploying to Netlify...');
try {
  execSync(`netlify deploy --prod --dir=dist --site=${siteName}`, { stdio: 'inherit' });
  console.log('✅ Deployment successful!');
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}

console.log('✨ All done! Your site is now live on Netlify.');
