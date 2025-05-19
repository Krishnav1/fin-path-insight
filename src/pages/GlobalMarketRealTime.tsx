import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import GlobalMarketRealTime from '@/components/GlobalMarket/GlobalMarketRealTime';

const GlobalMarketRealTimePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />
      <main className="container mx-auto py-8 px-4 md:px-6">
        <GlobalMarketRealTime />
      </main>
      <Footer />
    </div>
  );
};

export default GlobalMarketRealTimePage;
