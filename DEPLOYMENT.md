# Deployment Guide for FinPath Insight

This guide provides step-by-step instructions for deploying the FinPath Insight application to Netlify.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Git
- Netlify account

## Deployment Options

### Option 1: Using the Deployment Script (Recommended)

We've created a deployment script that automates the process of deploying to Netlify.

1. Make sure you have the Netlify CLI installed:
   ```
   npm install -g netlify-cli
   ```

2. Run the deployment script:
   ```
   node deploy-to-netlify.js
   ```

3. Follow the prompts in the terminal. If you're not logged in to Netlify, the script will guide you through the login process.

4. Once deployment is complete, the script will output the URL of your deployed site.

### Option 2: Manual Deployment

#### Step 1: Build the Project

1. Install dependencies:
   ```
   npm install
   ```

2. Create production build:
   ```
   npm run build
   ```

#### Step 2: Deploy to Netlify

1. Install Netlify CLI if you haven't already:
   ```
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```
   netlify login
   ```

3. Initialize a new Netlify site:
   ```
   netlify init
   ```

4. Follow the prompts to either create a new site or connect to an existing one.

5. Deploy the site:
   ```
   netlify deploy --prod
   ```

6. When prompted for the publish directory, enter `dist`.

### Option 3: Continuous Deployment via GitHub

1. Push your code to a GitHub repository.

2. Log in to your Netlify account and click "New site from Git".

3. Select GitHub as your Git provider and authorize Netlify.

4. Select your repository.

5. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

6. Click "Deploy site".

## Environment Variables

Make sure to set the following environment variables in your Netlify site settings:

- `VITE_API_BASE_URL`: The URL of your FastAPI backend (e.g., https://fininsight.onrender.com)
- `VITE_API_ENVIRONMENT`: Set to `production` for production deployment

You can set these variables in the Netlify dashboard under Site settings > Build & deploy > Environment.

## Troubleshooting

### API Connection Issues

If you're experiencing issues connecting to the API:

1. Check that the API URL in `.env.production` is correct.
2. Verify that the redirects in `netlify.toml` are properly configured.
3. Check for CORS issues in your browser's developer console.

### Build Failures

If your build is failing:

1. Check the build logs in the Netlify dashboard.
2. Ensure all dependencies are properly installed.
3. Verify that the build command and publish directory are correctly set.

## Custom Domain Setup

To set up a custom domain:

1. Go to your site settings in the Netlify dashboard.
2. Navigate to "Domain management".
3. Click "Add custom domain".
4. Follow the instructions to configure your DNS settings.

## Monitoring and Logging

For monitoring and logging:

1. Set up Netlify Analytics for site traffic monitoring.
2. Consider implementing a logging service like Sentry for error tracking.
3. Use the browser console logs for debugging client-side issues.

## Security Considerations

1. Ensure sensitive API keys are stored as environment variables.
2. Use HTTPS for all API communications.
3. Implement proper authentication for protected routes.
4. Consider adding Content Security Policy headers in `netlify.toml`.

## Support

If you encounter any issues with deployment, refer to the [Netlify documentation](https://docs.netlify.com/) or contact the development team for assistance.
