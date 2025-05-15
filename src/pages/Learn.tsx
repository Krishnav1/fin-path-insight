import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Lightbulb, BarChart, PiggyBank, GraduationCap } from "lucide-react";

export default function Learn() {
  const beginner = [
    {
      id: 1,
      title: "Introduction to Financial Markets",
      description: "Learn the basics of financial markets, including stocks, bonds, and commodities.",
      duration: "15 min read",
      icon: <BarChart className="h-5 w-5" />
    },
    {
      id: 2,
      title: "Understanding Investment Risk",
      description: "Explore the concept of risk in investments and how to manage it effectively.",
      duration: "12 min read",
      icon: <Lightbulb className="h-5 w-5" />
    },
    {
      id: 3,
      title: "Building Your First Portfolio",
      description: "Step-by-step guide to building a well-balanced investment portfolio.",
      duration: "20 min read",
      icon: <PiggyBank className="h-5 w-5" />
    }
  ];

  const intermediate = [
    {
      id: 4,
      title: "Technical Analysis Fundamentals",
      description: "Learn how to read charts and identify patterns for better investment decisions.",
      duration: "25 min read",
      icon: <BarChart className="h-5 w-5" />
    },
    {
      id: 5,
      title: "Fundamental Analysis for Stocks",
      description: "Understand how to evaluate companies using financial statements and ratios.",
      duration: "30 min read",
      icon: <BookOpen className="h-5 w-5" />
    },
    {
      id: 6,
      title: "ETFs vs. Mutual Funds",
      description: "Compare these popular investment vehicles and understand which is right for you.",
      duration: "18 min read",
      icon: <GraduationCap className="h-5 w-5" />
    }
  ];

  const advanced = [
    {
      id: 7,
      title: "Options Trading Strategies",
      description: "Explore advanced options trading strategies for risk management and income generation.",
      duration: "35 min read",
      icon: <BarChart className="h-5 w-5" />
    },
    {
      id: 8,
      title: "Asset Allocation Models",
      description: "Learn about different asset allocation models and how to apply them to your portfolio.",
      duration: "28 min read",
      icon: <PiggyBank className="h-5 w-5" />
    },
    {
      id: 9,
      title: "Tax-Efficient Investing",
      description: "Strategies to minimize tax impact and maximize after-tax returns on your investments.",
      duration: "22 min read",
      icon: <Lightbulb className="h-5 w-5" />
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Learn Financial Concepts</h1>
          <p className="text-slate-600 mb-8 dark:text-slate-400">Discover educational content designed to improve your financial literacy and investment skills.</p>
          
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">For Beginners</h2>
              <Button variant="ghost" className="text-fin-primary flex items-center gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {beginner.map(item => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="bg-fin-primary/10 p-2 rounded-full text-fin-primary">
                        {item.icon}
                      </div>
                      <span className="text-xs text-slate-500">{item.duration}</span>
                    </div>
                    <CardTitle className="mt-3">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <CardDescription>{item.description}</CardDescription>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">Read Article</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
          
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Intermediate Topics</h2>
              <Button variant="ghost" className="text-fin-primary flex items-center gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {intermediate.map(item => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="bg-fin-teal/10 p-2 rounded-full text-fin-teal">
                        {item.icon}
                      </div>
                      <span className="text-xs text-slate-500">{item.duration}</span>
                    </div>
                    <CardTitle className="mt-3">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <CardDescription>{item.description}</CardDescription>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">Read Article</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
          
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Advanced Strategies</h2>
              <Button variant="ghost" className="text-fin-primary flex items-center gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {advanced.map(item => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="bg-fin-accent/10 p-2 rounded-full text-fin-accent">
                        {item.icon}
                      </div>
                      <span className="text-xs text-slate-500">{item.duration}</span>
                    </div>
                    <CardTitle className="mt-3">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <CardDescription>{item.description}</CardDescription>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">Read Article</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 