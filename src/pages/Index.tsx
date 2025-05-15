import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import MarketOverview from "@/components/home/MarketOverview";
import TopMovers from "@/components/home/TopMovers";
import LatestNews from "@/components/home/LatestNews";
import FinPathPreview from "@/components/home/FinPathPreview";
import PopularTools from "@/components/home/PopularTools";
import LiveMarketTicker from "@/components/home/LiveMarketTicker";
import PromoVideo from "@/components/home/PromoVideo";
import { BookOpen, Award, BarChart2, Layers, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <LiveMarketTicker />
      
      <main className="flex-grow">
        <Hero />
        
        <section className="py-8 md:py-16 bg-white dark:bg-slate-900">
          <div className="container mx-auto px-4">
            <MarketOverview />
          </div>
        </section>
        
        {/* Why Fin Insight Section */}
        <section className="py-12 md:py-20 bg-fin-primary/5 dark:bg-slate-800/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-fin-primary mb-4">Why Fin Insight?</h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                We're building the financial platform we wish existed - focused on simplicity, education, and empowering retail investors.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="w-12 h-12 bg-fin-primary/10 rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-fin-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Simplified for Beginners</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Complex financial concepts broken down into simple, easy-to-understand language for new investors.
                </p>
              </div>
              
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="w-12 h-12 bg-fin-primary/10 rounded-full flex items-center justify-center mb-4">
                  <BarChart2 className="h-6 w-6 text-fin-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">India Market Focus</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Built specifically for Indian retail investors, with data and insights tailored to the Indian financial landscape.
                </p>
              </div>
              
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="w-12 h-12 bg-fin-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-fin-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Unbiased Education</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Educational content with no hidden agendas or commissions - just clear information to help you make better decisions.
                </p>
              </div>
              
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="w-12 h-12 bg-fin-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Layers className="h-6 w-6 text-fin-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Expert Analysis (Premium)</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Gain access to in-depth company reports prepared by our team of financial analysts, made simple for retail investors.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Promo Video Section */}
        <section className="py-12 md:py-20 bg-slate-50 dark:bg-slate-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-fin-primary mb-4">See Fin Insight in Action</h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                Discover how our platform helps investors like you make better financial decisions
              </p>
            </div>
            <PromoVideo />
          </div>
        </section>
        
        {/* New to Investing Section */}
        <section className="py-12 md:py-20 bg-white dark:bg-slate-900">
          <div className="container mx-auto px-4">
            <div className="bg-fin-primary/5 dark:bg-slate-800/20 rounded-xl p-6 md:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="inline-block px-3 py-1 bg-fin-primary/10 text-fin-primary rounded-full text-sm font-medium mb-4">FOR BEGINNERS</span>
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">New to Investing? Start Here!</h2>
                  <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
                    Take your first steps in the world of investing with our curated resources for beginners. No prior financial knowledge required.
                  </p>
                  
                  <div className="space-y-4">
                    <Link to="/learn/basics" className="flex items-center space-x-2 text-fin-primary hover:underline">
                      <ChevronRight size={18} />
                      <span>Understanding the Stock Market</span>
                    </Link>
                    <Link to="/learn/news" className="flex items-center space-x-2 text-fin-primary hover:underline">
                      <ChevronRight size={18} />
                      <span>How to Read Financial News</span>
                    </Link>
                    <Link to="/learn/glossary" className="flex items-center space-x-2 text-fin-primary hover:underline">
                      <ChevronRight size={18} />
                      <span>Glossary of Financial Terms</span>
                    </Link>
                  </div>
                  
                  <div className="mt-8">
                    <Link to="/learn">
                      <Button className="bg-fin-primary hover:bg-fin-primary/90">
                        View All Learning Resources
                      </Button>
                    </Link>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                  <div className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Financial Term of the Day</div>
                  <div className="mb-4">
                    <span className="text-lg font-medium text-fin-primary">P/E Ratio</span>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">
                      Price-to-Earnings Ratio measures a company's current share price relative to its earnings per share. 
                      Think of it as how many years of earnings it would take to pay back your investment at the current price.
                    </p>
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-4">
                    <p>
                      <span className="font-medium">Example:</span> A P/E ratio of 20 means investors are willing to pay ₹20 for every ₹1 of earnings the company generates.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-8 md:py-16 bg-slate-50 dark:bg-slate-950">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <TopMovers />
              </div>
              <div className="lg:col-span-2">
                <LatestNews />
              </div>
            </div>
          </div>
        </section>
        
        {/* Premium Teaser for Fin Insight Team Reports */}
        <section className="py-12 md:py-20 bg-gradient-to-br from-fin-primary to-fin-primary/80 text-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
              <div className="lg:col-span-3">
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium mb-4">PREMIUM FEATURE</span>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Get In-Depth Company Analysis from Our Experts</h2>
                <p className="text-xl mb-8 text-white/90">
                  Our team of analysts breaks down complex companies into easy-to-understand reports tailored for retail investors.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                    <div className="font-semibold mb-2">Business Breakdown</div>
                    <p className="text-sm text-white/80">Clear explanations of what the company does using simple analogies</p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                    <div className="font-semibold mb-2">Financial Insights</div>
                    <p className="text-sm text-white/80">Key numbers explained in retail-friendly terms with visuals</p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                    <div className="font-semibold mb-2">Buy/Hold/Sell View</div>
                    <p className="text-sm text-white/80">Our perspective with clear reasoning behind every recommendation</p>
                  </div>
                </div>
                
                <Link to="/finpath">
                  <Button className="bg-white text-fin-primary hover:bg-white/90">
                    Unlock with Premium
                  </Button>
                </Link>
              </div>
              
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl p-6 text-slate-900 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-bold text-lg">Sample Report Snippet</div>
                    <div className="text-xs px-2 py-1 bg-fin-accent rounded-full">RELIANCE INDUSTRIES</div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-sm font-medium text-slate-500 mb-1">Smart Business Breakdown</div>
                    <p className="text-sm">
                      Think of Reliance as India's version of Amazon + Exxon + Jio combined. They make money from:
                      1) Pulling oil out of the ground and turning it into everyday products
                      2) Selling you everything from groceries to smartphones in their retail stores
                      3) Connecting millions of Indians to the internet through their telecom business
                    </p>
                  </div>
                  
                  <div className="pt-3 border-t">
                    <div className="text-sm font-medium text-slate-500 mb-1">Our Investment View</div>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold">B</div>
                      <div className="text-sm">
                        <span className="font-medium">BUY</span> - Strong fundamentals and diversified revenue streams position Reliance well for future growth.
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-xs text-center text-slate-500">
                    Full report includes detailed analysis, peer comparison, and future outlook.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-8 md:py-16 bg-white dark:bg-slate-900">
          <div className="container mx-auto px-4">
            <FinPathPreview />
          </div>
        </section>
        
        <section className="py-8 md:py-16 bg-slate-50 dark:bg-slate-950">
          <div className="container mx-auto px-4">
            <PopularTools />
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
