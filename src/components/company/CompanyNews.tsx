import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyData } from "@/pages/CompanyAnalysis";
import { ExternalLink, Calendar, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getCompanyNews } from "@/lib/api-service";

interface CompanyNewsProps {
  companyData: CompanyData;
}

export default function CompanyNews({ companyData }: CompanyNewsProps) {
  const [news, setNews] = useState<any[]>(companyData.news || []);
  const [loading, setLoading] = useState(false);

  // Format published date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)} weeks ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Refresh news data
  const refreshNews = async () => {
    setLoading(true);
    try {
      const freshNews = await getCompanyNews(companyData.ticker);
      if (freshNews && freshNews.length > 0) {
        setNews(freshNews);
      }
    } catch (error) {
      console.error("Error refreshing news:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Latest News</CardTitle>
            <CardDescription>Recent news articles about {companyData.name}</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshNews} 
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </CardHeader>
        <CardContent>
          {news.length === 0 ? (
            <div className="text-center py-6 text-slate-500 dark:text-slate-400">
              <p>No recent news found for {companyData.name}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {news.map((item, index) => (
                <div key={index} className="border-b pb-4 dark:border-slate-700 last:border-b-0 last:pb-0">
                  <a 
                    href={item.url} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group hover:bg-slate-50 p-2 -mx-2 rounded-md transition-colors dark:hover:bg-slate-800"
                  >
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-fin-primary">{item.source}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(item.publishedAt)}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium mb-2 group-hover:text-fin-primary flex items-center gap-1">
                      {item.title}
                      <ExternalLink className="h-3 w-3 inline opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{item.snippet}</p>
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 