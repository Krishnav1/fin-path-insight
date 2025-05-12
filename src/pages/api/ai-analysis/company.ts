import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  analysis: string;
  error?: string;
};

/**
 * API route for AI company analysis
 * This acts as a proxy to the backend AI analysis service
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ analysis: '', error: 'Method not allowed' });
  }

  try {
    // Forward the request to our backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
    const response = await fetch(`${backendUrl}/api/ai-analysis/company`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in AI analysis API route:', error);
    return res.status(500).json({
      analysis: '',
      error: error instanceof Error ? error.message : 'Failed to generate AI analysis'
    });
  }
}
