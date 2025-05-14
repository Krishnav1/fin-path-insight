import logging
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import pandas as pd
from typing import Dict, Any, List, Optional
import json
from io import BytesIO

logger = logging.getLogger(__name__)

def generate_kline_chart(data: List[Dict[str, Any]], title: str = "Stock Price") -> str:
    """
    Generate a KLINE (candlestick) chart using Plotly
    
    Args:
        data: List of dictionaries with OHLC data
        title: Chart title
        
    Returns:
        JSON string with chart data
    """
    try:
        # Convert data to DataFrame
        df = pd.DataFrame(data)
        
        # Create figure
        fig = go.Figure(data=[go.Candlestick(
            x=df['date'] if 'date' in df.columns else df.index,
            open=df['open'] if 'open' in df.columns else df['Open'],
            high=df['high'] if 'high' in df.columns else df['High'],
            low=df['low'] if 'low' in df.columns else df['Low'],
            close=df['close'] if 'close' in df.columns else df['Close']
        )])
        
        # Update layout
        fig.update_layout(
            title=title,
            xaxis_title="Date",
            yaxis_title="Price",
            template="plotly_dark",
            height=500,
            margin=dict(l=50, r=50, t=50, b=50)
        )
        
        # Convert to JSON
        return json.dumps(fig.to_dict())
    except Exception as e:
        logger.error(f"Error generating KLINE chart: {str(e)}")
        return "{}"

def generate_valuation_chart(data: Dict[str, Any], peer_data: List[Dict[str, Any]] = None) -> str:
    """
    Generate a valuation comparison chart using Plotly
    
    Args:
        data: Dictionary with company valuation metrics
        peer_data: List of dictionaries with peer company metrics
        
    Returns:
        JSON string with chart data
    """
    try:
        metrics = ['P/E', 'EV/EBITDA', 'P/S', 'P/B']
        company_values = [
            data.get('ratios', {}).get('peRatio', 0),
            data.get('ratios', {}).get('enterpriseValueToEBITDA', 0),
            data.get('ratios', {}).get('priceToSalesRatio', 0),
            data.get('ratios', {}).get('priceToBookRatio', 0)
        ]
        
        # Create figure
        fig = go.Figure()
        
        # Add company data
        fig.add_trace(go.Bar(
            x=metrics,
            y=company_values,
            name=data.get('profile', {}).get('companyName', 'Company'),
            marker_color='rgb(26, 118, 255)'
        ))
        
        # Add peer data if available
        if peer_data:
            for peer in peer_data:
                peer_values = [
                    peer.get('ratios', {}).get('peRatio', 0),
                    peer.get('ratios', {}).get('enterpriseValueToEBITDA', 0),
                    peer.get('ratios', {}).get('priceToSalesRatio', 0),
                    peer.get('ratios', {}).get('priceToBookRatio', 0)
                ]
                
                fig.add_trace(go.Bar(
                    x=metrics,
                    y=peer_values,
                    name=peer.get('profile', {}).get('companyName', 'Peer'),
                ))
        
        # Update layout
        fig.update_layout(
            title="Valuation Comparison",
            xaxis_title="Metric",
            yaxis_title="Value",
            template="plotly_white",
            height=500,
            margin=dict(l=50, r=50, t=50, b=50),
            barmode='group'
        )
        
        # Convert to JSON
        return json.dumps(fig.to_dict())
    except Exception as e:
        logger.error(f"Error generating valuation chart: {str(e)}")
        return "{}"

def generate_analyst_ratings_chart(ratings: List[Dict[str, Any]]) -> str:
    """
    Generate an analyst ratings chart using Plotly
    
    Args:
        ratings: List of dictionaries with analyst ratings
        
    Returns:
        JSON string with chart data
    """
    try:
        # Count ratings
        rating_counts = {"Strong Buy": 0, "Buy": 0, "Hold": 0, "Sell": 0, "Strong Sell": 0}
        
        for rating in ratings:
            r = rating.get('rating', '').lower()
            if 'strong buy' in r or 'outperform' in r:
                rating_counts["Strong Buy"] += 1
            elif 'buy' in r:
                rating_counts["Buy"] += 1
            elif 'hold' in r or 'neutral' in r:
                rating_counts["Hold"] += 1
            elif 'sell' in r or 'underperform' in r:
                rating_counts["Sell"] += 1
            elif 'strong sell' in r:
                rating_counts["Strong Sell"] += 1
        
        # Create figure
        colors = ['green', 'lightgreen', 'yellow', 'orange', 'red']
        fig = go.Figure(data=[go.Pie(
            labels=list(rating_counts.keys()),
            values=list(rating_counts.values()),
            hole=.3,
            marker=dict(colors=colors)
        )])
        
        # Update layout
        fig.update_layout(
            title="Analyst Ratings",
            template="plotly_white",
            height=400,
            margin=dict(l=50, r=50, t=50, b=50)
        )
        
        # Convert to JSON
        return json.dumps(fig.to_dict())
    except Exception as e:
        logger.error(f"Error generating analyst ratings chart: {str(e)}")
        return "{}"

def generate_sentiment_chart(sentiment_data: Dict[str, float]) -> str:
    """
    Generate a sentiment analysis chart using Plotly
    
    Args:
        sentiment_data: Dictionary with sentiment scores
        
    Returns:
        JSON string with chart data
    """
    try:
        categories = ['Technical', 'Fundamental', 'News', 'Overall']
        values = [
            sentiment_data.get('technical', 0),
            sentiment_data.get('fundamental', 0),
            sentiment_data.get('news', 0),
            sentiment_data.get('overall', 0)
        ]
        
        # Create figure
        fig = go.Figure()
        
        # Add bar chart
        fig.add_trace(go.Bar(
            x=categories,
            y=values,
            marker_color=['#FF9999' if v < 0 else '#99FF99' for v in values],
            text=[f"{v:.2f}" for v in values],
            textposition='auto'
        ))
        
        # Update layout
        fig.update_layout(
            title="Sentiment Analysis",
            xaxis_title="Category",
            yaxis_title="Sentiment Score (-1 to +1)",
            template="plotly_white",
            height=400,
            margin=dict(l=50, r=50, t=50, b=50),
            yaxis=dict(range=[-1, 1])
        )
        
        # Convert to JSON
        return json.dumps(fig.to_dict())
    except Exception as e:
        logger.error(f"Error generating sentiment chart: {str(e)}")
        return "{}"
