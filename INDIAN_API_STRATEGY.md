# INDIAN API INTEGRATION STRATEGY

## Growth Plan Limits
- **50,000 requests/month** = ~1,666 requests/day
- **1 request/second** rate limit
- **Cost:** ₹1,799/month

## API Usage Optimization

### 1. FUNDAMENTAL DATA (Store in Supabase)
**Endpoints:**
- `/company/fundamentals/{symbol}` - Financial statements
- `/company/ratios/{symbol}` - P/E, ROE, etc.
- `/company/profile/{symbol}` - Company info

**Strategy:**
```sql
-- Create table
CREATE TABLE company_fundamentals (
  symbol VARCHAR(20) PRIMARY KEY,
  company_name VARCHAR(255),
  sector VARCHAR(100),
  market_cap DECIMAL(20,2),
  pe_ratio DECIMAL(10,2),
  roe DECIMAL(10,2),
  debt_to_equity DECIMAL(10,2),
  revenue DECIMAL(20,2),
  profit DECIMAL(20,2),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  data JSONB -- Full API response
);

-- Update quarterly (every 3 months)
CREATE INDEX idx_fundamentals_updated ON company_fundamentals(last_updated);
```

**Cron Job:** Update every Sunday at 2 AM
**API Calls Saved:** ~45,000/month (99% reduction)

### 2. REAL-TIME PRICES (Cache 1 minute)
**Endpoint:** `/stock/realtime/{symbol}`

**Strategy:**
```sql
CREATE TABLE stock_prices_cache (
  symbol VARCHAR(20) PRIMARY KEY,
  price DECIMAL(15,2),
  change_percent DECIMAL(10,2),
  volume BIGINT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-expire after 1 minute
CREATE INDEX idx_prices_timestamp ON stock_prices_cache(timestamp);
```

**Logic:**
```typescript
async function getStockPrice(symbol: string) {
  // Check cache (< 1 min old)
  const cached = await supabase
    .from('stock_prices_cache')
    .select('*')
    .eq('symbol', symbol)
    .gte('timestamp', new Date(Date.now() - 60000))
    .single();
  
  if (cached.data) return cached.data;
  
  // Fetch from Indian API
  const response = await fetch(`${INDIAN_API_URL}/stock/realtime/${symbol}`, {
    headers: { 'X-Api-Key': INDIAN_API_KEY }
  });
  
  const data = await response.json();
  
  // Update cache
  await supabase
    .from('stock_prices_cache')
    .upsert({ symbol, ...data, timestamp: new Date() });
  
  return data;
}
```

**API Calls:** ~10,000/month (only unique symbols per minute)

### 3. HISTORICAL DATA (Store in Supabase)
**Endpoint:** `/stock/history/{symbol}?period=1y`

**Strategy:**
```sql
CREATE TABLE stock_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol VARCHAR(20),
  date DATE,
  open DECIMAL(15,2),
  high DECIMAL(15,2),
  low DECIMAL(15,2),
  close DECIMAL(15,2),
  volume BIGINT,
  UNIQUE(symbol, date)
);

CREATE INDEX idx_history_symbol_date ON stock_history(symbol, date DESC);
```

**Cron Job:** Update daily at 6 PM (after market close)
**API Calls:** ~500/day = 15,000/month

### 4. NEWS (Cache 5 minutes)
**Endpoint:** `/news/latest?category=stock_market`

**Strategy:**
```sql
CREATE TABLE news_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  description TEXT,
  url TEXT,
  source VARCHAR(100),
  published_at TIMESTAMPTZ,
  category VARCHAR(50),
  cached_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_news_cached ON news_cache(cached_at DESC);
```

**Logic:** Fetch every 5 minutes, serve from cache
**API Calls:** ~8,640/month (288/day)

### 5. CORPORATE ACTIONS (Store in Supabase)
**Endpoint:** `/corporate-actions/{symbol}`

**Strategy:**
```sql
CREATE TABLE corporate_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol VARCHAR(20),
  action_type VARCHAR(50), -- dividend, split, bonus
  ex_date DATE,
  amount DECIMAL(15,2),
  ratio VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Cron Job:** Update weekly
**API Calls:** ~2,000/month

## TOTAL API USAGE ESTIMATE
- Fundamental updates: 500/month
- Real-time prices: 10,000/month
- Historical data: 15,000/month
- News: 8,640/month
- Corporate actions: 2,000/month
- **TOTAL: ~36,140/month** ✅ Within 50K limit

## IMPLEMENTATION PRIORITY

### Phase 1 (Week 1): Core Data Storage
1. Create Supabase tables for fundamentals, history, corporate actions
2. Create Supabase Edge Function: `indian-api-sync`
3. Set up daily cron job for data updates

### Phase 2 (Week 2): Caching Layer
1. Implement 1-min cache for real-time prices
2. Implement 5-min cache for news
3. Add cache invalidation logic

### Phase 3 (Week 3): FinGenie Integration
1. Update FinGenie to fetch from Supabase (not API)
2. Add real-time price enrichment
3. Add news context to responses

## COST SAVINGS
- Without caching: ~150,000 API calls/month (₹5,000+/month)
- With caching: ~36,000 API calls/month (₹1,799/month)
- **Savings: 76% reduction in API usage**
