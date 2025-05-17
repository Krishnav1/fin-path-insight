import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PortfolioOverview from './components/PortfolioOverview';
import PortfolioMetrics from './components/PortfolioMetrics';
import PortfolioAllocation from './components/PortfolioAllocation';
import PortfolioHoldings from './components/PortfolioHoldings';
import FinGenieInsights from './components/FinGenieInsights';
import ValueAddTools from './components/ValueAddTools';
import { mockPortfolioData } from './data/mockData';

export default function PortfolioAnalysisPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [portfolioData, setPortfolioData] = useState(mockPortfolioData);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Portfolio Analysis</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Track, analyze, and optimize your investment portfolio with powerful insights
          </p>
          
          <Tabs defaultValue="overview" onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="metrics">Risk & Return</TabsTrigger>
              <TabsTrigger value="allocation">Allocation</TabsTrigger>
              <TabsTrigger value="holdings">Holdings</TabsTrigger>
              <TabsTrigger value="insights">FinGenie Insights</TabsTrigger>
              <TabsTrigger value="tools">Smart Tools</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <PortfolioOverview portfolioData={portfolioData} />
            </TabsContent>
            
            <TabsContent value="metrics">
              <PortfolioMetrics portfolioData={portfolioData} />
            </TabsContent>
            
            <TabsContent value="allocation">
              <PortfolioAllocation portfolioData={portfolioData} />
            </TabsContent>
            
            <TabsContent value="holdings">
              <PortfolioHoldings portfolioData={portfolioData} />
            </TabsContent>
            
            <TabsContent value="insights">
              <FinGenieInsights portfolioData={portfolioData} />
            </TabsContent>
            
            <TabsContent value="tools">
              <ValueAddTools portfolioData={portfolioData} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
