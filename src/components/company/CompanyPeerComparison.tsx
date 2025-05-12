import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyData } from "@/pages/CompanyAnalysis";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getPeerComparison } from "@/lib/api-service";

interface CompanyPeerComparisonProps {
  companyData: CompanyData;
  currencySymbol: string;
}

function formatLargeNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return 'N/A';
  
  if (num >= 1e12) {
    return `${(num / 1e12).toFixed(2)}T`;
  } else if (num >= 1e9) {
    return `${(num / 1e9).toFixed(2)}B`;
  } else if (num >= 1e6) {
    return `${(num / 1e6).toFixed(2)}M`;
  } else {
    return num.toLocaleString();
  }
}

export default function CompanyPeerComparison({ companyData, currencySymbol }: CompanyPeerComparisonProps) {
  const [peers, setPeers] = useState(companyData.peerComparison || []);
  const [loading, setLoading] = useState(false);
  
  // Refresh peer data
  const refreshPeers = async () => {
    setLoading(true);
    try {
      // Make sure we have a ticker
      if (!companyData.ticker) {
        console.error("Cannot refresh peer data: ticker is missing");
        return;
      }
      
      // Safely call the getPeerComparison function with proper error handling
      const freshPeers = await getPeerComparison(
        companyData.ticker, 
        typeof companyData.sector === 'string' ? companyData.sector : undefined
      );
      
      if (freshPeers && Array.isArray(freshPeers) && freshPeers.length > 0) {
        setPeers(freshPeers);
      }
    } catch (error) {
      console.error("Error refreshing peer data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Add the current company to the peer comparison list
  const allCompanies = [
    {
      name: companyData.name,
      ticker: companyData.ticker,
      marketCap: companyData.marketCap,
      peRatio: companyData.peRatio || 0,
      revenueGrowth: companyData.revenueGrowth || 0,
      roe: companyData.roe || 0,
      roce: companyData.roce || 0
    },
    ...peers
  ];
  
  // Sort by market cap (largest first)
  const sortedCompanies = [...allCompanies].sort((a, b) => b.marketCap - a.marketCap);
  
  // Find the maximum values for each metric to highlight leaders
  const maxMarketCap = Math.max(...sortedCompanies.map(c => c.marketCap));
  const maxRevenueGrowth = Math.max(...sortedCompanies.map(c => c.revenueGrowth || 0));
  const maxRoe = Math.max(...sortedCompanies.map(c => c.roe || 0));
  const maxRoce = Math.max(...sortedCompanies.map(c => c.roce || 0));
  
  // For P/E, we actually want to highlight the lowest (most efficient) that's positive
  const positiveRatios = sortedCompanies.filter(c => (c.peRatio || 0) > 0).map(c => c.peRatio || 0);
  const minPositivePE = positiveRatios.length ? Math.min(...positiveRatios) : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Peer Comparison</CardTitle>
            <CardDescription>{companyData.name} compared to industry peers</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshPeers}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Company</TableHead>
                  <TableHead>Ticker</TableHead>
                  <TableHead>Market Cap</TableHead>
                  <TableHead>P/E Ratio</TableHead>
                  <TableHead>ROE</TableHead>
                  <TableHead>ROCE</TableHead>
                  <TableHead className="text-right">Growth</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCompanies.map((peer, index) => (
                  <TableRow key={index} className={peer.ticker === companyData.ticker ? "bg-slate-50 dark:bg-slate-800" : ""}>
                    <TableCell className="font-medium">
                      {peer.ticker === companyData.ticker ? (
                        <span className="font-bold">{peer.name}</span>
                      ) : (
                        peer.name
                      )}
                    </TableCell>
                    <TableCell>{peer.ticker}</TableCell>
                    <TableCell className={peer.marketCap === maxMarketCap ? "font-bold text-fin-primary" : ""}>
                      {currencySymbol}{formatLargeNumber(peer.marketCap)}
                    </TableCell>
                    <TableCell className={(peer.peRatio > 0 && peer.peRatio === minPositivePE) ? "font-bold text-fin-primary" : ""}>
                      {peer.peRatio?.toFixed(2) || 'N/A'}
                    </TableCell>
                    <TableCell className={peer.roe === maxRoe && peer.roe > 0 ? "font-bold text-fin-primary" : ""}>
                      {peer.roe?.toFixed(2) || 'N/A'}%
                    </TableCell>
                    <TableCell className={peer.roce === maxRoce && peer.roce > 0 ? "font-bold text-fin-primary" : ""}>
                      {peer.roce?.toFixed(2) || 'N/A'}%
                    </TableCell>
                    <TableCell className={`text-right ${
                      peer.revenueGrowth === maxRevenueGrowth && peer.revenueGrowth > 0 ? "font-bold text-fin-primary" : ""
                    }`}>
                      <div className="flex items-center justify-end gap-1">
                        {(peer.revenueGrowth || 0) >= 0 ? (
                          <>
                            {(peer.revenueGrowth || 0).toFixed(1)}%
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          </>
                        ) : (
                          <>
                            {Math.abs(peer.revenueGrowth || 0).toFixed(1)}%
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            <p>* Bold values indicate best-in-class metrics among peers</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Industry Context</CardTitle>
          <CardDescription>How {companyData.name} is positioned in the industry</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 bg-slate-50 rounded-lg dark:bg-slate-800">
            <h3 className="text-lg font-medium mb-3">Competitive Landscape</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {companyData.name} ranks {
                sortedCompanies.findIndex(c => c.ticker === companyData.ticker) + 1
              } out of {sortedCompanies.length} in market capitalization within its peer group.
              The company's P/E ratio is {
                (companyData.peRatio || 0) > minPositivePE && minPositivePE > 0
                  ? "higher than" 
                  : "among the lowest in"
              } its peer group, indicating a {
                (companyData.peRatio || 0) > minPositivePE && minPositivePE > 0
                  ? "potentially higher valuation relative to earnings" 
                  : "potentially attractive valuation relative to earnings"
              }.
            </p>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {companyData.name}'s return on equity (ROE) of {companyData.roe?.toFixed(2) || 'N/A'}% is {
                (companyData.roe || 0) === maxRoe && maxRoe > 0
                  ? "the highest among peers, demonstrating efficient use of shareholder capital" 
                  : (companyData.roe || 0) > (sortedCompanies.reduce((sum, c) => sum + (c.roe || 0), 0) / sortedCompanies.length)
                    ? "above the peer average, indicating good capital efficiency"
                    : "below the peer group average, suggesting potential areas for improvement"
              }.
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              In terms of revenue growth, {companyData.name} is {
                (companyData.revenueGrowth || 0) === maxRevenueGrowth && maxRevenueGrowth > 0
                  ? "leading the industry" 
                  : (companyData.revenueGrowth || 0) > 0 
                    ? "showing positive momentum" 
                    : "facing growth challenges"
              } with a {(companyData.revenueGrowth || 0).toFixed(1)}% year-over-year change, compared to a sector average of {
                (sortedCompanies.reduce((sum, c) => sum + (c.revenueGrowth || 0), 0) / sortedCompanies.length).toFixed(1)
              }%.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 