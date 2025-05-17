import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStocks, getCryptos, StockSummary, CryptoSearchResult } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

type SearchResult = {
  id: string;
  name: string;
  symbol: string;
  type: 'stock' | 'crypto';
  path: string;
};

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Search function with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        fetchResults();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      // Fetch stocks and cryptos in parallel
      const [stocks, cryptos] = await Promise.all([
        getStocks(query),
        getCryptos(query),
      ]);

      // Format stock results
      const stockResults: SearchResult[] = (stocks as StockSummary[]).map((stock) => ({
        id: stock.symbol,
        name: stock.name,
        symbol: stock.displaySymbol || stock.symbol.split('.')[0],
        type: 'stock',
        path: `/stocks/${stock.symbol}`
      }));

      // Format crypto results
      const cryptoResults: SearchResult[] = (cryptos as CryptoSearchResult[]).map((crypto) => ({
        id: crypto.id,
        name: crypto.name,
        symbol: crypto.symbol,
        type: 'crypto',
        path: `/crypto/${crypto.id}`
      }));

      // Combine and limit results
      setResults([...stockResults, ...cryptoResults].slice(0, 10));
      setShowResults(true);
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (query.trim() && results.length > 0) {
      // Navigate to the first result
      navigate(results[0].path);
      setQuery('');
      setShowResults(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.path);
    setQuery('');
    setShowResults(false);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <form onSubmit={handleSearch} className="flex w-full items-center">
        <div className="relative flex-grow">
          <Input
            id="search-query"
            name="search-query"
            ref={inputRef}
            type="text"
            placeholder="Search stocks or cryptocurrencies..."
            className="pr-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (query.length >= 2) {
                setShowResults(true);
              }
            }}
          />
          <Button 
            type="submit" 
            size="icon" 
            variant="ghost" 
            className="absolute right-0 top-0 h-full px-3"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {/* Results dropdown */}
      {showResults && (
        <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg dark:bg-gray-800">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : results.length > 0 ? (
            <ul className="max-h-60 overflow-auto py-1">
              {results.map((result) => (
                <li 
                  key={`${result.type}-${result.id}`}
                  className="cursor-pointer px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{result.symbol}</div>
                      <div className="text-sm text-gray-500">{result.name}</div>
                    </div>
                    <span className="text-xs uppercase text-gray-400">{result.type}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-gray-500">No results found</div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchBar; 