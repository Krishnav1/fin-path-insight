-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.market_overview;
DROP TABLE IF EXISTS public.stocks;
DROP TABLE IF EXISTS public.news;
DROP TABLE IF EXISTS public.cache;

-- Create cache table for API responses
CREATE TABLE public.cache (
  key TEXT PRIMARY KEY,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT current_timestamp
);

-- Add comment to the table for documentation
COMMENT ON TABLE public.cache IS 'Cache table for storing API responses and other data';

-- Create market_overview table
CREATE TABLE public.market_overview (
  id SERIAL PRIMARY KEY,
  market TEXT NOT NULL,
  indices JSONB NOT NULL,
  breadth JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT current_timestamp
);

-- Add comment to the table for documentation
COMMENT ON TABLE public.market_overview IS 'Market overview data for different markets (india, us, global)';

-- Create stocks table
CREATE TABLE public.stocks (
  id SERIAL PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price DECIMAL(15, 2),
  change DECIMAL(15, 2),
  change_percent DECIMAL(10, 2),
  volume BIGINT,
  market_cap DECIMAL(20, 2),
  pe_ratio DECIMAL(10, 2),
  sector TEXT,
  industry TEXT,
  updated_at TIMESTAMPTZ DEFAULT current_timestamp
);

-- Add comment to the table for documentation
COMMENT ON TABLE public.stocks IS 'Stock data for various companies';

-- Create news table
CREATE TABLE public.news (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  summary TEXT,
  url TEXT,
  image_url TEXT,
  source TEXT,
  author TEXT,
  market TEXT,
  company TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT current_timestamp
);

-- Add comment to the table for documentation
COMMENT ON TABLE public.news IS 'News articles related to markets and companies';

-- Set up Row Level Security (RLS) for all tables
ALTER TABLE public.cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_overview ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public access to cache" ON public.cache FOR ALL USING (true);
CREATE POLICY "Allow public access to market_overview" ON public.market_overview FOR ALL USING (true);
CREATE POLICY "Allow public access to stocks" ON public.stocks FOR ALL USING (true);
CREATE POLICY "Allow public access to news" ON public.news FOR ALL USING (true);

-- Create policies for service role
CREATE POLICY "Allow service role full access to cache" ON public.cache FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role full access to market_overview" ON public.market_overview FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role full access to stocks" ON public.stocks FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role full access to news" ON public.news FOR ALL TO service_role USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS cache_created_at_idx ON public.cache (created_at);
CREATE INDEX IF NOT EXISTS market_overview_market_idx ON public.market_overview (market);
CREATE INDEX IF NOT EXISTS stocks_symbol_idx ON public.stocks (symbol);
CREATE INDEX IF NOT EXISTS news_published_at_idx ON public.news (published_at);
CREATE INDEX IF NOT EXISTS news_market_idx ON public.news (market);
CREATE INDEX IF NOT EXISTS news_company_idx ON public.news (company);

-- Insert sample data for market_overview
INSERT INTO public.market_overview (market, indices, breadth)
VALUES (
  'india',
  '[
    {
      "name": "NIFTY 50",
      "value": 22345.60,
      "change": 123.45,
      "change_percent": 0.55,
      "timestamp": "2025-05-15T09:30:00+05:30"
    },
    {
      "name": "NIFTY BANK",
      "value": 48765.30,
      "change": -156.70,
      "change_percent": -0.32,
      "timestamp": "2025-05-15T09:30:00+05:30"
    },
    {
      "name": "NIFTY IT",
      "value": 37890.25,
      "change": 345.60,
      "change_percent": 0.92,
      "timestamp": "2025-05-15T09:30:00+05:30"
    },
    {
      "name": "INDIA VIX",
      "value": 14.25,
      "change": -0.75,
      "change_percent": -5.00,
      "timestamp": "2025-05-15T09:30:00+05:30"
    }
  ]'::jsonb,
  '{"advances": 1234, "declines": 876, "unchanged": 123}'::jsonb
);

-- Insert sample data for stocks
INSERT INTO public.stocks (symbol, name, price, change, change_percent, volume, market_cap, pe_ratio, sector, industry)
VALUES 
('RELIANCE.NS', 'Reliance Industries Ltd.', 2987.30, 67.80, 2.32, 12345678, 1876543000000, 22.5, 'Energy', 'Oil & Gas'),
('HDFCBANK.NS', 'HDFC Bank Ltd.', 1678.45, 45.60, 2.79, 8765432, 932145000000, 18.7, 'Financial Services', 'Banking'),
('TCS.NS', 'Tata Consultancy Services Ltd.', 3876.25, 78.45, 2.07, 3456789, 1432567000000, 28.3, 'Technology', 'IT Services'),
('INFY.NS', 'Infosys Ltd.', 1543.20, 28.75, 1.90, 5678901, 654321000000, 24.1, 'Technology', 'IT Services');

-- Insert sample data for news
INSERT INTO public.news (title, content, summary, url, image_url, source, author, market, company, published_at)
VALUES 
('RBI Maintains Repo Rate at 6.5%', 'The Reserve Bank of India (RBI) has decided to maintain the repo rate at 6.5% in its latest monetary policy meeting.', 'RBI keeps rates unchanged', 'https://example.com/rbi-news', 'https://example.com/rbi-image.jpg', 'Financial Times', 'John Doe', 'india', NULL, '2025-05-14T10:30:00+05:30'),
('Reliance Industries Reports Strong Q1 Results', 'Reliance Industries Limited reported a 15% increase in net profit for Q1 FY2026, beating market expectations.', 'Reliance Q1 results exceed expectations', 'https://example.com/reliance-news', 'https://example.com/reliance-image.jpg', 'Economic Times', 'Jane Smith', 'india', 'RELIANCE.NS', '2025-05-13T14:45:00+05:30'),
('HDFC Bank Expands Digital Banking Services', 'HDFC Bank has announced the launch of new digital banking features to enhance customer experience.', 'HDFC Bank launches new digital features', 'https://example.com/hdfc-news', 'https://example.com/hdfc-image.jpg', 'Business Standard', 'Robert Johnson', 'india', 'HDFCBANK.NS', '2025-05-12T09:15:00+05:30'),
('TCS Signs Major Deal with European Client', 'Tata Consultancy Services has signed a multi-year, multi-million dollar deal with a leading European retailer.', 'TCS secures major European contract', 'https://example.com/tcs-news', 'https://example.com/tcs-image.jpg', 'Mint', 'Sarah Williams', 'india', 'TCS.NS', '2025-05-11T11:20:00+05:30');
