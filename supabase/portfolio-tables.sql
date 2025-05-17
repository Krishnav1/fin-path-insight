-- Create portfolios table
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  total_value DECIMAL,
  total_invested DECIMAL,
  total_return DECIMAL,
  total_return_percentage DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create portfolio_holdings table
CREATE TABLE portfolio_holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity DECIMAL NOT NULL,
  buy_price DECIMAL NOT NULL,
  current_price DECIMAL,
  buy_date DATE,
  sector TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own portfolios"
  ON portfolios FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own portfolios"
  ON portfolios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolios"
  ON portfolios FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolios"
  ON portfolios FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own portfolio holdings"
  ON portfolio_holdings FOR SELECT
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own portfolio holdings"
  ON portfolio_holdings FOR INSERT
  WITH CHECK (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own portfolio holdings"
  ON portfolio_holdings FOR UPDATE
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own portfolio holdings"
  ON portfolio_holdings FOR DELETE
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

-- Create function to update portfolio totals
CREATE OR REPLACE FUNCTION update_portfolio_totals()
RETURNS TRIGGER AS $$
DECLARE
  total_invested DECIMAL := 0;
  total_value DECIMAL := 0;
  total_return DECIMAL := 0;
  total_return_percentage DECIMAL := 0;
BEGIN
  -- Calculate total invested and total value
  SELECT 
    COALESCE(SUM(buy_price * quantity), 0),
    COALESCE(SUM(current_price * quantity), 0)
  INTO total_invested, total_value
  FROM portfolio_holdings
  WHERE portfolio_id = NEW.portfolio_id;
  
  -- Calculate return values
  total_return := total_value - total_invested;
  
  IF total_invested > 0 THEN
    total_return_percentage := (total_return / total_invested) * 100;
  ELSE
    total_return_percentage := 0;
  END IF;
  
  -- Update the portfolio
  UPDATE portfolios
  SET 
    total_invested = total_invested,
    total_value = total_value,
    total_return = total_return,
    total_return_percentage = total_return_percentage,
    updated_at = NOW()
  WHERE id = NEW.portfolio_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update portfolio totals
CREATE TRIGGER update_portfolio_totals_on_insert
AFTER INSERT ON portfolio_holdings
FOR EACH ROW
EXECUTE FUNCTION update_portfolio_totals();

CREATE TRIGGER update_portfolio_totals_on_update
AFTER UPDATE ON portfolio_holdings
FOR EACH ROW
EXECUTE FUNCTION update_portfolio_totals();

CREATE TRIGGER update_portfolio_totals_on_delete
AFTER DELETE ON portfolio_holdings
FOR EACH ROW
EXECUTE FUNCTION update_portfolio_totals();
