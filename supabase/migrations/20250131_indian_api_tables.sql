-- ============================================
-- INDIAN API DATA STORAGE TABLES
-- ============================================

-- 1. Company Fundamentals (Update Quarterly)
CREATE TABLE IF NOT EXISTS public.company_fundamentals (
  symbol VARCHAR(20) PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  sector VARCHAR(100),
  industry VARCHAR(100),
  market_cap DECIMAL(20,2),
  pe_ratio DECIMAL(10,2),
  pb_ratio DECIMAL(10,2),
  roe DECIMAL(10,2),
  debt_to_equity DECIMAL(10,2),
  dividend_yield DECIMAL(10,2),
  revenue DECIMAL(20,2),
  profit DECIMAL(20,2),
  eps DECIMAL(10,2),
  book_value DECIMAL(10,2),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  data JSONB, -- Full API response
  CONSTRAINT chk_market_cap_positive CHECK (market_cap >= 0)
);

CREATE INDEX idx_fundamentals_sector ON public.company_fundamentals(sector);
CREATE INDEX idx_fundamentals_updated ON public.company_fundamentals(last_updated);
CREATE INDEX idx_fundamentals_market_cap ON public.company_fundamentals(market_cap DESC);

-- 2. Stock Prices Cache (1 minute TTL)
CREATE TABLE IF NOT EXISTS public.stock_prices_cache (
  symbol VARCHAR(20) PRIMARY KEY,
  price DECIMAL(15,2) NOT NULL,
  open DECIMAL(15,2),
  high DECIMAL(15,2),
  low DECIMAL(15,2),
  close DECIMAL(15,2),
  change_percent DECIMAL(10,2),
  volume BIGINT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_price_positive CHECK (price > 0)
);

CREATE INDEX idx_prices_timestamp ON public.stock_prices_cache(timestamp DESC);

-- Auto-delete entries older than 5 minutes
CREATE OR REPLACE FUNCTION delete_old_price_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM public.stock_prices_cache 
  WHERE timestamp < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- 3. Historical Stock Data (Daily updates)
CREATE TABLE IF NOT EXISTS public.stock_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol VARCHAR(20) NOT NULL,
  date DATE NOT NULL,
  open DECIMAL(15,2) NOT NULL,
  high DECIMAL(15,2) NOT NULL,
  low DECIMAL(15,2) NOT NULL,
  close DECIMAL(15,2) NOT NULL,
  volume BIGINT,
  UNIQUE(symbol, date),
  CONSTRAINT chk_ohlc_positive CHECK (open > 0 AND high > 0 AND low > 0 AND close > 0),
  CONSTRAINT chk_high_low CHECK (high >= low)
);

CREATE INDEX idx_history_symbol_date ON public.stock_history(symbol, date DESC);
CREATE INDEX idx_history_date ON public.stock_history(date DESC);

-- 4. News Cache (5 minute TTL)
CREATE TABLE IF NOT EXISTS public.news_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  source VARCHAR(100),
  image_url TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  category VARCHAR(50),
  symbols TEXT[], -- Related stock symbols
  cached_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_news_cached ON public.news_cache(cached_at DESC);
CREATE INDEX idx_news_published ON public.news_cache(published_at DESC);
CREATE INDEX idx_news_category ON public.news_cache(category);

-- Auto-delete news older than 1 hour
CREATE OR REPLACE FUNCTION delete_old_news_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM public.news_cache 
  WHERE cached_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- 5. Corporate Actions (Weekly updates)
CREATE TABLE IF NOT EXISTS public.corporate_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol VARCHAR(20) NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- dividend, split, bonus, rights
  ex_date DATE NOT NULL,
  record_date DATE,
  payment_date DATE,
  amount DECIMAL(15,2), -- For dividends
  ratio VARCHAR(20), -- For splits/bonus (e.g., "1:2")
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_action_type CHECK (action_type IN ('dividend', 'split', 'bonus', 'rights', 'buyback'))
);

CREATE INDEX idx_corporate_symbol ON public.corporate_actions(symbol);
CREATE INDEX idx_corporate_ex_date ON public.corporate_actions(ex_date DESC);
CREATE INDEX idx_corporate_type ON public.corporate_actions(action_type);

-- 6. Market Indices Cache (1 minute TTL)
CREATE TABLE IF NOT EXISTS public.market_indices_cache (
  index_name VARCHAR(50) PRIMARY KEY, -- NIFTY50, SENSEX, etc.
  value DECIMAL(15,2) NOT NULL,
  change DECIMAL(15,2),
  change_percent DECIMAL(10,2),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_indices_timestamp ON public.market_indices_cache(timestamp DESC);

-- 7. Conversation History (for FinGenie)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  model_used VARCHAR(50), -- gpt-4o, gpt-4o-mini, etc.
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_user ON public.conversations(user_id, created_at DESC);
CREATE INDEX idx_conversations_created ON public.conversations(created_at DESC);

-- 8. API Usage Tracking (for monitoring)
CREATE TABLE IF NOT EXISTS public.api_usage_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_name VARCHAR(50) NOT NULL, -- indian_api, openai
  endpoint VARCHAR(255),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_usage_created ON public.api_usage_log(created_at DESC);
CREATE INDEX idx_api_usage_api ON public.api_usage_log(api_name, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on user-specific tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own conversations
CREATE POLICY "users_own_conversations" ON public.conversations
  FOR ALL USING (auth.uid() = user_id);

-- Public read access for market data (no RLS needed)
-- company_fundamentals, stock_prices_cache, stock_history, news_cache, 
-- corporate_actions, market_indices_cache are public read

-- ============================================
-- SCHEDULED JOBS (Run via pg_cron or Supabase Edge Functions)
-- ============================================

-- Note: These should be triggered by Supabase Edge Functions with cron schedules

COMMENT ON TABLE public.company_fundamentals IS 'Update quarterly via cron job';
COMMENT ON TABLE public.stock_history IS 'Update daily at 6 PM IST via cron job';
COMMENT ON TABLE public.corporate_actions IS 'Update weekly via cron job';
COMMENT ON TABLE public.stock_prices_cache IS 'Auto-expire after 1 minute, fetch on-demand';
COMMENT ON TABLE public.news_cache IS 'Auto-expire after 5 minutes, fetch on-demand';
