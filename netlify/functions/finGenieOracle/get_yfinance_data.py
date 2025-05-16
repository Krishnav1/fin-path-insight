import yfinance as yf
import json
import sys
import datetime
import re

def normalize_ticker(ticker_symbol):
    """
    Normalize ticker symbols to yfinance format.
    Examples:
    - AAPL.US -> AAPL
    - RELIANCE.NSE -> RELIANCE.NS
    - INFY.BSE -> INFY.BO
    """
    # Common exchange mappings for yfinance
    exchange_mappings = {
        'NSE': 'NS',
        'BSE': 'BO',
        'US': '',  # US tickers don't need suffix in yfinance
        'NYSE': '',
        'NASDAQ': ''
    }
    
    # Check if ticker has an exchange suffix
    parts = ticker_symbol.split('.')
    if len(parts) > 1:
        symbol, exchange = parts[0], parts[1]
        if exchange in exchange_mappings:
            # Apply mapping
            mapped_exchange = exchange_mappings[exchange]
            if mapped_exchange:
                return f"{symbol}.{mapped_exchange}"
            return symbol  # US tickers
        return ticker_symbol  # Keep as is if unknown exchange
    
    return ticker_symbol  # No exchange suffix

def get_stock_data(ticker_symbol):
    """
    Fetches comprehensive stock data using yfinance.
    Returns a dictionary with all fetched data points.
    """
    data = {
        'ticker': ticker_symbol,
        'normalized_ticker': normalize_ticker(ticker_symbol),
        'timestamp': datetime.datetime.now().isoformat(),
        'data_source': 'yfinance'
    }
    
    try:
        # Normalize ticker for yfinance
        yf_ticker = normalize_ticker(ticker_symbol)
        ticker = yf.Ticker(yf_ticker)
        
        # --- Basic Info ---
        current_info = ticker.info
        data['info'] = {k: v for k, v in current_info.items() if k in [
            'shortName', 'longName', 'sector', 'industry', 'website', 
            'description', 'country', 'exchange', 'currency', 'quoteType'
        ]}
        
        # --- Real-time/Current Price Data ---
        history_1d = ticker.history(period="1d")
        
        price_data = {}
        if not history_1d.empty:
            price_data['currentPrice'] = float(history_1d['Close'].iloc[-1])
            price_data['dayOpen'] = float(history_1d['Open'].iloc[-1])
            price_data['dayHigh'] = float(history_1d['High'].iloc[-1])
            price_data['dayLow'] = float(history_1d['Low'].iloc[-1])
            price_data['volume'] = int(history_1d['Volume'].iloc[-1])
        else:
            # Fallback to info
            price_data['currentPrice'] = current_info.get('currentPrice') or current_info.get('previousClose')
            price_data['dayOpen'] = current_info.get('open')
            price_data['dayHigh'] = current_info.get('dayHigh')
            price_data['dayLow'] = current_info.get('dayLow')
            price_data['volume'] = current_info.get('volume')
        
        price_data['previousClose'] = current_info.get('previousClose')
        price_data['currency'] = current_info.get('currency')
        
        # Calculate day change
        if price_data.get('currentPrice') and price_data.get('previousClose'):
            price_data['dayChange'] = price_data['currentPrice'] - price_data['previousClose']
            price_data['dayChangePercent'] = (price_data['dayChange'] / price_data['previousClose']) * 100
        
        # Pre/post market
        price_data['preMarketPrice'] = current_info.get('preMarketPrice')
        price_data['postMarketPrice'] = current_info.get('postMarketPrice')
        
        data['price'] = price_data
        
        # --- Historical Price Data ---
        # Get 1 year of historical data for charts and technical indicators
        hist_1y = ticker.history(period="1y")
        if not hist_1y.empty:
            data['historical'] = {
                'dates': [date.strftime('%Y-%m-%d') for date in hist_1y.index],
                'open': [float(price) for price in hist_1y['Open']],
                'high': [float(price) for price in hist_1y['High']],
                'low': [float(price) for price in hist_1y['Low']],
                'close': [float(price) for price in hist_1y['Close']],
                'volume': [int(vol) for vol in hist_1y['Volume']]
            }
            
            # Calculate simple moving averages
            data['technical'] = {}
            
            # 50-day SMA
            if len(hist_1y) >= 50:
                sma50 = hist_1y['Close'].rolling(window=50).mean()
                data['technical']['sma50'] = float(sma50.iloc[-1])
                
            # 200-day SMA
            if len(hist_1y) >= 200:
                sma200 = hist_1y['Close'].rolling(window=200).mean()
                data['technical']['sma200'] = float(sma200.iloc[-1])
            
            # Simple RSI calculation (14-period)
            if len(hist_1y) >= 15:  # Need at least 15 days for 14-day RSI
                delta = hist_1y['Close'].diff()
                gain = delta.where(delta > 0, 0).rolling(window=14).mean()
                loss = -delta.where(delta < 0, 0).rolling(window=14).mean()
                rs = gain / loss
                rsi = 100 - (100 / (1 + rs))
                data['technical']['rsi14'] = float(rsi.iloc[-1])
        
        # --- Fundamental Data ---
        fundamentals = {}
        for key in [
            'marketCap', 'beta', 'trailingPE', 'forwardPE', 'priceToBook',
            'priceToSalesTrailing12Months', 'enterpriseToEbitda', 'profitMargins',
            'dividendRate', 'dividendYield', 'payoutRatio', 'trailingEps',
            'forwardEps', 'pegRatio', 'enterpriseValue', 'bookValue',
            'fiftyTwoWeekHigh', 'fiftyTwoWeekLow', 'averageVolume',
            'averageVolume10days', 'sharesOutstanding', 'floatShares'
        ]:
            if key in current_info:
                fundamentals[key] = current_info[key]
        
        data['fundamentals'] = fundamentals
        
        # --- Earnings Data ---
        earnings_data = {}
        
        # Next earnings date
        if current_info.get('earningsTimestamp'):
            earnings_data['nextEarningsDate'] = datetime.datetime.fromtimestamp(
                current_info.get('earningsTimestamp')).strftime('%Y-%m-%d')
        elif current_info.get('calendarEvents') and current_info['calendarEvents'].get('earnings'):
            earnings_timestamps = current_info['calendarEvents']['earnings'].get('earningsDate', [])
            if earnings_timestamps:
                # yfinance often gives a list of upcoming earnings date timestamps
                earnings_data['nextEarningsDate'] = datetime.datetime.fromtimestamp(
                    earnings_timestamps[0]).strftime('%Y-%m-%d')
        
        # Historical earnings
        try:
            earnings = ticker.earnings
            if not earnings.empty:
                earnings_data['historical'] = earnings.to_dict(orient='records')
        except:
            pass
            
        # Earnings estimates
        try:
            earnings_estimates = ticker.earnings_forecasts
            if earnings_estimates is not None and not earnings_estimates.empty:
                earnings_data['estimates'] = earnings_estimates.to_dict(orient='records')
        except:
            pass
            
        data['earnings'] = earnings_data
        
        # --- News ---
        news = []
        try:
            raw_news = ticker.news
            if raw_news:
                for item in raw_news[:10]:  # Get top 10 news items
                    news_item = {
                        'title': item.get('title'),
                        'link': item.get('link'),
                        'publisher': item.get('publisher'),
                        'type': item.get('type')
                    }
                    if item.get('providerPublishTime'):
                        news_item['publishedAt'] = datetime.datetime.fromtimestamp(
                            item.get('providerPublishTime')).strftime('%Y-%m-%d %H:%M:%S UTC')
                    news.append(news_item)
        except Exception as news_e:
            data['news_error'] = f"Could not fetch news: {str(news_e)}"
            
        data['news'] = news
        
        # --- Analyst Ratings ---
        ratings_data = {}
        
        # Summary stats
        ratings_data['recommendationMean'] = current_info.get('recommendationMean')
        ratings_data['recommendationKey'] = current_info.get('recommendationKey')
        ratings_data['numberOfAnalystOpinions'] = current_info.get('numberOfAnalystOpinions')
        ratings_data['targetMeanPrice'] = current_info.get('targetMeanPrice')
        ratings_data['targetHighPrice'] = current_info.get('targetHighPrice')
        ratings_data['targetLowPrice'] = current_info.get('targetLowPrice')
        
        # Detailed recommendations
        try:
            recommendations = ticker.recommendations
            if recommendations is not None and not recommendations.empty:
                # Convert DataFrame to dict, handling the index
                rec_dict = recommendations.tail(10).reset_index().to_dict(orient='records')
                ratings_data['recent'] = rec_dict
        except Exception as rec_e:
            ratings_data['recommendations_error'] = f"Could not fetch recommendations: {str(rec_e)}"
            
        data['ratings'] = ratings_data
        
        # --- Institutional Holders ---
        try:
            institutional_holders = ticker.institutional_holders
            if institutional_holders is not None and not institutional_holders.empty:
                data['institutionalHolders'] = institutional_holders.to_dict(orient='records')
        except:
            pass
            
        # --- Major Holders ---
        try:
            major_holders = ticker.major_holders
            if major_holders is not None and not major_holders.empty:
                data['majorHolders'] = major_holders.to_dict(orient='records')
        except:
            pass
            
        # --- Balance Sheet ---
        try:
            balance_sheet = ticker.balance_sheet
            if balance_sheet is not None and not balance_sheet.empty:
                # Convert to dict, handling the index
                data['balanceSheet'] = balance_sheet.to_dict(orient='dict')
        except:
            pass
            
        # --- Income Statement ---
        try:
            income_stmt = ticker.income_stmt
            if income_stmt is not None and not income_stmt.empty:
                data['incomeStatement'] = income_stmt.to_dict(orient='dict')
        except:
            pass
            
        # --- Cash Flow ---
        try:
            cash_flow = ticker.cashflow
            if cash_flow is not None and not cash_flow.empty:
                data['cashFlow'] = cash_flow.to_dict(orient='dict')
        except:
            pass
            
        return data

    except Exception as e:
        # Log the full error for debugging
        error_details = {
            "error": str(e),
            "type": type(e).__name__,
            "message": f"Failed to fetch data from yfinance for {ticker_symbol}."
        }
        return error_details

