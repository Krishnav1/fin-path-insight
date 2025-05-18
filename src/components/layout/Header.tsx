import { useState, KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Search, 
  User, 
  BellRing, 
  Menu, 
  X, 
  ChevronDown,
  LogOut,
  Bot
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useAuth } from "../../context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useToast } from "../../hooks/use-toast";
import { ThemeToggle } from "../ui/theme-toggle";
import { MarketToggle } from "../ui/market-toggle";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleSignOut = async () => {
    try {
      // Show toast first for immediate feedback
      toast({
        title: "Signing out",
        description: "Please wait...",
      });
      
      // Call the signOut function from AuthContext
      await signOut();
      
      // No need to navigate or reload here as the signOut function now handles this
      // The signOut function in AuthContext will force a page reload
    } catch (error) {
      console.error('Error during sign out:', error);
      toast({
        title: "Error signing out",
        description: "There was a problem signing you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/company/${searchQuery.trim().toUpperCase()}`);
      setSearchQuery("");
      setSearchOpen(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleMobileSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/company/${searchQuery.trim().toUpperCase()}`);
      setSearchQuery("");
      setIsMenuOpen(false);
    }
  };

  const handleMobileKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleMobileSearch();
    }
  };
  
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
      <div className="container flex items-center justify-between h-16 px-2 sm:px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-fin-primary to-fin-teal rounded-md flex items-center justify-center">
              <span className="text-white font-bold">FI</span>
            </div>
            <span className="text-xl font-bold text-fin-primary dark:text-white hidden sm:block">Fin Insight</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 ml-6">
            <div className="relative group">
              <Link to="/markets" className="text-slate-700 font-medium flex items-center gap-1 hover:text-fin-primary dark:text-slate-300 dark:hover:text-white">
                Markets <ChevronDown size={16} />
              </Link>
              <div className="absolute top-full left-0 bg-white shadow-md rounded-md p-2 w-48 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all transform origin-top-left border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                <Link to="/markets?type=stocks" className="block px-3 py-2 text-sm hover:bg-slate-100 rounded-md dark:hover:bg-slate-700">Stocks</Link>
                <Link to="/markets?type=etfs" className="block px-3 py-2 text-sm hover:bg-slate-100 rounded-md dark:hover:bg-slate-700">ETFs</Link>
                <Link to="/markets?type=crypto" className="block px-3 py-2 text-sm hover:bg-slate-100 rounded-md dark:hover:bg-slate-700">Crypto</Link>
                <Link to="/markets?type=movers" className="block px-3 py-2 text-sm hover:bg-slate-100 rounded-md dark:hover:bg-slate-700">Market Movers</Link>
              </div>
            </div>
            
            <Link to="/indian-market" className="text-slate-700 font-medium hover:text-fin-primary dark:text-slate-300 dark:hover:text-white">Indian Market</Link>
            
            <Link to="/news" className="text-slate-700 font-medium hover:text-fin-primary dark:text-slate-300 dark:hover:text-white">News</Link>
            
            <div className="relative group">
              <Link to="/tools" className="text-slate-700 font-medium flex items-center gap-1 hover:text-fin-primary dark:text-slate-300 dark:hover:text-white">
                Tools <ChevronDown size={16} />
              </Link>
              <div className="absolute top-full left-0 bg-white shadow-md rounded-md p-2 w-48 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all transform origin-top-left border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                <Link to="/tools" className="block px-3 py-2 text-sm hover:bg-slate-100 rounded-md dark:hover:bg-slate-700">All Tools</Link>
                <Link to="/fingenie" className="block px-3 py-2 text-sm hover:bg-slate-100 rounded-md dark:hover:bg-slate-700 flex items-center gap-2">
                  <Bot size={14} className="text-fin-primary" />
                  FinGenie AI
                </Link>
                <Link to="/portfolio" className="block px-3 py-2 text-sm hover:bg-slate-100 rounded-md dark:hover:bg-slate-700">Portfolio Analysis</Link>
                <Link to="/tools/calculator" className="block px-3 py-2 text-sm hover:bg-slate-100 rounded-md dark:hover:bg-slate-700">Financial Calculator</Link>
              </div>
            </div>
            
            <Link to="/learn" className="text-slate-700 font-medium hover:text-fin-primary dark:text-slate-300 dark:hover:text-white">Learn</Link>
            
            <div className="relative group">
              <Link to="/finpath" className="text-slate-700 font-medium flex items-center gap-1 hover:text-fin-primary dark:text-slate-300 dark:hover:text-white">
                FinPath <ChevronDown size={16} />
              </Link>
              <div className="absolute top-full left-0 bg-white shadow-md rounded-md p-2 w-48 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all transform origin-top-left border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                <Link to="/finpath/assessment" className="block px-3 py-2 text-sm hover:bg-slate-100 rounded-md dark:hover:bg-slate-700">Investor Assessment</Link>
                <Link to="/finpath/plan" className="block px-3 py-2 text-sm hover:bg-slate-100 rounded-md dark:hover:bg-slate-700">Learning Plan</Link>
                <Link to="/finpath/goals" className="block px-3 py-2 text-sm hover:bg-slate-100 rounded-md dark:hover:bg-slate-700">Goal Setting</Link>
              </div>
            </div>
            
            <div className="relative group">
              <Link to="/finwell" className="text-slate-700 font-medium flex items-center gap-1 hover:text-fin-primary dark:text-slate-300 dark:hover:text-white">
                FinWell <ChevronDown size={16} />
              </Link>
              <div className="absolute top-full left-0 bg-white shadow-md rounded-md p-2 w-48 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all transform origin-top-left border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                <Link to="/finwell/budget" className="block px-3 py-2 text-sm hover:bg-slate-100 rounded-md dark:hover:bg-slate-700">Budgeting Tools</Link>
                <Link to="/finwell/savings" className="block px-3 py-2 text-sm hover:bg-slate-100 rounded-md dark:hover:bg-slate-700">Savings Goals</Link>
                <Link to="/finwell/networth" className="block px-3 py-2 text-sm hover:bg-slate-100 rounded-md dark:hover:bg-slate-700">Net Worth</Link>
              </div>
            </div>
          </nav>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
          <div className="hidden sm:block">
            <MarketToggle />
          </div>
          
          {searchOpen ? (
            <div className="relative hidden sm:block">
              <Input
                className="w-[150px] md:w-[200px] lg:w-[300px] h-9 rounded-md pl-9"
                placeholder="Search stocks..."
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  if (!searchQuery) {
                    setSearchOpen(false);
                  }
                }}
              />
              <Search 
                className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 cursor-pointer" 
                onClick={handleSearch}
              />
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex"
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
          )}
          
          <ThemeToggle />
          
          <Button variant="ghost" size="icon" className="hidden lg:flex">
            <BellRing className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          
          {user ? (
            <div className="hidden sm:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="font-medium flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <span className="max-w-[80px] md:max-w-[120px] truncate">{(user as any).username || user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/portfolio">Portfolio</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <>
              <div className="hidden sm:block">
                <Link to="/login">
                  <Button variant="ghost" className="font-medium text-sm md:text-base">Log In</Button>
                </Link>
              </div>
              
              <div className="hidden sm:block">
                <Link to="/signup">
                  <Button className="bg-fin-accent hover:bg-fin-accent-hover text-fin-dark font-medium text-sm md:text-base">Sign Up</Button>
                </Link>
              </div>
            </>
          )}
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="sm:hidden"
            aria-expanded={isMenuOpen}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Menu</span>
          </Button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden p-4 space-y-3 bg-white border-t border-slate-200 dark:bg-slate-900 dark:border-slate-800 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="relative mb-4">
            <Input
              className="w-full h-9 rounded-md pl-9"
              placeholder="Search for stocks (e.g., AAPL, MSFT)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleMobileKeyDown}
            />
            <Search 
              className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 cursor-pointer" 
              onClick={handleMobileSearch}
            />
          </div>
          
          <div className="flex justify-center mb-3">
            <MarketToggle />
          </div>
          
          <Link to="/markets" className="block py-2 px-3 font-medium text-slate-700 hover:bg-slate-100 rounded-md dark:text-slate-300 dark:hover:bg-slate-800">Markets</Link>
          <div className="pl-6 space-y-1 mb-1">
            <Link to="/markets?type=stocks" className="block py-1 px-3 text-sm text-slate-600 hover:bg-slate-100 rounded-md dark:text-slate-400 dark:hover:bg-slate-800">Stocks</Link>
            <Link to="/markets?type=etfs" className="block py-1 px-3 text-sm text-slate-600 hover:bg-slate-100 rounded-md dark:text-slate-400 dark:hover:bg-slate-800">ETFs</Link>
            <Link to="/markets?type=crypto" className="block py-1 px-3 text-sm text-slate-600 hover:bg-slate-100 rounded-md dark:text-slate-400 dark:hover:bg-slate-800">Crypto</Link>
            <Link to="/markets?type=movers" className="block py-1 px-3 text-sm text-slate-600 hover:bg-slate-100 rounded-md dark:text-slate-400 dark:hover:bg-slate-800">Market Movers</Link>
          </div>
          <Link to="/indian-market" className="block py-2 px-3 font-medium text-slate-700 hover:bg-slate-100 rounded-md dark:text-slate-300 dark:hover:bg-slate-800">Indian Market</Link>
          <Link to="/news" className="block py-2 px-3 font-medium text-slate-700 hover:bg-slate-100 rounded-md dark:text-slate-300 dark:hover:bg-slate-800">News</Link>
          <Link to="/tools" className="block py-2 px-3 font-medium text-slate-700 hover:bg-slate-100 rounded-md dark:text-slate-300 dark:hover:bg-slate-800">Tools</Link>
          <div className="pl-6 space-y-1 mb-1">
            <Link to="/fingenie" className="block py-1 px-3 text-sm text-slate-600 hover:bg-slate-100 rounded-md dark:text-slate-400 dark:hover:bg-slate-800 flex items-center gap-2">
              <Bot size={14} className="text-fin-primary" />
              FinGenie AI
            </Link>
            <Link to="/tools/calculator" className="block py-1 px-3 text-sm text-slate-600 hover:bg-slate-100 rounded-md dark:text-slate-400 dark:hover:bg-slate-800">Financial Calculator</Link>
          </div>
          <Link to="/learn" className="block py-2 px-3 font-medium text-slate-700 hover:bg-slate-100 rounded-md dark:text-slate-300 dark:hover:bg-slate-800">Learn</Link>
          <Link to="/finpath" className="block py-2 px-3 font-medium text-slate-700 hover:bg-slate-100 rounded-md dark:text-slate-300 dark:hover:bg-slate-800">FinPath</Link>
          <Link to="/finwell" className="block py-2 px-3 font-medium text-slate-700 hover:bg-slate-100 rounded-md dark:text-slate-300 dark:hover:bg-slate-800">FinWell</Link>
          
          <div className="pt-4 mt-2 border-t border-slate-200 flex flex-col gap-3 dark:border-slate-800">
            {user ? (
              <>
                <div className="flex items-center gap-2 py-2 px-3 bg-slate-50 rounded-md dark:bg-slate-800/50">
                  <User className="h-5 w-5 text-fin-primary" />
                  <span className="font-medium truncate">{(user as any).username || user.email}</span>
                </div>
                <Link to="/profile" className="block py-2 px-3 font-medium text-slate-700 hover:bg-slate-100 rounded-md dark:text-slate-300 dark:hover:bg-slate-800">Profile</Link>
                <Link to="/dashboard" className="block py-2 px-3 font-medium text-slate-700 hover:bg-slate-100 rounded-md dark:text-slate-300 dark:hover:bg-slate-800">Dashboard</Link>
                <Link to="/portfolio" className="block py-2 px-3 font-medium text-slate-700 hover:bg-slate-100 rounded-md dark:text-slate-300 dark:hover:bg-slate-800">Portfolio</Link>
                <Link to="/settings" className="block py-2 px-3 font-medium text-slate-700 hover:bg-slate-100 rounded-md dark:text-slate-300 dark:hover:bg-slate-800">Settings</Link>
                <Button 
                  onClick={handleSignOut} 
                  variant="outline" 
                  className="w-full font-medium text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20 dark:text-red-400"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  <Link to="/login" className="w-full">
                    <Button variant="outline" className="w-full font-medium">Log In</Button>
                  </Link>
                  <Link to="/signup" className="w-full">
                    <Button className="w-full bg-fin-accent hover:bg-fin-accent-hover text-fin-dark font-medium">Sign Up</Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
