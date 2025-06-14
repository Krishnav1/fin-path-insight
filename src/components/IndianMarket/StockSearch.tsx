import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

// Common Indian stock mappings
const COMMON_STOCK_MAPPINGS: Record<string, string> = {
  'RELIANCE': 'RELIANCE.NSE',
  'TCS': 'TCS.NSE',
  'HDFC BANK': 'HDFCBANK.NSE',
  'INFOSYS': 'INFY.NSE',
  'HINDUSTAN UNILEVER': 'HINDUNILVR.NSE',
  'ICICI BANK': 'ICICIBANK.NSE',
  'SBI': 'SBIN.NSE',
  'BHARTI AIRTEL': 'BHARTIARTL.NSE',
  'AIRTEL': 'BHARTIARTL.NSE',
  'ITC': 'ITC.NSE',
  'KOTAK BANK': 'KOTAKBANK.NSE',
  'L&T': 'LT.NSE',
  'LARSEN': 'LT.NSE',
  'AXIS BANK': 'AXISBANK.NSE',
  'BAJAJ FINANCE': 'BAJFINANCE.NSE',
  'HCL TECH': 'HCLTECH.NSE',
  'ASIAN PAINTS': 'ASIANPAINT.NSE',
};

// Popular Indian stocks for autocomplete suggestions
const POPULAR_STOCKS = [
  { name: 'Reliance Industries', symbol: 'RELIANCE.NSE' },
  { name: 'Tata Consultancy Services', symbol: 'TCS.NSE' },
  { name: 'HDFC Bank', symbol: 'HDFCBANK.NSE' },
  { name: 'Infosys', symbol: 'INFY.NSE' },
  { name: 'Hindustan Unilever', symbol: 'HINDUNILVR.NSE' },
  { name: 'ICICI Bank', symbol: 'ICICIBANK.NSE' },
  { name: 'State Bank of India', symbol: 'SBIN.NSE' },
  { name: 'Bharti Airtel', symbol: 'BHARTIARTL.NSE' },
  { name: 'ITC Limited', symbol: 'ITC.NSE' },
  { name: 'Kotak Mahindra Bank', symbol: 'KOTAKBANK.NSE' },
  { name: 'Larsen & Toubro', symbol: 'LT.NSE' },
  { name: 'Axis Bank', symbol: 'AXISBANK.NSE' },
  { name: 'Bajaj Finance', symbol: 'BAJFINANCE.NSE' },
  { name: 'HCL Technologies', symbol: 'HCLTECH.NSE' },
  { name: 'Asian Paints', symbol: 'ASIANPAINT.NSE' },
];

interface StockSearchProps {
  onStockSelect?: (symbol: string) => void;
}

const StockSearch: React.FC<StockSearchProps> = ({ onStockSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ name: string; symbol: string }>>([]);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside search results to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter stocks based on query
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTerm = query.toUpperCase();
    
    // First check for exact matches in our common mappings
    const mappedSymbol = COMMON_STOCK_MAPPINGS[searchTerm];
    
    let filteredResults = POPULAR_STOCKS.filter(stock => 
      stock.name.toUpperCase().includes(searchTerm) || 
      stock.symbol.split('.')[0].includes(searchTerm)
    );
    
    // Add the mapped symbol if it exists and isn't already in results
    if (mappedSymbol && !filteredResults.some(r => r.symbol === mappedSymbol)) {
      filteredResults.unshift({
        name: searchTerm,
        symbol: mappedSymbol
      });
    }
    
    setResults(filteredResults);
    setShowResults(true);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && results.length > 0) {
      handleSelectStock(results[0].symbol);
    }
  };

  const handleSelectStock = (symbol: string) => {
    // Reset the UI
    setQuery('');
    setResults([]);
    setShowResults(false);
    
    // Handle the selected stock
    if (onStockSelect) {
      onStockSelect(symbol);
    } else {
      // If no callback is provided, navigate to company analysis page
      navigate(`/company-analysis/${symbol.split('.')[0]}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative w-full max-w-sm" ref={searchContainerRef}>
      <form onSubmit={handleSearch} className="relative flex w-full items-center">
        <Search className="absolute left-2 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          value={query}
          onChange={handleInputChange}
          className="pl-8 pr-10"
          placeholder="Search Indian stocks..."
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 h-full px-3 py-1"
            onClick={handleClearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </form>

      {showResults && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-lg overflow-hidden">
          <ul className="max-h-60 overflow-auto">
            {results.map((result, index) => (
              <li 
                key={index} 
                className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex justify-between"
                onClick={() => handleSelectStock(result.symbol)}
              >
                <span className="font-medium">{result.name}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">{result.symbol.split('.')[0]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default StockSearch;
