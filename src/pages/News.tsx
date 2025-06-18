import { Link } from "react-router-dom";
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { format, parseISO, formatDistanceToNowStrict } from 'date-fns';
import { useNews, NewsItem, NEWS_CATEGORIES } from '@/context/news-context';
import { RefreshCw, Search, Calendar, Tag, ExternalLink, Filter, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils'; // For conditional class names

const NewsPage: React.FC = () => {
  const {
    categoryNews,
    loading,
    error,
    refreshNews,
    nextRefreshTime,
    categorizeNews, // If needed for re-categorization or dynamic updates
  } = useNews();

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [countdown, setCountdown] = useState<string>("");
  const articlesPerPage = 9;

  // Update countdown timer for next refresh
  useEffect(() => {
    const updateTimer = () => {
      if (nextRefreshTime) {
        const distance = formatDistanceToNowStrict(nextRefreshTime, { addSuffix: true });
        setCountdown(distance);
      }
    };
    updateTimer(); // Initial call
    const intervalId = setInterval(updateTimer, 1000 * 30); // Update every 30 seconds
    return () => clearInterval(intervalId);
  }, [nextRefreshTime]);

  // Memoized and filtered news articles based on category and search term
  const filteredArticles = useMemo(() => {
    let articlesToFilter: NewsItem[] = [];

    if (selectedCategory === "All") {
      // Combine all news from all categories, ensuring no duplicates if an article appears in multiple lists
      const allArticlesMap = new Map<string, NewsItem>();
      Object.values(categoryNews).flat().forEach(article => {
        if (article.id || article.link) { // Ensure article has a unique identifier
            allArticlesMap.set(article.id || article.link!, article);
        }
      });
      articlesToFilter = Array.from(allArticlesMap.values());
    } else if (categoryNews[selectedCategory]) {
      articlesToFilter = categoryNews[selectedCategory];
    } else {
        // If a category is selected but has no news (e.g. after a refresh with no new items for it)
        articlesToFilter = [];
    }

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      articlesToFilter = articlesToFilter.filter(article =>
        article.title.toLowerCase().includes(lowerSearchTerm) ||
        (article.content && article.content.toLowerCase().includes(lowerSearchTerm)) ||
        (article.excerpt && article.excerpt.toLowerCase().includes(lowerSearchTerm)) ||
        (article.snippet && article.snippet.toLowerCase().includes(lowerSearchTerm)) ||
        (article.source && article.source.toLowerCase().includes(lowerSearchTerm)) ||
        (article.tags && article.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)))
      );
    }
    // Sort by date, most recent first
    return articlesToFilter.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }, [categoryNews, selectedCategory, searchTerm]);

  // Pagination logic
  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = filteredArticles.slice(indexOfFirstArticle, indexOfLastArticle);
  const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top on page change
    }
  };

  const handleRefresh = async () => {
    await refreshNews();
    setCurrentPage(1); // Reset to first page after refresh
  };
  
  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchTerm]);

  // Loading state UI
  if (loading && Object.keys(categoryNews).length === 0) { // Show full page loader only on initial load
    return (
      <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-fin-teal mx-auto mb-4" />
          <p className="text-xl font-semibold text-slate-700 dark:text-slate-300">Loading latest financial news...</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Please wait a moment.</p>
        </div>
      </div>
    );
  }

  // Error state UI
  if (error && Object.keys(categoryNews).length === 0) { // Show full page error only if no data is available
    return (
      <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="text-center p-8 bg-red-50 dark:bg-red-900/30 rounded-lg shadow-xl max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-3">Oops! Something Went Wrong</h2>
          <p className="text-red-600 dark:text-red-300 mb-6">{error}</p>
          <Button onClick={handleRefresh} variant="destructive" size="lg">
            <RefreshCw className="mr-2 h-5 w-5" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8 text-center md:text-left">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
          Financial News Hub
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto md:mx-0">
          Stay informed with the latest financial headlines, market analyses, and economic trends from trusted sources worldwide.
        </p>
      </header>

      {/* Filters, Refresh, and Countdown Section */}
      <div className="mb-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg shadow-md sticky top-16 z-10 backdrop-blur-sm bg-opacity-80 dark:bg-opacity-80">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Category Select */}
          <div className="md:col-span-1">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-fin-teal focus:border-fin-teal">
                <Filter className="h-4 w-4 mr-2 text-slate-500 dark:text-slate-400" />
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent>
                {NEWS_CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Input */}
          <div className="md:col-span-1 relative">
            <Input
              type="text"
              placeholder="Search news..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-fin-teal focus:border-fin-teal"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          </div>

          {/* Refresh Button and Countdown */}
          <div className="md:col-span-1 flex flex-col sm:flex-row items-center justify-end gap-3">
            <Button onClick={handleRefresh} variant="outline" className="w-full sm:w-auto bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border-slate-300 dark:border-slate-600">
              <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
              {loading ? 'Refreshing...' : 'Refresh News'}
            </Button>
            {countdown && (
              <p className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                Next update {countdown}
              </p>
            )}
          </div>
        </div>
        {error && Object.keys(categoryNews).length > 0 && ( // Inline error if some data is already loaded
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-sm flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" /> {error}
            </div>
        )}
      </div>

      {/* News Grid */}
      {currentArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
          {currentArticles.map((article) => (
            <Card key={article.id || article.link} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-fin-teal dark:hover:border-fin-teal transform hover:-translate-y-1">
              <CardHeader className="p-0 relative">
                <a href={article.link || article.url || '#'} target="_blank" rel="noopener noreferrer" className="block">
                  <img 
                    src={article.imageUrl || article.image_url || `https://placehold.co/600x400/e9f5ff/003566?text=${encodeURIComponent(article.category || 'News')}`}
                    alt={article.title} 
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </a>
                {article.category && (
                    <span className="absolute top-3 right-3 bg-fin-teal text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                        {article.category}
                    </span>
                )}
              </CardHeader>
              <CardContent className="p-5 flex-grow flex flex-col">
                <CardTitle className="text-lg font-semibold mb-2 leading-tight line-clamp-3 flex-grow">
                  <a href={article.link || article.url || '#'} target="_blank" rel="noopener noreferrer" className="hover:text-fin-teal dark:hover:text-fin-teal-light transition-colors">
                    {article.title}
                  </a>
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                  {article.excerpt || article.snippet || (article.content ? article.content.substring(0, 120) + '...' : 'No description available.')}
                </CardDescription>
                <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mt-auto">
                  <Calendar className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" /> 
                  <span title={format(parseISO(article.publishedAt), 'PPPp')}>{formatDistanceToNowStrict(parseISO(article.publishedAt), { addSuffix: true })}</span>
                </div>
              </CardContent>
              <CardFooter className="p-4 border-t dark:border-slate-700/50 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px] sm:max-w-[150px]" title={article.source || 'N/A'}>
                  {article.source || 'N/A'}
                </span>
                <a href={article.link || article.url || '#'} target="_blank" rel="noopener noreferrer" className="text-xs text-fin-teal hover:underline flex items-center font-medium">
                  Read More <ExternalLink className="ml-1 h-3.5 w-3.5" />
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 col-span-full">
          <Info className="h-16 w-16 text-slate-400 dark:text-slate-500 mx-auto mb-6" />
          <p className="text-2xl font-semibold text-slate-700 dark:text-slate-300 mb-2">No News Articles Found</p>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {searchTerm ? 
              `Your search for "${searchTerm}" ${selectedCategory !== "All" ? `in ${selectedCategory}` : ''} did not match any articles. Try a different search or category.` :
              `There are no articles for the "${selectedCategory}" category at the moment. Please check back later or try a different category.`
            }
          </p>
          {searchTerm && (
            <Button variant="outline" onClick={() => setSearchTerm("")} className="mt-6">
                Clear Search
            </Button>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-12 flex justify-center items-center space-x-2 flex-wrap gap-2">
          <Button 
            onClick={() => paginate(currentPage - 1)} 
            disabled={currentPage === 1}
            variant="outline"
            className="bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600"
          >
            Previous
          </Button>
          {/* Simplified pagination for many pages - consider a more advanced component for > 10 pages */}
          {[...Array(totalPages).keys()].map(number => {
            const pageNum = number + 1;
            // Show first page, last page, current page, and 2 pages around current page
            if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
              return (
                <Button 
                  key={pageNum} 
                  onClick={() => paginate(pageNum)} 
                  variant={currentPage === pageNum ? "default" : "outline"}
                  className={cn(currentPage !== pageNum && 'bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600', 'px-4 py-2')}
                >
                  {pageNum}
                </Button>
              );
            } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                return <span key={pageNum} className="text-slate-500 dark:text-slate-400">...</span>;
            }
            return null;
          })}
          <Button 
            onClick={() => paginate(currentPage + 1)} 
            disabled={currentPage === totalPages}
            variant="outline"
            className="bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default NewsPage;