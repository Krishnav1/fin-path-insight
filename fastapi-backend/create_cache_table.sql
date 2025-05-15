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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.cache;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON public.cache;
DROP POLICY IF EXISTS "Allow anonymous update access" ON public.cache;
DROP POLICY IF EXISTS "Allow anonymous delete access" ON public.cache;
DROP POLICY IF EXISTS "Allow service role full access" ON public.cache;

-- Create a single policy for all operations
CREATE POLICY "Allow public access to cache" 
  ON public.cache
  FOR ALL
  USING (true);

-- Ensure the service role has full access
CREATE POLICY "Allow service role full access" 
  ON public.cache
  FOR ALL
  TO service_role
  USING (true);

-- Create index on created_at for faster expiration checks
CREATE INDEX IF NOT EXISTS cache_created_at_idx ON public.cache (created_at);
