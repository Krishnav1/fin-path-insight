import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMarket } from "@/hooks/use-market";
import { fetchNews } from "@/utils/eodhd-api";
import { format, parseISO } from "date-fns";
import { any } from "node_modules/zod/lib/external";

interface NewsItem {
  id?: number;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  snippet: string;
  category?: string;
  image?: string;
  symbols?: string[];
  tickers?: string[];
}

export default function News() {
  const { market } = useMarket();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Define the available categories
  // Note: These categories are assigned on the client side since the API doesn't have category filtering
  const categories = ["All", "Markets", "Economy", "Companies", "Technology", "Crypto", "Regulation", "Investing"];

  // Category keywords mapping for client-side filtering
  const categoryKeywords: {[key: string]: string[]} = {
    "Markets": ["market", "stock", "index", "nifty", "sensex", "nasdaq", "dow", "s&p", "rally", "bearish", "bullish"],
    "Economy": ["economy", "inflation", "gdp", "growth", "recession", "central bank", "fed", "rbi", "interest rate", "monetary"],
    "Companies": ["company", "earnings", "revenue", "profit", "ceo", "corporate", "business", "acquisition", "merger"],
    "Technology": ["tech", "technology", "digital", "software", "hardware", "ai", "artificial intelligence", "cloud", "data"],
    "Crypto": ["crypto", "bitcoin", "ethereum", "blockchain", "coin", "token", "defi", "nft", "web3"],
    "Regulation": ["regulation", "compliance", "law", "legal", "policy", "government", "regulatory", "sebi", "sec"],
    "Investing": ["invest", "portfolio", "asset", "fund", "etf", "mutual fund", "dividend", "return", "wealth"]
  };

  // Fetch news data when component mounts or when market/category changes
  useEffect(() => {
    const fetchNewsData = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchParams: any = {
          limit: 30,
          offset: 0,
          sort: 'publishedAt',
          order: 'desc',
        };
        if (market === 'india') {
          fetchParams.symbols = ['RELIANCE.NSE', 'TCS.NSE', 'HDFCBANK.NSE', 'INFY.NSE'];
        }
        const newsData = await fetchNews(fetchParams);
        // Map the EODHD news data to our NewsItem format
        const apiNewsItems: NewsItem[] = newsData.map((article: any) => ({
          title: article.title,
          url: article.link,
          source: article.source || 'EODHD News',
          publishedAt: article.date || article.published || new Date().toISOString(),
          snippet: article.text || article.summary || 'No description provided',
          image: article.image_url || article.banner_image || null,
          symbols: article.symbols || [],
          tickers: article.tickers || []
        })) || [];
        
        // Add category field to each news item based on content analysis
        const categorizedNews = apiNewsItems.map(item => {
          // Combine title and snippet for better category detection
          const content = `${item.title} ${item.snippet}`.toLowerCase();
          
          // Assign category based on keywords found in content
          let assignedCategory = "Other";
          for (const [category, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some(keyword => content.includes(keyword.toLowerCase()))) {
              assignedCategory = category;
              break;
            }
          }
          
          // Use image from API or generate placeholder based on category
          const imagePlaceholder = `https://placehold.co/600x400/e9f5ff/003566?text=${assignedCategory.replace(/ /g, '+')}`;          
        
          return {
            ...item,
            id: Math.random(), // Assign a random ID if not present
            category: assignedCategory,
            image: item.image || imagePlaceholder
          };
        });
        
        // Filter by selected category (if not "All")
        const filteredNews = activeCategory === "All" 
          ? categorizedNews 
          : categorizedNews.filter(news => news.category === activeCategory);
        
        setNewsItems(filteredNews);
        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching news:", err);
        setError(err.message || "Failed to load news. Please try again later.");
        setLoading(false);
      }
    };
    
    // Only call fetchNewsData
    fetchNews();
  }, [market, activeCategory]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Latest Financial News</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Powered by EODHD Financial News API</p>
        
        <div className="mb-6">
          <div className="flex overflow-x-auto gap-2 pb-2">
            {categories.map(category => (
              <button 
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-md whitespace-nowrap transition-colors ${
                  activeCategory === category 
                    ? "bg-fin-primary text-white" 
                    : "bg-white border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fin-primary"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md mb-6">
            {error}
          </div>
        ) : newsItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">No news articles found for this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsItems.map(item => (
              <Link to={item.url} target="_blank" rel="noopener noreferrer" key={item.id}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
                  <div className="aspect-video w-full overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium px-2 py-1 bg-fin-primary/10 text-fin-primary rounded-full">{item.category}</span>
                      <span className="text-xs text-slate-500">
                        {format(parseISO(item.publishedAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <CardDescription className="text-sm">{item.snippet}</CardDescription>
                    <div className="mt-2 text-xs text-slate-500 flex justify-between">
                      <span>Source: {item.source}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}