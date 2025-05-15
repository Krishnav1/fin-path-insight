# FinPath Insight Production Deployment Guide

This guide provides detailed instructions for deploying the FinPath Insight application to production on Netlify with proper integration of the backend services on Render.com.

## Architecture Overview

FinPath Insight uses a multi-tier architecture:

1. **Frontend**: React application deployed on Netlify
2. **Node.js Backend**: Express API service deployed on Render.com (https://fininsight.onrender.com)
3. **FastAPI Backend**: Python API service deployed on Render.com (https://fin-path-insight-fastapi.onrender.com)
4. **Database**: MongoDB Atlas cloud database

## Prerequisites

- Node.js v18 or higher
- Git
- Netlify account
- Netlify CLI installed (`npm install -g netlify-cli`)
- Access to the GitHub repository (https://github.com/Krishnav1/fin-path-insight)

## Deployment Steps

### 1. Clone the Repository

If you haven't already, clone the repository:

```bash
git clone https://github.com/Krishnav1/fin-path-insight.git
cd fin-path-insight
```

### 2. Install Dependencies

Install all required packages:

```bash
npm install
```

### 3. Test API Connections

Before deployment, test connections to both backend services:

```bash
node test-api-connections.js
```

This will verify that both the Node.js and FastAPI backends are accessible and functioning correctly.

### 4. Build for Production

Build the application for production:

```bash
npm run build
```

This creates optimized files in the `dist` directory.

### 5. Deploy to Netlify

Use the provided deployment script:

```bash
.\deploy.bat
```

This script will:
- Test API connections
- Prompt you to push changes to GitHub
- Build the project for production
- Deploy to Netlify

Alternatively, deploy manually:

```bash
netlify deploy --prod --dir=dist
```

## Updating Existing Deployment

To update an existing deployment:

1. Make your code changes
2. Test locally with `npm run dev`
3. Run the deployment script: `.\deploy.bat`
4. Verify the changes on the live site

## Configuration Files

### .env.production

This file contains environment variables for production:

```
# API Configuration
VITE_API_BASE_URL=https://fininsight.onrender.com
VITE_API_ENVIRONMENT=production
VITE_FASTAPI_URL=https://fin-path-insight-fastapi.onrender.com

# Feature Flags
VITE_ENABLE_FALLBACK_APIS=true
VITE_ENABLE_ERROR_MONITORING=true
```

### netlify.toml

This file configures Netlify deployment and redirects:

```toml
[build]
  command = "npm run build"
  publish = "dist"
  environment = { NODE_VERSION = "18" }

# Node.js API proxy with fallback handling
[[redirects]]
  from = "/api/*"
  to = "https://fininsight.onrender.com/api/:splat"
  status = 200
  force = true
  headers = {X-From = "Netlify", X-Proxy-Type = "Node"}

# FastAPI proxy for specific endpoints
[[redirects]]
  from = "/fastapi/*"
  to = "https://fin-path-insight-fastapi.onrender.com/api/:splat"
  status = 200
  force = true
  headers = {X-From = "Netlify", X-Proxy-Type = "FastAPI"}
```

## Troubleshooting MongoDB Connection Issues

The MongoDB connection issues shown in the error logs can be resolved with these steps:

1. **Update Connection Timeouts**: The MongoDB connection timeouts have been increased in the `updateStockData.js` script to handle network latency.

2. **Retry Logic**: Enhanced retry logic with exponential backoff has been implemented to handle temporary connection issues.

3. **Check MongoDB Atlas Settings**:
   - Ensure your IP is whitelisted in MongoDB Atlas
   - Verify the connection string in your environment variables
   - Check that the MongoDB user has the correct permissions

4. **GitHub Actions Environment**:
   - The GitHub workflow has been updated to handle MongoDB connection issues better
   - Static data fallbacks have been implemented for when MongoDB is unavailable

5. **Alternative Database Options**:
   - If MongoDB Atlas continues to have issues, consider using a different MongoDB provider
   - Possible alternatives: MongoDB Atlas M10 dedicated cluster, DigitalOcean MongoDB, or self-hosted MongoDB

## Error Handling System

A comprehensive error handling system has been implemented:

1. **Centralized Error Handler**: `src/utils/errorHandler.js` provides standardized error handling.

2. **Error Display Component**: `src/components/common/ErrorDisplay.jsx` shows user-friendly error messages.

3. **API Service with Fallbacks**: `src/services/apiService.js` includes fallback mechanisms when primary APIs fail.

## Monitoring and Maintenance

1. **Check Netlify Deployment Status**: Visit the Netlify dashboard to monitor your deployment.

2. **Monitor Backend Services**: Regularly check the health of both backend services on Render.com.

3. **Database Monitoring**: Set up MongoDB Atlas alerts for database performance and availability.

4. **GitHub Actions**: The `update-stock-data.yml` workflow runs daily to update stock data. Check its status in the GitHub Actions tab.

## Support and Contact

If you encounter any issues with the deployment, please contact the development team or open an issue on GitHub.

---

Last updated: May 14, 2025
