import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { GeminiAnalysis } from '../../lib/types';

// ENV VARS: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, EODHD_API_KEY, VERTEX_API_KEY
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EODHD_API_KEY = process.env.EODHD_API_KEY;
const VERTEX_API_KEY = process.env.VERTEX_API_KEY;
const CACHE_TTL_MINUTES = 15;

async function fetchHoldings(supabase: any, userId: string, portfolioId: string) {
  const { data, error } = await supabase
    .from('portfolio_holdings')
    .select('*')
    .eq('user_id', userId)
    .eq('portfolio_id', portfolioId);
  if (error) throw new Error('Could not fetch holdings');
  return data;
}

async function fetchEODHD(symbol: string) {
  const url = `https://eodhd.com/api/eod/${symbol}?api_token=${EODHD_API_KEY}&fmt=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('EODHD fetch failed');
  return res.json();
}

async function fetchFundamentals(symbol: string) {
  const url = `https://eodhd.com/api/fundamentals/${symbol}?api_token=${EODHD_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('EODHD fundamentals fetch failed');
  return res.json();
}

async function fetchVertexAI(holdings: any[], fundamentals: any, goals: any[]) {
  // Compose a prompt for Gemini 2.5 Pro
  const prompt = {
    holdings,
    fundamentals,
    goals
  };
  const res = await fetch('https://vertex.googleapis.com/v1/projects/YOUR_PROJECT_ID/locations/us-central1/publishers/google/models/gemini-1.5-pro:predict', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VERTEX_API_KEY}`
    },
    body: JSON.stringify({ instances: [prompt] })
  });
  if (!res.ok) throw new Error('Vertex AI fetch failed');
  const data = await res.json();
  // Adapt this to match GeminiAnalysis structure
  return data?.predictions?.[0] as GeminiAnalysis;
}

async function getCachedAnalysis(userId: string, portfolioId: string) {
  const { data, error } = await supabase
    .from('portfolio_analysis')
    .select('*')
    .eq('user_id', userId)
    .eq('portfolio_id', portfolioId)
    .order('generated_at', { ascending: false })
    .limit(1);
  if (error) throw new Error('Cache lookup failed');
  if (!data || !data[0]) return null;
  const expires = data[0].expires_at ? new Date(data[0].expires_at) : null;
  if (expires && expires < new Date()) return null;
  return data[0].analysis_data || data[0].analysis;
}

async function cacheAnalysis(userId: string, portfolioId: string, analysis: GeminiAnalysis) {
  const now = new Date();
  const expires = new Date(now.getTime() + CACHE_TTL_MINUTES * 60000);
  const { error } = await supabase.from('portfolio_analysis').insert([
    {
      user_id: userId,
      portfolio_id: portfolioId,
      analysis,
      generated_at: now.toISOString(),
      expires_at: expires.toISOString(),
    }
  ]);
  if (error) throw new Error('Cache write failed');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const userId = session.user.id;
    const { portfolio_id } = req.body;
    if (!portfolio_id) return res.status(400).json({ error: 'Missing portfolio_id' });

    // 1. Check cache
    const cached = await getCachedAnalysis(userId, portfolio_id);
    if (cached) return res.status(200).json({ analysis: cached, cached: true });

    // 2. Fetch holdings
    const holdings = await fetchHoldings(supabase, userId, portfolio_id);
    if (!holdings || holdings.length === 0) return res.status(404).json({ error: 'No holdings found' });

    // 3. Fetch EODHD data for all symbols
    const fundamentals = {};
    for (const h of holdings) {
      fundamentals[h.symbol] = await fetchFundamentals(h.symbol);
    }

    // 4. Fetch goals
    const { data: goals, error: goalsError } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', userId);
    if (goalsError) return res.status(500).json({ error: 'Failed to fetch goals' });

    // 5. Call Vertex AI
    const analysis = await fetchVertexAI(holdings, fundamentals, goals);

    // 6. Cache the analysis
    await cacheAnalysis(userId, portfolio_id, analysis);

    res.status(200).json({ analysis, cached: false });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Unknown error' });
  }
}
