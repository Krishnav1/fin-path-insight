-- Check if extension exists before creating
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create portfolio_analysis table for storing Gemini analysis results
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'portfolio_analysis') THEN
        CREATE TABLE portfolio_analysis (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
            analysis_data JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable RLS on the new table
        ALTER TABLE portfolio_analysis ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies for the new table
        CREATE POLICY "Users can view their own portfolio analysis"
            ON portfolio_analysis FOR SELECT
            USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

        CREATE POLICY "Users can insert their own portfolio analysis"
            ON portfolio_analysis FOR INSERT
            WITH CHECK (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

        CREATE POLICY "Users can update their own portfolio analysis"
            ON portfolio_analysis FOR UPDATE
            USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

        CREATE POLICY "Users can delete their own portfolio analysis"
            ON portfolio_analysis FOR DELETE
            USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));
            
        RAISE NOTICE 'Created portfolio_analysis table and policies';
    ELSE
        RAISE NOTICE 'portfolio_analysis table already exists, skipping creation';
    END IF;
END
$$;

-- Create index for faster queries
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_portfolio_analysis_portfolio_id') THEN
        CREATE INDEX idx_portfolio_analysis_portfolio_id ON portfolio_analysis(portfolio_id);
        RAISE NOTICE 'Created index on portfolio_analysis(portfolio_id)';
    ELSE
        RAISE NOTICE 'Index on portfolio_analysis(portfolio_id) already exists, skipping creation';
    END IF;
END
$$;

-- Create function to clean up old analysis results (keep only the most recent 5 per portfolio)
CREATE OR REPLACE FUNCTION cleanup_old_portfolio_analysis()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete all but the 5 most recent analysis results for this portfolio
    DELETE FROM portfolio_analysis
    WHERE id IN (
        SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY portfolio_id ORDER BY created_at DESC) as rn
            FROM portfolio_analysis
            WHERE portfolio_id = NEW.portfolio_id
        ) ranked
        WHERE ranked.rn > 5
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to clean up old analysis results
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'cleanup_old_portfolio_analysis_trigger') THEN
        CREATE TRIGGER cleanup_old_portfolio_analysis_trigger
        AFTER INSERT ON portfolio_analysis
        FOR EACH ROW
        EXECUTE FUNCTION cleanup_old_portfolio_analysis();
        
        RAISE NOTICE 'Created cleanup trigger for portfolio_analysis';
    ELSE
        RAISE NOTICE 'Cleanup trigger for portfolio_analysis already exists, skipping creation';
    END IF;
END
$$;
