#!/usr/bin/env python3
import yfinance as yf
import json
import sys
import pandas as pd
from datetime import datetime, timedelta

def get_stock_data(ticker, period='1y', interval='1d'):
    """
    Fetch stock data for the given Indian ticker
    
    Args:
        ticker (str): Indian stock ticker symbol (will add .NS for NSE stocks if not present)
        period (str): Data period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
        interval (str): Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)
    
    Returns:
        dict: JSON-serializable dictionary with stock data
    """
    try:
        # Ensure NSE suffix for Indian stocks if not already present
        if '.' not in ticker and not ticker.endswith('.NS'):
            ticker = f"{ticker}.NS"
            
        stock = yf.Ticker(ticker)
        
        info = {}
        try:
            info = stock.info
        except Exception as e:
            # print(f"Warning: stock.info failed for {ticker}: {e}. Falling back.")
            pass

        current_price = info.get('currentPrice', info.get('regularMarketPrice'))
        # Using multiple fallbacks for previous_close
        previous_close = info.get('previousClose', info.get('regularMarketPreviousClose', info.get('chartPreviousClose')))
        
        day_change = None
        day_change_pct = None

        # Fallback to fast_info if current_price is not found from .info
        if current_price is None and hasattr(stock, 'fast_info'):
            try:
                fast_info = stock.fast_info
                current_price = fast_info.last_price
                if previous_close is None: # Only update if not already found from .info
                    previous_close = fast_info.previous_close
            except Exception as e:
                # print(f"Warning: stock.fast_info failed for {ticker}: {e}. Falling back further.")
                pass
        
        if current_price is not None and previous_close is not None:
            day_change = current_price - previous_close
            if previous_close != 0: # Avoid division by zero
                day_change_pct = (day_change / previous_close) * 100
        
        # Get historical data - actions=False is generally fine for price history.
        # auto_adjust=True handles splits/dividends.
        hist = stock.history(period=period, interval=interval, prepost=False, actions=False, auto_adjust=True)

        # Fallback to historical data if live data points are still insufficient
        if current_price is None and not hist.empty:
            current_price = hist['Close'].iloc[-1]
            # Recalculate day_change and day_change_pct using historical previous close if primary previous_close wasn't available
            if previous_close is not None: 
                 day_change = current_price - previous_close
                 if previous_close != 0:
                    day_change_pct = (day_change / previous_close) * 100
            elif len(hist) >= 2: 
                previous_close_hist = hist['Close'].iloc[-2]
                day_change = current_price - previous_close_hist
                if previous_close_hist != 0: # Avoid division by zero
                    day_change_pct = (day_change / previous_close_hist) * 100
        
        # Get company info
        try:
            company_info = {
                'name': info.get('longName', ''),
                'sector': info.get('sector', ''),
                'industry': info.get('industry', ''),
                'website': info.get('website', ''),
                'logo': info.get('logo_url', ''),
                'marketCap': info.get('marketCap', None),
                'currency': info.get('currency', 'INR'),
            }
        except Exception as e:
            company_info = {'error': str(e)}
        
        # Format historical data
        if hist.empty:
            return {'error': f'No data found for {ticker}'}
        
        # Reset index to make date a column and convert to records
        hist = hist.reset_index()
        
        # Convert datetime to string
        hist['Date'] = hist['Date'].dt.strftime('%Y-%m-%d')
        
        # Convert to list of dictionaries
        history_data = hist.to_dict('records')
        
        # Calculate percentage change (from start of period)
        if history_data:
            period_start_price = history_data[0]['Close']
            period_change_pct = ((current_price - period_start_price) / period_start_price) * 100 if period_start_price else None
        else:
            period_change_pct = None
        
        return {
            'success': True,
            'ticker': ticker,
            'company': company_info,
            'currentPrice': current_price,
            'dayChange': day_change,
            'dayChangePct': day_change_pct,
            'periodChangePct': period_change_pct,
            'history': history_data
        }
    except Exception as e:
        return {'error': str(e), 'ticker': ticker}

def get_multiple_stocks(tickers, period='1y', interval='1d'):
    """
    Fetch data for multiple stock tickers
    
    Args:
        tickers (list): List of stock ticker symbols
        period (str): Data period
        interval (str): Data interval
    
    Returns:
        dict: Dictionary with data for each ticker
    """
    results = {}
    for ticker in tickers:
        results[ticker] = get_stock_data(ticker, period, interval)
    return results

