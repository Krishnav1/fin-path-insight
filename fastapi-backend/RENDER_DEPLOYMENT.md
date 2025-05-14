# Render Deployment Guide for FinInsight API

This guide provides instructions for deploying the FinInsight FastAPI backend to Render.

## Prerequisites

1. A [Render](https://render.com) account
2. Your GitHub repository with the FinInsight codebase
3. API keys for all required services

## Deployment Steps

### 1. Create a New Web Service

1. Log in to your Render dashboard
2. Click "New" and select "Web Service"
3. Connect your GitHub repository
4. Select the repository containing the FinInsight codebase

### 2. Configure the Web Service

Use the following settings:

- **Name**: `fin-insight-api` (or your preferred name)
- **Root Directory**: Leave empty (we'll use the root of the repository)
- **Environment**: Python 3
- **Build Command**: `chmod +x ./build.sh && ./build.sh`
- **Start Command**: `chmod +x ./start.sh && ./start.sh`
- **Plan**: Free (or select a paid plan for better performance)

### 3. Add Environment Variables

Add the following environment variables in the Render dashboard:

| Key | Value | Description |
|-----|-------|-------------|
| `GEMINI_API_KEY` | Your API key | Google Gemini API key |
| `PINECONE_API_KEY` | Your API key | Pinecone API key |
| `PINECONE_INDEX_NAME` | `fingenie-finance-vectors` | Pinecone index name |
| `PINECONE_CLOUD` | `aws` | Pinecone cloud provider |
| `FMP_API_KEY` | Your API key | Financial Modeling Prep API key |
| `NEWS_API_KEY` | Your API key | NewsAPI key |
| `SUPABASE_URL` | Your URL | Supabase project URL |
| `SUPABASE_ANON_KEY` | Your key | Supabase anonymous key |
| `SUPABASE_TTL_CACHE` | `3600` | Cache TTL in seconds |
| `NODE_ENV` | `production` | Environment setting |

### 4. Deploy the Service

1. Click "Create Web Service"
2. Wait for the build and deployment to complete
3. Once deployed, Render will provide a URL for your API

### 5. Verify Deployment

1. Test the API health endpoint: `https://your-render-url.onrender.com/health`
2. Test other endpoints using the provided URL

### 6. Set Up Auto-Deploy (Optional)

By default, Render will automatically deploy when you push to the main branch of your repository. You can configure this in the "Settings" tab of your Web Service.

### 7. Monitoring and Logs

- View logs in the "Logs" tab of your Web Service
- Set up alerts for service outages or errors

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check that all dependencies are listed in `requirements.txt`
   - Ensure Python version compatibility

2. **Runtime Errors**:
   - Check logs for specific error messages
   - Verify all environment variables are set correctly

3. **API Key Issues**:
   - Ensure all API keys are valid and not expired
   - Check for rate limiting on external APIs

### Getting Help

If you encounter issues not covered here, refer to:
- [Render Documentation](https://render.com/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

## Updating Your Deployment

To update your deployment:

1. Push changes to your GitHub repository
2. Render will automatically build and deploy the new version
3. Monitor the logs to ensure the deployment succeeds

## Scaling (For Paid Plans)

If you're on a paid plan, you can scale your service:

1. Go to the "Settings" tab of your Web Service
2. Under "Instance Type", select a higher tier
3. Save changes to apply the new configuration
