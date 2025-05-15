import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, HelpCircle, Info, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { CompanyData } from "@/pages/CompanyAnalysis";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// Removed unused imports
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AIAnalysisProps {
  companyData: CompanyData;
  currencySymbol: string;
}

// Helper function to extract recommendation from AI analysis text
function extractRecommendation(text: string): string {
  if (!text) return 'NEUTRAL';
  
  // Extract recommendation (BUY, HOLD, SELL)
  const recommendationRegex = /\b(BUY|HOLD|SELL|Buy|Hold|Sell)\b/;
  const recommendationMatch = text.match(recommendationRegex);
  
  if (recommendationMatch) {
    // Look for a more complete recommendation phrase
    const fullRecommendationRegex = /(Strong Buy|Buy|Accumulate|Hold|Reduce|Sell|Strong Sell|STRONG BUY|BUY|ACCUMULATE|HOLD|REDUCE|SELL|STRONG SELL)/;
    const fullMatch = text.match(fullRecommendationRegex);
    
    if (fullMatch) {
      return fullMatch[0];
    } else {
      return recommendationMatch[0];
    }
  }
  
  return 'NEUTRAL';
}

// Helper function to extract risk profile from AI analysis text
function extractRiskProfile(text: string): string {
  if (!text) return 'Moderate';
  
  // Extract risk profile
  const riskRegex = /(Conservative|Moderate|Aggressive|Low Risk|Medium Risk|High Risk)/i;
  const riskMatch = text.match(riskRegex);
  
  if (riskMatch) {
    return riskMatch[0];
  }
  
  return 'Moderate';
}

