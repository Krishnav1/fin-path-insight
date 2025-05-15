import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Calculator, 
  Search, 
  TrendingUp, 
  BarChart4, 
  LineChart, 
  DollarSign, 
  PieChart, 
  ArrowRightCircle, 
  Percent
} from "lucide-react";

export default function Tools() {
  const toolsCategories = [
    {
      title: "Stock Screener",
      description: "Find stocks based on custom criteria",
      icon: <Search className="h-5 w-5" />,
      path: "/tools/screener"
    },
    {
      title: "Portfolio Analyzer",
      description: "Get insights on your investment portfolio",
      icon: <PieChart className="h-5 w-5" />,
      path: "/tools/portfolio"
    },
    {
      title: "Technical Analysis",
      description: "Chart patterns and technical indicators",
      icon: <LineChart className="h-5 w-5" />,
      path: "/tools/technical"
    },
    {
      title: "Fundamental Analysis",
      description: "Analyze company financials and ratios",
      icon: <BarChart4 className="h-5 w-5" />,
      path: "/tools/fundamental"
    },
    {
      title: "Financial Calculators",
      description: "Calculate financial scenarios",
      icon: <Calculator className="h-5 w-5" />,
      path: "/tools/calculators"
    },
    {
      title: "Market Movers",
      description: "See top gainers and losers in the market",
      icon: <TrendingUp className="h-5 w-5" />,
      path: "/tools/movers"
    }
  ];

  const calculatorTypes = [
    {
      title: "Compound Interest Calculator",
      description: "See how your investments grow over time",
      isPopular: true,
      path: "/tools/calculators/compound-interest"
    },
    {
      title: "Retirement Calculator",
      description: "Plan your retirement savings and income",
      isPopular: true,
      path: "/tools/calculators/retirement"
    },
    {
      title: "Mortgage Calculator",
      description: "Calculate mortgage payments and amortization",
      isPopular: false,
      path: "/tools/calculators/mortgage"
    },
    {
      title: "Budget Calculator",
      description: "Create a personal or household budget",
      isPopular: false,
      path: "/tools/calculators/budget"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Financial Tools & Calculators</h1>
          <p className="text-slate-600 mb-8 dark:text-slate-400">Access powerful tools to analyze investments, plan your finances, and make informed decisions.</p>
          
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-6">All Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {toolsCategories.map((tool, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-fin-primary/10 rounded-full text-fin-primary">
                        {tool.icon}
                      </div>
                      <CardTitle className="text-xl">{tool.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">{tool.description}</CardDescription>
                    <Link to={tool.path}>
                      <Button className="w-full">Use Tool</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
          
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-6">Popular Calculators</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {calculatorTypes.filter(calc => calc.isPopular).map((calculator, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow overflow-hidden">
                  <div className="p-6 pb-0">
                    <CardTitle className="mb-2">{calculator.title}</CardTitle>
                    <CardDescription>{calculator.description}</CardDescription>
                  </div>
                  <CardContent className="p-6">
                    <Link to={calculator.path}>
                      <Button className="w-full">Open Calculator</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
          
          <section>
            <Card className="overflow-hidden">
              <div className="md:grid md:grid-cols-2">
                <div className="p-6 md:p-8">
                  <CardTitle className="text-2xl mb-3">Compound Interest Calculator</CardTitle>
                  <CardDescription className="mb-6">See how your investments can grow over time with the power of compound interest.</CardDescription>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="initial-investment">Initial Investment</Label>
                      <div className="relative mt-1">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input 
                          id="initial-investment" 
                          type="number" 
                          placeholder="1000" 
                          className="pl-8" 
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="monthly-contribution">Monthly Contribution</Label>
                      <div className="relative mt-1">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input 
                          id="monthly-contribution" 
                          type="number" 
                          placeholder="100" 
                          className="pl-8" 
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="interest-rate">Annual Interest Rate</Label>
                      <div className="relative mt-1">
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input 
                          id="interest-rate" 
                          type="number" 
                          placeholder="7" 
                          className="pl-8" 
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="time-period">Time Period (years)</Label>
                      <Input 
                        id="time-period" 
                        type="number" 
                        placeholder="10" 
                      />
                    </div>
                    
                    <Button className="w-full">Calculate</Button>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-6 md:p-8 border-t md:border-t-0 md:border-l border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-2">Results</h3>
                    <p className="text-slate-500 dark:text-slate-400">Enter your investment details and click calculate to see results.</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 dark:bg-slate-900 dark:border-slate-700">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Future Value</p>
                        <p className="text-2xl font-bold">$0.00</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Total Contributions</p>
                        <p className="text-2xl font-bold">$0.00</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Interest Earned</p>
                        <p className="text-2xl font-bold">$0.00</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Final Balance</p>
                        <p className="text-2xl font-bold">$0.00</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <div className="w-full h-40 flex items-center justify-center bg-white rounded-lg border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                      <LineChart className="h-32 w-32 text-slate-300" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </section>
          
          <div className="mt-10 p-6 bg-fin-primary/10 rounded-lg border border-fin-primary/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Need Advanced Financial Tools?</h2>
                <p className="text-slate-600 dark:text-slate-400">Upgrade to premium for access to professional-grade financial analysis tools.</p>
              </div>
              <Button className="flex items-center gap-1">
                Explore Premium <ArrowRightCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 