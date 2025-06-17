// EODHD API Service
// This service provides functions to interact with the EODHD API strictly through Supabase Edge Functions
// This file maintains backward compatibility with the original implementation but uses the modular structure

// Import services from the modular structure
import { 
  marketDataService,
  fundamentalsService,
  newsService,
  cacheService,
  CacheService,
  EODHDService
} from '@/services/eodhd';

// Import old dependencies for backward compatibility
import { callEdgeFunction } from '@/lib/edge-function-client';
import { API_ENDPOINTS } from '@/config/api-config';
import { companyService } from '@/services/company-service';

// Export all the types from our modular services for use elsewhere
export type { 
  CompanyProfile,
  FinancialHighlights,
  BalanceSheetItem,
  IncomeStatementItem, 
  CashFlowItem,
  IntradayPrice,
  HistoricalPrice, 
  RealTimeQuote,
  NewsItem
} from '@/services/eodhd';

// For backward compatibility, provide the same constants used in the original file
const EODHD_FUNDAMENTALS_URL = API_ENDPOINTS.EODHD_FUNDAMENTALS;
const EODHD_PROXY_URL = API_ENDPOINTS.EODHD_PROXY;
const EODHD_REALTIME_URL = API_ENDPOINTS.EODHD_REALTIME;

// Point to our new cache for backward compatibility
const apiCache = cacheService;
const CACHE_TTL = CacheService.DEFAULT_TTL; // 5 minutes cache TTL
const REALTIME_CACHE_TTL = CacheService.REALTIME_TTL; // 1 minute cache TTL for real-time data

// Create a singleton instance of our main service for export
export const eodhd = EODHDService.getInstance();

/**
 * Fetch intraday OHLCV price data from EODHD API
 * @param symbol Stock symbol (e.g., 'AAPL.US')
 * @param interval Interval string (e.g., '5m', '15m', '1h', '1d')
 * @param range Data range (e.g., '1d', '5d', '1m')
 * @returns Array of OHLCV data points
 */
export async function getIntradayPricesEODHD(
  symbol: string,
  interval: string = '5m',
  range: string = '1d'
): Promise<any[] | null> {
  try {
    return await marketDataService.getIntradayPrices(symbol, interval, range);
  } catch (error) {
    console.error('Error fetching EODHD intraday prices:', error);
    return null;
  }
}

/**
 * Get company general information and fundamentals
 * @param symbol Stock symbol
 * @returns Company general information and fundamentals
 */
export async function getCompanyFundamentals(symbol: string) {
  try {
    return await fundamentalsService.getCompanyProfile(symbol);
  } catch (error) {
    console.error('Error fetching company fundamentals:', error);
    throw error;
  }
}

/**
 * Get company financial highlights
 * @param symbol Stock symbol
 * @returns Company financial highlights
 */
export async function getCompanyHighlights(symbol: string) {
  try {
    return await fundamentalsService.getFinancialHighlights(symbol);
  } catch (error) {
    console.error('Error fetching company highlights:', error);
    throw error;
  }
}

/**
 * Get company financial statements
 * @param symbol Stock symbol
 * @returns Company financial statements
 */
export async function getCompanyFinancials(symbol: string) {
  try {
    // Collect all financial data for the company
    const [balanceSheet, incomeStatement, cashFlow] = await Promise.all([
      fundamentalsService.getBalanceSheet(symbol),
      fundamentalsService.getIncomeStatement(symbol),
      fundamentalsService.getCashFlow(symbol)
    ]);
    
    return {
      balanceSheet,
      incomeStatement,
      cashFlow
    };
  } catch (error) {
    console.error('Error fetching company financials:', error);
    throw error;
  }
}

/**
 * Get company balance sheet
 * @param symbol Stock symbol
 * @returns Company balance sheet data
 */
export async function getCompanyBalanceSheet(symbol: string) {
  try {
    return await fundamentalsService.getBalanceSheet(symbol);
  } catch (error) {
    console.error('Error fetching company balance sheet:', error);
    throw error;
  }
}

/**
 * Get company income statement
 * @param symbol Stock symbol
 * @returns Company income statement data
 */
export async function getCompanyIncomeStatement(symbol: string) {
  try {
    return await fundamentalsService.getIncomeStatement(symbol);
  } catch (error) {
    console.error('Error fetching company income statement:', error);
    throw error;
  }
}

/**
 * Get company cash flow statement
 * @param symbol Stock symbol
 * @returns Company cash flow statement data
 */
export async function getCompanyCashFlow(symbol: string) {
  try {
    return await fundamentalsService.getCashFlow(symbol);
  } catch (error) {
    console.error('Error fetching company cash flow:', error);
    throw error;
  }
}

/**
 * Get company earnings history
 * @param symbol Stock symbol
 * @returns Company earnings history
 */
export async function getCompanyEarnings(symbol: string) {
  try {
    return await fundamentalsService.getEarnings(symbol);
  } catch (error) {
    console.error('Error fetching company earnings:', error);
    throw error;
  }
}

/**
 * Get company dividend history
 * @param symbol Stock symbol
 * @returns Company dividend history
 */
