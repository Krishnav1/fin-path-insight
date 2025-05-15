import { useState, KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TrendingUp, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Hero() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/company/${searchQuery.trim().toUpperCase()}`);
      setSearchQuery("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="relative bg-gradient-to-b from-slate-100 to-white py-12 md:py-24">
      <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>
      <div className="relative container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-fin-primary mb-6">
              Master the Indian Stock Market: <span className="text-fin-teal">Clear Insights for Retail Investors</span>
            </h1>
            <p className="text-xl text-slate-700 mb-8">
              Access easy-to-understand market data, expert reports, and learning resources tailored for Indian retail investors. No jargon, just clarity.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
              <Link to="/signup">
                <Button className="bg-fin-accent hover:bg-fin-accent-hover text-fin-dark font-medium text-lg px-8 py-6">
                  Explore Free Market Data <ChevronRight size={20} className="ml-2" />
                </Button>
              </Link>
              <Link to="/finpath">
                <Button variant="outline" className="font-medium text-lg px-8 py-6">
                  Learn About Premium <TrendingUp size={20} className="ml-2" />
                </Button>
              </Link>
            </div>
            
            <div className="relative max-w-lg mx-auto lg:mx-0">
              <div className="bg-white rounded-full border border-slate-200 shadow-sm flex items-center p-1">
                <Search className="text-slate-400 ml-3 h-5 w-5" />
                <Input 
                  className="border-0 shadow-none rounded-full flex-1 px-3 py-2 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="Search for stocks, ETFs, news..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button 
                  className="rounded-full px-6 py-5 bg-fin-primary hover:bg-fin-primary/90"
                  onClick={handleSearch}
                >
                  Search
                </Button>
              </div>
              <div className="mt-2 text-center lg:text-left text-sm text-slate-500">
                Popular Indian Stocks: <Link to="/company/RELIANCE.NS" className="text-fin-teal hover:underline">RELIANCE</Link>,&nbsp;
                <Link to="/company/TCS.NS" className="text-fin-teal hover:underline">TCS</Link>,&nbsp;
                <Link to="/company/HDFCBANK.NS" className="text-fin-teal hover:underline">HDFC BANK</Link>,&nbsp;
                <Link to="/company/INFY.NS" className="text-fin-teal hover:underline">INFOSYS</Link>
              </div>
            </div>
          </div>
          
          <div className="relative hidden lg:block">
            <div className="absolute -top-16 -right-16 w-72 h-72 bg-fin-accent/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-8 -left-8 w-60 h-60 bg-fin-teal/10 rounded-full blur-2xl"></div>
            <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
              <div className="bg-fin-primary text-white px-6 py-4 flex justify-between items-center">
                <div className="text-lg font-semibold">Indian Market Dashboard</div>
                <div className="text-sm">Live Updates</div>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-lg font-medium">NIFTY 50</div>
                    <div className="flex items-center text-fin-positive">
                      <TrendingUp size={16} className="mr-1" />
                      <span className="font-medium">+0.42%</span>
                    </div>
                  </div>
                  <div className="bg-slate-100 rounded-lg h-20 w-full overflow-hidden">
                    <svg viewBox="0 0 400 100" className="w-full h-full">
                      <path 
                        d="M 0,50 C 50,30 100,60 150,40 C 200,20 250,80 300,60 C 350,40 400,50 400,50" 
                        fill="none" 
                        stroke="#0d9488" 
                        strokeWidth="2"
                      />
                      <path 
                        d="M 0,50 C 50,30 100,60 150,40 C 200,20 250,80 300,60 C 350,40 400,50 400,100 L 400,100 L 0,100" 
                        fill="url(#gradient)" 
                        fillOpacity="0.2"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#0d9488" />
                          <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="text-sm text-slate-500 mb-1">Top Gainers</div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">RELIANCE</span>
                      <span className="text-fin-positive font-medium">+1.82%</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="text-sm text-slate-500 mb-1">Top Losers</div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">TATAMOTORS</span>
                      <span className="text-fin-negative font-medium">-2.70%</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between gap-4">
                  <Button className="flex-1 bg-fin-accent hover:bg-fin-accent-hover text-fin-dark">Portfolio</Button>
                  <Button className="flex-1" variant="outline">Watchlist</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
