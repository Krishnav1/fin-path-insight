/**
 * EODHD Fundamentals Service
 * Handles company fundamentals, financial statements, and company profiles
 */

import { EODHDBaseService, ENDPOINTS } from './base-service';
import { CacheService } from './cache-service';

// Types
export interface CompanyProfile {
  Code: string;
  Type: string;
  Name: string;
  Exchange: string;
  CurrencyCode: string;
  CurrencyName: string;
  CurrencySymbol: string;
  CountryName: string;
  CountryISO: string;
  ISIN: string;
  LEI?: string;
  PrimaryTicker: string;
  CUSIP?: string;
  SEDOL?: string;
  IPODate?: string;
  Sector: string;
  Industry: string;
  Description: string;
  FullTimeEmployees: number;
  UpdatedAt: string;
  WebURL: string;
  LogoURL?: string;
  [key: string]: any;
}

export interface FinancialHighlights {
  MarketCapitalization: number;
  EBITDA: number;
  PERatio: number;
  PEGRatio: number;
  WallStreetTargetPrice: number;
  BookValue: number;
  DividendShare: number;
  DividendYield: number;
  EPS: number;
  RevenuePerShareTTM: number;
  ProfitMargin: number;
  OperatingMarginTTM: number;
  ReturnOnAssetsTTM: number;
  ReturnOnEquityTTM: number;
  RevenueTTM: number;
  GrossProfitTTM: number;
  DilutedEpsTTM: number;
  QuarterlyEarningsGrowthYOY: number;
  QuarterlyRevenueGrowthYOY: number;
  AnalystTargetPrice: number;
  TrailingPE: number;
  ForwardPE: number;
  PriceToSalesRatioTTM: number;
  PriceToBookRatio: number;
  EVToRevenue: number;
  EVToEBITDA: number;
  Beta: number;
  WeekHigh52: number;
  WeekLow52: number;
  DayMovingAverage50: number;
  DayMovingAverage200: number;
  SharesOutstanding: number;
  DividendDate: string;
  ExDividendDate: string;
  [key: string]: any;
}

export interface BalanceSheetItem {
  date: string;
  filing_date: string;
  currency_symbol: string;
  totalAssets: number;
  totalCurrentAssets: number;
  cashAndCashEquivalents: number;
  cashAndShortTermInvestments: number;
  inventory: number;
  currentNetReceivables: number;
  totalNonCurrentAssets: number;
  propertyPlantEquipment: number;
  goodwillAndIntangibleAssets?: number;
  goodwill?: number;
  intangibleAssets?: number;
  longTermInvestments: number;
  totalLiabilities: number;
  totalCurrentLiabilities: number;
  currentAccountsPayable: number;
  shortTermDebt: number;
  totalNonCurrentLiabilities: number;
  longTermDebt: number;
  deferredRevenue?: number;
  deferredTaxLiabilitiesNonCurrent?: number;
  totalShareholderEquity: number;
  treasuryStock?: number;
  retainedEarnings: number;
  commonStock: number;
  commonStockSharesOutstanding: number;
  [key: string]: any;
}

export interface IncomeStatementItem {
  date: string;
  filing_date: string;
  currency_symbol: string;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  researchAndDevelopmentExpenses?: number;
  generalAndAdministrativeExpenses?: number;
  sellingAndMarketingExpenses?: number;
  sellingGeneralAndAdministrativeExpenses: number;
  operatingExpenses: number;
  operatingIncome: number;
  totalOtherIncomeExpensesNet?: number;
  interestExpense?: number;
  interestIncome?: number;
  incomeBeforeTax: number;
  incomeTaxExpense: number;
  netIncome: number;
  eps: number;
  epsDiluted: number;
  weightedAverageSharesOutstanding: number;
  weightedAverageSharesOutstandingDiluted: number;
  [key: string]: any;
}

export interface CashFlowItem {
  date: string;
  filing_date: string;
  currency_symbol: string;
  netIncome: number;
  depreciation: number;
  changesInWorkingCapital: number;
  accountsReceivables?: number;
  accountsPayables?: number;
  inventory?: number;
  cashflowFromOperations: number;
  cashflowFromInvestment: number;
  capitalExpenditures: number;
  cashflowFromFinancing: number;
  dividendsPaid?: number;
  netChangeInCash: number;
  cashAtEndOfPeriod: number;
  cashAtBeginningOfPeriod: number;
  operatingCashFlow: number;
  [key: string]: any;
}

export interface EarningsItem {
  date: string;
  epsActual: number;
  epsEstimate: number;
  epsDifference: number;
  surprisePercent: number;
  [key: string]: any;
}

export interface DividendItem {
  date: string;
  value: number;
  currency: string;
  declarationDate: string;
  recordDate: string;
  paymentDate: string;
  [key: string]: any;
}

export interface InsiderTransaction {
  date: string;
  ownerName: string;
  transactionCode: string;
  transactionType: string;
  securitiesTransacted: number;
  price: number;
  securitiesOwned: number;
  conversionExercisePrice?: number;
  filingDate: string;
  [key: string]: any;
}

/**
 * Service for accessing EODHD company fundamentals data
 */
export class FundamentalsService extends EODHDBaseService {
  private static instance: FundamentalsService;

  private constructor() {
    super();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): FundamentalsService {
    if (!FundamentalsService.instance) {
      FundamentalsService.instance = new FundamentalsService();
    }
    return FundamentalsService.instance;
  }

