-- Drop the existing cache table if it exists
DROP TABLE IF EXISTS public.cache;

-- Create cache table for FinInsight application with the correct structure
CREATE TABLE public.cache (
  key TEXT PRIMARY KEY,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT current_timestamp
);

-- Add comment to the table for documentation
COMMENT ON TABLE public.cache IS 'Cache table for storing API responses and other data';

-- Add comments to columns
COMMENT ON COLUMN public.cache.key IS 'Primary key - Cache key';
COMMENT ON COLUMN public.cache.value IS 'Cached data in JSON format';
COMMENT ON COLUMN public.cache.created_at IS 'Timestamp when the cache entry was created';

-- Grant permissions (if needed)
ALTER TABLE public.cache ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for read/write
CREATE POLICY "Allow anonymous read access" 
  ON public.cache
  FOR SELECT
  TO anon 
  USING (true);

CREATE POLICY "Allow anonymous insert access" 
  ON public.cache
  FOR INSERT
  TO anon 
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update access" 
  ON public.cache
  FOR UPDATE
  TO anon 
  USING (true);

CREATE POLICY "Allow anonymous delete access" 
  ON public.cache
  FOR DELETE
  TO anon 
  USING (true);

-- Create index on created_at for faster expiration checks
CREATE INDEX IF NOT EXISTS cache_created_at_idx ON public.cache (created_at);
