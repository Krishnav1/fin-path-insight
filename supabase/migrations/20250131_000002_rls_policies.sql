-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- Run this in Supabase SQL Editor AFTER running the first migration
-- ============================================

-- Enable RLS on all user-specific tables
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saving_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saving_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.net_worth_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.net_worth_liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.net_worth_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "users_own_data" ON public.portfolios;
DROP POLICY IF EXISTS "users_own_data" ON public.portfolio_holdings;
DROP POLICY IF EXISTS "users_own_data" ON public.budgets;
DROP POLICY IF EXISTS "users_own_data" ON public.budget_transactions;
DROP POLICY IF EXISTS "users_own_data" ON public.saving_goals;
DROP POLICY IF EXISTS "users_own_data" ON public.saving_contributions;
DROP POLICY IF EXISTS "users_own_data" ON public.net_worth_assets;
DROP POLICY IF EXISTS "users_own_data" ON public.net_worth_liabilities;
DROP POLICY IF EXISTS "users_own_data" ON public.net_worth_history;
DROP POLICY IF EXISTS "users_own_conversations" ON public.conversations;

-- Create RLS policies
CREATE POLICY "users_own_data" ON public.portfolios
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_data" ON public.portfolio_holdings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_data" ON public.budgets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_data" ON public.budget_transactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_data" ON public.saving_goals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_data" ON public.saving_contributions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_data" ON public.net_worth_assets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_data" ON public.net_worth_liabilities
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_data" ON public.net_worth_history
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_conversations" ON public.conversations
  FOR ALL USING (auth.uid() = user_id);

-- Public read access for market data tables (no RLS needed)
-- company_fundamentals, stock_prices_cache, stock_history, 
-- news_cache, corporate_actions, market_indices_cache are public read