  /**
   * Get general company profile and fundamentals
   * @param symbol Stock symbol
   * @returns Company profile and general fundamental data
   */
  async getCompanyProfile(symbol: string): Promise<CompanyProfile> {
    const formattedSymbol = this.formatSymbol(symbol);
    
    const data = await this.callAPI<CompanyProfile>(
      ENDPOINTS.FUNDAMENTALS,
      '',
      {
        symbol: formattedSymbol,
        type: 'general'
      },
      CacheService.FUNDAMENTALS_TTL
    );
    
    return this.normalizeResponse<CompanyProfile>(data);
  }

  /**
   * Get company financial highlights
   * @param symbol Stock symbol
   * @returns Financial highlights data
   */
  async getFinancialHighlights(symbol: string): Promise<FinancialHighlights> {
    const formattedSymbol = this.formatSymbol(symbol);
    
    const data = await this.callAPI<FinancialHighlights>(
      ENDPOINTS.FUNDAMENTALS,
      '',
      {
        symbol: formattedSymbol,
        type: 'highlights'
      },
      CacheService.FUNDAMENTALS_TTL
    );
    
    return this.normalizeResponse<FinancialHighlights>(data);
  }

  /**
   * Get company balance sheet statements
   * @param symbol Stock symbol
   * @param period Period of data ('quarterly' or 'annual')
   * @param limit Max number of statements to return
   * @returns Balance sheet data
   */
  async getBalanceSheet(symbol: string, period: 'quarterly' | 'annual' = 'annual', limit: number = 5): Promise<BalanceSheetItem[]> {
    const formattedSymbol = this.formatSymbol(symbol);
    
    const data = await this.callAPI<BalanceSheetItem[]>(
      ENDPOINTS.FUNDAMENTALS,
      '',
      {
        symbol: formattedSymbol,
        type: 'balancesheet',
        period,
        limit
      },
      CacheService.FUNDAMENTALS_TTL
    );
    
    return this.normalizeResponse<BalanceSheetItem[]>(data);
  }

  /**
   * Get company income statements
   * @param symbol Stock symbol
   * @param period Period of data ('quarterly' or 'annual')
   * @param limit Max number of statements to return
   * @returns Income statement data
   */
  async getIncomeStatement(symbol: string, period: 'quarterly' | 'annual' = 'annual', limit: number = 5): Promise<IncomeStatementItem[]> {
    const formattedSymbol = this.formatSymbol(symbol);
    
    const data = await this.callAPI<IncomeStatementItem[]>(
      ENDPOINTS.FUNDAMENTALS,
      '',
      {
        symbol: formattedSymbol,
        type: 'income',
        period,
        limit
      },
      CacheService.FUNDAMENTALS_TTL
    );
    
    return this.normalizeResponse<IncomeStatementItem[]>(data);
  }

  /**
   * Get company cash flow statements
   * @param symbol Stock symbol
   * @param period Period of data ('quarterly' or 'annual')
   * @param limit Max number of statements to return
   * @returns Cash flow statement data
   */
  async getCashFlow(symbol: string, period: 'quarterly' | 'annual' = 'annual', limit: number = 5): Promise<CashFlowItem[]> {
    const formattedSymbol = this.formatSymbol(symbol);
    
    const data = await this.callAPI<CashFlowItem[]>(
      ENDPOINTS.FUNDAMENTALS,
      '',
      {
        symbol: formattedSymbol,
        type: 'cashflow',
        period,
        limit
      },
      CacheService.FUNDAMENTALS_TTL
    );
    
    return this.normalizeResponse<CashFlowItem[]>(data);
  }

  /**
   * Get company earnings history and estimates
   * @param symbol Stock symbol
   * @param limit Max number of earnings to return
   * @returns Earnings data
   */
  async getEarnings(symbol: string, limit: number = 8): Promise<EarningsItem[]> {
    const formattedSymbol = this.formatSymbol(symbol);
    
    const data = await this.callAPI<EarningsItem[]>(
      ENDPOINTS.FUNDAMENTALS,
      '',
      {
        symbol: formattedSymbol,
        type: 'earnings',
        limit
      },
      CacheService.DEFAULT_TTL
    );
    
    return this.normalizeResponse<EarningsItem[]>(data);
  }

  /**
   * Get company dividend history
   * @param symbol Stock symbol
   * @param limit Max number of dividends to return
   * @returns Dividend history data
   */
  async getDividends(symbol: string, limit: number = 20): Promise<DividendItem[]> {
    const formattedSymbol = this.formatSymbol(symbol);
    
    const data = await this.callAPI<DividendItem[]>(
      ENDPOINTS.FUNDAMENTALS,
      '',
      {
        symbol: formattedSymbol,
        type: 'dividends',
        limit
      },
      CacheService.DEFAULT_TTL
    );
    
    return this.normalizeResponse<DividendItem[]>(data);
  }

  /**
   * Get company insider transactions
   * @param symbol Stock symbol
   * @param limit Max number of transactions to return
   * @returns Insider transaction data
   */
  async getInsiderTransactions(symbol: string, limit: number = 20): Promise<InsiderTransaction[]> {
    const formattedSymbol = this.formatSymbol(symbol);
    
    const data = await this.callAPI<InsiderTransaction[]>(
      ENDPOINTS.FUNDAMENTALS,
      '',
      {
        symbol: formattedSymbol,
        type: 'insiders',
        limit
      },
      CacheService.DEFAULT_TTL
    );
    
    return this.normalizeResponse<InsiderTransaction[]>(data);
  }
}

// Export singleton instance
export const fundamentalsService = FundamentalsService.getInstance();
