import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyData } from "@/pages/CompanyAnalysis";
import { AlertTriangle, TrendingUp, MinusCircle, TrendingDown, ArrowRight, Check, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CompanyRecommendationProps {
  companyData: CompanyData;
}

export default function CompanyRecommendation({ companyData }: CompanyRecommendationProps) {
  // Calculate total ratings for percentage
  const totalRatings = companyData.analystRatings.buy + companyData.analystRatings.hold + companyData.analystRatings.sell;
  const buyPercentage = Math.round((companyData.analystRatings.buy / totalRatings) * 100);
  const holdPercentage = Math.round((companyData.analystRatings.hold / totalRatings) * 100);
  const sellPercentage = Math.round((companyData.analystRatings.sell / totalRatings) * 100);
  
  // For custom analysis
  const [customPrompt, setCustomPrompt] = useState("");
  const [customAnalysis, setCustomAnalysis] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Calculate fundamental score (0-100)
  const calculateFundamentalScore = () => {
    let score = 0;
    
    // P/E score (lower is better, but not too low)
    if (companyData.peRatio > 0 && companyData.peRatio < 12) score += 20;
    else if (companyData.peRatio >= 12 && companyData.peRatio < 20) score += 15;
    else if (companyData.peRatio >= 20 && companyData.peRatio < 30) score += 10;
    else if (companyData.peRatio >= 30) score += 5;
    
    // Revenue growth score
    if (companyData.revenueGrowth > 20) score += 20;
    else if (companyData.revenueGrowth > 10) score += 15;
    else if (companyData.revenueGrowth > 5) score += 10;
    else if (companyData.revenueGrowth > 0) score += 5;
    
    // Profit margin score
    if (companyData.profitMargin > 20) score += 20;
    else if (companyData.profitMargin > 15) score += 15;
    else if (companyData.profitMargin > 10) score += 10;
    else if (companyData.profitMargin > 5) score += 5;
    
    // ROE score
    if ((companyData.roe || 0) > 20) score += 20;
    else if ((companyData.roe || 0) > 15) score += 15;
    else if ((companyData.roe || 0) > 10) score += 10;
    else if ((companyData.roe || 0) > 5) score += 5;
    
    // Debt to Equity score (lower is better)
    if ((companyData.debtToEquity || 0) < 0.2) score += 20;
    else if ((companyData.debtToEquity || 0) < 0.5) score += 15;
    else if ((companyData.debtToEquity || 0) < 1) score += 10;
    else if ((companyData.debtToEquity || 0) < 2) score += 5;
    
    return Math.min(score, 100);
  };
  
  const fundamentalScore = calculateFundamentalScore();
  
  // Get recommendation based on score
  const getRecommendation = () => {
    if (fundamentalScore >= 70) return "Buy";
    else if (fundamentalScore >= 40) return "Hold";
    else return "Sell";
  };
  
  const recommendation = getRecommendation();
  
  const handleGenerateAnalysis = () => {
    if (!customPrompt.trim()) return;
    
    setIsGenerating(true);
    
    // Mock API call - in a real app, this would call an AI service
    setTimeout(() => {
      // Generate analysis based on prompt
      const generatedAnalysis = `Based on ${companyData.name}'s financial metrics and ${customPrompt}, the company shows ${
        fundamentalScore > 70 ? "strong potential for long-term investment" :
        fundamentalScore > 50 ? "reasonable value but with some caution advised" :
        "significant challenges that investors should carefully consider"
      }. ${companyData.name}'s ${companyData.peRatio.toFixed(2)} P/E ratio is ${
        companyData.peRatio < 15 ? "attractively valued" :
        companyData.peRatio < 25 ? "reasonably valued" :
        "on the higher end of valuations"
      }, while its ${companyData.revenueGrowth.toFixed(1)}% revenue growth ${
        companyData.revenueGrowth > 10 ? "demonstrates strong business momentum" :
        companyData.revenueGrowth > 5 ? "shows steady performance" :
        "suggests challenges in expanding its business"
      }. When considering your specific interest in ${customPrompt}, investors should weigh these factors carefully before making any decisions.`;
      
      setCustomAnalysis(generatedAnalysis);
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 dark:bg-amber-950/20 dark:border-amber-900/30">
        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
        <div>
          <h3 className="font-medium text-amber-800 dark:text-amber-400">Educational Analysis Only</h3>
          <p className="text-sm text-amber-700 dark:text-amber-500">
            The following is a simplified analysis for educational purposes and NOT financial advice. 
            Always do your own research or consult a financial advisor before making investment decisions.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Fin Path Insight Analysis</CardTitle>
            <CardDescription>Key observations about {companyData.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h3>Overall Summary</h3>
              <p>
                {companyData.name} operates in the {companyData.industry} industry and has established itself as a 
                {companyData.marketCap > 1e12 ? " market leader" : companyData.marketCap > 1e11 ? " major player" : " significant competitor"} 
                with a market capitalization of {companyData.marketCap > 1e12 ? "over $1 trillion" : companyData.marketCap > 1e9 ? `$${(companyData.marketCap / 1e9).toFixed(2)} billion` : `$${(companyData.marketCap / 1e6).toFixed(2)} million`}.
              </p>
              <p>
                The company's P/E ratio of {companyData.peRatio?.toFixed(2) || 'N/A'} is 
                {(companyData.peRatio || 0) > 30 ? " relatively high, suggesting investors have high growth expectations" : 
                 (companyData.peRatio || 0) > 15 ? " in line with the broader market, indicating balanced growth expectations" : 
                 (companyData.peRatio || 0) > 0 ? " relatively low, which may indicate either undervaluation or market concerns about future growth" :
                 " not available for analysis"}.
                With a revenue growth rate of {(companyData.revenueGrowth || 0).toFixed(1)}%, the company is 
                {(companyData.revenueGrowth || 0) > 15 ? " showing strong top-line expansion" : 
                 (companyData.revenueGrowth || 0) > 5 ? " maintaining solid growth" : 
                 (companyData.revenueGrowth || 0) > 0 ? " growing at a modest pace" : 
                 " currently facing growth challenges"}.
              </p>
              <p>
                {companyData.name}'s profit margin of {(companyData.profitMargin || 0).toFixed(1)}% is 
                {(companyData.profitMargin || 0) > 20 ? " excellent, demonstrating strong operational efficiency" : 
                 (companyData.profitMargin || 0) > 10 ? " healthy, showing good cost management" : 
                 (companyData.profitMargin || 0) > 5 ? " reasonable but with room for improvement" : 
                 " relatively low, potentially indicating pricing pressure or high costs"}.
              </p>
              
              <h3>What Retail Investors Should Know</h3>
              <ul>
                <li>
                  <strong>Business Understanding:</strong> {companyData.name} makes money primarily through 
                  {companyData.businessModel.substring(0, companyData.businessModel.indexOf('.') + 1) || companyData.businessModel}
                </li>
                <li>
                  <strong>Competitive Position:</strong> With an estimated {companyData.marketShare}% market share, 
                  the company {
                    companyData.marketShare > 30 ? "dominates its market segment" : 
                    companyData.marketShare > 15 ? "holds a strong competitive position" : 
                    companyData.marketShare > 5 ? "is a notable player in a competitive space" : 
                    "faces significant competition from larger players"
                  }.
                </li>
                <li>
                  <strong>Financial Health:</strong> The company's revenue and profit trends over recent years show 
                  {
                    companyData.yearlyRevenue[companyData.yearlyRevenue.length - 1]?.value > companyData.yearlyRevenue[companyData.yearlyRevenue.length - 2]?.value && 
                    companyData.yearlyProfit[companyData.yearlyProfit.length - 1]?.value > companyData.yearlyProfit[companyData.yearlyProfit.length - 2]?.value
                      ? " consistent growth in both top and bottom lines" 
                      : companyData.yearlyRevenue[companyData.yearlyRevenue.length - 1]?.value > companyData.yearlyRevenue[companyData.yearlyRevenue.length - 2]?.value
                        ? " revenue growth but challenges in maintaining profit growth" 
                        : companyData.yearlyProfit[companyData.yearlyProfit.length - 1]?.value > companyData.yearlyProfit[companyData.yearlyProfit.length - 2]?.value
                          ? " improving profitability despite revenue challenges" 
                          : " current challenges in both revenue and profit growth"
                  }.
                </li>
                <li>
                  <strong>Key Risks:</strong> Investors should be aware of {companyData.weaknesses[0]?.toLowerCase() || 'potential industry challenges'}.
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Fundamental Score</CardTitle>
            <CardDescription>Based on key financial metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              {/* Circular score indicator */}
              <div className="relative w-32 h-32">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle cx="50" cy="50" r="45" fill="none" strokeWidth="8" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                  
                  {/* Score circle */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="none" 
                    strokeWidth="8" 
                    stroke={
                      fundamentalScore >= 70 ? "#22c55e" : 
                      fundamentalScore >= 40 ? "#eab308" : 
                      "#ef4444"
                    }
                    strokeDasharray={`${fundamentalScore * 2.83} 283`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    className={
                      fundamentalScore >= 70 ? "stroke-green-500" : 
                      fundamentalScore >= 40 ? "stroke-amber-500" : 
                      "stroke-red-500"
                    }
                  />
                  
                  {/* Score text */}
                  <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" 
                    fontSize="24" fontWeight="bold" fill="currentColor" 
                    className="text-slate-800 dark:text-white">
                    {fundamentalScore}
                  </text>
                  <text x="50" y="65" textAnchor="middle" dominantBaseline="middle" 
                    fontSize="10" fill="currentColor" 
                    className="text-slate-600 dark:text-slate-300">
                    out of 100
                  </text>
                </svg>
              </div>
              
              {/* Recommendation */}
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-1">Recommendation:</h3>
                <div className={`text-xl font-bold mb-4 ${
                  recommendation === "Buy" ? "text-green-600 dark:text-green-500" :
                  recommendation === "Hold" ? "text-amber-600 dark:text-amber-500" :
                  "text-red-600 dark:text-red-500"
                }`}>
                  {recommendation}
                </div>
                <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                  <span>Weak</span>
                  <span>Strong</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden dark:bg-slate-700">
                  <div 
                    className={`h-full ${
                      fundamentalScore >= 70 ? "bg-green-500" :
                      fundamentalScore >= 40 ? "bg-amber-500" :
                      "bg-red-500"
                    }`}
                    style={{ width: `${fundamentalScore}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Key Positives</CardTitle>
            <CardDescription>Strengths & opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {companyData.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-800 dark:text-slate-200">{strength}</span>
                </li>
              ))}
              {fundamentalScore >= 50 && (
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-800 dark:text-slate-200">
                    {companyData.name} has a strong fundamental score of {fundamentalScore}, 
                    indicating solid financial performance.
                  </span>
                </li>
              )}
              {companyData.yearlyRevenue.length > 1 && 
               companyData.yearlyRevenue[companyData.yearlyRevenue.length - 1].value > 
               companyData.yearlyRevenue[companyData.yearlyRevenue.length - 2].value && (
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-800 dark:text-slate-200">
                    Consistent revenue growth year-over-year, demonstrating market demand.
                  </span>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Key Risks</CardTitle>
            <CardDescription>Challenges & concerns</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {companyData.weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start gap-2">
                  <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-800 dark:text-slate-200">{weakness}</span>
                </li>
              ))}
              {(companyData.debtToEquity || 0) > 1 && (
                <li className="flex items-start gap-2">
                  <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-800 dark:text-slate-200">
                    High debt-to-equity ratio ({companyData.debtToEquity?.toFixed(2) || 'N/A'}) could limit financial flexibility.
                  </span>
                </li>
              )}
              {(companyData.revenueGrowth || 0) < 0 && (
                <li className="flex items-start gap-2">
                  <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-800 dark:text-slate-200">
                    Negative revenue growth indicates challenging market conditions.
                  </span>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Analyst Consensus</CardTitle>
          <CardDescription>Based on {totalRatings} analyst ratings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-green-600 dark:text-green-500">Buy</span>
                <span>{companyData.analystRatings.buy} analysts ({buyPercentage}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden dark:bg-slate-700">
                <div 
                  className="h-full bg-green-500 dark:bg-green-600" 
                  style={{ width: `${buyPercentage}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-amber-600 dark:text-amber-500">Hold</span>
                <span>{companyData.analystRatings.hold} analysts ({holdPercentage}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden dark:bg-slate-700">
                <div 
                  className="h-full bg-amber-500 dark:bg-amber-600" 
                  style={{ width: `${holdPercentage}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-red-600 dark:text-red-500">Sell</span>
                <span>{companyData.analystRatings.sell} analysts ({sellPercentage}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden dark:bg-slate-700">
                <div 
                  className="h-full bg-red-500 dark:bg-red-600" 
                  style={{ width: `${sellPercentage}%` }}
                ></div>
              </div>
            </div>
            
            <div className="pt-4 text-sm text-slate-500 dark:text-slate-400">
              The majority of analysts rate {companyData.name} as a{" "}
              {buyPercentage > 50 ? "Buy" : holdPercentage > 50 ? "Hold" : "Sell"} currently,
              which {buyPercentage > 50 && recommendation === "Buy" || 
                  holdPercentage > 50 && recommendation === "Hold" || 
                  sellPercentage > 50 && recommendation === "Sell" ? 
                "aligns with" : "differs from"} our fundamental analysis ({recommendation}).
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Custom analysis section */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Investment Analysis</CardTitle>
          <CardDescription>Ask a specific investment question about {companyData.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder={`Example: What are the long-term growth prospects for ${companyData.name}?`}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="min-h-[80px]"
            />
            <Button 
              onClick={handleGenerateAnalysis} 
              disabled={isGenerating || !customPrompt.trim()}
              className="gap-2"
            >
              {isGenerating ? "Generating..." : "Generate Analysis"}
              <ArrowRight className="h-4 w-4" />
            </Button>
            
            {customAnalysis && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                <h3 className="text-md font-medium mb-2">Analysis</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  {customAnalysis}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
} 