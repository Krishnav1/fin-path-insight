# Supabase Database Setup for FinPath Insight

This guide provides step-by-step instructions for setting up the Supabase database tables required for the FinPath Insight application.

## Project Information

- **Project ID**: ydakwyplcqoshxcdllah
- **Project URL**: https://ydakwyplcqoshxcdllah.supabase.co
- **Anon Public Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkYWt3eXBsY3Fvc2h4Y2RsbGFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTAwNTMsImV4cCI6MjA2Mjc4NjA1M30.J0c0YqSsR9XbtbYLVOq6oqQwYQ3G7j65Q0stEtS4W2s

## Required Tables

Below are the SQL statements to create all the necessary tables in your Supabase project. You can execute these in the SQL Editor in the Supabase dashboard.

### 1. Stocks Table

```sql
CREATE TABLE IF NOT EXISTS stocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol TEXT NOT NULL UNIQUE,
  name TEXT,
  price DECIMAL(15, 2),
  change DECIMAL(15, 2),
  change_percent DECIMAL(15, 2),
  volume BIGINT,
  previous_close DECIMAL(15, 2),
  open DECIMAL(15, 2),
  high DECIMAL(15, 2),
  low DECIMAL(15, 2),
  market_cap DECIMAL(20, 2),
  market TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT stocks_symbol_key UNIQUE (symbol)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS stocks_market_idx ON stocks (market);
CREATE INDEX IF NOT EXISTS stocks_change_percent_idx ON stocks (change_percent);
CREATE INDEX IF NOT EXISTS stocks_volume_idx ON stocks (volume);
```

### 2. Market Indices Table

```sql
CREATE TABLE IF NOT EXISTS market_indices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol TEXT NOT NULL,
  name TEXT,
  price DECIMAL(15, 2),
  change DECIMAL(15, 2),
  change_percent DECIMAL(15, 2),
  market TEXT NOT NULL,
  importance INTEGER DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT market_indices_symbol_key UNIQUE (symbol)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS market_indices_market_idx ON market_indices (market);
```

### 3. Market Status Table

```sql
CREATE TABLE IF NOT EXISTS market_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market TEXT NOT NULL UNIQUE,
  status TEXT,
  next_open TIMESTAMPTZ,
  next_close TIMESTAMPTZ,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Charts Table

```sql
CREATE TABLE IF NOT EXISTS charts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol TEXT NOT NULL,
  interval TEXT NOT NULL,
  range TEXT NOT NULL,
  prices JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT charts_symbol_interval_range_key UNIQUE (symbol, interval, range)
);
```

### 5. Financials Table

```sql
CREATE TABLE IF NOT EXISTS financials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol TEXT NOT NULL,
  income_statement JSONB,
  balance_sheet JSONB,
  cash_flow JSONB,
  ratios JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT financials_symbol_key UNIQUE (symbol)
);
```

### 6. News Table

```sql
CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  summary TEXT,
  url TEXT NOT NULL,
  source TEXT,
  published_at TIMESTAMPTZ,
  image_url TEXT,
  market TEXT,
  tags TEXT[],
  
  CONSTRAINT news_url_key UNIQUE (url)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS news_published_at_idx ON news (published_at DESC);
CREATE INDEX IF NOT EXISTS news_market_idx ON news (market);
CREATE INDEX IF NOT EXISTS news_tags_idx ON news USING GIN (tags);
```

### 7. Profiles Table

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);
```

### 8. Watchlists Table

```sql
CREATE TABLE IF NOT EXISTS watchlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  stocks TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT watchlists_user_id_key UNIQUE (user_id)
);

-- Set up Row Level Security (RLS)
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own watchlist" 
  ON watchlists FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlist" 
  ON watchlists FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watchlist" 
  ON watchlists FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
```

### 9. Health Check Table

```sql
CREATE TABLE IF NOT EXISTS health_check (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial health check record
INSERT INTO health_check (service, status, message)
VALUES ('supabase', 'ok', 'Supabase is operational');
```

## Setting Up RLS Policies

Row Level Security (RLS) is important for protecting user data. The above SQL includes RLS policies for user-specific tables. For public data tables like stocks and news, you may want to set up the following policies:

```sql
-- Allow public read access to stocks data
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read stocks data" 
  ON stocks FOR SELECT 
  USING (true);

-- Allow public read access to market indices
ALTER TABLE market_indices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read market indices" 
  ON market_indices FOR SELECT 
  USING (true);

-- Allow public read access to news
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read news" 
  ON news FOR SELECT 
  USING (true);
```

## Setting Up Storage Buckets

You may also want to set up storage buckets for user avatars and news images:

1. Go to the Storage section in your Supabase dashboard
2. Create the following buckets:
   - `avatars` - for user profile pictures
   - `news-images` - for news article images

Set up public access policies for these buckets:

```sql
-- For avatars bucket
CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- For news images bucket
CREATE POLICY "News images are publicly accessible."
  ON storage.objects FOR SELECT
  USING (bucket_id = 'news-images');
```

## Initial Data Population

After creating the tables, you can use the `updateStockData.js` script to populate the stocks and market indices tables with initial data. This script has been updated to work with Supabase instead of MongoDB.

To run the script:

```bash
cd backend
node scripts/updateStockData.js
```

## Testing the Connection

You can test the Supabase connection using the provided test script:

```bash
node test-api-connections.js
```

This will verify that the application can connect to Supabase and perform basic operations.

## Next Steps

1. Update your GitHub repository secrets to include:
   - `SUPABASE_ANON_KEY` - The anon public key
   - `SUPABASE_SERVICE_KEY` - A service role key (create this in the Supabase dashboard)

2. Deploy your application to Netlify using the provided deployment script:
   ```bash
   ./deploy.bat
   ```

3. Verify that the application is working correctly with Supabase as the backend database.

## Troubleshooting

If you encounter any issues:

1. Check the Supabase dashboard for error logs
2. Verify that your environment variables are correctly set
3. Make sure the tables are created with the correct schema
4. Test the connection using the test script

For more information, refer to the [Supabase documentation](https://supabase.com/docs).
