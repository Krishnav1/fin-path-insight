
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useNews, NewsItem } from "@/context/news-context"; // Import useNews and NewsItem

interface LatestNewsProps {
  category?: 'global' | 'india'; // Optional category to filter news
  limit?: number; // Optional limit for number of articles
}

export default function LatestNews({ category, limit = 5 }: LatestNewsProps = {}) { // Default limit to 5 as per previous Index.tsx
  const { 
    globalNews, 
    indianNews, 
    loading: newsLoading, // Rename to avoid conflict if other loading states are used
    error: newsError,     // Rename to avoid conflict
    // refreshNews // We might not need refreshNews directly in this component if it's for display only
  } = useNews();
  
  const [displayNews, setDisplayNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    let newsToDisplay: NewsItem[] = [];
    if (category === 'global') {
      newsToDisplay = globalNews;
    } else if (category === 'india') {
      newsToDisplay = indianNews;
    } else {
      // Fallback if no specific category is provided (though typically it will be)
      // Combine and sort all news by date for a general feed
      newsToDisplay = [...globalNews, ...indianNews]
                        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }
    
    // Apply the limit to the selected news articles
    setDisplayNews(newsToDisplay.slice(0, limit));
  }, [category, limit, globalNews, indianNews]);

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
      {/* Only show header if not being used as a sub-component with its own header */}
      {!category && (
        <CardHeader className="flex flex-row justify-between items-center pb-2">
          <CardTitle className="text-xl dark:text-white">Latest Financial News</CardTitle>
          <Link to="/news" className="text-sm font-medium text-fin-teal hover:underline">
            View All News
          </Link>
        </CardHeader>
      )}
      <CardContent>
        {newsLoading ? (
          <div className="py-4 text-center">Loading latest news...</div>
        ) : newsError ? (
          <div className="py-4 text-center text-red-500">Error: {newsError}</div>
        ) : (
          <div className="space-y-6">
            {displayNews.length > 0 ? displayNews.map((article) => (
              <div key={article.id || article.title} className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="sm:w-1/3 sm:flex-shrink-0 mb-3 sm:mb-0">
                  <Link to={article.link || article.url || '#'} target="_blank" rel="noopener noreferrer">
                    <img 
                      src={article.imageUrl || article.image_url || `https://placehold.co/600x400/e9f5ff/003566?text=${encodeURIComponent(article.category || 'News')}`}
                      alt={article.title} 
                      className="w-full h-40 sm:h-32 object-cover rounded-lg shadow-sm transition-transform hover:scale-105"
                    />
                  </Link>
                </div>
                <div className="sm:w-2/3">
                  <Link to={article.link || article.url || '#'} target="_blank" rel="noopener noreferrer" className="hover:text-fin-primary dark:text-white dark:hover:text-fin-teal">
                    <h3 className="font-semibold text-lg line-clamp-2 mb-1 leading-tight">{article.title}</h3>
                  </Link>
                  <p className="text-slate-600 dark:text-slate-300 text-sm line-clamp-3 mb-2 leading-relaxed">
                    {article.excerpt || article.snippet || (article.content ? article.content.substring(0, 120) + '...' : 'No description available.')}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full text-fin-neutral-light dark:text-fin-neutral-darkest font-medium">{article.category || 'General'}</span>
                    <div className="flex gap-2 items-center">
                      <span className="font-medium truncate max-w-[100px] sm:max-w-[150px]">{article.source}</span>
                      <span className="text-slate-400 dark:text-slate-600">•</span>
                      <span className="whitespace-nowrap">{formatTime(article.publishedAt, undefined)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-4 text-center text-slate-500 dark:text-slate-400">No news articles available for this section.</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
