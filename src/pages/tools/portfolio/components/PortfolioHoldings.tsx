import React, { useState, Dispatch, SetStateAction, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Portfolio, StockHolding } from '@/types/portfolio';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Plus, Edit, Trash2, ExternalLink, Loader2, Save } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PortfolioHoldingsProps {
  portfolioData: Portfolio;
  setPortfolioData: Dispatch<SetStateAction<Portfolio>>;
  onSave: () => Promise<void>;
  isAnalyzing: boolean;
}

interface EditHoldingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holding: StockHolding | null;
  onSave: (holding: StockHolding) => void;
}

// Edit Holding Dialog Component
function EditHoldingDialog({ open, onOpenChange, holding, onSave }: EditHoldingDialogProps) {
  const [formData, setFormData] = useState<StockHolding>({
    symbol: '',
    name: '',
    quantity: 0,
    buyPrice: 0,
    currentPrice: 0,
    sector: '',
    buyDate: new Date().toISOString().split('T')[0],
    value: 0,
    profit: 0,
    profitPercentage: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Load holding data when dialog opens
  useEffect(() => {
    if (holding) {
      setFormData(holding);
    }
  }, [holding]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Handle numeric fields
    if (['quantity', 'buyPrice', 'currentPrice'].includes(name)) {
      const numValue = parseFloat(value);
      setFormData(prev => ({
        ...prev,
        [name]: isNaN(numValue) ? 0 : numValue
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.symbol) newErrors.symbol = 'Symbol is required';
    if (!formData.name) newErrors.name = 'Name is required';
    if (formData.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0';
    if (formData.buyPrice <= 0) newErrors.buyPrice = 'Buy price must be greater than 0';
    if (formData.currentPrice <= 0) newErrors.currentPrice = 'Current price must be greater than 0';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Calculate derived values
      const value = formData.quantity * formData.currentPrice;
      const profit = formData.quantity * (formData.currentPrice - formData.buyPrice);
      const profitPercentage = ((formData.currentPrice - formData.buyPrice) / formData.buyPrice) * 100;
      
      const updatedHolding = {
        ...formData,
        value,
        profit,
        profitPercentage
      };
      
      onSave(updatedHolding);
      onOpenChange(false);
      
      toast({
        title: holding ? 'Holding updated' : 'Holding added',
        description: `${formData.symbol} has been ${holding ? 'updated' : 'added'} successfully.`
      });
    } else {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields correctly.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{holding ? 'Edit Holding' : 'Add New Holding'}</DialogTitle>
          <DialogDescription>
            {holding ? 'Update the details of your investment.' : 'Add a new investment to your portfolio.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="symbol" className="text-right">Symbol</Label>
            <Input
              id="symbol"
              name="symbol"
              value={formData.symbol}
              onChange={handleChange}
              className="col-span-3"
              placeholder="e.g. AAPL"
            />
            {errors.symbol && <p className="col-span-3 col-start-2 text-sm text-red-500">{errors.symbol}</p>}
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="col-span-3"
              placeholder="e.g. Apple Inc."
            />
            {errors.name && <p className="col-span-3 col-start-2 text-sm text-red-500">{errors.name}</p>}
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">Quantity</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleChange}
              className="col-span-3"
              min="0"
              step="0.01"
            />
            {errors.quantity && <p className="col-span-3 col-start-2 text-sm text-red-500">{errors.quantity}</p>}
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="buyPrice" className="text-right">Buy Price</Label>
            <Input
              id="buyPrice"
              name="buyPrice"
              type="number"
              value={formData.buyPrice}
              onChange={handleChange}
              className="col-span-3"
              min="0"
              step="0.01"
            />
            {errors.buyPrice && <p className="col-span-3 col-start-2 text-sm text-red-500">{errors.buyPrice}</p>}
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="currentPrice" className="text-right">Current Price</Label>
            <Input
              id="currentPrice"
              name="currentPrice"
              type="number"
              value={formData.currentPrice}
              onChange={handleChange}
              className="col-span-3"
              min="0"
              step="0.01"
            />
            {errors.currentPrice && <p className="col-span-3 col-start-2 text-sm text-red-500">{errors.currentPrice}</p>}
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sector" className="text-right">Sector</Label>
            <Input
              id="sector"
              name="sector"
              value={formData.sector}
              onChange={handleChange}
              className="col-span-3"
              placeholder="e.g. Technology"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="buyDate" className="text-right">Buy Date</Label>
            <Input
              id="buyDate"
              name="buyDate"
              type="date"
              value={formData.buyDate}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          
          <DialogFooter>
            <Button type="submit" className="mt-4">
              {holding ? 'Update Holding' : 'Add Holding'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function PortfolioHoldings({ portfolioData, setPortfolioData, onSave, isAnalyzing }: PortfolioHoldingsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof StockHolding>('value');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentHolding, setCurrentHolding] = useState<StockHolding | null>(null);
  const { toast } = useToast();
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Handle sort
  const handleSort = (field: keyof StockHolding) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Filter and sort holdings
  const filteredHoldings = portfolioData.holdings
    .filter(holding => 
      holding.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      holding.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (holding.sector && holding.sector.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === undefined || bValue === undefined) return 0;
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });
  
  // Get sort icon
  const getSortIcon = (field: keyof StockHolding) => {
    if (field !== sortField) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Portfolio Holdings</CardTitle>
              <CardDescription>Manage and track all your investments</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search holdings..."
                  className="pl-9 w-full md:w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button className="whitespace-nowrap" onClick={() => {
                // Open dialog to add a new holding
                setCurrentHolding(null);
                setEditDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Holding
              </Button>
              <Button 
                className="whitespace-nowrap" 
                variant="outline" 
                onClick={onSave}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save & Analyze
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => handleSort('symbol')}
                  >
                    <div className="flex items-center gap-1">
                      Symbol {getSortIcon('symbol')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Name {getSortIcon('name')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => handleSort('quantity')}
                  >
                    <div className="flex items-center gap-1">
                      Quantity {getSortIcon('quantity')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => handleSort('buyPrice')}
                  >
                    <div className="flex items-center gap-1">
                      Buy Price {getSortIcon('buyPrice')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => handleSort('currentPrice')}
                  >
                    <div className="flex items-center gap-1">
                      Current Price {getSortIcon('currentPrice')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => handleSort('value')}
                  >
                    <div className="flex items-center gap-1">
                      Value {getSortIcon('value')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => handleSort('profitPercentage')}
                  >
                    <div className="flex items-center gap-1">
                      Return % {getSortIcon('profitPercentage')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => handleSort('sector')}
                  >
                    <div className="flex items-center gap-1">
                      Sector {getSortIcon('sector')}
                    </div>
                  </TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHoldings.length > 0 ? (
                  filteredHoldings.map((holding, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{holding.symbol}</TableCell>
                      <TableCell>{holding.name}</TableCell>
                      <TableCell>{holding.quantity}</TableCell>
                      <TableCell>{formatCurrency(holding.buyPrice)}</TableCell>
                      <TableCell>{formatCurrency(holding.currentPrice)}</TableCell>
                      <TableCell>{formatCurrency(holding.value || 0)}</TableCell>
                      <TableCell>
                        <Badge className={`${(holding.profitPercentage || 0) >= 0 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                          {(holding.profitPercentage || 0) >= 0 ? '+' : ''}{holding.profitPercentage?.toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell>{holding.sector}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <span className="sr-only">Open menu</span>
                              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                                <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setCurrentHolding(holding);
                              setEditDialogOpen(true);
                            }}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              <span>View Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600 dark:text-red-400"
                              onClick={() => {
                                // Remove holding from portfolio
                                setPortfolioData(prev => ({
                                  ...prev,
                                  holdings: prev.holdings.filter(h => 
                                    // Filter out the current holding
                                    !(h.symbol === holding.symbol && 
                                      h.buyPrice === holding.buyPrice && 
                                      h.quantity === holding.quantity)
                                  )
                                }));
                                toast({
                                  title: 'Holding deleted',
                                  description: `${holding.symbol} has been removed from your portfolio.`
                                });
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      {searchQuery ? (
                        <div className="flex flex-col items-center justify-center">
                          <Search className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                          <p className="text-slate-500 dark:text-slate-400">No results found for "{searchQuery}"</p>
                          <Button 
                            variant="link" 
                            onClick={() => setSearchQuery('')}
                            className="mt-2"
                          >
                            Clear search
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <p className="text-slate-500 dark:text-slate-400 mb-2">No holdings found</p>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add your first holding
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Showing {filteredHoldings.length} of {portfolioData.holdings.length} holdings
          </div>
        </CardContent>
      </Card>
      
      {/* Edit Holding Dialog */}
      <EditHoldingDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        holding={currentHolding}
        onSave={(updatedHolding) => {
          if (currentHolding) {
            // Update existing holding
            setPortfolioData(prev => ({
              ...prev,
              holdings: prev.holdings.map(h => 
                // Match the holding to update based on multiple properties
                (h.symbol === currentHolding.symbol && 
                 h.buyPrice === currentHolding.buyPrice && 
                 h.quantity === currentHolding.quantity) ? updatedHolding : h
              )
            }));
          } else {
            // Add new holding
            setPortfolioData(prev => ({
              ...prev,
              holdings: [...prev.holdings, updatedHolding]
            }));
          }
        }}
      />
    </div>
  );
}
