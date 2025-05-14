-- Create health_check table
CREATE TABLE IF NOT EXISTS health_check (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial health check record
INSERT INTO health_check (service, status, message)
VALUES ('supabase', 'ok', 'Supabase is operational')
ON CONFLICT DO NOTHING;

-- Create stocks table
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
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS stocks_market_idx ON stocks (market);
CREATE INDEX IF NOT EXISTS stocks_change_percent_idx ON stocks (change_percent);
CREATE INDEX IF NOT EXISTS stocks_volume_idx ON stocks (volume);

-- Create market_indices table
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
