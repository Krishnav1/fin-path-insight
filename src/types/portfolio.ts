/**
 * Portfolio related type definitions
 */

export interface StockHolding {
  id?: string;
  symbol: string;
  name: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  buyDate?: string;
  sector?: string;
  value?: number;
  profit?: number;
  profitPercentage?: number;
  allocation?: number;
  beta?: number;
}

export interface Portfolio {
  id?: string;
  userId?: string;
  name: string;
  description?: string;
  holdings: StockHolding[];
  createdAt?: string;
  updatedAt?: string;
  totalValue?: number;
  totalInvested?: number;
  totalReturn?: number;
  totalReturnPercentage?: number;
}

export interface PortfolioMetrics {
  totalValue: number;
  totalInvested: number;
  totalReturn: number;
  totalReturnPercentage: number;
  cagr?: number;
  volatility?: number;
  beta?: number;
  sharpeRatio?: number;
  maxDrawdown?: number;
  sectorAllocation?: {sector: string; value: number; percentage: number}[];
}

export interface PortfolioSuggestion {
  type: 'alert' | 'suggestion' | 'positive';
  message: string;
  details?: string;
}

export interface WhatIfScenario {
  symbol: string;
  changePercentage: number;
  newPortfolioValue: number;
  impact: number;
  impactPercentage: number;
}

export interface TaxEstimate {
  symbol: string;
  buyDate: string;
  sellDate: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  gain: number;
  taxRate: number;
  taxAmount: number;
}
