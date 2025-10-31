import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import CompanyOverview from "@/components/company/CompanyOverview";
import CompanyFinancials from "@/components/company/CompanyFinancials";
import CompanyCharts from "@/components/company/CompanyCharts";
import CompanyNews from "@/components/company/CompanyNews";
import CompanyPeerComparison from "@/components/company/CompanyPeerComparison";
import CompanyRecommendation from "@/components/company/CompanyRecommendation";
import AIAnalysis from "@/components/company/AIAnalysis";
import { Loader2, ArrowLeft, RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMarket } from "@/hooks/use-market";
import { fetchCompanyData, type CompanyData as ImportedCompanyData } from "@/services/companyDataService";
import { getPeerComparison } from "@/services/apiService";
// Import html2pdf and declare its type to include the 'from' method
import html2pdfLib from 'html2pdf.js';
// Use a type assertion to tell TypeScript that the library has the methods we need
const html2pdf = html2pdfLib as any;

// Company data types
export type CompanyData = {
  ticker: string;
  displaySymbol?: string;
  name: string;
  exchange: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  sector: string;
  industry: string;
  about: string;
  foundedYear: number;
  ceo: string;
  headquarters: string;
  website: string;
  businessModel: string;
  strengths: string[];
  weaknesses: string[];
  marketCap: number;
  peRatio: number;
  eps: number;
  beta?: number;
  dividendYield: number;
  roe?: number;
  roce?: number;
  debtToEquity?: number;
  revenueGrowth: number;
  profitMargin: number;
  yearlyRevenue: { year: number; value: number }[];
  yearlyProfit: { year: number; value: number }[];
  yearlyEps?: { year: number; value: number }[];
  yearlyRoe?: { year: number; value: number }[];
  yearlyRoce?: { year: number; value: number }[];
  yearlyDebtToEquity?: { year: number; value: number }[];
  yearlyDividendYield?: { year: number; value: number }[];
  market52WeekHigh?: number;
  market52WeekLow?: number;
  marketShare: number;
  growthDrivers: string[];
  peerComparison: {
    name: string;
    ticker: string;
    marketCap: number;
    peRatio: number;
    revenueGrowth: number;
    roe?: number;
    roce?: number;
  }[];
  analystRatings: {
    buy: number;
    hold: number;
    sell: number;
  };
  valuation: "Undervalued" | "Fairly Valued" | "Overvalued";
  lastUpdated?: Date;
  news?: {
    title: string;
    url: string;
    source: string;
    publishedAt: string;
    snippet: string;
  }[];
  chartData?: {
    date: Date;
    close: number;
    volume?: number;
  }[];
  // Added for enhanced Supabase integration
  fromSupabase?: boolean;
  peerData?: any[];
};

export default function CompanyAnalysis() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { market } = useMarket();

  const fetchCompanyDataInternal = async () => {
    if (!symbol) return;
    
    setLoading(true);
    try {
      const data = await fetchCompanyData(symbol);
      setCompanyData(data);
    } catch (error) {
      console.error("Error fetching company data:", error);
      setCompanyData(null);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine valuation based on P/E ratio and growth
  const determineValuation = (pe: number, growth: number): "Undervalued" | "Fairly Valued" | "Overvalued" => {
    if (!pe || pe < 0) return "Fairly Valued";
    
    // PEG ratio concept (P/E to Growth)
    const pegRatio = pe / growth;
    
    if (pegRatio < 0.8) return "Undervalued";
    if (pegRatio > 1.5) return "Overvalued";
    return "Fairly Valued";
  };

  // Function to handle refresh button click
  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    
    console.log("Refreshing company data from Indian API...");
    
    try {
      await fetchCompanyDataInternal();
    } catch (error) {
      console.error("Error refreshing company data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch data on initial load
  useEffect(() => {
    fetchCompanyDataInternal();
  }, [symbol, market]);

  // ... (rest of the code remains the same)
  const handleDownloadPDF = () => {
    if (!companyData) return;
    
    const element = document.getElementById('company-report');
    if (!element) return;
    
    const options = {
      margin: 10,
      filename: `${companyData.name}_Research_Report.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().from(element).set(options).save();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Header />
        <main className="container py-8 px-4 md:px-6">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-fin-primary" />
              <p className="text-slate-500 dark:text-slate-400">Loading company data...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Header />
        <main className="container py-8 px-4 md:px-6">
          <div className="flex items-center justify-center h-[60vh] flex-col gap-6">
            <p className="text-xl text-slate-500 dark:text-slate-400">Company not found or data unavailable.</p>
            <Button onClick={() => navigate(-1)} variant="outline" className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Go Back
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const currencySymbol = market === "india" ? "₹" : "$";
  
  const formatTimestamp = (timestamp: Date | undefined) => {
    if (!timestamp) return 'Not available';
    
    try {
      // If it's a string or invalid Date object, create a valid Date object
      const dateObj = timestamp instanceof Date && !isNaN(timestamp.getTime()) 
        ? timestamp 
        : new Date();
      
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(dateObj);
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Not available';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header />
      <main className="container py-8 px-4 md:px-6" id="company-report">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold tracking-tight">{companyData?.name}</h1>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{companyData?.ticker}</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Powered by Indian API</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-1"
              >
                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                <span>Refresh</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadPDF}
                disabled={!companyData}
                className="flex items-center gap-1"
              >
                <Download size={16} />
                <span>Download PDF</span>
              </Button>
            </div>
        </div>
          
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-3">
          {companyData?.name || 'Company'}
          <span className="text-xl text-slate-500 dark:text-slate-400">
            ({companyData?.exchange || 'Exchange'}: {companyData?.displaySymbol || companyData?.ticker?.split('.')[0] || companyData?.ticker || 'Symbol'})
          </span>
        </h1>
          
          <div className="mt-1 flex items-center gap-3">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                {currencySymbol}{(companyData?.currentPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`ml-2 text-sm font-medium ${(companyData?.priceChange || 0) >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                {(companyData?.priceChange || 0) >= 0 ? '+' : ''}{(companyData?.priceChange || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                ({(companyData?.priceChangePercent || 0) >= 0 ? '+' : ''}{(companyData?.priceChangePercent || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%)
              </span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Last updated: {formatTimestamp(companyData?.lastUpdated)}
            </span>
          </div>
        </div>

        <Tabs defaultValue="overview" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="peer-comparison">Peer Comparison</TabsTrigger>
            <TabsTrigger value="recommendation">Analyst View</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <CompanyOverview companyData={companyData} currencySymbol={currencySymbol} />
          </TabsContent>
          
          <TabsContent value="financials">
            <CompanyFinancials companyData={companyData} currencySymbol={currencySymbol} />
          </TabsContent>
          
          <TabsContent value="charts">
            <CompanyCharts companyData={companyData} currencySymbol={currencySymbol} />
          </TabsContent>
          
          <TabsContent value="peer-comparison">
            <CompanyPeerComparison companyData={companyData} currencySymbol={currencySymbol} />
          </TabsContent>
          
          <TabsContent value="recommendation">
            <CompanyRecommendation companyData={companyData} />
          </TabsContent>
          
          <TabsContent value="news">
            <CompanyNews companyData={companyData} />
          </TabsContent>
          
          <TabsContent value="ai-analysis">
            <AIAnalysis companyData={companyData} currencySymbol={currencySymbol} />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
} 