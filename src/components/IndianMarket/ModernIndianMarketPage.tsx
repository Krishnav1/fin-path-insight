import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import IndianMarketController from './IndianMarketController';
import MarketOverview from './MarketOverview';
import TopStocks from './TopStocks';
import Watchlist from './Watchlist';
import StockSearch from './StockSearch';
import SectorView from './SectorView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Enhanced Indian Market Page Component
 * Uses modular architecture with separate components for:
 * - Market overview data
 * - Top stocks listing
 * - Stock search with autocomplete
 * - User watchlist
 * - Sector categorization view
 */
const IndianMarketPage: React.FC = () => {
  // Track active tab for mobile view
  const [activeTab, setActiveTab] = useState<string>("overview");

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Indian Stock Market</h1>
        
        {/* Search Bar - Always visible at top */}
        <div className="mb-6">
          <StockSearch />
        </div>
        
        {/* Main market data section wrapped in controller for state management */}
        <IndianMarketController>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Market tabs for mobile view */}
            <div className="lg:hidden w-full mb-4">
              <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 mb-2">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
                  <TabsTrigger value="sectors">Sectors</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-6">
                  <MarketOverview />
                  <TopStocks />
                </TabsContent>
                
                <TabsContent value="watchlist">
                  <Watchlist />
                </TabsContent>
                
                <TabsContent value="sectors">
                  <SectorView stocks={[]} />
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Desktop view - all sections visible */}
            <div className="hidden lg:block lg:col-span-2 space-y-6">
              <MarketOverview />
              <TopStocks />
            </div>
            
            {/* Right sidebar - always visible on desktop */}
            <div className="hidden lg:flex lg:col-span-1 flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Watchlist</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Watchlist />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Sectors</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <SectorView stocks={[]} />
                </CardContent>
              </Card>
            </div>
          </div>
        </IndianMarketController>
      </main>
      
      <Footer />
    </div>
  );
};

export default IndianMarketPage;
