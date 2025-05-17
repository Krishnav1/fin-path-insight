import { Portfolio, StockHolding, PortfolioMetrics, PortfolioSuggestion } from '@/types/portfolio';

// Mock stock holdings
export const mockStockHoldings: StockHolding[] = [
  { 
    symbol: 'RELIANCE.NS', 
    name: 'Reliance Industries Ltd.', 
    quantity: 50, 
    buyPrice: 2500, 
    currentPrice: 2876.45,
    sector: 'Energy',
    buyDate: '2022-04-15',
    value: 143822.50,
    profit: 18822.50,
    profitPercentage: 15.06,
    allocation: 11.51,
    beta: 1.2
  },
  { 
    symbol: 'TCS.NS', 
    name: 'Tata Consultancy Services Ltd.', 
    quantity: 30, 
    buyPrice: 3200, 
    currentPrice: 3456.80,
    sector: 'Technology',
    buyDate: '2022-05-20',
    value: 103704,
    profit: 7704,
    profitPercentage: 8.02,
    allocation: 8.30,
    beta: 0.9
  },
  { 
    symbol: 'HDFCBANK.NS', 
    name: 'HDFC Bank Ltd.', 
    quantity: 100, 
    buyPrice: 1500, 
    currentPrice: 1678.25,
    sector: 'Financial Services',
    buyDate: '2022-03-10',
    value: 167825,
    profit: 17825,
    profitPercentage: 11.88,
    allocation: 13.43,
    beta: 1.1
  },
  { 
    symbol: 'INFY.NS', 
    name: 'Infosys Ltd.', 
    quantity: 80, 
    buyPrice: 1300, 
    currentPrice: 1456.30,
    sector: 'Technology',
    buyDate: '2022-06-05',
    value: 116504,
    profit: 12504,
    profitPercentage: 12.02,
    allocation: 9.32,
    beta: 0.95
  },
  { 
    symbol: 'SUNPHARMA.NS', 
    name: 'Sun Pharmaceutical Industries Ltd.', 
    quantity: 60, 
    buyPrice: 900, 
    currentPrice: 1023.45,
    sector: 'Healthcare',
    buyDate: '2022-07-12',
    value: 61407,
    profit: 7407,
    profitPercentage: 13.72,
    allocation: 4.91,
    beta: 0.75
  }
];

// Mock portfolio metrics
export const mockPortfolioMetrics: PortfolioMetrics = {
  totalValue: 1250000,
  totalInvested: 1000000,
  totalReturn: 250000,
  totalReturnPercentage: 25,
  cagr: 12.5,
  volatility: 15.2,
  beta: 1.1,
  sharpeRatio: 1.8,
  maxDrawdown: -12.5,
  sectorAllocation: [
    {sector: 'Financial Services', value: 437500, percentage: 35},
    {sector: 'Technology', value: 312500, percentage: 25},
    {sector: 'Energy', value: 187500, percentage: 15},
    {sector: 'Healthcare', value: 150000, percentage: 12},
    {sector: 'Consumer Goods', value: 100000, percentage: 8},
    {sector: 'Others', value: 62500, percentage: 5}
  ]
};

// Mock portfolio suggestions
export const mockSuggestions: PortfolioSuggestion[] = [
  { 
    type: 'alert', 
    message: 'Your portfolio is overweight in the Technology sector (25% vs. benchmark 18%)',
    details: 'Consider diversifying to reduce sector-specific risk'
  },
  { 
    type: 'suggestion', 
    message: 'Consider adding more defensive stocks to reduce portfolio volatility',
    details: 'Your portfolio beta of 1.1 indicates slightly higher volatility than the market'
  },
  { 
    type: 'positive', 
    message: 'Your diversification across large-cap stocks is good',
    details: 'Well-diversified portfolios tend to have better risk-adjusted returns'
  }
];

// Mock performance data
export const mockPerformanceData = [
  { date: 'Jan', value: 1000000 },
  { date: 'Feb', value: 1020000 },
  { date: 'Mar', value: 1050000 },
  { date: 'Apr', value: 1080000 },
  { date: 'May', value: 1100000 },
  { date: 'Jun', value: 1150000 },
  { date: 'Jul', value: 1200000 },
  { date: 'Aug', value: 1250000 }
];

// Complete mock portfolio
export const mockPortfolioData: Portfolio = {
  id: 'mock-portfolio-1',
  name: 'My Investment Portfolio',
  description: 'My long-term investment portfolio focused on growth stocks',
  holdings: mockStockHoldings,
  createdAt: '2022-01-01',
  updatedAt: '2023-05-18',
  totalValue: mockPortfolioMetrics.totalValue,
  totalInvested: mockPortfolioMetrics.totalInvested,
  totalReturn: mockPortfolioMetrics.totalReturn,
  totalReturnPercentage: mockPortfolioMetrics.totalReturnPercentage
};
