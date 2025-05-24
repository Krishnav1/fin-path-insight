import React, { useEffect, useState } from 'react';
import { GeminiAnalysis } from '../lib/types';

interface PortfolioIntelligenceProps {
  portfolioId: string;
}

const PortfolioIntelligence: React.FC<PortfolioIntelligenceProps> = ({ portfolioId }) => {
  const [analysis, setAnalysis] = useState<GeminiAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!portfolioId) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);
    fetch('/api/portfolio-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ portfolio_id: portfolioId })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Unknown error');
        setAnalysis(data.analysis);
      })
      .catch(e => {
        setError(e.message || 'Failed to fetch analysis');
      })
      .finally(() => setLoading(false));
  }, [portfolioId]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[200px] text-primary animate-pulse">
      <span className="loader mb-2" />
      <span>Generating portfolio intelligence...</span>
    </div>
  );

  if (error) return (
    <div className="bg-red-100 text-red-800 rounded p-4 my-4 text-center">
      <strong>Error:</strong> {error}
    </div>
  );

  if (!analysis) return null;

  return (
    <div className="p-4 md:p-6 bg-white dark:bg-gray-900 rounded shadow-md max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-primary">Portfolio Intelligence</h2>
      {/* Overview */}
      <section className="mb-6">
        <h3 className="font-semibold mb-2 text-secondary">Overview</h3>
        <ul className="grid grid-cols-2 gap-2 text-sm">
          <li><strong>Invested:</strong> {analysis.overview.total_invested}</li>
          <li><strong>Market Value:</strong> {analysis.overview.market_value}</li>
          <li><strong>Absolute Return:</strong> {analysis.overview.absolute_return}</li>
          <li><strong>Percent Return:</strong> {analysis.overview.percent_return}</li>
          <li><strong>Top Gainer:</strong> {analysis.overview.top_gainer}</li>
          <li><strong>Worst Performer:</strong> {analysis.overview.worst_performer}</li>
        </ul>
      </section>
      {/* Stock Breakdown */}
      <section className="mb-6">
        <h3 className="font-semibold mb-2 text-secondary">Stock Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs border border-gray-200 dark:border-gray-700 rounded">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="p-2">Symbol</th>
                <th className="p-2">Sector</th>
                <th className="p-2">% Gain</th>
                <th className="p-2">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {analysis.stock_breakdown.map((stock, i) => (
                <tr key={i} className="even:bg-gray-50 dark:even:bg-gray-800">
                  <td className="p-2">{stock.symbol}</td>
                  <td className="p-2">{stock.sector}</td>
                  <td className="p-2">{stock.percent_gain}</td>
                  <td className="p-2">{stock.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {/* Diversification */}
      <section className="mb-6">
        <h3 className="font-semibold mb-2 text-secondary">Diversification</h3>
        <div className="flex flex-wrap gap-4">
          <div>
            <strong>Risk:</strong> <span className={
              analysis.diversification.risk_flag === 'High' ? 'text-red-600' : analysis.diversification.risk_flag === 'Medium' ? 'text-yellow-600' : 'text-green-600'
            }>{analysis.diversification.risk_flag}</span>
          </div>
          <div>
            <strong>Sectors:</strong>
            <ul className="ml-2">
              {Object.entries(analysis.diversification.sector_breakdown).map(([sector, percent]) => (
                <li key={sector}>{sector}: {percent}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      {/* Recommendations */}
      <section className="mb-6">
        <h3 className="font-semibold mb-2 text-secondary">Recommendations</h3>
        <ul className="list-disc ml-6 text-sm">
          {analysis.recommendations.map((rec, i) => (
            <li key={i}>{rec}</li>
          ))}
        </ul>
      </section>
      {/* Summary */}
      <section>
        <h3 className="font-semibold mb-2 text-secondary">Summary</h3>
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm">
          {analysis.summary}
        </div>
      </section>
    </div>
  );
};

export default PortfolioIntelligence;
