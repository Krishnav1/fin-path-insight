-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  exchange TEXT NOT NULL,
  country TEXT,
  sector TEXT,
  industry TEXT,
  description TEXT,
  business_model TEXT,
  industry_context TEXT,
  logo_url TEXT,
  website TEXT,
  employee_count INTEGER,
  ceo TEXT,
  founded_year INTEGER,
  market_cap NUMERIC,
  is_tracked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create financial_metrics table
CREATE TABLE IF NOT EXISTS public.financial_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('annual', 'quarterly')),
  revenue NUMERIC,
  net_income NUMERIC,
  eps NUMERIC,
  pe_ratio NUMERIC,
  market_cap NUMERIC,
  dividend_yield NUMERIC,
  profit_margin NUMERIC,
  operating_margin NUMERIC,
  return_on_equity NUMERIC,
  return_on_assets NUMERIC,
  debt_to_equity NUMERIC,
  current_ratio NUMERIC,
  quick_ratio NUMERIC,
  free_cash_flow NUMERIC,
  ebitda NUMERIC,
  gross_margin NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id, period, period_type)
);

-- Create financial_statements table
CREATE TABLE IF NOT EXISTS public.financial_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('annual', 'quarterly')),
  statement_type TEXT NOT NULL CHECK (statement_type IN ('income', 'balance', 'cash_flow')),
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id, period, period_type, statement_type)
);

-- Create peer_comparisons table
CREATE TABLE IF NOT EXISTS public.peer_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  peer_data JSONB NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id)
);

-- Create company_insights table
CREATE TABLE IF NOT EXISTS public.company_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  opportunities TEXT[] DEFAULT '{}',
  threats TEXT[] DEFAULT '{}',
  summary TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id)
);

-- Create news_cache table
CREATE TABLE IF NOT EXISTS public.news_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  articles JSONB NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id)
);

-- Create RLS policies for companies table
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Everyone can read companies
CREATE POLICY "Companies are viewable by everyone" 
  ON public.companies FOR SELECT 
  USING (true);

-- Only authenticated users with admin role can insert/update/delete
CREATE POLICY "Companies can be inserted by admins" 
  ON public.companies FOR INSERT 
  TO authenticated 
  USING ((SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin' OR (SELECT is_super_admin FROM auth.users WHERE id = auth.uid()) = true);

CREATE POLICY "Companies can be updated by admins" 
  ON public.companies FOR UPDATE 
  TO authenticated 
  USING ((SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin' OR (SELECT is_super_admin FROM auth.users WHERE id = auth.uid()) = true);

CREATE POLICY "Companies can be deleted by admins" 
  ON public.companies FOR DELETE 
  TO authenticated 
  USING ((SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin' OR (SELECT is_super_admin FROM auth.users WHERE id = auth.uid()) = true);

-- Apply similar RLS policies to other tables
ALTER TABLE public.financial_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_cache ENABLE ROW LEVEL SECURITY;

-- Everyone can read financial data
CREATE POLICY "Financial metrics are viewable by everyone" 
  ON public.financial_metrics FOR SELECT 
  USING (true);

CREATE POLICY "Financial statements are viewable by everyone" 
  ON public.financial_statements FOR SELECT 
  USING (true);

CREATE POLICY "Peer comparisons are viewable by everyone" 
  ON public.peer_comparisons FOR SELECT 
  USING (true);

CREATE POLICY "Company insights are viewable by everyone" 
  ON public.company_insights FOR SELECT 
  USING (true);

CREATE POLICY "News cache is viewable by everyone" 
  ON public.news_cache FOR SELECT 
  USING (true);

-- Only service role can modify financial data (via edge functions)
-- These will be handled by the edge function with service role key
