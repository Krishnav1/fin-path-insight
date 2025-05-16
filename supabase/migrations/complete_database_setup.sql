-- Complete Database Setup for FinPath Insight
-- This file contains all necessary tables, indexes, and security policies

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Budget data table
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    recurring BOOLEAN DEFAULT false,
    recurrence_period VARCHAR(20) CHECK (recurrence_period IN ('daily', 'weekly', 'monthly', 'yearly')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);

-- Budget transactions table
CREATE TABLE IF NOT EXISTS public.budget_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    transaction_date DATE NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_budget_transactions_budget_id ON public.budget_transactions(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_transactions_user_id ON public.budget_transactions(user_id);

-- Saving goals table
CREATE TABLE IF NOT EXISTS public.saving_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    target_amount DECIMAL(15, 2) NOT NULL,
    current_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    target_date DATE,
    category VARCHAR(100),
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(20) CHECK (status IN ('active', 'completed', 'paused')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_saving_goals_user_id ON public.saving_goals(user_id);

-- Saving goal contributions table
CREATE TABLE IF NOT EXISTS public.saving_contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES public.saving_goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    contribution_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saving_contributions_goal_id ON public.saving_contributions(goal_id);
CREATE INDEX IF NOT EXISTS idx_saving_contributions_user_id ON public.saving_contributions(user_id);

-- Net worth assets table
CREATE TABLE IF NOT EXISTS public.net_worth_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    value DECIMAL(15, 2) NOT NULL,
    asset_type VARCHAR(50) CHECK (asset_type IN ('cash', 'investment', 'property', 'vehicle', 'other')),
    is_liquid BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_net_worth_assets_user_id ON public.net_worth_assets(user_id);

-- Net worth liabilities table
CREATE TABLE IF NOT EXISTS public.net_worth_liabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(5, 2),
    liability_type VARCHAR(50) CHECK (liability_type IN ('credit_card', 'loan', 'mortgage', 'other')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_net_worth_liabilities_user_id ON public.net_worth_liabilities(user_id);

-- Net worth history table (for tracking changes over time)
CREATE TABLE IF NOT EXISTS public.net_worth_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_assets DECIMAL(15, 2) NOT NULL,
    total_liabilities DECIMAL(15, 2) NOT NULL,
    net_worth DECIMAL(15, 2) NOT NULL,
    snapshot_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_net_worth_history_user_id ON public.net_worth_history(user_id);

-- Portfolio holdings table
CREATE TABLE IF NOT EXISTS public.portfolio_holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    portfolio_id UUID,
    symbol VARCHAR(20) NOT NULL,
    quantity DECIMAL(15, 6) NOT NULL,
    purchase_price DECIMAL(15, 2),
    purchase_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_user_id ON public.portfolio_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_portfolio_id ON public.portfolio_holdings(portfolio_id);

-- User portfolios table
CREATE TABLE IF NOT EXISTS public.portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON public.portfolios(user_id);

-- Fix the circular reference by adding the foreign key constraint after both tables exist
ALTER TABLE public.portfolio_holdings 
ADD CONSTRAINT fk_portfolio_holdings_portfolio 
FOREIGN KEY (portfolio_id) REFERENCES public.portfolios(id) ON DELETE CASCADE;

-- Financial goals table
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_date DATE,
    target_amount DECIMAL(15, 2),
    current_amount DECIMAL(15, 2) DEFAULT 0,
    category VARCHAR(100),
    status VARCHAR(20) CHECK (status IN ('not_started', 'in_progress', 'completed', 'abandoned')),
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_goals_user_id ON public.financial_goals(user_id);

-- User preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'system',
    default_market VARCHAR(20) DEFAULT 'global',
    currency VARCHAR(10) DEFAULT 'USD',
    notification_preferences JSONB DEFAULT '{}',
    dashboard_layout JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT user_preferences_user_id_key UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- User profiles table (extended profile data)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    website TEXT,
    bio TEXT,
    risk_profile VARCHAR(20) DEFAULT 'moderate',
    financial_goals JSONB DEFAULT '[]',
    CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Create or update RLS policies for security
-- Budget policies
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY budgets_user_policy ON public.budgets
    USING (auth.uid() = user_id);

-- Budget transactions policies
ALTER TABLE public.budget_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY budget_transactions_user_policy ON public.budget_transactions
    USING (auth.uid() = user_id);

-- Saving goals policies
ALTER TABLE public.saving_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY saving_goals_user_policy ON public.saving_goals
    USING (auth.uid() = user_id);

-- Saving contributions policies
ALTER TABLE public.saving_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY saving_contributions_user_policy ON public.saving_contributions
    USING (auth.uid() = user_id);

-- Net worth assets policies
ALTER TABLE public.net_worth_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY net_worth_assets_user_policy ON public.net_worth_assets
    USING (auth.uid() = user_id);

-- Net worth liabilities policies
ALTER TABLE public.net_worth_liabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY net_worth_liabilities_user_policy ON public.net_worth_liabilities
    USING (auth.uid() = user_id);

-- Net worth history policies
ALTER TABLE public.net_worth_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY net_worth_history_user_policy ON public.net_worth_history
    USING (auth.uid() = user_id);

-- Portfolio holdings policies
ALTER TABLE public.portfolio_holdings ENABLE ROW LEVEL SECURITY;
CREATE POLICY portfolio_holdings_user_policy ON public.portfolio_holdings
    USING (auth.uid() = user_id);

-- Portfolios policies
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
CREATE POLICY portfolios_user_policy ON public.portfolios
    USING (auth.uid() = user_id);
CREATE POLICY portfolios_public_policy ON public.portfolios
    USING (is_public = true);

-- Financial goals policies
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY financial_goals_user_policy ON public.financial_goals
    USING (auth.uid() = user_id);

-- User preferences policies
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_preferences_user_policy ON public.user_preferences
    USING (auth.uid() = user_id);

-- Profiles policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_user_policy ON public.profiles
    USING (auth.uid() = id);

-- Create a trigger to automatically create a profile entry when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  
  -- Also create default user preferences
  INSERT INTO public.user_preferences (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$;

-- Add functions for common operations
CREATE OR REPLACE FUNCTION public.calculate_net_worth(user_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_assets DECIMAL;
  total_liabilities DECIMAL;
BEGIN
  -- Calculate total assets
  SELECT COALESCE(SUM(value), 0) INTO total_assets
  FROM public.net_worth_assets
  WHERE user_id = user_uuid;
  
  -- Calculate total liabilities
  SELECT COALESCE(SUM(amount), 0) INTO total_liabilities
  FROM public.net_worth_liabilities
  WHERE user_id = user_uuid;
  
  -- Return net worth
  RETURN total_assets - total_liabilities;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update saving goal progress
CREATE OR REPLACE FUNCTION public.update_saving_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.saving_goals
  SET current_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM public.saving_contributions
    WHERE goal_id = NEW.goal_id
  )
  WHERE id = NEW.goal_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating saving goal progress
CREATE TRIGGER update_goal_progress_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.saving_contributions
FOR EACH ROW EXECUTE FUNCTION public.update_saving_goal_progress();

-- Function to update saving goal status based on progress
CREATE OR REPLACE FUNCTION public.update_saving_goal_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If current amount >= target amount, mark as completed
  IF NEW.current_amount >= NEW.target_amount THEN
    NEW.status := 'completed';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating saving goal status
CREATE TRIGGER update_goal_status_trigger
BEFORE UPDATE ON public.saving_goals
FOR EACH ROW EXECUTE FUNCTION public.update_saving_goal_status();

-- Function to take a snapshot of net worth
CREATE OR REPLACE FUNCTION public.create_net_worth_snapshot(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
  total_assets DECIMAL;
  total_liabilities DECIMAL;
  net_worth DECIMAL;
BEGIN
  -- Calculate total assets
  SELECT COALESCE(SUM(value), 0) INTO total_assets
  FROM public.net_worth_assets
  WHERE user_id = user_uuid;
  
  -- Calculate total liabilities
  SELECT COALESCE(SUM(amount), 0) INTO total_liabilities
  FROM public.net_worth_liabilities
  WHERE user_id = user_uuid;
  
  -- Calculate net worth
  net_worth := total_assets - total_liabilities;
  
  -- Insert snapshot
  INSERT INTO public.net_worth_history (
    user_id, 
    total_assets, 
    total_liabilities, 
    net_worth, 
    snapshot_date
  )
  VALUES (
    user_uuid, 
    total_assets, 
    total_liabilities, 
    net_worth, 
    CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- End of database setup