def extract_tickers_from_text(text):
    """
    Extract potential stock ticker symbols from text.
    Looks for:
    1. Standard tickers (e.g., AAPL, MSFT)
    2. Tickers with exchange (e.g., AAPL.US, RELIANCE.NSE)
    """
    # Pattern for tickers: 1-5 uppercase letters, optionally followed by .EXCHANGE
    ticker_pattern = r'\b[A-Z]{1,5}(?:\.[A-Z]{2,4})?\b'
    
    # Find all matches
    potential_tickers = re.findall(ticker_pattern, text)
    
    # Filter out common words that might be mistaken for tickers
    common_words = {'A', 'I', 'AM', 'PM', 'CEO', 'CFO', 'CTO', 'COO', 'THE', 'FOR', 'AND', 'OR'}
    filtered_tickers = [ticker for ticker in potential_tickers if ticker not in common_words]
    
    return filtered_tickers

if __name__ == "__main__":
    # Check if a command is provided
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command provided. Use 'data <ticker>' or 'extract <text>'"}))
        sys.exit(1)
        
    command = sys.argv[1]
    
    if command == "data" and len(sys.argv) > 2:
        # Get data for a specific ticker
        ticker_symbol = sys.argv[2]
        result = get_stock_data(ticker_symbol)
    elif command == "extract" and len(sys.argv) > 2:
        # Extract tickers from text
        text = ' '.join(sys.argv[2:])
        result = {"tickers": extract_tickers_from_text(text)}
    else:
        result = {"error": "Invalid command. Use 'data <ticker>' or 'extract <text>'"}
    
    # Ensure everything is serializable to JSON
    def default_serializer(obj):
        if isinstance(obj, (datetime.date, datetime.datetime)):
            return obj.isoformat()
        return str(obj)  # Fallback to string for unknown types

    try:
        print(json.dumps(result, default=default_serializer))
    except TypeError as te:
        # If serialization fails, print a minimal error JSON
        print(json.dumps({
            "error": "JSON serialization error in yfinance script", 
            "details": str(te), 
            "original_data_keys": list(result.keys()) if isinstance(result, dict) else []
        }))
