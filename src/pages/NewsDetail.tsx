import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User, Tag, Share2 } from "lucide-react";
import { Loader2 } from "lucide-react";

type NewsArticle = {
  id: number;
  title: string;
  category: string;
  date: string;
  author: string;
  summary: string;
  content: string[];
  relatedArticles: {
    id: number;
    title: string;
    category: string;
  }[];
  image: string;
};

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch from API
    const fetchArticle = async () => {
      setLoading(true);
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data for demo
        const mockArticle: NewsArticle = {
          id: parseInt(id || "1"),
          title: "Global Markets Rally on Economic Data",
          category: "Markets",
          date: "June 15, 2023",
          author: "Jane Smith",
          summary: "Stock markets across the globe rallied today after positive economic data from major economies suggested a soft landing is possible.",
          content: [
            "Stock markets worldwide saw significant gains on Thursday as investors reacted positively to a series of encouraging economic reports that suggest major economies might achieve a 'soft landing' – cooling inflation without triggering a recession.",
            "In the United States, the S&P 500 rose 1.4% to close at a new record high, while the tech-heavy Nasdaq Composite gained 1.8%. European markets also performed well, with the pan-European Stoxx 600 finishing up 1.2%.",
            "The rally was fueled by several factors. First, inflation data released earlier this week showed continued moderation in price increases, reinforcing expectations that central banks might soon pivot to a more accommodative monetary policy stance. Additionally, manufacturing and service sector data came in stronger than anticipated, alleviating concerns about an economic downturn.",
            "\"These numbers suggest we're threading the needle between fighting inflation and maintaining growth,\" said Marcus Johnson, chief economist at Capital Investments. \"The markets are clearly relieved to see evidence that the feared hard landing might be avoided.\"",
            "Asian markets also participated in the rally, with Japan's Nikkei 225 gaining 1.1% and Hong Kong's Hang Seng index rising 1.6%. The positive sentiment extended to emerging markets as well, with indices in Brazil, India, and South Africa all posting gains.",
            "In commodity markets, oil prices climbed on expectations of sustained demand, with Brent crude rising 2.3% to $84.75 per barrel. Gold, often seen as a safe-haven asset, saw modest declines as investors embraced riskier assets.",
            "Bond yields rose slightly as investors shifted away from fixed-income securities, though the moves were contained, suggesting the market isn't anticipating aggressive rate hikes that would significantly impact bond valuations.",
            "Looking ahead, market participants will be closely watching upcoming employment data and central bank communications for further clues about the economic trajectory and monetary policy outlook."
          ],
          relatedArticles: [
            { id: 2, title: "Central Bank Signals Potential Rate Cut", category: "Economy" },
            { id: 3, title: "Tech Sector Leads Stock Market Gains", category: "Sectors" },
            { id: 5, title: "Investors Turn to Safe-Haven Assets", category: "Investing" }
          ],
          image: "https://placehold.co/1200x600/e9f5ff/003566?text=Global+Markets"
        };
        
        setArticle(mockArticle);
      } catch (error) {
        console.error("Error fetching article:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchArticle();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Header />
        <main className="container py-8 px-4 md:px-6">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-fin-primary" />
              <p className="text-slate-500 dark:text-slate-400">Loading article...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Header />
        <main className="container py-8 px-4 md:px-6">
          <div className="flex items-center justify-center h-[60vh] flex-col gap-6">
            <p className="text-xl text-slate-500 dark:text-slate-400">Article not found.</p>
            <Button onClick={() => navigate(-1)} variant="outline" className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Go Back to News
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header />
      <main className="container py-8 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-1 mb-6"
            onClick={() => navigate('/news')}
          >
            <ArrowLeft size={16} />
            <span>Back to News</span>
          </Button>
          
          <div className="mb-8">
            <span className="inline-block px-3 py-1 bg-fin-primary/10 text-fin-primary rounded-full text-sm font-medium mb-4">{article.category}</span>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">{article.title}</h1>
            
            <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400 mb-6">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{article.date}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>By {article.author}</span>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg overflow-hidden mb-8">
            <img 
              src={article.image} 
              alt={article.title} 
              className="w-full object-cover h-[300px] md:h-[400px]"
            />
          </div>
          
          <div className="prose prose-slate dark:prose-invert max-w-none mb-8">
            <p className="text-lg font-medium mb-4 text-slate-700 dark:text-slate-300 italic">
              {article.summary}
            </p>
            
            {article.content.map((paragraph, index) => (
              <p key={index} className="mb-4 text-slate-600 dark:text-slate-400">
                {paragraph}
              </p>
            ))}
          </div>
          
          <div className="flex justify-between items-center border-t border-b py-4 mb-8 dark:border-slate-800">
            <div className="flex items-center gap-1">
              <Tag className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-500 dark:text-slate-400">Markets, Economy, Global</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </Button>
            </div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Related Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {article.relatedArticles.map(related => (
                <Card key={related.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="text-xs font-medium px-2 py-1 bg-fin-primary/10 text-fin-primary rounded-full inline-block mb-2">{related.category}</div>
                    <Button
                      variant="link"
                      className="p-0 h-auto font-medium text-slate-900 dark:text-white hover:text-fin-primary text-left" 
                      onClick={() => {
                        // Navigate without creating browser history that would lead to multiple clicks
                        navigate(`/news/article/${related.id}`, { replace: true });
                      }}
                    >
                      {related.title}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 