# FinPath Insight - Financial Data Backend

This is the backend service for FinPath Insight, providing financial data for stocks and cryptocurrencies.

## Features

- **Stock Data**: Fetch and cache data from Yahoo Finance for Indian stocks
  - Company information
  - Real-time prices
  - Financial metrics (P/E, EPS, ROE, etc.)
  - Historical chart data
  - Financial statements (revenue, net income)

- **Cryptocurrency Data**: Fetch and cache data from CoinGecko API
  - Current prices
  - Market data
  - Historical performance

- **Caching**: In-memory caching to reduce API load
  - Configurable TTL (Time To Live)
  - MongoDB persistence for longer-term storage

- **Static Data Generation**: Automatically generates static JSON files
  - Support for high-traffic deployments
  - Enables serverless hosting options

## API Endpoints

### Stocks

- `GET /api/stocks` - Get list of tracked stocks
- `GET /api/stocks?search=tcs` - Search stocks by name or symbol
- `GET /api/stocks/:symbol` - Get detailed stock data
- `GET /api/stocks/:symbol/chart` - Get chart data
- `GET /api/stocks/:symbol/financials` - Get financial statements

### Cryptocurrencies

- `GET /api/crypto` - Get list of tracked cryptocurrencies
- `GET /api/crypto?search=bitcoin` - Search cryptocurrencies
- `GET /api/crypto/:coinId` - Get detailed cryptocurrency data
- `GET /api/crypto/:coinId/market` - Get market data

## Setup

### Prerequisites

- Node.js 18 or higher
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
cd backend
npm install
```

3. Create a `.env` file based on the example:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/fin-path-insight
CACHE_TTL=300
NODE_ENV=development
```

### Running the service

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

### Generating Static Data

Run the data update script:

```bash
npm run update-data
```

This will:
1. Fetch data for all configured stocks and cryptocurrencies
2. Generate JSON files in the `public/data` directory
3. Update metadata with timestamp information

## Deployment

This service can be deployed to any Node.js hosting platform:

- **Traditional hosting**: Heroku, DigitalOcean, AWS, etc.
- **Serverless**: Netlify Functions, Vercel, AWS Lambda
- **Static hosting**: GitHub Pages (using generated static data)

## GitHub Actions

The repository includes a GitHub Actions workflow that:

1. Runs every 5 minutes to update financial data
2. Commits changes to the repository
3. Can be triggered manually via workflow_dispatch

## License

MIT 