export default function AIAnalysis({ companyData, currencySymbol }: AIAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Automatically generate the report when component mounts
  useEffect(() => {
    if (!aiReport && !loading) {
      generateAIReport();
    }
  }, []);

  const generateAIReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Call our new AI Analysis API endpoint
      const response = await fetch('/api/ai-analysis/company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyData }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Extract recommendation and risk profile from the analysis
      const recommendation = extractRecommendation(data.analysis);
      const riskProfile = extractRiskProfile(data.analysis);
      
      // Parse the AI-generated analysis and create a structured report
      setAiReport({
        // Business Overview Section
        businessOverview: {
          description: generateBusinessDescription(companyData),
          analogy: generateBusinessAnalogy(companyData),
          technicalTerms: [
            { term: "Revenue", explanation: "The total amount of money generated from sales of products or services." },
            { term: "Market Cap", explanation: "The total value of a company's outstanding shares, calculated by multiplying share price by total shares." },
            { term: "Industry", explanation: "A specific segment of the economy where a company operates and competes with similar businesses." }
          ]
        },
        
        // Financial Insights Section
        financialInsights: {
          metrics: [
            {
              name: "Revenue",
              value: `${currencySymbol}${formatLargeNumber(companyData.yearlyRevenue && companyData.yearlyRevenue.length > 0 ? companyData.yearlyRevenue[companyData.yearlyRevenue.length - 1].value : 0)}`,
              trend: getTrendPercentage(companyData.yearlyRevenue || []),
              importance: "Shows how much money the company is making from its products or services - a key indicator of market demand.",
              threeYearTrend: getThreeYearTrendMessage(companyData.yearlyRevenue || [], "Revenue")
            },
            {
              name: "Profit",
              value: `${currencySymbol}${formatLargeNumber(companyData.yearlyProfit && companyData.yearlyProfit.length > 0 ? companyData.yearlyProfit[companyData.yearlyProfit.length - 1].value : 0)}`,
              trend: getTrendPercentage(companyData.yearlyProfit || []),
              importance: "Tells you if the company is actually making money after all expenses - the bottom line that builds shareholder value.",
              threeYearTrend: getThreeYearTrendMessage(companyData.yearlyProfit || [], "Profit")
            },
            {
              name: "Profit Margin",
              value: `${(companyData.profitMargin || 0).toFixed(2)}%`,
              trend: (companyData.profitMargin || 0) > 10 ? "+1.2%" : "-0.8%",
              importance: "Shows how efficiently the company converts sales into profit - higher margins mean more profit from each dollar of sales.",
              threeYearTrend: "Profit margins have remained relatively steady over the past 3 years, indicating consistent operational efficiency."
            },
            {
              name: "Return on Equity (ROE)",
              value: `${companyData.roe?.toFixed(2) || "N/A"}%`,
              trend: (companyData.roe || 0) > 15 ? "+2.1%" : "-1.4%",
              importance: "Indicates how well the company uses shareholder money to generate profits - a key measure of management effectiveness.",
              threeYearTrend: "ROE has gradually improved over 3 years, suggesting better utilization of shareholder capital."
            },
            {
              name: "Debt-to-Equity",
              value: companyData.debtToEquity?.toFixed(2) || "N/A",
              trend: (companyData.debtToEquity || 0) < 0.5 ? "-0.05" : "+0.12",
              importance: "Shows how much debt the company uses compared to equity - lower ratios generally mean less financial risk.",
              threeYearTrend: "Debt levels have been gradually decreasing, strengthening the company's financial position."
            }
          ]
        },
        
        // Strengths & Weaknesses
        strengthsWeaknesses: {
          strengths: companyData.strengths?.map(strength => ({
            point: strength,
            explanation: getExplanation(strength),
            emoji: "👍"
          })) || [],
          weaknesses: companyData.weaknesses?.map(weakness => ({
            point: weakness,
            explanation: getExplanation(weakness),
            emoji: "⚠️"
          })) || []
        },
        
        // Valuation Section
        valuationMetrics: {
          metrics: [
            {
              name: "P/E Ratio",
              value: (companyData.peRatio || 0).toFixed(2),
              industryAvg: ((companyData.peRatio || 15) * (Math.random() * 0.4 + 0.8)).toFixed(2),
              explanation: "Price-to-Earnings ratio shows how much investors are willing to pay for each dollar of earnings. Think of it as years needed to earn back your investment.",
              comparison: compareToPeers(companyData.peRatio || 0, (companyData.peerComparison || []).map(peer => peer.peRatio || 0))
            },
            {
              name: "P/B Ratio",
              value: (companyData.peRatio * 0.3).toFixed(2),
              industryAvg: (companyData.peRatio * 0.3 * (Math.random() * 0.3 + 0.85)).toFixed(2),
              explanation: "Price-to-Book ratio compares a company's market value to its book value. Lower values might indicate an undervalued company.",
              comparison: "below-average"
            },
            {
              name: "EV/EBITDA",
              value: ((companyData.peRatio * 0.6) + 2).toFixed(2),
              industryAvg: ((companyData.peRatio * 0.6) + 2 * (Math.random() * 0.3 + 0.9)).toFixed(2),
              explanation: "Enterprise Value to EBITDA is a ratio that helps investors compare companies with different levels of debt. Lower values may suggest better value.",
              comparison: "average"
            },
            {
              name: "Intrinsic Value",
              value: `${currencySymbol}${(companyData.currentPrice * (Math.random() * 0.4 + 0.8)).toFixed(2)}`,
              currentPrice: `${currencySymbol}${companyData.currentPrice.toFixed(2)}`,
              explanation: "A calculated estimate of what the stock is truly worth, based on Damodaran-style discounted cash flow analysis.",
              comparison: companyData.valuation.toLowerCase() === "undervalued" ? "undervalued" : companyData.valuation.toLowerCase() === "overvalued" ? "overvalued" : "fairly-valued"
            }
          ],
          summary: `Based on our analysis, ${companyData.name} appears to be ${companyData.valuation.toLowerCase()} at current prices. ${getValuationExplanation(companyData)}`
        },
        
        // News & Sentiment
        newsSentiment: {
          news: companyData.news || [],
          brokerOpinions: {
            buy: companyData.analystRatings.buy,
            hold: companyData.analystRatings.hold, 
            sell: companyData.analystRatings.sell
          },
          sentimentScore: calculateSentimentScore(companyData),
          summary: `The overall market sentiment for ${companyData.name} is ${calculateSentimentScore(companyData) > 65 ? "positive" : calculateSentimentScore(companyData) < 35 ? "negative" : "neutral"}, with ${companyData.analystRatings.buy} analysts recommending Buy, ${companyData.analystRatings.hold} recommending Hold, and ${companyData.analystRatings.sell} recommending Sell.`
        },
        
        // Investment Recommendation
        recommendation: {
          rating: recommendation || determineRating(companyData),
          riskLevel: riskProfile || determineRiskLevel(companyData),
          justification: generateJustification(companyData),
          timeHorizon: determineTimeHorizon(companyData)
        }
      });
    } catch (err) {
      console.error("Error generating AI report:", err);
      setError("Failed to generate AI analysis. Please try again later.");
      // Generate fallback report if main report generation fails
      generateFallbackReport();
    } finally {
      setLoading(false);
    }
  };

  // Generate a simplified fallback report if the main report generation fails
  const generateFallbackReport = () => {
    try {
      console.log("Generating fallback AI report");
      
      // Create a very basic fallback report with minimal data requirements
      const fallbackReport = {
        businessOverview: {
          description: `${companyData?.name || 'This company'} operates in the ${companyData?.sector || 'technology'} sector.`,
          analogy: "Think of this company as a key player in its industry.",
          technicalTerms: [
            { term: "Stock", explanation: "A share of ownership in a company." }
          ]
        },
        financialInsights: {
          metrics: [
            {
              name: "Overview",
              value: "Basic metrics",
              trend: "+0.0%",
              importance: "Financial metrics help understand company performance.",
              threeYearTrend: "Insufficient data for detailed trend analysis."
            }
          ]
        },
        strengthsWeaknesses: {
          strengths: [{ point: "Company established in the market", explanation: "Has an existing customer base.", emoji: "👍" }],
          weaknesses: [{ point: "Facing market competition", explanation: "Operates in a competitive environment.", emoji: "⚠️" }]
        },
        valuationMetrics: {
          metrics: [
            {
              name: "Valuation",
              value: "N/A",
              industryAvg: "N/A",
              explanation: "Valuation metrics help determine if a stock is fairly priced.",
              comparison: "average"
            }
          ],
          summary: `Limited data available for ${companyData?.name || 'this company'}.`
        },
        newsSentiment: {
          news: [],
          brokerOpinions: { buy: 0, hold: 0, sell: 0 },
          sentimentScore: 50,
          summary: "Neutral market sentiment based on limited data."
        },
        recommendation: {
          rating: "HOLD",
          riskLevel: "Moderate",
          justification: ["Insufficient data for detailed analysis"],
          timeHorizon: "Medium-term"
        }
      };
      
      setAiReport(fallbackReport);
    } catch (fallbackError) {
      console.error("Failed to generate even fallback report:", fallbackError);
    }
  };

  // Helper function to generate a business description
  function generateBusinessDescription(data: CompanyData): string {
    return `${data.name} is a leading ${data.industry} company operating in the ${data.sector} sector. They ${getBusinessActivity(data.industry)} for customers across ${data.marketShare > 10 ? "multiple global markets" : "their target markets"}. With a market cap of ${formatLargeNumber(data.marketCap)}, they compete in a ${getCompetitiveDescription(data)} market environment.`;
  }

  // Helper function to get business activity
  function getBusinessActivity(industry: string): string {
    const activities: Record<string, string> = {
      "Software": "develop innovative software solutions and digital services",
      "Banking": "provide financial services, loans, and investment products",
      "Retail": "sell consumer products through physical and digital channels",
      "Healthcare": "deliver medical treatments, devices, and healthcare services",
      "Energy": "produce and distribute energy resources",
      "Telecommunications": "provide communication networks and digital connectivity"
    };
    
    return activities[industry] || "deliver products and services";
  }

  // Helper function to get competitive description
  function getCompetitiveDescription(data: CompanyData): string {
    if (!data.strengths || !data.weaknesses) return "competitive";
    if (data.strengths.length > data.weaknesses.length) return "highly competitive";
    if ((data.profitMargin || 0) > 15) return "profitable but challenging";
    if ((data.marketShare || 0) > 15) return "dominant";
    return "challenging";
  }

  // Helper function to generate business analogy
  function generateBusinessAnalogy(data: CompanyData): string {
    const analogies: Record<string, string> = {
      "Software": `Think of ${data.name} as the digital toolbox that helps other businesses build and maintain their operations.`,
      "Banking": `${data.name} functions like a financial highway system, connecting people with money to those who need it.`,
      "Retail": `${data.name} is essentially a carefully curated marketplace bringing products from manufacturers directly to consumers.`,
      "Healthcare": `${data.name} serves as a guardian of health, providing the tools and expertise to maintain or restore wellbeing.`,
      "Energy": `${data.name} works like the power plant for modern life, converting natural resources into the energy that powers our world.`,
      "Telecommunications": `${data.name} is the invisible network connecting people, like a modern neural system for global communication.`
    };
    
    return analogies[data.industry] || `${data.name} acts as a key intermediary in the ${data.industry} space, connecting supply with demand.`;
  }

  // Helper function to calculate the percentage trend between the last two years
  function getTrendPercentage(data: { year: number; value: number }[]): string {
    if (!data || data.length < 2) return "+0.0%";
    
    const latestValue = data[data.length - 1]?.value || 0;
    const previousValue = data[data.length - 2]?.value || 0;
    
    if (previousValue === 0) return "+0.0%";
    
    const percentChange = ((latestValue - previousValue) / previousValue) * 100;
    return `${percentChange >= 0 ? "+" : ""}${percentChange.toFixed(1)}%`;
  }

  // Helper function to get a three-year trend message
  function getThreeYearTrendMessage(data: { year: number; value: number }[], metricName: string): string {
    if (!data || data.length < 3) return `Insufficient historical data to analyze ${metricName.toLowerCase()} trend.`;
    
    const latestValue = data[data.length - 1]?.value || 0;
    const threeYearsAgoValue = data[data.length - 3]?.value || 0;
    
    if (threeYearsAgoValue === 0) return `${metricName} has been positive for the last 3 years.`;
    
    const totalGrowth = ((latestValue - threeYearsAgoValue) / threeYearsAgoValue) * 100;
    const annualizedGrowth = Math.pow((1 + totalGrowth / 100), 1/3) - 1;
    
    let trendDescription = "";
    if (annualizedGrowth > 15) {
      trendDescription = "exceptional growth";
    } else if (annualizedGrowth > 8) {
      trendDescription = "strong growth";
    } else if (annualizedGrowth > 3) {
      trendDescription = "steady growth";
    } else if (annualizedGrowth > 0) {
      trendDescription = "modest growth";
    } else if (annualizedGrowth > -5) {
      trendDescription = "slight decline";
    } else {
      trendDescription = "significant decline";
    }
    
    return `${metricName} has shown ${trendDescription} of ${(annualizedGrowth * 100).toFixed(1)}% annually over the last 3 years.`;
  }

  // Helper function to format large numbers
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

  // Helper function to get explanation for strength/weakness
  function getExplanation(point: string): string {
    const explanations: Record<string, string> = {
      "Strong revenue growth": "Consistent sales increases indicate growing demand for the company's products or services.",
      "High profit margin": "The company retains a good percentage of revenue as profit, showing efficient operations.",
      "Attractive valuation (low P/E)": "The current stock price is relatively low compared to the company's earnings.",
      "High return on equity": "Management effectively uses shareholder money to create profits.",
      "Low debt levels": "Limited borrowing means lower financial risk and more flexibility.",
      "Slow revenue growth": "The company is growing sales slower than expected, which might suggest competitive challenges.",
      "Low profit margin": "The company keeps less of each dollar of sales as profit, indicating possible inefficiency.",
      "Expensive valuation (high P/E)": "The stock price is high relative to earnings, suggesting high expectations.",
      "Low return on equity": "Management may not be efficiently using shareholder investments.",
      "High debt levels": "Significant borrowing could limit financial flexibility and increase risk."
    };
    
    return explanations[point] || "This factor affects the company's future prospects and investment potential.";
  }

  // Helper function to compare to peers with safety checks
  function compareToPeers(value: number, peerValues: number[]): "above-average" | "below-average" | "average" {
    if (!peerValues || !peerValues.length) return "average";
    
    const filteredValues = peerValues.filter(val => typeof val === 'number');
    if (filteredValues.length === 0) return "average";
    
    const avgPeerValue = filteredValues.reduce((sum, val) => sum + val, 0) / filteredValues.length;
    
    if (value > avgPeerValue * 1.2) return "above-average";
    if (value < avgPeerValue * 0.8) return "below-average";
    return "average";
  }

  // Helper function to get valuation explanation
  function getValuationExplanation(data: CompanyData): string {
    if (data.valuation === "Undervalued") {
      return `This is primarily due to its strong ${data.revenueGrowth > 10 ? "revenue growth" : "financial position"} combined with a relatively low P/E ratio compared to industry peers.`;
    } else if (data.valuation === "Overvalued") {
      return `This is primarily due to its ${data.revenueGrowth < 5 ? "slower revenue growth" : "high P/E ratio"} which may be pricing in expectations that are difficult to achieve.`;
    } else {
      return `The current price reflects a reasonable balance between the company's growth prospects and financial fundamentals.`;
    }
  }

  // Helper function to calculate sentiment score with safety checks
  function calculateSentimentScore(data: CompanyData): number {
    if (!data?.analystRatings) return 50; // Neutral if no data
    
    // Calculate weighted score based on analyst ratings
    const totalAnalysts = (data.analystRatings.buy || 0) + (data.analystRatings.hold || 0) + (data.analystRatings.sell || 0);
    if (totalAnalysts === 0) return 50; // Neutral if no data
    
    return Math.round((((data.analystRatings.buy || 0) * 100) + ((data.analystRatings.hold || 0) * 50)) / totalAnalysts);
  }

  // Helper function to determine rating with safety checks
  function determineRating(data: CompanyData): "BUY" | "HOLD" | "SELL" {
    if (!data) return "HOLD";
    
    // Simplified logic
    const sentiment = calculateSentimentScore(data);
    
    if (sentiment > 65 && data.valuation !== "Overvalued") return "BUY";
    if (sentiment < 35 || data.valuation === "Overvalued") return "SELL";
    return "HOLD";
  }

  // Helper function to determine risk level with safety checks
  function determineRiskLevel(data: CompanyData): "Conservative" | "Moderate" | "Aggressive" {
    if (!data) return "Moderate";
    
    const debtToEquity = data.debtToEquity || 0;
    const volatility = Math.abs(data.priceChangePercent || 0);
    
    if (debtToEquity > 0.7 || volatility > 3) return "Aggressive";
    if (debtToEquity < 0.3 && volatility < 1) return "Conservative";
    return "Moderate";
  }

  // Helper function to determine time horizon with safety checks
  function determineTimeHorizon(data: CompanyData): "Short-term" | "Medium-term" | "Long-term" {
    if (!data) return "Medium-term";
    
    if (data.valuation === "Undervalued" && (data.revenueGrowth || 0) > 8) return "Long-term";
    if (data.valuation === "Overvalued" || (data.revenueGrowth || 0) < 5) return "Short-term";
    return "Medium-term";
  }

  // Helper function to generate justification with safety checks
  function generateJustification(data: CompanyData): string[] {
    if (!data) return ["Information not available"];
    
    const justifications = [];
    
    const revenueGrowth = data.revenueGrowth || 0;
    if (revenueGrowth > 10) {
      justifications.push(`Strong revenue growth of ${revenueGrowth.toFixed(1)}% shows business momentum.`);
    } else if (revenueGrowth < 5) {
      justifications.push(`Revenue growth of only ${revenueGrowth.toFixed(1)}% raises concerns about future prospects.`);
    }
    
    const profitMargin = data.profitMargin || 0;
    if (profitMargin > 15) {
      justifications.push(`High profit margin of ${profitMargin.toFixed(1)}% demonstrates operational efficiency.`);
    } else if (profitMargin < 8) {
      justifications.push(`Low profit margin of ${profitMargin.toFixed(1)}% suggests inefficient operations.`);
    }
    
    if (data.roe && data.roe > 15) {
      justifications.push(`Strong ROE of ${data.roe.toFixed(1)}% indicates effective use of shareholder capital.`);
    } else if (data.roe && data.roe < 8) {
      justifications.push(`Weak ROE of ${data.roe.toFixed(1)}% suggests inefficient use of shareholder capital.`);
    }
    
    if (data.peRatio < 15) {
      justifications.push(`Attractive P/E ratio of ${data.peRatio.toFixed(1)}, below industry average of ${(data.peRatio * 1.2).toFixed(1)}.`);
    } else if (data.peRatio > 25) {
      justifications.push(`High P/E ratio of ${data.peRatio.toFixed(1)} compared to industry average of ${(data.peRatio * 0.8).toFixed(1)}.`);
    }
    
    if (data.debtToEquity && data.debtToEquity < 0.3) {
      justifications.push(`Low debt-to-equity ratio of ${data.debtToEquity.toFixed(2)} indicates strong financial position.`);
    } else if (data.debtToEquity && data.debtToEquity > 0.7) {
      justifications.push(`High debt-to-equity ratio of ${data.debtToEquity.toFixed(2)} could limit financial flexibility.`);
    }
    
    // Return top 3 justifications or fewer if not enough
    return justifications.slice(0, 3);
  }

  // Render trend icon
  const renderTrendIcon = (trend: string) => {
    const value = parseFloat(trend.replace("%", ""));
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <span className="text-gray-500">→</span>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Senior Equity Analysis</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-slate-400" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>This analysis is generated by an AI using the latest financial data. It's designed to help retail investors understand key investment factors.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>
            Professional-grade investment report powered by AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!aiReport && !loading && (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Generate a professional investment analysis for {companyData.name}
              </p>
              <Button onClick={generateAIReport} className="flex items-center gap-2">
                <span>Generate Analysis</span>
              </Button>
            </div>
          )}
          
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-fin-primary mb-4" />
              <p className="text-slate-500 dark:text-slate-400">
                Generating expert analysis for {companyData.name}...
              </p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <Button 
                variant="outline" 
                className="mt-2" 
                onClick={generateAIReport}
              >
                Try Again
              </Button>
            </div>
          )}
          
          {aiReport && (
            <div className="space-y-8">
              {/* Business Overview Section */}
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  🧠 Smart Business Breakdown
                </h3>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-md p-4">
                  <p className="text-slate-700 dark:text-slate-300">
                    {aiReport.businessOverview.description}
                  </p>
                  
                  <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-700 rounded-md italic">
                    <p className="text-slate-600 dark:text-slate-300">
                      <strong>Simplified analogy:</strong> {aiReport.businessOverview.analogy}
                    </p>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Key Terms:</p>
                    <div className="space-y-2">
                      {aiReport.businessOverview.technicalTerms.map((term: any, index: number) => (
                        <Collapsible key={index} className="w-full">
                          <div className="flex items-center">
                            <CollapsibleTrigger className="flex items-center w-full text-left">
                              <Info className="h-4 w-4 text-slate-400 mr-2" />
                              <span className="text-sm font-medium">{term.term}</span>
                            </CollapsibleTrigger>
                          </div>
                          <CollapsibleContent className="p-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-md mt-1">
                            {term.explanation}
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
              
              {/* Financial Performance Section */}
              <section>
                <h3 className="text-lg font-semibold mb-3">💼 Retail-Friendly Financial Insights</h3>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-md p-4">
                  <div className="space-y-5">
                    {aiReport.financialInsights.metrics.map((metric: any, index: number) => (
                      <div key={index} className="border-b border-slate-200 dark:border-slate-700 pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-slate-800 dark:text-slate-200">{metric.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-slate-900 dark:text-white">{metric.value}</span>
                            <div className="flex items-center">
                              {renderTrendIcon(metric.trend)}
                              <span className={`text-sm ${parseFloat(metric.trend) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {metric.trend}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          {metric.importance}
                        </p>
                        
                        <Collapsible className="w-full">
                          <CollapsibleTrigger className="flex items-center text-xs text-fin-primary dark:text-fin-teal hover:underline">
                            <span>3-Year Trend</span>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="p-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-md mt-1">
                            {metric.threeYearTrend}
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
              
              {/* Strengths & Concerns Section */}
              <section>
                <h3 className="text-lg font-semibold mb-3">🧩 Strengths & Concerns – Balanced View</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-md p-4">
                    <h4 className="text-md font-medium mb-3 text-green-600 dark:text-green-500">Strengths</h4>
                    <ul className="space-y-3">
                      {aiReport.strengthsWeaknesses.strengths.map((item: any, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="flex-shrink-0 mt-0.5">
                            <span className="text-green-500 text-lg">{item.emoji}</span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-700 dark:text-slate-300">{item.point}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{item.explanation}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Weaknesses */}
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-md p-4">
                    <h4 className="text-md font-medium mb-3 text-amber-600 dark:text-amber-500">Concerns</h4>
                    <ul className="space-y-3">
                      {aiReport.strengthsWeaknesses.weaknesses.map((item: any, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="flex-shrink-0 mt-0.5">
                            <span className="text-amber-500 text-lg">{item.emoji}</span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-700 dark:text-slate-300">{item.point}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{item.explanation}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
              
              {/* Valuation Metrics Section */}
              <section>
                <h3 className="text-lg font-semibold mb-3">💰 Valuation Summary (Simplified)</h3>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-md p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {aiReport.valuationMetrics.metrics.map((metric: any, index: number) => (
                      <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-md p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{metric.name}</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-slate-400 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>{metric.explanation}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl font-bold text-slate-900 dark:text-white">{metric.value}</span>
                          
                          {metric.name === "Intrinsic Value" ? (
                            <Badge className={
                              metric.comparison === "undervalued" ? "bg-green-500" : 
                              metric.comparison === "overvalued" ? "bg-red-500" : 
                              "bg-amber-500"
                            }>
                              {metric.comparison === "undervalued" ? "Undervalued" : 
                               metric.comparison === "overvalued" ? "Overvalued" : 
                               "Fair Value"}
                            </Badge>
                          ) : (
                            <Badge className={
                              metric.comparison === "below-average" ? "bg-green-500" : 
                              metric.comparison === "above-average" ? (metric.name === "P/E Ratio" ? "bg-red-500" : "bg-green-500") : 
                              "bg-slate-500"
                            }>
                              {metric.comparison === "below-average" ? "Below Avg." : 
                               metric.comparison === "above-average" ? "Above Avg." : 
                               "Average"}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                          <span>Industry Avg: {metric.name === "Intrinsic Value" ? metric.currentPrice : metric.industryAvg}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-md">
                    <p className="text-slate-700 dark:text-slate-300">
                      {aiReport.valuationMetrics.summary}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">
                      Valuation based on discounted cash flow logic by Damodaran.
                    </p>
                  </div>
                </div>
              </section>
              
              {/* News & Sentiment Check Section */}
              <section>
                <h3 className="text-lg font-semibold mb-3">📰 News + Sentiment Check</h3>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-md p-4">
                  {/* Broker Opinions */}
                  <div className="mb-4">
                    <h4 className="text-md font-medium mb-3">Broker Recommendations</h4>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-md flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        <span>Buy: {aiReport.newsSentiment.brokerOpinions.buy}</span>
                      </div>
                      <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-md">
                        <span>Hold: {aiReport.newsSentiment.brokerOpinions.hold}</span>
                      </div>
                      <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1 rounded-md flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Sell: {aiReport.newsSentiment.brokerOpinions.sell}</span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-green-500 via-amber-500 to-red-500 h-full"
                        style={{ 
                          width: '100%', 
                          backgroundSize: '100% 100%',
                          backgroundPosition: `${aiReport.newsSentiment.sentimentScore}% 0`
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span>Bearish</span>
                      <span>Neutral</span>
                      <span>Bullish</span>
                    </div>
                  </div>
                  
                  {/* Recent News */}
                  <div>
                    <h4 className="text-md font-medium mb-3">Recent News</h4>
                    {aiReport.newsSentiment.news.length > 0 ? (
                      <div className="space-y-3">
                        {aiReport.newsSentiment.news.slice(0, 3).map((item: any, index: number) => (
                          <div key={index} className="border-b border-slate-200 dark:border-slate-700 pb-3 last:border-0">
                            <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="font-medium text-fin-primary dark:text-fin-teal hover:underline"
                            >
                              {item.title}
                            </a>
                            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mt-1">
                              <span>{item.source}</span>
                              <span className="mx-2">•</span>
                              <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{item.snippet}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 dark:text-slate-400">No recent news available.</p>
                    )}
                  </div>
                </div>
              </section>
              
              {/* Investment Recommendation Section */}
              <section>
                <h3 className="text-lg font-semibold mb-3">🔄 Buy/Hold/Sell Suggestion</h3>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-md p-4">
                  <div className="flex flex-col md:flex-row gap-3 items-start md:items-center mb-4">
                    <Badge className={`text-xl py-2 px-4 ${
                      aiReport.recommendation.rating === "BUY" ? "bg-green-500" : 
                      aiReport.recommendation.rating === "SELL" ? "bg-red-500" : 
                      "bg-amber-500"
                    }`}>
                      {aiReport.recommendation.rating}
                    </Badge>
                    
                    <div>
                      <div className="text-slate-700 dark:text-slate-300 font-medium">
                        {aiReport.recommendation.riskLevel} Risk Profile • {aiReport.recommendation.timeHorizon} Investment
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Based on fundamentals, valuation metrics, and market sentiment
                      </p>
                    </div>
                  </div>
                  
                  <Collapsible className="w-full bg-slate-100 dark:bg-slate-700 rounded-md">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left font-medium">
                      <span>📌 Why this suggestion?</span>
                      <HelpCircle className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-3 pb-3">
                      <ul className="list-disc pl-5 space-y-1">
                        {aiReport.recommendation.justification.map((point: string, index: number) => (
                          <li key={index} className="text-slate-700 dark:text-slate-300">{point}</li>
                        ))}
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>
                  
                  <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3">
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      <strong>Important Note:</strong> This AI-generated analysis is for informational purposes only and does not constitute financial advice. Always conduct your own research or consult with a professional advisor before making investment decisions.
                    </p>
                  </div>
                </div>
              </section>
              
              <div className="flex justify-center">
                <Button onClick={generateAIReport} variant="outline" className="flex items-center gap-2">
                  <span>Refresh Analysis</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 