def get_market_indices():
    """
    Fetch data for major Indian market indices with detailed information
    
    Returns:
        dict: Dictionary with comprehensive Indian index data
    """
    # Key Indian indices
    indices = {
        '^NSEI': 'NIFTY 50',
        '^BSESN': 'S&P BSE SENSEX',
        '^CNXNIFTY': 'NIFTY 50',
        '^CNXIT': 'NIFTY IT',
        '^CNXBAN': 'NIFTY BANK',
        '^CNXAUTO': 'NIFTY AUTO',
        '^CNXFMCG': 'NIFTY FMCG',
        '^CNXPHARMA': 'NIFTY PHARMA',
        '^CNXMETAL': 'NIFTY METAL',
        '^CNXREALTY': 'NIFTY REALTY'
    }
    
    results = {}
    for symbol, name in indices.items():
        try:
            data = get_stock_data(symbol, period='1mo', interval='1d')
            # Add index name if not present
            if 'company' in data and 'name' in data['company'] and not data['company']['name']:
                data['company']['name'] = name
            results[symbol] = data
        except Exception as e:
            print(f"Error fetching {symbol}: {e}", file=sys.stderr)
            results[symbol] = {'error': str(e), 'ticker': symbol}
    
    return results

def get_top_gainers_losers():
    """
    Get top gainers and losers for the day in the Indian market
    
    Returns:
        dict: Dictionary with gainers and losers with comprehensive data
    """
    # Comprehensive list of top Indian stocks
    indian_stocks = [
        # Nifty 50 components
        'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
        'HINDUNILVR.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS', 'KOTAKBANK.NS',
        'LT.NS', 'AXISBANK.NS', 'BAJFINANCE.NS', 'ASIANPAINT.NS', 'MARUTI.NS',
        'TATAMOTORS.NS', 'WIPRO.NS', 'HCLTECH.NS', 'SUNPHARMA.NS', 'ONGC.NS',
        'NTPC.NS', 'POWERGRID.NS', 'TITAN.NS', 'ULTRACEMCO.NS', 'BAJAJFINSV.NS',
        'ADANIENT.NS', 'ADANIPORTS.NS', 'JSWSTEEL.NS', 'TATASTEEL.NS', 'HINDALCO.NS',
        
        # Additional large cap stocks
        'DRREDDY.NS', 'DIVISLAB.NS', 'CIPLA.NS', 'NESTLEIND.NS', 'BRITANNIA.NS',
        'HEROMOTOCO.NS', 'M&M.NS', 'EICHERMOT.NS', 'BAJAJ-AUTO.NS', 'TECHM.NS',
        'APOLLOHOSP.NS', 'COALINDIA.NS', 'GRASIM.NS', 'INDUSINDBK.NS', 'UPL.NS'
    ]
    
    results = []
    for ticker in indian_stocks:
        try:
            stock = yf.Ticker(ticker)
            hist = stock.history(period='2d')
            if len(hist) >= 2:
                prev_close = hist['Close'].iloc[-2]
                current_close = hist['Close'].iloc[-1]
                change_pct = ((current_close - prev_close) / prev_close) * 100
                
                results.append({
                    'ticker': ticker.replace('.NS', ''),
                    'name': stock.info.get('longName', ticker),
                    'price': current_close,
                    'changePct': change_pct
                })
        except Exception as e:
            print(f"Error fetching {ticker}: {e}", file=sys.stderr)
    
    # Sort by percentage change
    results.sort(key=lambda x: x.get('changePct', 0), reverse=True)
    
    # Get top 5 gainers and losers
    gainers = results[:5] if len(results) >= 5 else results
    losers = results[-5:] if len(results) >= 5 else results
    losers.reverse()  # Show biggest losers first
    
    return {
        'gainers': gainers,
        'losers': losers
    }

