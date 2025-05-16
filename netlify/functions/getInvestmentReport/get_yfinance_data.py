import yfinance as yf
import json
import sys
import datetime

def get_stock_data(ticker_symbol):
    """
    Fetches comprehensive stock data using yfinance.
    Returns a dictionary with all fetched data points.
    """
    data = {}
    try:
        ticker = yf.Ticker(ticker_symbol)
        current_info = ticker.info
        history_1d = ticker.history(period="1d") # For more reliable current price

        # --- Real-time/Current Price Data ---
        if not history_1d.empty:
            data['currentPrice'] = history_1d['Close'].iloc[-1]
        elif current_info.get('currentPrice'):
            data['currentPrice'] = current_info.get('currentPrice')
        else:
            data['currentPrice'] = current_info.get('previousClose') # Fallback
        
        data['previousClose'] = current_info.get('previousClose')
        data['dayOpen'] = current_info.get('open')
        data['dayHigh'] = current_info.get('dayHigh')
        data['dayLow'] = current_info.get('dayLow')

        if data.get('currentPrice') and data.get('previousClose'):
            data['dayChange'] = data['currentPrice'] - data['previousClose']
            data['dayChangePercent'] = (data['dayChange'] / data['previousClose']) * 100 if data['previousClose'] else 0
        else:
            data['dayChange'] = None
            data['dayChangePercent'] = None

        data['preMarketPrice'] = current_info.get('preMarketPrice')
        data['postMarketPrice'] = current_info.get('postMarketPrice')
        data['currency'] = current_info.get('currency')

        # --- Historical Price Data (for chart hints & technicals) ---
        # Fetch enough data for technical indicator calculation (e.g., 1 year for common RSI/MACD)
        hist_1y = ticker.history(period="1y")
        if not hist_1y.empty:
            data['historicalPrices'] = {
                'dates': [date.strftime('%Y-%m-%d') for date in hist_1y.index],
                'open': [float(price) for price in hist_1y['Open']],
                'high': [float(price) for price in hist_1y['High']],
                'low': [float(price) for price in hist_1y['Low']],
                'close': [float(price) for price in hist_1y['Close']],
                'volume': [int(vol) for vol in hist_1y['Volume']]
            }
        else:
            data['historicalPrices'] = None

        # --- Fundamental Data ---
        data['marketCap'] = current_info.get('marketCap')
        data['beta'] = current_info.get('beta')
        data['trailingPE'] = current_info.get('trailingPE')
        data['forwardPE'] = current_info.get('forwardPE')
        data['priceToSalesTrailing12Months'] = current_info.get('priceToSalesTrailing12Months')
        data['priceToBook'] = current_info.get('priceToBook')
        data['enterpriseToEbitda'] = current_info.get('enterpriseToEbitda') # EV/EBITDA
        data['fiftyTwoWeekHigh'] = current_info.get('fiftyTwoWeekHigh')
        data['fiftyTwoWeekLow'] = current_info.get('fiftyTwoWeekLow')
        data['averageVolume'] = current_info.get('averageVolume')
        data['averageVolume10days'] = current_info.get('averageDailyVolume10Day')
        data['dividendYield'] = current_info.get('dividendYield')
        data['payoutRatio'] = current_info.get('payoutRatio')
        data['earningsTimestamp'] = None
        data['earningsDate'] = None 
        if current_info.get('earningsTimestamp'):
            data['earningsTimestamp'] = current_info.get('earningsTimestamp')
            data['earningsDate'] = datetime.datetime.fromtimestamp(current_info.get('earningsTimestamp')).strftime('%Y-%m-%d')
        elif current_info.get('calendarEvents') and current_info['calendarEvents'].get('earnings'):
            earnings_timestamps = current_info['calendarEvents']['earnings'].get('earningsDate', [])
            if earnings_timestamps:
                # yfinance often gives a list of upcoming earnings date timestamps
                # We'll take the first one (earliest)
                data['earningsTimestamp'] = earnings_timestamps[0]
                data['earningsDate'] = datetime.datetime.fromtimestamp(earnings_timestamps[0]).strftime('%Y-%m-%d')

        # --- Market News ---
        news = []
        try:
            raw_news = ticker.news
            if raw_news:
                for item in raw_news[:5]: # Get top 5 news items
                    news_item = {
                        'title': item.get('title'),
                        'link': item.get('link'),
                        'publisher': item.get('publisher'),
                        'providerPublishTime': item.get('providerPublishTime'),
                        'type': item.get('type')
                    }
                    if item.get('providerPublishTime'):
                         news_item['publishedAt'] = datetime.datetime.fromtimestamp(item.get('providerPublishTime')).strftime('%Y-%m-%d %H:%M:%S UTC')
                    news.append(news_item)
        except Exception as news_e:
            data['news_error'] = f"Could not fetch news: {str(news_e)}"
        data['news'] = news

        # --- Analyst Ratings/Sentiments ---
        recommendations_data = {}
        try:
            recommendations = ticker.recommendations
            if recommendations is not None and not recommendations.empty:
                # Convert DataFrame to dict, but we need to handle the index
                rec_dict = recommendations.tail(10).reset_index().to_dict(orient='records')
                recommendations_data['summary'] = rec_dict
            else:
                recommendations_data['summary'] = []
        except Exception as rec_e:
            recommendations_data['error'] = f"Could not fetch recommendations: {str(rec_e)}"
            recommendations_data['summary'] = []

        recommendations_data['recommendationMean'] = current_info.get('recommendationMean') # e.g. 1.0 Buy, 5.0 Sell
        recommendations_data['recommendationKey'] = current_info.get('recommendationKey') # e.g. 'buy', 'strong_buy'
        recommendations_data['numberOfAnalystOpinions'] = current_info.get('numberOfAnalystOpinions')
        recommendations_data['targetMeanPrice'] = current_info.get('targetMeanPrice')
        recommendations_data['targetHighPrice'] = current_info.get('targetHighPrice')
        recommendations_data['targetLowPrice'] = current_info.get('targetLowPrice')
        data['analystRatings'] = recommendations_data
        
        # --- Technical Indicators placeholders ---
        # yfinance does not provide these directly. They need to be calculated or fetched from EODHD.
        data['rsi'] = "N/A (requires calculation or separate fetch)"
        data['macd'] = "N/A (requires calculation or separate fetch)"

        return data # Return all, including None, for explicit handling in Node.js

    except Exception as e:
        # Log the full error for debugging on Netlify
        error_details = {
            "error": str(e),
            "type": type(e).__name__,
            "message": f"Failed to fetch data from yfinance for {ticker_symbol}."
        }
        return error_details

if __name__ == "__main__":
    if len(sys.argv) > 1:
        ticker_symbol_arg = sys.argv[1]
        # yfinance usually expects .NS for NSE and .BO for BSE (India)
        # And often no suffix for US stocks (e.g. AAPL, MSFT)
        # EODHD uses a different format (e.g. AAPL.US, RELIANCE.NSE)
        # This script expects the yfinance-compatible ticker.
        # The Node.js part will handle the conversion from user input.
        result = get_stock_data(ticker_symbol_arg)
    else:
        result = {"error": "No ticker symbol provided to yfinance script."}
    
    # Ensure everything is serializable to JSON
    def default_serializer(obj):
        if isinstance(obj, (datetime.date, datetime.datetime)):
            return obj.isoformat()
        # Add more types if necessary
        return str(obj) # Fallback to string for unknown types

    try:
        print(json.dumps(result, default=default_serializer))
    except TypeError as te:
        # If serialization fails, print a minimal error JSON
        print(json.dumps({"error": "JSON serialization error in yfinance script", "details": str(te), "original_data_keys": list(result.keys()) if isinstance(result, dict) else []}))
