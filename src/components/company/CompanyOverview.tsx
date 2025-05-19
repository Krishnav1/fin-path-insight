import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Building2, CalendarDays, User, MapPin, Globe, TrendingUp, Briefcase, DollarSign, PercentCircle, ArrowUpDown } from "lucide-react";
import { CompanyData } from "@/pages/CompanyAnalysis";

interface CompanyOverviewProps {
  companyData: CompanyData;
  currencySymbol: string;
}

export default function CompanyOverview({ companyData, currencySymbol }: CompanyOverviewProps) {
  // Format large numbers for display
  const formatLargeNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null) return 'N/A';
    
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    return num.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Card */}
      <Card>
        <CardHeader>
          <CardTitle>Key Metrics</CardTitle>
          <CardDescription>Important financial and market metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border rounded-md p-3">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-fin-primary" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Market Cap</p>
              </div>
              <p className="font-semibold">{currencySymbol}{formatLargeNumber(companyData.marketCap)}</p>
            </div>
            
            <div className="border rounded-md p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-fin-primary" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">P/E Ratio</p>
              </div>
              <p className="font-semibold">{companyData.peRatio !== null && companyData.peRatio !== undefined ? Number(companyData.peRatio).toFixed(2) : 'N/A'}</p>
            </div>
            
            <div className="border rounded-md p-3">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-fin-primary" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">EPS</p>
              </div>
              <p className="font-semibold">{currencySymbol}{companyData.eps !== null && companyData.eps !== undefined ? Number(companyData.eps).toFixed(2) : 'N/A'}</p>
            </div>
            
            <div className="border rounded-md p-3">
              <div className="flex items-center gap-2 mb-1">
                <PercentCircle className="h-4 w-4 text-fin-primary" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Dividend Yield</p>
              </div>
              <p className="font-semibold">{companyData.dividendYield !== null && companyData.dividendYield !== undefined ? Number(companyData.dividendYield).toFixed(2) : '0'}%</p>
            </div>
            
            <div className="border rounded-md p-3">
              <div className="flex items-center gap-2 mb-1">
                <PercentCircle className="h-4 w-4 text-fin-primary" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">ROE</p>
              </div>
              <p className="font-semibold">{companyData.roe !== null && companyData.roe !== undefined ? Number(companyData.roe).toFixed(2) : 'N/A'}%</p>
            </div>
            
            <div className="border rounded-md p-3">
              <div className="flex items-center gap-2 mb-1">
                <PercentCircle className="h-4 w-4 text-fin-primary" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">ROCE</p>
              </div>
              <p className="font-semibold">{companyData.roce !== null && companyData.roce !== undefined ? Number(companyData.roce).toFixed(2) : 'N/A'}%</p>
            </div>
            
            <div className="border rounded-md p-3">
              <div className="flex items-center gap-2 mb-1">
                <ArrowUpDown className="h-4 w-4 text-fin-primary" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Debt to Equity</p>
              </div>
              <p className="font-semibold">{companyData.debtToEquity !== null && companyData.debtToEquity !== undefined ? Number(companyData.debtToEquity).toFixed(2) : 'N/A'}</p>
            </div>
            
            <div className="border rounded-md p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-fin-primary" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">52W Range</p>
              </div>
              <p className="font-semibold text-sm">
                {currencySymbol}{companyData.market52WeekLow !== null && companyData.market52WeekLow !== undefined ? Number(companyData.market52WeekLow).toFixed(2) : 'N/A'} - {currencySymbol}{companyData.market52WeekHigh !== null && companyData.market52WeekHigh !== undefined ? Number(companyData.market52WeekHigh).toFixed(2) : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
              <CardDescription>Basic information about {companyData.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-3">About the Company</h3>
                <p className="text-slate-600 dark:text-slate-400">{companyData.about}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flex gap-3">
                  <CalendarDays className="h-5 w-5 text-fin-primary" />
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Year Founded</p>
                    <p className="font-medium">{companyData.foundedYear}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <User className="h-5 w-5 text-fin-primary" />
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">CEO</p>
                    <p className="font-medium">{companyData.ceo}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MapPin className="h-5 w-5 text-fin-primary" />
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Headquarters</p>
                    <p className="font-medium">{companyData.headquarters}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Globe className="h-5 w-5 text-fin-primary" />
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Website</p>
                    <a 
                      href={companyData.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="font-medium text-fin-primary flex items-center gap-1 hover:underline"
                    >
                      {companyData.website.replace(/^https?:\/\//, '')}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Briefcase className="h-5 w-5 text-fin-primary" />
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Sector</p>
                    <p className="font-medium">{companyData.sector}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Building2 className="h-5 w-5 text-fin-primary" />
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Industry</p>
                    <p className="font-medium">{companyData.industry}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Business Model</CardTitle>
              <CardDescription>How {companyData.name} makes money</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400">{companyData.businessModel}</p>
            </CardContent>
          </Card>
          
          {/* TradingView Chart Widget */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Chart</CardTitle>
              <CardDescription>Powered by TradingView</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {/* Using TradingView Widget */}
              <div className="tradingview-widget-container">
                <div id="tradingview_chart" style={{ height: '100%', width: '100%' }}>
                  <iframe 
                    title={`${companyData.ticker} Chart`}
                    src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${companyData.ticker}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=light&style=1&timezone=exchange&withdateranges=1&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=fin-path-insight&utm_medium=widget&utm_campaign=chart`}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  ></iframe>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Key Strengths</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {companyData.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="h-5 w-5 text-green-500 flex-shrink-0">✓</span>
                    <span className="text-slate-600 dark:text-slate-400">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Key Weaknesses</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {companyData.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="h-5 w-5 text-red-500 flex-shrink-0">✗</span>
                    <span className="text-slate-600 dark:text-slate-400">{weakness}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Market Position</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-slate-600 dark:text-slate-400">
                <span className="font-medium">{companyData.name}'s</span> estimated market share in its primary sector is <span className="font-medium">{companyData.marketShare}%</span>.
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Key growth drivers are:
              </p>
              <ul className="mt-2 space-y-1">
                {companyData.growthDrivers.map((driver, index) => (
                  <li key={index} className="text-slate-600 dark:text-slate-400 pl-4 relative">
                    <span className="absolute left-0 top-2 h-1 w-1 rounded-full bg-fin-primary"></span>
                    {driver}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          {/* Company Logo */}
          <Card>
            <CardHeader>
              <CardTitle>Company Identity</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center flex-col">
              <img 
                src={`https://logo.clearbit.com/${companyData.website.replace(/^https?:\/\//, '')}`}
                alt={`${companyData.name} logo`}
                className="max-w-[160px] h-auto mb-4"
                onError={(e) => {
                  // Fallback if Clearbit doesn't have the logo
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${companyData.name}&background=random&size=150&bold=true`;
                }}
              />
              <div className="text-center">
                <p className="text-slate-900 dark:text-slate-100 font-medium">{companyData.name}</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{companyData.ticker}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 