export async function getCompanyDividends(symbol: string) {
  try {
    return await fundamentalsService.getDividends(symbol);
  } catch (error) {
    console.error('Error fetching company dividends:', error);
    throw error;
  }
}

/**
 * Get company insider transactions
 * @param symbol Stock symbol
 * @returns Company insider transactions
 */
export async function getCompanyInsiders(symbol: string) {
  try {
    return await fundamentalsService.getInsiderTransactions(symbol);
  } catch (error) {
    console.error('Error fetching company insider transactions:', error);
    throw error;
  }
}

/**
 * Get financial news
 * @param params News parameters (symbol, market, limit, offset, etc.)
 * @returns Array of news items
 */
export async function getFinancialNews(params: any = {}) {
  try {
    return await newsService.getNews(params);
  } catch (error) {
    console.error('Error fetching financial news:', error);
    return [];
  }
}

/**
 * Get live (delayed) stock price data for a symbol or multiple symbols
 * @param symbols Stock symbol or array of symbols (e.g. 'AAPL.US' or ['AAPL.US', 'MSFT.US'])
 * @returns Live stock price data
 */
export async function getLiveStockPrice(symbols: string | string[]) {
  try {
    if (Array.isArray(symbols)) {
      return await marketDataService.getBulkQuotes(symbols);
    } else {
      return await marketDataService.getRealTimeQuote(symbols);
    }
  } catch (error) {
    console.error('Error fetching live stock price:', error);
    return null;
  }
}

/**
 * Get comprehensive company data by combining multiple API calls
 * @param symbol Stock symbol
 * @returns Comprehensive company data
 */
export async function getComprehensiveCompanyData(symbol: string) {
  try {
    // Collect all data about a company in parallel for efficiency
    const eodhData = await Promise.all([
      fundamentalsService.getCompanyProfile(symbol),
      fundamentalsService.getFinancialHighlights(symbol),
      getCompanyFinancials(symbol), // Using our compatibility function that collects all financials
      fundamentalsService.getEarnings(symbol),
      fundamentalsService.getDividends(symbol),
      fundamentalsService.getInsiderTransactions(symbol),
      marketDataService.getRealTimeQuote(symbol)
    ]);
    
    const [
      profileData, 
      highlightsData, 
      financialsData, 
      earningsData, 
      dividendsData, 
      insidersData, 
      quoteData
    ] = eodhData;
      
    // First try to get additional data from Supabase if available
    try {
      const company = await companyService.getCompanyBySymbol(symbol);
      
      if (company) {
        // Get additional data from Supabase
        const supabaseData = await Promise.all([
          companyService.getFinancialMetrics(company.id),
          companyService.getFinancialStatements(company.id, 'income'),
          companyService.getFinancialStatements(company.id, 'balance'),
          companyService.getPeerComparison(company.id)
        ]);
        
        // Type the Supabase responses properly to avoid TypeScript errors
        const metrics: Record<string, any> = supabaseData[0] || {};
        const incomeData: Record<string, any> = supabaseData[1] || {};
        const balanceData: Record<string, any> = supabaseData[2] || {};
        const peerData: any = supabaseData[3] || null;
        
        // Return comprehensive data from both EODHD and Supabase
        return {
          fundamentals: {
            general: {
              Code: metrics?.ticker || company?.symbol,
              Type: metrics?.companyType || null, 
              Name: metrics?.companyName || company?.name,
              Exchange: metrics?.exchange || company?.exchange,
              CurrencyCode: metrics?.currency || null,
              CountryName: metrics?.country || company?.country,
              WebURL: metrics?.website || company?.website,
              LogoURL: metrics?.logoUrl || null,
              FullTimeEmployees: metrics?.fullTimeEmployees || company?.employee_count,
              BusinessSummary: metrics?.description || company?.description,
              Industry: metrics?.industry || company?.industry,
              Sector: metrics?.sector || company?.sector,
              GicSector: metrics?.gicSector || null,
              GicGroup: metrics?.gicGroup || null
            },
            highlights: metrics?.highlights || highlightsData,
            financial_statements: {
              balance_sheet: balanceData?.data || financialsData?.balanceSheet,
              income_statement: incomeData?.data || financialsData?.incomeStatement,
              peer_comparison: peerData || null
            },
            technicals: {}
          },
          historical_data: {
            prices: await getIntradayPricesEODHD(symbol, '1h', '1m'),
            earnings: earningsData,
            dividends: dividendsData,
            splits: [],
            institutional_ownership: insidersData,
            short_interest: [],
            news: await getFinancialNews({ symbols: symbol })
          },
          real_time: quoteData,
          fromSupabase: true
        };
      }
    } catch (supabaseError) {
      console.log('No additional company data found in Supabase:', supabaseError);
    }
    
    // If we don't have Supabase data, return just the EODHD data
    return {
      profile: profileData,
      highlights: highlightsData,
      financials: financialsData,
      earnings: earningsData,
      dividends: dividendsData,
      insiders: insidersData,
      realTimeQuote: quoteData
    };
  } catch (error) {
    console.error('Error fetching comprehensive company data:', error);
    throw error;
  }
}
    

