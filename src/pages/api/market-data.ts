import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import MarketData from '@/models/MarketData';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const { type } = req.query;
    const query = type ? { type } : {};
    
    const marketData = await MarketData.find(query).sort({ lastUpdated: -1 });
    
    res.status(200).json(marketData);
  } catch (error) {
    console.error('Error fetching market data:', error);
    res.status(500).json({ message: 'Error fetching market data' });
  }
} 