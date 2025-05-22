# Fin Path Insight - Supabase Edge Functions

This directory contains all the Edge Functions for the Fin Path Insight application, migrated from Deno Deploy to Supabase Edge Functions.

## Functions Overview

| Function Name | Description |
|---------------|-------------|
| `analyze-portfolio` | Analyzes portfolio holdings using Google's Gemini API |
| `eodhd-fundamentals` | Retrieves stock fundamentals data from EODHD API |
| `eodhd-proxy` | Forwards requests to the EODHD API |
| `eodhd-realtime` | Provides real-time stock data from EODHD API |
| `fingenie-chat` | AI chat capabilities using Google's Gemini API |
| `fingenie-oracle` | Financial information using Google's Gemini API |
| `investment-report` | Generates investment reports using multiple data sources |
| `market-data` | Provides market data from external APIs |

## Deployment Instructions

### Prerequisites

1. A Supabase account and project
2. API keys for:
   - Google Gemini API
   - EODHD API
   - Alpha Vantage API (optional)

### Deployment Steps

1. Copy the `.env.example` file to `.env` and fill in your API keys
2. Deploy each function using the Supabase Dashboard or CLI:

#### Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to "Edge Functions" in the sidebar
3. Click "Create a new function"
4. Enter the function name (e.g., `analyze-portfolio`)
5. Upload the function files
6. Set environment variables in "Project Settings" > "API" > "Environment Variables"

#### Using Supabase CLI

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Deploy a function
supabase functions deploy analyze-portfolio --project-ref your-project-ref
```

## Environment Variables

The following environment variables need to be set in your Supabase project:

- `GEMINI_API_KEY`: Your Google Gemini API key
- `EODHD_API_KEY`: Your EODHD API key
- `ALPHA_VANTAGE_API_KEY`: Your Alpha Vantage API key (optional)

## Frontend Integration

The frontend code has been updated to use the Supabase Edge Functions. The API endpoints are configured in `src/config/api-config.ts`.

Make sure to update your `.env` file with:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
VITE_EODHD_API_KEY=your-eodhd-api-key
```

## Testing

After deployment, you can test the functions using the Supabase Dashboard:

1. Go to your Supabase project dashboard
2. Navigate to "Edge Functions"
3. Click on a function
4. Use the "Invoke" button to test with sample data

## Troubleshooting

If you encounter any issues:

1. Check the function logs in the Supabase Dashboard
2. Verify that all environment variables are set correctly
3. Ensure your API keys are valid and have the necessary permissions
