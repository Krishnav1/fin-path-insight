import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { PieChart, LineChart, BarChart, DollarSign, Wallet, ArrowUpRight, TrendingUp, PiggyBank, CreditCard, ArrowDownRight } from "lucide-react";

export default function FinWell() {
  const { user } = useAuth();
  
  // Mock financial data
  const financialSummary = {
    monthlyIncome: 5000,
    monthlyExpenses: 3200,
    savingsRate: 36, // percentage
    totalSavings: 42500,
    totalDebt: 28000,
    netWorth: 14500
  };
  
  const budgetCategories = [
    { name: "Housing", percentage: 30, spent: 1500, budget: 1500, color: "bg-blue-400" },
    { name: "Transportation", percentage: 10, spent: 350, budget: 500, color: "bg-green-400" },
    { name: "Food", percentage: 15, spent: 700, budget: 750, color: "bg-yellow-400" },
    { name: "Utilities", percentage: 8, spent: 320, budget: 400, color: "bg-purple-400" },
    { name: "Entertainment", percentage: 7, spent: 400, budget: 350, color: "bg-red-400" },
    { name: "Savings", percentage: 20, spent: 1000, budget: 1000, color: "bg-emerald-400" },
    { name: "Other", percentage: 10, spent: 450, budget: 500, color: "bg-slate-400" }
  ];
  
  const savingsGoals = [
    { id: 1, name: "Emergency Fund", target: 15000, current: 10000, percentage: 67 },
    { id: 2, name: "Vacation", target: 3000, current: 1500, percentage: 50 },
    { id: 3, name: "Down Payment", target: 50000, current: 12000, percentage: 24 }
  ];
  
  const recentTransactions = [
    { id: 1, description: "Grocery Store", amount: -78.35, category: "Food", date: "Today" },
    { id: 2, description: "Salary Deposit", amount: 2500, category: "Income", date: "Yesterday" },
    { id: 3, description: "Electric Bill", amount: -95.40, category: "Utilities", date: "2 days ago" },
    { id: 4, description: "Restaurant", amount: -42.50, category: "Food", date: "3 days ago" },
    { id: 5, description: "Gas Station", amount: -38.00, category: "Transportation", date: "5 days ago" }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Financial Wellness Dashboard</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Track your finances, set goals, and improve your financial health.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Monthly Budget</CardTitle>
                  <div className="p-2 bg-slate-100 rounded-full dark:bg-slate-800">
                    <Wallet className="h-5 w-5 text-fin-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">${financialSummary.monthlyExpenses}</span>
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <ArrowDownRight className="h-4 w-4" />
                    5% under budget
                  </span>
                </div>
                <p className="text-sm text-slate-500">of ${financialSummary.monthlyIncome} monthly income</p>
                <Progress 
                  value={(financialSummary.monthlyExpenses / financialSummary.monthlyIncome) * 100} 
                  className="h-2 mt-4"
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Savings Rate</CardTitle>
                  <div className="p-2 bg-slate-100 rounded-full dark:bg-slate-800">
                    <PiggyBank className="h-5 w-5 text-fin-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">{financialSummary.savingsRate}%</span>
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <ArrowUpRight className="h-4 w-4" />
                    3% increase
                  </span>
                </div>
                <p className="text-sm text-slate-500">of total monthly income</p>
                <Progress value={financialSummary.savingsRate} className="h-2 mt-4" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Net Worth</CardTitle>
                  <div className="p-2 bg-slate-100 rounded-full dark:bg-slate-800">
                    <TrendingUp className="h-5 w-5 text-fin-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">${financialSummary.netWorth}</span>
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <ArrowUpRight className="h-4 w-4" />
                    12% this year
                  </span>
                </div>
                <p className="text-sm text-slate-500">Assets minus Liabilities</p>
                <div className="flex items-center gap-2 mt-4">
                  <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden dark:bg-slate-800">
                    <div 
                      className="bg-fin-primary h-full" 
                      style={{ width: `${(financialSummary.totalSavings / (financialSummary.totalSavings + financialSummary.totalDebt)) * 100}%` }} 
                    ></div>
                  </div>
                  <span className="text-xs text-slate-500">
                    {Math.round((financialSummary.totalSavings / (financialSummary.totalSavings + financialSummary.totalDebt)) * 100)}% assets
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <Tabs defaultValue="budget">
                <TabsList className="w-full grid grid-cols-3 mb-4">
                  <TabsTrigger value="budget">Budget</TabsTrigger>
                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                  <TabsTrigger value="networth">Net Worth</TabsTrigger>
                </TabsList>
                
                <TabsContent value="budget">
                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Budget Breakdown</CardTitle>
                      <CardDescription>Your spending by category this month</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center mb-6">
                        <PieChart className="h-48 w-48 text-slate-300" />
                      </div>
                      <div className="space-y-4">
                        {budgetCategories.map(category => (
                          <div key={category.name}>
                            <div className="flex justify-between items-center mb-1">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                                <span>{category.name}</span>
                              </div>
                              <span>${category.spent} / ${category.budget}</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                              <div 
                                className={`h-full ${category.spent > category.budget ? 'bg-red-500' : category.color}`} 
                                style={{ width: `${Math.min(100, (category.spent / category.budget) * 100)}%` }} 
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">Adjust Budget</Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="transactions">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Transactions</CardTitle>
                      <CardDescription>Your latest financial activities</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentTransactions.map(transaction => (
                          <div key={transaction.id} className="flex justify-between items-center p-3 border border-slate-200 rounded-lg dark:border-slate-700">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${
                                transaction.amount > 0 
                                  ? 'bg-green-100 text-green-600' 
                                  : 'bg-red-100 text-red-600'
                              }`}>
                                {transaction.amount > 0 ? <DollarSign className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                              </div>
                              <div>
                                <h4 className="font-medium">{transaction.description}</h4>
                                <p className="text-xs text-slate-500">{transaction.category} • {transaction.date}</p>
                              </div>
                            </div>
                            <span className={`font-medium ${
                              transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">View All Transactions</Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="networth">
                  <Card>
                    <CardHeader>
                      <CardTitle>Net Worth Trend</CardTitle>
                      <CardDescription>Track your financial progress over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center mb-6">
                        <LineChart className="h-48 w-full text-slate-300" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border border-slate-200 rounded-lg p-3 dark:border-slate-700">
                          <h4 className="text-sm text-slate-500 mb-1">Total Assets</h4>
                          <p className="text-2xl font-bold">${financialSummary.totalSavings}</p>
                        </div>
                        <div className="border border-slate-200 rounded-lg p-3 dark:border-slate-700">
                          <h4 className="text-sm text-slate-500 mb-1">Total Debt</h4>
                          <p className="text-2xl font-bold">${financialSummary.totalDebt}</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">Add/Update Assets</Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
            
            <div>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Savings Goals</CardTitle>
                  <CardDescription>Track your progress towards financial goals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    {savingsGoals.map(goal => (
                      <div key={goal.id} className="border border-slate-200 rounded-lg p-3 dark:border-slate-700">
                        <h3 className="font-medium">{goal.name}</h3>
                        <div className="flex justify-between items-center text-sm my-1">
                          <span>${goal.current}</span>
                          <span className="text-slate-500">of ${goal.target}</span>
                        </div>
                        <Progress value={goal.percentage} className="h-2 mb-1" />
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-slate-500">{goal.percentage}% complete</span>
                          <Button variant="ghost" size="sm" className="h-auto py-0 px-2 text-xs">
                            Add Funds
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Create New Goal</Button>
                </CardFooter>
              </Card>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Financial Health Score</CardTitle>
              <CardDescription>Your overall financial wellness assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="w-36 h-36 rounded-full border-8 border-fin-primary flex items-center justify-center mb-4">
                  <span className="text-4xl font-bold">78</span>
                </div>
                <p className="text-lg font-medium">Good</p>
                <p className="text-sm text-slate-500">Your financial health is on the right track!</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-slate-200 rounded-lg p-3 dark:border-slate-700">
                  <h4 className="text-sm font-medium mb-1">Spending Habits</h4>
                  <div className="flex items-center gap-2">
                    <Progress value={70} className="h-2 flex-1" />
                    <span className="text-sm">70/100</span>
                  </div>
                </div>
                <div className="border border-slate-200 rounded-lg p-3 dark:border-slate-700">
                  <h4 className="text-sm font-medium mb-1">Savings Rate</h4>
                  <div className="flex items-center gap-2">
                    <Progress value={85} className="h-2 flex-1" />
                    <span className="text-sm">85/100</span>
                  </div>
                </div>
                <div className="border border-slate-200 rounded-lg p-3 dark:border-slate-700">
                  <h4 className="text-sm font-medium mb-1">Debt Management</h4>
                  <div className="flex items-center gap-2">
                    <Progress value={65} className="h-2 flex-1" />
                    <span className="text-sm">65/100</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Get Personalized Financial Advice</Button>
            </CardFooter>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 