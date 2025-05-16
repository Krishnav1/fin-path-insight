
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMarket } from "@/hooks/use-market";
import { useEffect, useState } from "react";
import axios from "axios";

// News article type definition
type NewsArticle = {
  id: string;
  articleId: string;
  title: string;
  excerpt: string;
  snippet?: string;
  source: string;
  publishedAt?: string;
  time?: string;
  category: string;
  imageUrl: string;
  url: string;
};

const mockGlobalNews: NewsArticle[] = [
  {
    id: "1",
    articleId: "fed-signals-potential-rate-cuts",
    title: "Fed Signals Potential Rate Cuts Amid Cooling Inflation Data",
    excerpt: "Federal Reserve officials hint at possible interest rate cuts later this year as inflation shows signs of easing, according to meeting minutes.",
    source: "Market Watch",
    time: "2 hours ago",
    category: "Economy",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80",
    url: "/news/article?id=fed-signals-potential-rate-cuts"
  },
  {
    id: "2",
    articleId: "tech-giants-face-antitrust-scrutiny",
    title: "Tech Giants Face New Antitrust Scrutiny as Regulatory Landscape Shifts",
    excerpt: "Major technology companies are bracing for increased regulatory oversight as new antitrust measures gain bipartisan support.",
    source: "Tech Insider",
    time: "4 hours ago",
    category: "Technology",
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80",
    url: "/news/article?id=tech-giants-face-antitrust-scrutiny"
  },
  {
    id: "3",
    articleId: "renewable-energy-stocks-surge",
    title: "Renewable Energy Stocks Surge Following Climate Policy Announcement",
    excerpt: "Clean energy companies see significant stock price gains after new government initiatives to accelerate the transition to renewable energy sources.",
    source: "Green Invest",
    time: "6 hours ago",
    category: "Energy",
    imageUrl: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80",
    url: "/news/article?id=renewable-energy-stocks-surge"
  },
  {
    id: "4",
    articleId: "global-supply-chain-improvements",
    title: "Global Supply Chain Improvements Show Promising Signs for Inflation Relief",
    excerpt: "Key logistics indicators suggest easing of supply chain bottlenecks, potentially helping to reduce inflationary pressures in consumer goods.",
    source: "Economic Times",
    time: "8 hours ago",
    category: "Global Markets",
    imageUrl: "https://images.unsplash.com/photo-1566543294046-b52b26614cb6?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80",
    url: "/news/article?id=global-supply-chain-improvements"
  }
];

// Mock news data - India
const mockIndiaNews: NewsArticle[] = [
  {
    id: "1",
    articleId: "rbi-holds-benchmark-rates",
    title: "RBI Holds Benchmark Interest Rates Steady Amidst Inflation Concerns",
    excerpt: "The Reserve Bank of India has maintained key policy rates, prioritizing inflation control while supporting economic growth targets.",
    source: "Financial Express",
    time: "3 hours ago",
    category: "Economy",
    imageUrl: "https://images.unsplash.com/photo-1565698228480-539e49b54be8?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80",
    url: "/news/article?id=rbi-holds-benchmark-rates"
  },
  {
    id: "2",
    articleId: "it-sector-recovery",
    title: "IT Sector Shows Promising Recovery with Strong Quarterly Results",
    excerpt: "Major Indian IT companies report better than expected Q1 results, signaling potential rebound in tech spending and project pipeline.",
    source: "The Economic Times",
    time: "5 hours ago",
    category: "Technology",
    imageUrl: "https://images.unsplash.com/photo-1573164574572-cb89e39749b4?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80",
    url: "/news/article?id=it-sector-recovery"
  },
  {
    id: "3",
    articleId: "green-energy-policy-india",
    title: "New Green Energy Policy to Boost Solar Manufacturing in India",
    excerpt: "Government announces incentives for domestic solar panel production, aiming to reduce imports and create manufacturing jobs.",
    source: "Mint",
    time: "7 hours ago",
    category: "Energy",
    imageUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80",
    url: "/news/article?id=green-energy-policy-india"
  },
  {
    id: "4",
    articleId: "auto-sales-rise",
    title: "Auto Sales Rise as Supply Chain Disruptions Ease and Demand Recovers",
    excerpt: "Passenger vehicle sales show strong monthly growth as semiconductor shortages diminish and consumer confidence improves.",
    source: "Business Standard",
    time: "9 hours ago",
    category: "Auto",
    imageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80",
    url: "/news/article?id=auto-sales-rise"
  }
];

export default function LatestNews() {
  const { market } = useMarket();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch news based on market selection
  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // For now, we'll use mock data instead of the failing GNEWS API
        // When you have a valid API key, you can uncomment the API call below
        /*
        const response = await axios.get(`/api/news/latest?market=${market}`);
        if (Array.isArray(response.data)) {
          setNews(response.data);
        } else if (response.data && typeof response.data === 'object' && Array.isArray(response.data.data)) {
          setNews(response.data.data);
        } else {
          throw new Error('Invalid API response format');
        }
        */
        
        // Use mock data based on selected market
        setNews(market === "global" ? mockGlobalNews : mockIndiaNews);
        
      } catch (err) {
        console.error('Error fetching latest news:', err);
        // Don't show error to user since we're using mock data
        setNews(market === "global" ? mockGlobalNews : mockIndiaNews);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [market]);

  // Format the time for display
  const formatTime = (publishedAt: string | undefined, fallbackTime: string | undefined) => {
    if (publishedAt) {
      const date = new Date(publishedAt);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      
      if (diffHrs < 24) {
        return `${diffHrs} ${diffHrs === 1 ? 'hour' : 'hours'} ago`;
      } else {
        return date.toLocaleDateString();
      }
    }
    return fallbackTime || 'Recently';
  };

  return (
    <Card className="dark:border-slate-700">
      <CardHeader className="flex flex-row justify-between items-center pb-2">
        <CardTitle className="text-xl dark:text-white">Latest Financial News</CardTitle>
        <Link to="/news" className="text-sm font-medium text-fin-teal hover:underline">
          View All News
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-4 text-center">Loading latest news...</div>
        ) : error ? (
          <div className="py-4 text-center text-red-500">{error}</div>
        ) : (
          <div className="space-y-6">
            {Array.isArray(news) && news.length > 0 ? news.map((article) => (
              <div key={article.id || article.articleId} className="flex flex-col sm:flex-row gap-4">
                <div className="sm:w-1/3 mb-3 sm:mb-0">
                  <Link to={`/news/article?id=${article.articleId || article.id}`}>
                    <img 
                      src={article.imageUrl} 
                      alt={article.title} 
                      className="w-full h-40 sm:h-28 object-cover rounded-lg"
                    />
                  </Link>
                </div>
                <div className="sm:w-2/3">
                  <Link to={`/news/article?id=${article.articleId || article.id}`} className="hover:text-fin-primary dark:text-white dark:hover:text-fin-teal">
                    <h3 className="font-semibold text-lg line-clamp-2 mb-1">{article.title}</h3>
                  </Link>
                  <p className="text-slate-600 text-sm line-clamp-2 mb-2 dark:text-slate-300">
                    {article.excerpt || article.snippet}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="bg-slate-100 px-2 py-1 rounded dark:bg-slate-800">{article.category}</span>
                    <div className="flex gap-2">
                      <span className="font-medium">{article.source}</span>
                      <span>•</span>
                      <span>{formatTime(article.publishedAt, article.time)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-4 text-center">No news articles available</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
