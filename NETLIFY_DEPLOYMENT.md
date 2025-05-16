# Netlify Deployment Instructions

## Environment Variables

Make sure to set the following environment variables in your Netlify dashboard:

1. **GEMINI_API_KEY**: Your Google Gemini API key for the FinGenie chat and investment report features
2. **EODHD_API_KEY**: Your EODHD API key for fetching stock data as a backup to yfinance

## Deploying the Site

You can deploy the site using one of these methods:

### Method 1: Using the Netlify CLI

```bash
# Run the deployment script
./deploy-netlify.bat
```

### Method 2: Manual Deployment

1. Build the project:
```bash
npm install
npx vite build
```

2. Deploy to Netlify:
```bash
netlify deploy --prod
```

## Netlify Functions

This project uses two Netlify Functions:

1. **fingenieChat**: Handles chat conversations using Google Gemini
2. **getInvestmentReport**: Generates investment reports for stocks using yfinance, EODHD, and Google Gemini

Make sure both functions are properly deployed and the environment variables are set correctly.

## Troubleshooting

If you encounter any issues with the deployment:

1. Check that all dependencies are installed correctly
2. Verify that the environment variables are set in the Netlify dashboard
3. Check the Netlify deployment logs for any errors
