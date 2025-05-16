# FinPath Insight API - Deno Deploy

This directory contains the API services for FinPath Insight, built with Deno and designed to be deployed on Deno Deploy.

## Features

- **FinGenie Chat API**: AI-powered financial chat assistant
- **Investment Report API**: Generates comprehensive stock analysis reports
- **FinGenie Oracle API**: Provides educational information about financial topics

## Benefits of Deno Deploy

- **No Timeout Limits**: Unlike Netlify Functions (10s limit), Deno Deploy allows longer-running processes
- **Global Edge Network**: Faster response times with servers close to users
- **Built-in TypeScript Support**: No compilation step needed
- **Simplified Deployment**: Easy deployment with CLI or GitHub integration

## Local Development

1. **Install Deno**:
   ```
   # Windows PowerShell
   irm https://deno.land/install.ps1 | iex
   
   # macOS/Linux
   curl -fsSL https://deno.land/install.sh | sh
   ```

2. **Install deployctl**:
   ```
   deno install -A jsr:@deno/deployctl --global
   ```

3. **Set up environment variables**:
   Copy `.env.example` to `.env` and add your API keys:
   ```
   cp .env.example .env
   ```

4. **Run locally**:
   ```
   deno run --allow-net --allow-env --allow-read main.ts
   ```

5. **Test the API**:
   The server will be available at `http://localhost:8000/`

## Deployment

### Option 1: Deploy with deployctl

1. **Authenticate with Deno Deploy**:
   ```
   deployctl deploy
   ```
   Follow the prompts to authenticate with GitHub.

2. **Set environment variables**:
   After deployment, go to the Deno Deploy dashboard and set your environment variables:
   - `GEMINI_API_KEY`
   - `EODHD_API_KEY`

### Option 2: Deploy with GitHub Integration

1. **Push this code to GitHub**
2. **Create a new project in Deno Deploy**
3. **Connect to your GitHub repository**
4. **Set the entry point to `deno/main.ts`**
5. **Add environment variables in the Deno Deploy dashboard**

## Frontend Integration

Update your frontend code to use the new API endpoints:

```typescript
// Use the API configuration from src/config/api.ts
import API from '@/config/api';

// Example usage
const response = await fetch(API.endpoints.fingenieChat, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'Tell me about stock investing',
    userId: 'user123',
  }),
});
```

## API Endpoints

- **Chat API**: `/api/fingenieChat`
- **Investment Report API**: `/api/getInvestmentReport`
- **Oracle API**: `/api/finGenieOracle`

All endpoints accept POST requests with JSON bodies.

## Troubleshooting

- **API Key Issues**: Ensure your API keys are correctly set in the Deno Deploy dashboard
- **CORS Errors**: The API includes CORS headers, but you may need to adjust them for your specific domain
- **Rate Limits**: The code includes caching to help with API rate limits, but you may still encounter them with heavy usage
