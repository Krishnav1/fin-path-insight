import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import * as XLSX from 'xlsx';
import { parse } from 'papaparse';
import { 
  Upload, 
  FileText, 
  AlertTriangle, 
  Plus, 
  RefreshCw
} from 'lucide-react';

// Import our new components
import { usePortfolio, ImportedStock } from './hooks/usePortfolio';
import { PortfolioTable } from './components/PortfolioTable';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { ImportModal } from './components/ImportModal';
import { StockForm } from './components/StockForm';

export default function PortfolioAnalyzerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for UI management
  const [activeTab, setActiveTab] = useState('overview');
  const [isDragging, setIsDragging] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importedStocks, setImportedStocks] = useState<ImportedStock[]>([]);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showEditStockModal, setShowEditStockModal] = useState(false);
  const [newStock, setNewStock] = useState({ symbol: '', name: '', quantity: '', buyPrice: '', sector: '', currentPrice: '' });
  const [editingStock, setEditingStock] = useState<any>(null);
  
  // Use our portfolio hook
  const {
    loading,
    refreshing,
    stocks,
    portfolioId,
    analyzing,
    analysisResult,
    fetchUserPortfolio,
    fetchStockData,
    refreshStockPrices,
    analyzePortfolio,
    addStock,
    editStock,
    deleteStock
  } = usePortfolio();

  // Check user existence in Supabase after login
  useEffect(() => {
    if (!user) return;
    
    const checkUserInSupabase = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error || !data) {
          console.error('Error checking user profile:', error);
          // Try to check if user exists in auth.users first
          const { data: authData, error: authError } = await supabase.auth.getUser();
          
          if (!authError && authData?.user) {
            // User exists in auth but not in profiles - create profile
            console.log('User exists in auth but not in profiles. Creating profile...');
            try {
              const { error: insertError } = await supabase
                .from('profiles')
                .insert([{
                  id: user.id,
                  email: user.email,
                  full_name: user.user_metadata?.full_name || 'User',
                  email_verified: user.confirmed_at ? true : false
                }]);
                
              if (insertError) {
                console.error('Error creating user profile:', insertError);
                toast({
                  title: 'Profile Creation Failed',
                  description: 'Could not create your profile. Please contact support.',
                  variant: 'destructive'
                });
                navigate('/login');
              } else {
                // Profile created successfully, continue with app
                console.log('Profile created successfully.');
                // Directly proceed to fetch portfolio
                fetchUserPortfolio();
              }
            } catch (e) {
              console.error('Exception creating profile:', e);
              toast({
                title: 'Profile Creation Failed',
                description: 'Could not create your profile. Please contact support.',
                variant: 'destructive'
              });
              navigate('/login');
            }
          } else {
            // User doesn't exist in auth either
            toast({
              title: 'User Not Found',
              description: 'Your account could not be found in our database. Please contact support.',
              variant: 'destructive'
            });
            navigate('/login');
          }
        }
      } catch (error) {
        console.error('Error checking user:', error);
      }
    };
    
    checkUserInSupabase();
  }, [user, navigate, fetchUserPortfolio]);

  // Input handlers for stock form
  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setNewStock(prev => ({ ...prev, [name]: value }));
  }

  function handleQuantityChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value.replace(/[^0-9]/g, '');
    setNewStock(prev => ({ ...prev, quantity: value }));
  }

  function handleBuyPriceChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value.replace(/[^0-9.]/g, '');
    setNewStock(prev => ({ ...prev, buyPrice: value }));
  }

  function handleCurrentPriceChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value.replace(/[^0-9.]/g, '');
    setNewStock(prev => ({ ...prev, currentPrice: value }));
  }

  // Handle refreshing current price for Add Stock modal
  async function handleRefreshCurrentPrice() {
    if (!newStock.symbol) {
      toast({ title: 'Symbol Required', description: 'Please enter a symbol first', variant: 'destructive' });
      return;
    }
    
    try {
      const price = await fetchStockData(newStock.symbol);
      if (price) {
        setNewStock(prev => ({ ...prev, currentPrice: price.toString() }));
        toast({ title: 'Price Fetched', description: `Current price: ₹${price}`, variant: 'default' });
      } else {
        toast({ title: 'Not Found', description: 'Could not fetch current price', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to fetch price', variant: 'destructive' });
    }
  }

  // Handle adding a new stock
  const handleAddStock = async () => {
    const success = await addStock(newStock);
    if (success) {
      setShowAddStockModal(false);
      setNewStock({ symbol: '', name: '', quantity: '', buyPrice: '', sector: '', currentPrice: '' });
    }
  };

  // Handle editing a stock
  const handleEditStock = (stock: any) => {
    setEditingStock(stock);
    setNewStock({
      symbol: stock.symbol,
      name: stock.name,
      quantity: stock.quantity.toString(),
      buyPrice: stock.buyPrice.toString(),
      sector: stock.sector,
      currentPrice: stock.currentPrice.toString()
    });
    setShowEditStockModal(true);
  };
  
  // Save edited stock
  const handleSaveEditedStock = async () => {
    if (!editingStock) return;
    
    const success = await editStock(editingStock, newStock);
    if (success) {
      setShowEditStockModal(false);
      setEditingStock(null);
      setNewStock({ symbol: '', name: '', quantity: '', buyPrice: '', sector: '', currentPrice: '' });
    }
  };
  
  // Handle deleting a stock
  const handleDeleteStock = async (stock: any) => {
    if (!confirm(`Are you sure you want to delete ${stock.symbol} from your portfolio?`)) return;
    await deleteStock(stock);
  };

  // Handle drag and drop functionality
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Get dropped files
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Create a synthetic event to reuse handleFileChange
      const syntheticEvent = {
        target: {
          files: files
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      handleFileChange(syntheticEvent);
    }
  };
  
  // Parse CSV file and prepare for confirmation
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    
    const file = e.target.files[0];
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a CSV file',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      // Read the CSV file using PapaParse for better CSV handling
      const result = await new Promise<any>((resolve, reject) => {
        parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => resolve(results),
          error: (error) => reject(error)
        });
      });
      
      if (!result.data || !result.data.length) {
        throw new Error('No data found in CSV');
      }
      
      // Check for required columns
      const firstRow = result.data[0];
      const hasRequiredColumns = 
        (firstRow.Symbol || firstRow.symbol) && 
        (firstRow.Quantity || firstRow.quantity) && 
        (firstRow['Buy Price'] || firstRow.BuyPrice || firstRow.buyPrice || firstRow['buy price'] || firstRow['Purchase Price']);
      
      if (!hasRequiredColumns) {
        toast({
          title: 'Invalid CSV Format',
          description: 'CSV must include Symbol, Quantity, and Buy Price columns',
          variant: 'destructive'
        });
        return;
      }
      
      // Process data rows to standard format
      const parsedStocks: ImportedStock[] = result.data
        .filter((row: any) => {
          const symbol = row.Symbol || row.symbol;
          const quantity = parseFloat(row.Quantity || row.quantity);
          const buyPrice = parseFloat(
            row['Buy Price'] || row.BuyPrice || row.buyPrice || row['buy price'] || row['Purchase Price']
          );
          return symbol && !isNaN(quantity) && !isNaN(buyPrice);
        })
        .map((row: any) => {
          const symbol = row.Symbol || row.symbol;
          const name = row.Name || row.name || symbol;
          const quantity = parseFloat(row.Quantity || row.quantity);
          const buyPrice = parseFloat(
            row['Buy Price'] || row.BuyPrice || row.buyPrice || row['buy price'] || row['Purchase Price']
          );
          const sector = row.Sector || row.sector || 'Other';
          const buyDate = row['Buy Date'] || row.BuyDate || row.buyDate || row['buy date'] || new Date().toISOString().split('T')[0];
          
          return {
            symbol,
            name,
            quantity,
            buyPrice,
            sector,
            buyDate
          };
        });
      
      if (parsedStocks.length === 0) {
        toast({
          title: 'No Valid Data',
          description: 'No valid stock data found in the CSV',
          variant: 'destructive'
        });
        return;
      }
      
      // Fetch current prices for all stocks
      for (const stock of parsedStocks) {
        try {
          const price = await fetchStockData(stock.symbol);
          if (price) {
            stock.currentPrice = price;
          }
        } catch (error) {
          console.error(`Failed to fetch price for ${stock.symbol}:`, error);
          // Continue with other stocks even if one fails
        }
      }
      
      // Show the confirmation modal with the parsed stocks
      setImportedStocks(parsedStocks);
      setShowImportModal(true);
      
    } catch (error) {
      console.error('Error processing CSV:', error);
      toast({
        title: 'Processing Failed',
        description: 'Failed to process CSV data',
        variant: 'destructive'
      });
    } finally {
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Handle updating an imported stock in the confirmation modal
  const handleUpdateImportedStock = (index: number, field: keyof ImportedStock, value: string | number) => {
    setImportedStocks(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: typeof value === 'string' && ['quantity', 'buyPrice', 'currentPrice'].includes(field as string) 
          ? parseFloat(value) 
          : value
      };
      return updated;
    });
  };
  
  // Remove a stock from the import list
  const handleRemoveImportedStock = (index: number) => {
    setImportedStocks(prev => prev.filter((_, i) => i !== index));
  };
  
  // Save all imported stocks to Supabase
  const handleSaveImportedStocks = async () => {
    if (!user || !portfolioId || importedStocks.length === 0) return;
    
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      let addedCount = 0;
      const errors: string[] = [];
      
      // Add each stock to Supabase
      for (const stock of importedStocks) {
        const { error } = await supabase
          .from('portfolio_holdings')
          .insert([{
            user_id: user.id,
            portfolio_id: portfolioId,
            symbol: stock.symbol,
            name: stock.name,
            quantity: stock.quantity,
            buy_price: stock.buyPrice,
            current_price: stock.currentPrice || stock.buyPrice,
            sector: stock.sector,
            buy_date: stock.buyDate || new Date().toISOString().split('T')[0]
          }]);
        
        if (error) {
          console.error(`Error adding ${stock.symbol}:`, error);
          errors.push(`${stock.symbol}: ${error.message}`);
        } else {
          addedCount++;
        }
      }
      
      // Update the UI with the new stocks
      await fetchUserPortfolio();
      
      // Close modal and clear imported stocks
      setShowImportModal(false);
      setImportedStocks([]);
      
      if (errors.length > 0) {
        toast({
          title: 'Partial Import Success',
          description: `Added ${addedCount} of ${importedStocks.length} stocks. Some errors occurred.`,
          variant: 'default'
        });
      } else {
        toast({
          title: 'Import Complete',
          description: `Successfully added ${addedCount} stocks to your portfolio`,
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Error saving imported stocks:', error);
      toast({
        title: 'Import Failed',
        description: 'Failed to save stocks to your portfolio',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Portfolio Analyzer</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Analyze your investment portfolio performance, risk, and allocation
          </p>
          
          {/* Upload Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Import Your Portfolio</CardTitle>
              <CardDescription>
                Upload your portfolio data or manually add your investments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center ${
                    isDragging ? 'border-fin-primary bg-fin-primary/5' : 'border-slate-200 dark:border-slate-700'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center">
                    <Upload className="h-10 w-10 text-slate-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Drag & Drop CSV File</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-4">
                      or click to browse your files
                    </p>
                    <Input 
                      type="file" 
                      accept=".csv" 
                      className="hidden" 
                      id="portfolio-file" 
                      onChange={handleFileChange}
                      ref={fileInputRef}
                    />
                    <Label htmlFor="portfolio-file" asChild>
                      <Button variant="outline">Select CSV File</Button>
                    </Label>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-4">Template & Instructions</h3>
                  <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-400">
                      Download our CSV template and fill it with your portfolio data. The template includes:
                    </p>
                    <ul className="list-disc pl-5 text-slate-600 dark:text-slate-400 space-y-1">
                      <li>Stock symbol (e.g., RELIANCE.NS)</li>
                      <li>Quantity of shares</li>
                      <li>Purchase price per share</li>
                      <li>Purchase date (optional)</li>
                    </ul>
                    <Button 
                      variant="outline" 
                      className="flex items-center"
                      onClick={() => {
                        // Create template data
                        const templateData = [
                          {
                            Symbol: 'RELIANCE.NS',
                            Name: 'Reliance Industries Ltd',
                            Quantity: 10,
                            'Buy Price': 2500,
                            Sector: 'Energy',
                            'Buy Date': new Date().toISOString().split('T')[0]
                          },
                          {
                            Symbol: 'TCS.NS',
                            Name: 'Tata Consultancy Services Ltd',
                            Quantity: 5,
                            'Buy Price': 3200,
                            Sector: 'Technology',
                            'Buy Date': new Date().toISOString().split('T')[0]
                          }
                        ];
                        
                        // Create a workbook
                        const workbook = XLSX.utils.book_new();
                        const worksheet = XLSX.utils.json_to_sheet(templateData);
                        
                        // Add worksheet to workbook
                        XLSX.utils.book_append_sheet(workbook, worksheet, 'Portfolio Template');
                        
                        // Generate Excel file
                        XLSX.writeFile(workbook, 'portfolio-template.xlsx');
                        
                        toast({
                          title: 'Template Downloaded',
                          description: 'Excel template has been downloaded. Fill it and upload to import your portfolio.',
                          variant: 'default'
                        });
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Download Template
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddStockModal(true);
                    setNewStock({ symbol: '', name: '', quantity: '', buyPrice: '', sector: '', currentPrice: '' });
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Stocks Manually
                </Button>
                <Button 
                  variant="outline" 
                  onClick={refreshStockPrices} 
                  disabled={refreshing || stocks.length === 0}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {refreshing ? 'Refreshing...' : 'Refresh Prices'}
                </Button>
              </div>
              <Button onClick={analyzePortfolio} disabled={analyzing || stocks.length === 0}>
                {analyzing ? 'Analyzing...' : 'Analyze Portfolio'}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Portfolio Analysis Tabs */}
          <Tabs defaultValue="overview" onValueChange={setActiveTab} className="mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <div>
                <h3 className="text-lg font-semibold">Portfolio Analysis</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 sm:mb-0">
                  {stocks.length === 0 ? 'Add stocks to analyze your portfolio' : `${stocks.length} stocks in your portfolio`}
                </p>
                {!analysisResult && stocks.length > 0 && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                    Analyze your portfolio to get personalized recommendations
                  </p>
                )}
                {analysisResult && (
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                    Analysis complete! Check the Recommendations tab for insights
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={analyzePortfolio} 
                  disabled={analyzing || stocks.length === 0}
                  className="flex items-center"
                >
                  {analyzing ? 'Analyzing...' : analysisResult ? 'Refresh Analysis' : 'Analyze Portfolio'}
                </Button>
                {analysisResult && (
                  <Button 
                    onClick={() => setActiveTab('recommendations')} 
                    className="flex items-center"
                    type="primary"
                  >
                    View Recommendations
                  </Button>
                )}
              </div>
            </div>
            
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview" onClick={() => setActiveTab('overview')}>Overview</TabsTrigger>
              <TabsTrigger value="allocation" onClick={() => setActiveTab('allocation')}>Allocation</TabsTrigger>
              <TabsTrigger value="performance" onClick={() => setActiveTab('performance')}>Performance</TabsTrigger>
              <TabsTrigger value="risk" onClick={() => setActiveTab('risk')}>Risk</TabsTrigger>
              <TabsTrigger 
                value="recommendations" 
                onClick={() => setActiveTab('recommendations')}
                className={!analysisResult ? 'relative' : ''}
              >
                Recommendations
                {!analysisResult && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            
            {/* Tab Content */}
            <TabsContent value={activeTab} className="mt-6">
              <AnalysisDisplay 
                activeTab={activeTab}
                analysisResult={analysisResult}
                stocks={stocks}
              />
            </TabsContent>
            
            {/* Portfolio Holdings Table */}
            {activeTab === 'overview' && stocks.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Portfolio Holdings</CardTitle>
                      <CardDescription>Your current stock investments</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <PortfolioTable 
                    stocks={stocks}
                    onEditStock={handleEditStock}
                    onDeleteStock={handleDeleteStock}
                  />
                </CardContent>
              </Card>
            )}
          </Tabs>
        </div>
      </main>
      
      <Footer />
      
      {/* Import Modal */}
      <ImportModal
        showImportModal={showImportModal}
        importedStocks={importedStocks}
        loading={loading}
        onCancel={() => setShowImportModal(false)}
        onSave={handleSaveImportedStocks}
        onUpdateStock={handleUpdateImportedStock}
        onRemoveStock={handleRemoveImportedStock}
      />
      
      {/* Add Stock Modal */}
      <StockForm
        isOpen={showAddStockModal}
        isEditing={false}
        stock={newStock}
        loading={loading}
        onCancel={() => {
          setShowAddStockModal(false);
          setNewStock({ symbol: '', name: '', quantity: '', buyPrice: '', sector: '', currentPrice: '' });
        }}
        onSave={handleAddStock}
        onInputChange={handleInputChange}
        onQuantityChange={handleQuantityChange}
        onBuyPriceChange={handleBuyPriceChange}
        onCurrentPriceChange={handleCurrentPriceChange}
        onRefreshPrice={handleRefreshCurrentPrice}
      />
      
      {/* Edit Stock Modal */}
      <StockForm
        isOpen={showEditStockModal}
        isEditing={true}
        stock={newStock}
        loading={loading}
        onCancel={() => {
          setShowEditStockModal(false);
          setEditingStock(null);
          setNewStock({ symbol: '', name: '', quantity: '', buyPrice: '', sector: '', currentPrice: '' });
        }}
        onSave={handleSaveEditedStock}
        onInputChange={handleInputChange}
        onQuantityChange={handleQuantityChange}
        onBuyPriceChange={handleBuyPriceChange}
        onCurrentPriceChange={handleCurrentPriceChange}
        onRefreshPrice={handleRefreshCurrentPrice}
      />
    </div>
  );
}