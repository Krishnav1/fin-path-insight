import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { PieChart, LineChart, BarChart, DollarSign, Wallet, ArrowUpRight, TrendingUp, PiggyBank, CreditCard, ArrowDownRight, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Import the FinWell service
import * as FinwellService from "@/services/finwell-service";
import type { Budget, SavingGoal, NetWorthAsset, NetWorthLiability, BudgetTransaction } from "@/services/finwell-service";

export default function FinWell() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { section } = useParams<{ section?: string }>();
  const navigate = useNavigate();
  
  // State for financial data
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<BudgetTransaction[]>([]);
  const [savingGoals, setSavingGoals] = useState<SavingGoal[]>([]);
  const [assets, setAssets] = useState<NetWorthAsset[]>([]);
  const [liabilities, setLiabilities] = useState<NetWorthLiability[]>([]);
  const [netWorthHistory, setNetWorthHistory] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState<number>(78);
  
  // State for financial summary
  const [financialSummary, setFinancialSummary] = useState({
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savingsRate: 0,
    totalSavings: 0,
    totalDebt: 0,
    netWorth: 0
  });

  // State for dialogs
  const [newBudgetOpen, setNewBudgetOpen] = useState(false);
  const [newGoalOpen, setNewGoalOpen] = useState(false);
  const [newAssetOpen, setNewAssetOpen] = useState(false);
  const [newLiabilityOpen, setNewLiabilityOpen] = useState(false);
  const [newTransactionOpen, setNewTransactionOpen] = useState(false);
  
  // Form states
  const [newBudget, setNewBudget] = useState<Partial<Budget>>({
    name: '',
    amount: 0,
    category: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
  });
  
  const [newGoal, setNewGoal] = useState<Partial<SavingGoal>>({
    name: '',
    target_amount: 0,
    current_amount: 0,
    target_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    status: 'active',
    priority: 'medium'
  });
  
  const [newAsset, setNewAsset] = useState<Partial<NetWorthAsset>>({
    name: '',
    category: '',
    value: 0,
    asset_type: 'cash',
    is_liquid: true
  });
  
  const [newLiability, setNewLiability] = useState<Partial<NetWorthLiability>>({
    name: '',
    category: '',
    amount: 0,
    liability_type: 'credit_card',
    interest_rate: 0
  });
  
  const [newTransaction, setNewTransaction] = useState<Partial<BudgetTransaction>>({
    budget_id: '',
    amount: 0,
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
    category: ''
  });
  
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>('');
  
  // Budget categories with colors
  const categoryColors: Record<string, string> = {
    "Housing": "bg-blue-400",
    "Transportation": "bg-green-400",
    "Food": "bg-yellow-400",
    "Utilities": "bg-purple-400",
    "Entertainment": "bg-red-400",
    "Savings": "bg-emerald-400",
    "Education": "bg-indigo-400",
    "Healthcare": "bg-pink-400",
    "Shopping": "bg-orange-400",
    "Other": "bg-slate-400"
  };
  
  // Fetch user's financial data
  useEffect(() => {
    if (user) {
      fetchFinancialData();
    }
  }, [user]);
  
  const fetchFinancialData = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Fetch budgets
      const { data: budgetsData, error: budgetsError } = await FinwellService.getBudgets(user.id);
      if (budgetsError) throw budgetsError;
      if (budgetsData) setBudgets(budgetsData);
      
      // Fetch saving goals
      const { data: goalsData, error: goalsError } = await FinwellService.getSavingGoals(user.id);
      if (goalsError) throw goalsError;
      if (goalsData) {
        // Calculate percentage for each goal
        const goalsWithPercentage = goalsData.map(goal => ({
          ...goal,
          percentage: goal.target_amount > 0 ? Math.round((goal.current_amount / goal.target_amount) * 100) : 0
        }));
        setSavingGoals(goalsWithPercentage);
      }
      
      // Fetch assets and liabilities
      const { data: assetsData, error: assetsError } = await FinwellService.getNetWorthAssets(user.id);
      if (assetsError) throw assetsError;
      if (assetsData) setAssets(assetsData);
      
      const { data: liabilitiesData, error: liabilitiesError } = await FinwellService.getNetWorthLiabilities(user.id);
      if (liabilitiesError) throw liabilitiesError;
      if (liabilitiesData) setLiabilities(liabilitiesData);
      
      // Fetch net worth history
      const { data: historyData, error: historyError } = await FinwellService.getNetWorthHistory(user.id);
      if (historyError) throw historyError;
      if (historyData) setNetWorthHistory(historyData);
      
      // Calculate financial health score
      const score = await FinwellService.calculateFinancialHealthScore(user.id);
      setHealthScore(score);
      
      // Calculate financial summary
      if (budgetsData && assetsData && liabilitiesData) {
        // Calculate monthly income (sum of all income budgets)
        const incomeTotal = budgetsData
          .filter(budget => budget.category.toLowerCase() === 'income')
          .reduce((sum, budget) => sum + budget.amount, 0);
        
        // Calculate monthly expenses (sum of all expense budgets)
        const expensesTotal = budgetsData
          .filter(budget => budget.category.toLowerCase() !== 'income')
          .reduce((sum, budget) => sum + budget.amount, 0);
        
        // Calculate savings rate
        const savingsRate = incomeTotal > 0 ? Math.round(((incomeTotal - expensesTotal) / incomeTotal) * 100) : 0;
        
        // Calculate total assets and liabilities
        const totalAssets = assetsData.reduce((sum, asset) => sum + asset.value, 0);
        const totalLiabilities = liabilitiesData.reduce((sum, liability) => sum + liability.amount, 0);
        
        // Update financial summary
        setFinancialSummary({
          monthlyIncome: incomeTotal,
          monthlyExpenses: expensesTotal,
          savingsRate: savingsRate,
          totalSavings: totalAssets,
          totalDebt: totalLiabilities,
          netWorth: totalAssets - totalLiabilities
        });
      }
      
      // If there's a selected budget, fetch its transactions
      if (selectedBudgetId) {
        const { data: transactionsData, error: transactionsError } = await FinwellService.getBudgetTransactions(selectedBudgetId);
        if (transactionsError) throw transactionsError;
        if (transactionsData) setTransactions(transactionsData);
      }
      
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your financial data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      // Calculate days difference
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 7) {
        return `${diffDays} days ago`;
      } else {
        return date.toLocaleDateString();
      }
    }
  };
  
  // Handle creating a new budget
  const handleCreateBudget = async () => {
    if (!user || !newBudget.name || !newBudget.amount || !newBudget.category) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const { error } = await FinwellService.createBudget({
        ...newBudget as Budget,
        user_id: user.id
      });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Budget created successfully!',
      });
      
      // Reset form and close dialog
      setNewBudget({
        name: '',
        amount: 0,
        category: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
      });
      setNewBudgetOpen(false);
      
      // Refresh data
      fetchFinancialData();
      
    } catch (error) {
      console.error('Error creating budget:', error);
      toast({
        title: 'Error',
        description: 'Failed to create budget. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle creating a new saving goal
  const handleCreateSavingGoal = async () => {
    if (!user || !newGoal.name || !newGoal.target_amount) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const { error } = await FinwellService.createSavingGoal({
        ...newGoal as SavingGoal,
        user_id: user.id
      });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Saving goal created successfully!',
      });
      
      // Reset form and close dialog
      setNewGoal({
        name: '',
        target_amount: 0,
        current_amount: 0,
        target_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        status: 'active',
        priority: 'medium'
      });
      setNewGoalOpen(false);
      
      // Refresh data
      fetchFinancialData();
      
    } catch (error) {
      console.error('Error creating saving goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to create saving goal. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle creating a new asset
  const handleCreateAsset = async () => {
    if (!user || !newAsset.name || !newAsset.category || !newAsset.value) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const { error } = await FinwellService.createNetWorthAsset({
        ...newAsset as NetWorthAsset,
        user_id: user.id
      });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Asset added successfully!',
      });
      
      // Reset form and close dialog
      setNewAsset({
        name: '',
        category: '',
        value: 0,
        asset_type: 'cash',
        is_liquid: true
      });
      setNewAssetOpen(false);
      
      // Refresh data
      fetchFinancialData();
      
    } catch (error) {
      console.error('Error creating asset:', error);
      toast({
        title: 'Error',
        description: 'Failed to add asset. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle creating a new liability
  const handleCreateLiability = async () => {
    if (!user || !newLiability.name || !newLiability.category || !newLiability.amount) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const { error } = await FinwellService.createNetWorthLiability({
        ...newLiability as NetWorthLiability,
        user_id: user.id
      });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Liability added successfully!',
      });
      
      // Reset form and close dialog
      setNewLiability({
        name: '',
        category: '',
        amount: 0,
        liability_type: 'credit_card',
        interest_rate: 0
      });
      setNewLiabilityOpen(false);
      
      // Refresh data
      fetchFinancialData();
      
    } catch (error) {
      console.error('Error creating liability:', error);
      toast({
        title: 'Error',
        description: 'Failed to add liability. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle creating a new transaction
  const handleCreateTransaction = async () => {
    if (!user || !newTransaction.budget_id || !newTransaction.amount || !newTransaction.description) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const { error } = await FinwellService.createBudgetTransaction({
        ...newTransaction as BudgetTransaction,
        user_id: user.id
      });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Transaction recorded successfully!',
      });
      
      // Reset form and close dialog
      setNewTransaction({
        budget_id: '',
        amount: 0,
        description: '',
        transaction_date: new Date().toISOString().split('T')[0],
        category: ''
      });
      setNewTransactionOpen(false);
      
      // Refresh data
      fetchFinancialData();
      
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to record transaction. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Process budgets for display
  const budgetCategories = budgets
    .filter(budget => budget.category.toLowerCase() !== 'income')
    .map(budget => {
      // Calculate spent amount (mock for now, would be calculated from transactions)
      const spent = Math.random() * budget.amount * 0.8; // Random spent amount for demo
      
      return {
        name: budget.name,
        category: budget.category,
        percentage: Math.round((budget.amount / financialSummary.monthlyExpenses) * 100) || 0,
        spent: spent,
        budget: budget.amount,
        color: categoryColors[budget.category] || categoryColors.Other
      };
    });
  
  // Process recent transactions for display
  const recentTransactions = transactions.slice(0, 5).map(tx => ({
    id: tx.id,
    description: tx.description,
    amount: tx.amount,
    category: tx.category,
    date: formatDate(tx.transaction_date)
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-fin-primary mb-4" />
            <p className="text-lg text-slate-600 dark:text-slate-400">Loading your financial data...</p>
          </div>
        ) : !user ? (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">Please log in to view your financial dashboard.</p>
            <Button onClick={() => window.location.href = '/login'}>Log In</Button>
          </div>
        ) : (
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
              <Tabs 
                defaultValue={section || "budget"} 
                onValueChange={(value) => navigate(`/finwell/${value === 'budget' ? '' : value}`)}
              >
                <TabsList className="w-full grid grid-cols-4 mb-4">
                  <TabsTrigger value="budget">Budget</TabsTrigger>
                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                  <TabsTrigger value="networth">Net Worth</TabsTrigger>
                  <TabsTrigger value="savings">Savings</TabsTrigger>
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
                      <Button variant="outline" className="w-full" onClick={() => setNewBudgetOpen(true)}>Add New Budget</Button>
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
                      <Button variant="outline" className="w-full" onClick={() => setNewTransactionOpen(true)}>Add Transaction</Button>
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
                    <CardFooter className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => setNewAssetOpen(true)}>Add Asset</Button>
                      <Button variant="outline" className="flex-1" onClick={() => setNewLiabilityOpen(true)}>Add Liability</Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="savings">
                  <Card>
                    <CardHeader>
                      <CardTitle>Savings Goals</CardTitle>
                      <CardDescription>Track your progress towards financial goals</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-5">
                        {savingGoals.map(goal => (
                          <div key={goal.id} className="border border-slate-200 rounded-lg p-3 dark:border-slate-700">
                            <h3 className="font-medium">{goal.name}</h3>
                            <div className="flex justify-between items-center text-sm my-1">
                              <span>${goal.current_amount}</span>
                              <span className="text-slate-500">of ${goal.target_amount}</span>
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
                      <Button className="w-full" onClick={() => setNewGoalOpen(true)}>Create New Goal</Button>
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
                    {savings=Goals.map(goal => (
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
                  <Button className="w-full" onClick={() => setNewGoalOpen(true)}>Create New Goal</Button>
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
                  <span className="text-4xl font-bold">{healthScore}</span>
                </div>
                <p className="text-lg font-medium">
                  {healthScore >= 80 ? 'Excellent' : 
                   healthScore >= 70 ? 'Good' : 
                   healthScore >= 50 ? 'Fair' : 'Needs Attention'}
                </p>
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
        )}
      </main>
      
      <Footer />
      
      {/* Dialog for creating a new budget */}
      <Dialog open={newBudgetOpen} onOpenChange={setNewBudgetOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Budget</DialogTitle>
            <DialogDescription>
              Set up a new budget to track your spending in a specific category.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newBudget.name}
                onChange={(e) => setNewBudget({ ...newBudget, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                value={newBudget.amount || ''}
                onChange={(e) => setNewBudget({ ...newBudget, amount: parseFloat(e.target.value) || 0 })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select 
                value={newBudget.category} 
                onValueChange={(value) => setNewBudget({ ...newBudget, category: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Income">Income</SelectItem>
                  <SelectItem value="Housing">Housing</SelectItem>
                  <SelectItem value="Transportation">Transportation</SelectItem>
                  <SelectItem value="Food">Food</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Entertainment">Entertainment</SelectItem>
                  <SelectItem value="Savings">Savings</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Shopping">Shopping</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="start_date" className="text-right">
                Start Date
              </Label>
              <Input
                id="start_date"
                type="date"
                value={newBudget.start_date}
                onChange={(e) => setNewBudget({ ...newBudget, start_date: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="end_date" className="text-right">
                End Date
              </Label>
              <Input
                id="end_date"
                type="date"
                value={newBudget.end_date}
                onChange={(e) => setNewBudget({ ...newBudget, end_date: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="recurring" className="text-right">
                Recurring
              </Label>
              <Select 
                value={newBudget.recurring ? 'true' : 'false'} 
                onValueChange={(value) => setNewBudget({ ...newBudget, recurring: value === 'true' })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Is this recurring?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newBudget.recurring && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="recurrence_period" className="text-right">
                  Period
                </Label>
                <Select 
                  value={newBudget.recurrence_period} 
                  onValueChange={(value: any) => setNewBudget({ ...newBudget, recurrence_period: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select recurrence period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleCreateBudget}>Create Budget</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for creating a new saving goal */}
      <Dialog open={newGoalOpen} onOpenChange={setNewGoalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Saving Goal</DialogTitle>
            <DialogDescription>
              Set a new financial goal to work towards.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="goal_name" className="text-right">
                Name
              </Label>
              <Input
                id="goal_name"
                value={newGoal.name}
                onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="target_amount" className="text-right">
                Target Amount
              </Label>
              <Input
                id="target_amount"
                type="number"
                value={newGoal.target_amount || ''}
                onChange={(e) => setNewGoal({ ...newGoal, target_amount: parseFloat(e.target.value) || 0 })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="current_amount" className="text-right">
                Current Amount
              </Label>
              <Input
                id="current_amount"
                type="number"
                value={newGoal.current_amount || ''}
                onChange={(e) => setNewGoal({ ...newGoal, current_amount: parseFloat(e.target.value) || 0 })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="target_date" className="text-right">
                Target Date
              </Label>
              <Input
                id="target_date"
                type="date"
                value={newGoal.target_date}
                onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">
                Priority
              </Label>
              <Select 
                value={newGoal.priority} 
                onValueChange={(value: any) => setNewGoal({ ...newGoal, priority: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleCreateSavingGoal}>Create Goal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for adding a new asset */}
      <Dialog open={newAssetOpen} onOpenChange={setNewAssetOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
            <DialogDescription>
              Add a new asset to track in your net worth calculation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="asset_name" className="text-right">
                Name
              </Label>
              <Input
                id="asset_name"
                value={newAsset.name}
                onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="asset_category" className="text-right">
                Category
              </Label>
              <Input
                id="asset_category"
                value={newAsset.category}
                onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })}
                className="col-span-3"
                placeholder="e.g., Investments, Property"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="asset_value" className="text-right">
                Value
              </Label>
              <Input
                id="asset_value"
                type="number"
                value={newAsset.value || ''}
                onChange={(e) => setNewAsset({ ...newAsset, value: parseFloat(e.target.value) || 0 })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="asset_type" className="text-right">
                Type
              </Label>
              <Select 
                value={newAsset.asset_type} 
                onValueChange={(value: any) => setNewAsset({ ...newAsset, asset_type: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select asset type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                  <SelectItem value="property">Property</SelectItem>
                  <SelectItem value="vehicle">Vehicle</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_liquid" className="text-right">
                Liquid Asset
              </Label>
              <Select 
                value={newAsset.is_liquid ? 'true' : 'false'} 
                onValueChange={(value) => setNewAsset({ ...newAsset, is_liquid: value === 'true' })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Is this a liquid asset?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="asset_notes" className="text-right">
                Notes
              </Label>
              <Input
                id="asset_notes"
                value={newAsset.notes || ''}
                onChange={(e) => setNewAsset({ ...newAsset, notes: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleCreateAsset}>Add Asset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for adding a new liability */}
      <Dialog open={newLiabilityOpen} onOpenChange={setNewLiabilityOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Liability</DialogTitle>
            <DialogDescription>
              Add a new liability to track in your net worth calculation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="liability_name" className="text-right">
                Name
              </Label>
              <Input
                id="liability_name"
                value={newLiability.name}
                onChange={(e) => setNewLiability({ ...newLiability, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="liability_category" className="text-right">
                Category
              </Label>
              <Input
                id="liability_category"
                value={newLiability.category}
                onChange={(e) => setNewLiability({ ...newLiability, category: e.target.value })}
                className="col-span-3"
                placeholder="e.g., Debt, Loan"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="liability_amount" className="text-right">
                Amount
              </Label>
              <Input
                id="liability_amount"
                type="number"
                value={newLiability.amount || ''}
                onChange={(e) => setNewLiability({ ...newLiability, amount: parseFloat(e.target.value) || 0 })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="liability_type" className="text-right">
                Type
              </Label>
              <Select 
                value={newLiability.liability_type} 
                onValueChange={(value: any) => setNewLiability({ ...newLiability, liability_type: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select liability type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="loan">Loan</SelectItem>
                  <SelectItem value="mortgage">Mortgage</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="interest_rate" className="text-right">
                Interest Rate (%)
              </Label>
              <Input
                id="interest_rate"
                type="number"
                value={newLiability.interest_rate || ''}
                onChange={(e) => setNewLiability({ ...newLiability, interest_rate: parseFloat(e.target.value) || 0 })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="liability_notes" className="text-right">
                Notes
              </Label>
              <Input
                id="liability_notes"
                value={newLiability.notes || ''}
                onChange={(e) => setNewLiability({ ...newLiability, notes: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleCreateLiability}>Add Liability</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for adding a new transaction */}
      <Dialog open={newTransactionOpen} onOpenChange={setNewTransactionOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Transaction</DialogTitle>
            <DialogDescription>
              Record a new financial transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="budget_id" className="text-right">
                Budget
              </Label>
              <Select 
                value={newTransaction.budget_id} 
                onValueChange={(value) => setNewTransaction({ ...newTransaction, budget_id: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a budget" />
                </SelectTrigger>
                <SelectContent>
                  {budgets.map(budget => (
                    <SelectItem key={budget.id} value={budget.id || ''}>{budget.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transaction_amount" className="text-right">
                Amount
              </Label>
              <Input
                id="transaction_amount"
                type="number"
                value={newTransaction.amount || ''}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: parseFloat(e.target.value) || 0 })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transaction_description" className="text-right">
                Description
              </Label>
              <Input
                id="transaction_description"
                value={newTransaction.description || ''}
                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transaction_date" className="text-right">
                Date
              </Label>
              <Input
                id="transaction_date"
                type="date"
                value={newTransaction.transaction_date}
                onChange={(e) => setNewTransaction({ ...newTransaction, transaction_date: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transaction_category" className="text-right">
                Category
              </Label>
              <Input
                id="transaction_category"
                value={newTransaction.category || ''}
                onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleCreateTransaction}>Add Transaction</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 