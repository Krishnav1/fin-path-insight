// EODHD API Service
// This service provides functions to interact with the EODHD API through our Deno backend
// Enhanced with Supabase-based company data storage

import axios from 'axios';
import { companyService } from '@/services/company-service';

// Base URL for EODHD API endpoints
const EODHD_FUNDAMENTALS_URL = '/api/eodhd-fundamentals';
const EODHD_PROXY_URL = '/api/eodhd-proxy';
const EODHD_REALTIME_URL = '/api/eodhd-realtime';

// Cache for API responses to reduce redundant calls
const apiCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL
const REALTIME_CACHE_TTL = 60 * 1000; // 1 minute cache TTL for real-time data

/**
 * Get company general information and fundamentals
 * @param symbol Stock symbol
 * @returns Company general information and fundamentals
 */
export async function getCompanyFundamentals(symbol: string) {
  const cacheKey = `fundamentals-general-${symbol}`;
  
  // Check cache first
  if (apiCache[cacheKey] && Date.now() - apiCache[cacheKey].timestamp < CACHE_TTL) {
    return apiCache[cacheKey].data;
  }
  
  try {
    const response = await axios.get(EODHD_FUNDAMENTALS_URL, {
      params: {
        symbol,
        type: 'general'
      }
    });
    
    // Cache the response
    apiCache[cacheKey] = {
      data: response.data,
      timestamp: Date.now()
    };
    
    return response.data;
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
  const cacheKey = `fundamentals-highlights-${symbol}`;
  
  // Check cache first
  if (apiCache[cacheKey] && Date.now() - apiCache[cacheKey].timestamp < CACHE_TTL) {
    return apiCache[cacheKey].data;
  }
  
  try {
    const response = await axios.get(EODHD_FUNDAMENTALS_URL, {
      params: {
        symbol,
        type: 'highlights'
      }
    });
    
    // Cache the response
    apiCache[cacheKey] = {
      data: response.data,
      timestamp: Date.now()
    };
    
    return response.data;
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
  const cacheKey = `fundamentals-financials-${symbol}`;
  
  // Check cache first
  if (apiCache[cacheKey] && Date.now() - apiCache[cacheKey].timestamp < CACHE_TTL) {
    return apiCache[cacheKey].data;
  }
  
  try {
    const response = await axios.get(EODHD_FUNDAMENTALS_URL, {
      params: {
        symbol,
        type: 'financials'
      }
    });
    
    // Cache the response
    apiCache[cacheKey] = {
      data: response.data,
      timestamp: Date.now()
    };
    
    return response.data;
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
  const cacheKey = `fundamentals-balancesheet-${symbol}`;
  
  // Check cache first
  if (apiCache[cacheKey] && Date.now() - apiCache[cacheKey].timestamp < CACHE_TTL) {
    return apiCache[cacheKey].data;
  }
  
  try {
    const response = await axios.get(EODHD_FUNDAMENTALS_URL, {
      params: {
        symbol,
        type: 'balancesheet'
      }
    });
    
    // Cache the response
    apiCache[cacheKey] = {
      data: response.data,
      timestamp: Date.now()
    };
    
    return response.data;
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
  const cacheKey = `fundamentals-income-${symbol}`;
  
  // Check cache first
  if (apiCache[cacheKey] && Date.now() - apiCache[cacheKey].timestamp < CACHE_TTL) {
    return apiCache[cacheKey].data;
  }
  
  try {
    const response = await axios.get(EODHD_FUNDAMENTALS_URL, {
      params: {
        symbol,
        type: 'income'
      }
    });
    
    // Cache the response
    apiCache[cacheKey] = {
      data: response.data,
      timestamp: Date.now()
    };
    
    return response.data;
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
  const cacheKey = `fundamentals-cashflow-${symbol}`;
  
  // Check cache first
  if (apiCache[cacheKey] && Date.now() - apiCache[cacheKey].timestamp < CACHE_TTL) {
    return apiCache[cacheKey].data;
  }
  
  try {
    const response = await axios.get(EODHD_FUNDAMENTALS_URL, {
      params: {
        symbol,
        type: 'cashflow'
      }
    });
    
    // Cache the response
    apiCache[cacheKey] = {
      data: response.data,
      timestamp: Date.now()
    };
    
    return response.data;
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
  const cacheKey = `fundamentals-earnings-${symbol}`;
  
  // Check cache first
  if (apiCache[cacheKey] && Date.now() - apiCache[cacheKey].timestamp < CACHE_TTL) {
    return apiCache[cacheKey].data;
  }
  
  try {
    const response = await axios.get(EODHD_FUNDAMENTALS_URL, {
      params: {
        symbol,
        type: 'earnings'
      }
    });
    
    // Cache the response
    apiCache[cacheKey] = {
      data: response.data,
      timestamp: Date.now()
    };
    
    return response.data;
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
  const cacheKey = `fundamentals-dividends-${symbol}`;
  
  // Check cache first
  if (apiCache[cacheKey] && Date.now() - apiCache[cacheKey].timestamp < CACHE_TTL) {
    return apiCache[cacheKey].data;
  }
  
  try {
    const response = await axios.get(EODHD_FUNDAMENTALS_URL, {
      params: {
        symbol,
        type: 'dividends'
      }
    });
    
    // Cache the response
    apiCache[cacheKey] = {
      data: response.data,
      timestamp: Date.now()
    };
    
    return response.data;
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
  const cacheKey = `fundamentals-insiders-${symbol}`;
  
  // Check cache first
  if (apiCache[cacheKey] && Date.now() - apiCache[cacheKey].timestamp < CACHE_TTL) {
    return apiCache[cacheKey].data;
  }
  
  try {
    const response = await axios.get(EODHD_FUNDAMENTALS_URL, {
      params: {
        symbol,
        type: 'insiders'
      }
    });
    
    // Cache the response
    apiCache[cacheKey] = {
      data: response.data,
      timestamp: Date.now()
    };
    
    return response.data;
  } catch (error) {
    console.error('Error fetching company insiders:', error);
    throw error;
  }
}

/**
 * Get live (delayed) stock price data for a symbol or multiple symbols
 * @param symbols Stock symbol or array of symbols (e.g. 'AAPL.US' or ['AAPL.US', 'MSFT.US'])
 * @returns Live stock price data
 */
export async function getLiveStockPrice(symbols: string | string[]) {
  // Convert single symbol to array for consistent handling
  const symbolArray = Array.isArray(symbols) ? symbols : [symbols];
  const symbolsStr = symbolArray.join(',');
  
  const cacheKey = `realtime-${symbolsStr}`;
  
  // Check cache first with shorter TTL for real-time data
  if (apiCache[cacheKey] && Date.now() - apiCache[cacheKey].timestamp < REALTIME_CACHE_TTL) {
    return apiCache[cacheKey].data;
  }
  
  try {
    // If it's a single symbol, use the primary symbol in the URL path
    // If multiple symbols, use the first one in the path and the rest in the 's' parameter
    const primarySymbol = symbolArray[0];
    const additionalSymbols = symbolArray.length > 1 ? symbolArray.slice(1).join(',') : '';
    
    const params: Record<string, string> = { fmt: 'json' };
    if (additionalSymbols) {
      params.s = additionalSymbols;
    }
    
    const response = await axios.get(`${EODHD_REALTIME_URL}/${primarySymbol}`, { params });
    
    // Cache the response with shorter TTL
    apiCache[cacheKey] = {
      data: response.data,
      timestamp: Date.now()
    };
    
    return response.data;
  } catch (error) {
    console.error('Error fetching live stock prices:', error);
    throw error;
  }
}

/**
 * Get comprehensive company data by combining multiple API calls
 * @param symbol Stock symbol
 * @returns Comprehensive company data
 */
export async function getComprehensiveCompanyData(symbol: string) {
  try {
    // First try to get data from Supabase if available
    try {
      const company = await companyService.getCompanyBySymbol(symbol);
      
      if (company) {
        // Get additional data from Supabase
        const [financialMetrics, incomeStatement, balanceSheet, peerComparison] = await Promise.all([
          companyService.getFinancialMetrics(company.id),
          companyService.getFinancialStatements(company.id, 'income'),
          companyService.getFinancialStatements(company.id, 'balance'),
          companyService.getPeerComparison(company.id)
        ]);
        
        // Return comprehensive data from Supabase
        return {
          fundamentals: {
            General: {
              Code: company.symbol,
              Name: company.name,
              Exchange: company.exchange,
              Sector: company.sector,
              Industry: company.industry,
              Description: company.description,
              WebURL: company.website,
              FullTimeEmployees: company.employee_count,
              Officers: { CEO: company.ceo },
              IPODate: company.founded_year ? `${company.founded_year}-01-01` : null,
              CountryName: company.country
            }
          },
          highlights: {
            MarketCapitalization: company.market_cap,
            ...(financialMetrics.length > 0 ? {
              RevenueTTM: financialMetrics[0].revenue,
              GrossProfitTTM: financialMetrics[0].gross_margin,
              ProfitMargin: financialMetrics[0].profit_margin,
              OperatingMarginTTM: financialMetrics[0].operating_margin,
              EPS: financialMetrics[0].eps,
              PERatio: financialMetrics[0].pe_ratio,
              DividendYield: financialMetrics[0].dividend_yield,
              ROE: financialMetrics[0].return_on_equity,
              ROA: financialMetrics[0].return_on_assets,
              FreeCashFlow: financialMetrics[0].free_cash_flow,
              TotalDebtToEquity: financialMetrics[0].debt_to_equity
            } : {})
          },
          financials: financialMetrics,
          balanceSheet: balanceSheet.map(item => item.data),
          incomeStatement: incomeStatement.map(item => item.data),
          peerComparison: peerComparison?.peer_data || [],
          fromSupabase: true
        };
      }
    } catch (supabaseError) {
      console.warn('Could not fetch from Supabase, falling back to API:', supabaseError);
    }
    
    // Fallback to API calls if Supabase data is not available
    const [fundamentals, highlights, financials, balanceSheet, incomeStatement, cashFlow, earnings, dividends] = await Promise.all([
      getCompanyFundamentals(symbol).catch(() => null),
      getCompanyHighlights(symbol).catch(() => null),
      getCompanyFinancials(symbol).catch(() => null),
      getCompanyBalanceSheet(symbol).catch(() => null),
      getCompanyIncomeStatement(symbol).catch(() => null),
      getCompanyCashFlow(symbol).catch(() => null),
      getCompanyEarnings(symbol).catch(() => null),
      getCompanyDividends(symbol).catch(() => null)
    ]);
    
    // Combine all data into a comprehensive object
    return {
      fundamentals,
      highlights,
      financials,
      balanceSheet,
      incomeStatement,
      cashFlow,
      earnings,
      dividends,
      lastUpdated: new Date(),
      fromSupabase: false
    };
  } catch (error) {
    console.error('Error fetching comprehensive company data:', error);
    throw error;
  }
}