def get_sector_performance():
    """
    Get comprehensive performance data by sector for Indian market
    
    Returns:
        list: List of detailed sector performance data
    """
    # Comprehensive map of Indian sectors and representative stocks
    sectors = {
        'IT': ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS', 'TECHM.NS', 'LTTS.NS', 'MINDTREE.NS', 'MPHASIS.NS'],
        'Banking': ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'AXISBANK.NS', 'KOTAKBANK.NS', 'INDUSINDBK.NS', 'FEDERALBNK.NS', 'BANDHANBNK.NS'],
        'Energy': ['RELIANCE.NS', 'ONGC.NS', 'NTPC.NS', 'POWERGRID.NS', 'BPCL.NS', 'IOC.NS', 'GAIL.NS', 'ADANIGREEN.NS'],
        'Pharma': ['SUNPHARMA.NS', 'DRREDDY.NS', 'CIPLA.NS', 'DIVISLAB.NS', 'BIOCON.NS', 'AUROPHARMA.NS', 'LUPIN.NS', 'ALKEM.NS'],
        'Auto': ['MARUTI.NS', 'TATAMOTORS.NS', 'M&M.NS', 'HEROMOTOCO.NS', 'BAJAJ-AUTO.NS', 'EICHERMOT.NS', 'TVSMOTOR.NS', 'ASHOKLEY.NS'],
        'FMCG': ['HINDUNILVR.NS', 'ITC.NS', 'NESTLEIND.NS', 'BRITANNIA.NS', 'DABUR.NS', 'MARICO.NS', 'GODREJCP.NS', 'COLPAL.NS'],
        'Metals': ['TATASTEEL.NS', 'JSWSTEEL.NS', 'HINDALCO.NS', 'VEDL.NS', 'JINDALSTEL.NS', 'SAIL.NS', 'NATIONALUM.NS', 'APLAPOLLO.NS'],
        'Infrastructure': ['LT.NS', 'ADANIPORTS.NS', 'DLF.NS', 'GODREJPROP.NS', 'OBEROIRLTY.NS', 'PRESTIGE.NS', 'SOBHA.NS', 'BRIGADE.NS'],
        'Telecom': ['BHARTIARTL.NS', 'IDEA.NS', 'TATACOMM.NS', 'HATHWAY.NS', 'NXTDIGITAL.NS'],
        'Cement': ['ULTRACEMCO.NS', 'SHREECEM.NS', 'AMBUJACEM.NS', 'ACC.NS', 'RAMCOCEM.NS', 'JKCEMENT.NS', 'DALBHARAT.NS']
    }
    
    results = []
    for sector, tickers in sectors.items():
        sector_change = 0
        count = 0
        
        for ticker in tickers:
            try:
                stock = yf.Ticker(ticker)
                hist = stock.history(period='1mo')
                if not hist.empty:
                    start_price = hist['Close'].iloc[0]
                    end_price = hist['Close'].iloc[-1]
                    change_pct = ((end_price - start_price) / start_price) * 100
                    sector_change += change_pct
                    count += 1
            except Exception as e:
                print(f"Error calculating sector performance for {ticker}: {e}", file=sys.stderr)
        
        if count > 0:
            avg_change = sector_change / count
            results.append({
                'sector': sector,
                'changePct': avg_change,
                'tickers': tickers
            })
    
    # Sort by performance
    results.sort(key=lambda x: x.get('changePct', 0), reverse=True)
    return results

if __name__ == "__main__":
    # Check if arguments are provided
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No command specified'}))
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'stock':
        if len(sys.argv) < 3:
            print(json.dumps({'error': 'No ticker specified'}))
            sys.exit(1)
        
        ticker = sys.argv[2]
        period = sys.argv[3] if len(sys.argv) > 3 else '1y'
        interval = sys.argv[4] if len(sys.argv) > 4 else '1d'
        
        result = get_stock_data(ticker, period, interval)
        print(json.dumps(result))
    
    elif command == 'multiple':
        if len(sys.argv) < 3:
            print(json.dumps({'error': 'No tickers specified'}))
            sys.exit(1)
        
        tickers = sys.argv[2].split(',')
        period = sys.argv[3] if len(sys.argv) > 3 else '1y'
        interval = sys.argv[4] if len(sys.argv) > 4 else '1d'
        
        result = get_multiple_stocks(tickers, period, interval)
        print(json.dumps(result))
    
    elif command == 'indices':
        result = get_market_indices()
        print(json.dumps(result))
    
    elif command == 'gainers-losers':
        result = get_top_gainers_losers()
        print(json.dumps(result))
    
    elif command == 'sectors':
        result = get_sector_performance()
        print(json.dumps(result))
    
    else:
        print(json.dumps({'error': f'Unknown command: {command}'}))
        sys.exit(1)
