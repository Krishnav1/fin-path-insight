-- Create portfolio_analyses table to store Gemini analysis results
CREATE TABLE portfolio_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a unique index on portfolio_id to ensure only one analysis per portfolio
CREATE UNIQUE INDEX portfolio_analyses_portfolio_id_idx ON portfolio_analyses (portfolio_id);

-- Create RLS policies
ALTER TABLE portfolio_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own portfolio analyses"
  ON portfolio_analyses FOR SELECT
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own portfolio analyses"
  ON portfolio_analyses FOR INSERT
  WITH CHECK (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own portfolio analyses"
  ON portfolio_analyses FOR UPDATE
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own portfolio analyses"
  ON portfolio_analyses FOR DELETE
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));
