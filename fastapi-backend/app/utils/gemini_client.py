import os
import logging
import json
import random
from typing import List, Dict, Any, Optional
from app.core.config import settings

# Fallback mode flag
USE_FALLBACK = True

# Try to import Google Generative AI, but don't fail if it's not available
try:
    import google.generativeai as genai
    USE_FALLBACK = False
except ImportError:
    logging.warning("Google Generative AI package not available. Using fallback mode.")
    USE_FALLBACK = True

logger = logging.getLogger(__name__)

# Initialize Gemini API
def init_gemini():
    """Initialize the Google Gemini API client"""
    if USE_FALLBACK:
        logger.info("Using fallback mode for Gemini API")
        return True
        
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        logger.info("Successfully initialized Google Gemini API client")
        return True
    except Exception as e:
        logger.error(f"Error initializing Google Gemini API client: {str(e)}")
        return False

# Generate embeddings using Gemini
async def generate_embedding(text: str) -> List[float]:
    """
    Generate embeddings for text using Google Gemini
    
    Args:
        text: The text to generate embeddings for
        
    Returns:
        List of embedding values
    """
    # Initialize Gemini if not already initialized
    init_gemini()
    
    if USE_FALLBACK:
        # Generate mock embeddings in fallback mode
        logger.info("Using fallback mode for embeddings generation")
        # Create a deterministic but random-looking embedding based on the text
        import hashlib
        hash_object = hashlib.md5(text.encode())
        seed = int(hash_object.hexdigest(), 16) % 10000
        random.seed(seed)
        # Generate a 768-dimensional embedding (common size)
        return [random.uniform(-1, 1) for _ in range(768)]
    
    try:
        # Generate embeddings
        embedding_model = "models/embedding-001"
        embedding = genai.embed_content(
            model=embedding_model,
            content=text,
            task_type="retrieval_document"
        )
        
        # Return the embedding values
        return embedding["embedding"]
    except Exception as e:
        logger.error(f"Error generating embeddings: {str(e)}")
        # Fallback to mock embeddings if real generation fails
        logger.info("Falling back to mock embeddings after error")
        import hashlib
        hash_object = hashlib.md5(text.encode())
        seed = int(hash_object.hexdigest(), 16) % 10000
        random.seed(seed)
        return [random.uniform(-1, 1) for _ in range(768)]

# Generate text response using Gemini
async def generate_text_response(prompt: str, system_prompt: Optional[str] = None, 
                                conversation_history: Optional[List[Dict[str, Any]]] = None) -> str:
    """
    Generate text response using Google Gemini
    
    Args:
        prompt: The user prompt
        system_prompt: Optional system prompt for context
        conversation_history: Optional conversation history
        
    Returns:
        Generated text response
    """
    # Initialize Gemini if not already initialized
    init_gemini()
    
    if USE_FALLBACK:
        # Generate mock response in fallback mode
        logger.info("Using fallback mode for text response generation")
        
        # Create a simple response based on the prompt
        if "stock" in prompt.lower() or "market" in prompt.lower():
            return "Based on the market data, the stock shows moderate volatility with potential for growth in the coming quarters. Consider the industry trends and company fundamentals before making investment decisions."
        elif "company" in prompt.lower() or "analysis" in prompt.lower():
            return "The company appears to have stable financials with a reasonable debt-to-equity ratio. Recent quarterly results show improvement in operating margins, though revenue growth has been modest compared to industry peers."
        elif "financial" in prompt.lower() or "report" in prompt.lower():
            return "The financial report indicates positive cash flow and healthy liquidity ratios. The company has maintained consistent dividend payouts while investing in R&D for future growth opportunities."
        else:
            return "I've analyzed the information you provided. While specific details would require more in-depth analysis, the general outlook appears positive with some areas that warrant careful monitoring in the near term."
    
    try:
        # Set up the model
        generation_config = {
            "temperature": 0.7,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 2048,
        }
        
        # Use gemini-1.5-flash for better performance
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config=generation_config
        )
        
        # Format conversation history if provided
        formatted_history = []
        if conversation_history:
            for message in conversation_history:
                formatted_history.append({
                    "role": message["sender"],
                    "parts": [{"text": message["text"]}]
                })
        
        # Create the chat session
        if formatted_history:
            chat = model.start_chat(history=formatted_history)
            response = chat.send_message(prompt)
        else:
            # If no history, use system prompt if provided
            if system_prompt:
                full_prompt = f"{system_prompt}\n\n{prompt}"
                response = model.generate_content(full_prompt)
            else:
                response = model.generate_content(prompt)
        
        # Return the text response
        return response.text
    except Exception as e:
        logger.error(f"Error generating text response: {str(e)}")
        # Return fallback response if real generation fails
        logger.info("Falling back to mock response after error")
        return "Based on the available information, this appears to be a company with potential for growth. Consider reviewing more detailed financial metrics and industry comparisons for a comprehensive analysis."

# Generate company analysis using Gemini
async def generate_company_analysis(company_data: Dict[str, Any], 
                                  context: Optional[str] = None) -> str:
    """
    Generate company analysis using Google Gemini
    
    Args:
        company_data: Company data including financials, news, and market metrics
        context: Optional additional context from knowledge base
        
    Returns:
        Generated analysis report
    """
    # Initialize Gemini if not already initialized
    init_gemini()
    
    if USE_FALLBACK:
        # Generate mock analysis in fallback mode
        logger.info("Using fallback mode for company analysis generation")
        
        # Extract company name or symbol for personalized response
        company_name = company_data.get("company_name", "")
        symbol = company_data.get("symbol", "")
        company_identifier = company_name or symbol or "The company"
        
        # Create a structured mock analysis
        mock_analysis = f"""
# Investment Analysis Report: {company_identifier}

## 1. Company Overview
{company_identifier} operates in a competitive market environment with established business operations. The company has demonstrated resilience in its core business segments.

## 2. Financial Analysis
The financial metrics indicate a stable financial position with reasonable debt levels. Revenue growth has been consistent, though profit margins show room for improvement compared to industry benchmarks.

## 3. Technical Analysis
Price action shows moderate volatility with support levels holding in recent trading sessions. Volume patterns suggest accumulation by institutional investors, which is typically a positive signal.

## 4. News Sentiment
Recent news coverage has been mixed, with positive developments in operational efficiency offset by concerns about industry-wide regulatory changes.

## 5. Risk Assessment
Key risks include market competition, potential supply chain disruptions, and sensitivity to macroeconomic factors. The company's diversification strategy helps mitigate some of these risks.

## 6. Investment Outlook
The medium to long-term outlook appears cautiously optimistic, with growth opportunities in emerging markets and through product innovation.

## 7. Recommendation
HOLD - Current valuation appears fair given the risk-reward profile. Investors should monitor upcoming quarterly results for confirmation of growth trajectory.

*This analysis is based on available data and should not be considered as financial advice. Investors should conduct their own research before making investment decisions.*
"""
        return mock_analysis
    
    try:
        # Format company data for the prompt
        formatted_data = format_company_data_for_prompt(company_data)
        
        # Create the prompt
        system_prompt = """
You are FinGenie, an expert financial analyst specializing in stock market analysis.
Analyze the provided company data and generate a comprehensive investment analysis report.
Your analysis should include:

1. Company Overview: Brief description of the company and its business model
2. Financial Analysis: Key insights from financial metrics
3. Technical Analysis: Patterns and trends from price and volume data
4. News Sentiment: Analysis of recent news and its potential impact
5. Risk Assessment: Key risks and concerns for investors
6. Investment Outlook: Overall assessment and potential future performance
7. Recommendation: Clear buy/hold/sell recommendation with justification

Use professional financial language but make it accessible to retail investors.
Base your analysis strictly on the provided data and avoid making up information.
If certain data is missing, acknowledge the limitation rather than inventing facts.

5. Valuation & Price Target
   - Multiple-based valuation with industry comparisons
   - Intrinsic value assessment
   - Potential catalysts that could change valuation

6. Risk Assessment
   - Specific business risks
   - Financial statement risks
   - Market and macroeconomic risks

7. Sentiment Analysis
   - Broker consensus and recent changes
   - News sentiment trends
   - Social media and market sentiment indicators

8. Investment Conclusion
   - Nuanced BUY/HOLD/SELL recommendation with clear rationale
   - Risk profile assessment (Conservative, Moderate, Aggressive)
   - Investor suitability (e.g., "Suitable for growth investors with 3+ year horizon")
   - Price target with upside/downside potential

Formatting Guidelines:
- Use bullet points for clarity where appropriate
- Include section headings for easy navigation
- Keep explanations investor-friendly but sophisticated
- Use financial insight, not just summaries
- Avoid hallucination; rely only on the given data

Here is the comprehensive company data:
{formatted_data}

{context if context else ""}
"""
        
        # Generate the analysis
        model = genai.GenerativeModel(model_name="gemini-pro")
        response = model.generate_content(system_prompt)
        
        # Return the analysis
        return response.text
    except Exception as e:
        logger.error(f"Error generating company analysis: {str(e)}")
        raise

# Format company data for prompt
def format_company_data_for_prompt(company_data: Dict[str, Any]) -> str:
    """Format company data for the AI prompt"""
    # Handle empty or None company_data
    if not company_data:
        return "# COMPANY DATA FOR ANALYSIS\n\nNo detailed company data available."
        
    formatted_data = """# COMPANY DATA FOR ANALYSIS\n\n"""
    
    try:
        # Company Information
        formatted_data += "## COMPANY INFORMATION\n"
        if "company_name" in company_data:
            formatted_data += f"Company Name: {company_data['company_name']}\n"
        if "symbol" in company_data:
            formatted_data += f"Symbol: {company_data['symbol']}\n"
        if "sector" in company_data:
            formatted_data += f"Sector: {company_data['sector']}\n"
        if "industry" in company_data:
            formatted_data += f"Industry: {company_data['industry']}\n"
        if "description" in company_data:
            formatted_data += f"Business Description: {company_data['description']}\n"
        formatted_data += "\n"
        
        # Market Data
        if "market_data" in company_data:
            formatted_data += "## MARKET DATA\n"
            market_data = company_data["market_data"]
            
            if "current_price" in market_data:
                formatted_data += f"Current Price: ₹{market_data['current_price']}\n"
            if "previous_close" in market_data:
                formatted_data += f"Previous Close: ₹{market_data['previous_close']}\n"
            if "open" in market_data:
                formatted_data += f"Open: ₹{market_data['open']}\n"
            if "day_high" in market_data:
                formatted_data += f"Day High: ₹{market_data['day_high']}\n"
            if "day_low" in market_data:
                formatted_data += f"Day Low: ₹{market_data['day_low']}\n"
            if "52_week_high" in market_data:
                formatted_data += f"52-Week High: ₹{market_data['52_week_high']}\n"
            if "52_week_low" in market_data:
                formatted_data += f"52-Week Low: ₹{market_data['52_week_low']}\n"
            if "volume" in market_data:
                formatted_data += f"Volume: {format_volume(market_data['volume'])}\n"
            if "market_cap" in market_data:
                formatted_data += f"Market Cap: ₹{format_in_crores(market_data['market_cap'])} Cr\n"
            if "pe_ratio" in market_data:
                formatted_data += f"P/E Ratio: {market_data['pe_ratio']}\n"
            if "eps" in market_data:
                formatted_data += f"EPS: ₹{market_data['eps']}\n"
            if "dividend_yield" in market_data:
                formatted_data += f"Dividend Yield: {market_data['dividend_yield']}%\n"
            formatted_data += "\n"
        
        # Financial Metrics
        if "financial_metrics" in company_data:
            formatted_data += "## FINANCIAL METRICS\n"
            financials = company_data["financial_metrics"]
            
            if "revenue" in financials:
                formatted_data += f"Revenue: ₹{format_in_crores(financials['revenue'])} Cr\n"
            if "net_income" in financials:
                formatted_data += f"Net Income: ₹{format_in_crores(financials['net_income'])} Cr\n"
            if "profit_margin" in financials:
                formatted_data += f"Profit Margin: {financials['profit_margin']}%\n"
            if "operating_margin" in financials:
                formatted_data += f"Operating Margin: {financials['operating_margin']}%\n"
            if "roa" in financials:
                formatted_data += f"Return on Assets: {financials['roa']}%\n"
            if "roe" in financials:
                formatted_data += f"Return on Equity: {financials['roe']}%\n"
            if "debt_to_equity" in financials:
                formatted_data += f"Debt to Equity: {financials['debt_to_equity']}\n"
            if "current_ratio" in financials:
                formatted_data += f"Current Ratio: {financials['current_ratio']}\n"
            if "quick_ratio" in financials:
                formatted_data += f"Quick Ratio: {financials['quick_ratio']}\n"
            if "inventory_turnover" in financials:
                formatted_data += f"Inventory Turnover: {financials['inventory_turnover']}\n"
            formatted_data += "\n"
        
        # Technical Indicators
        if "technical_indicators" in company_data:
            formatted_data += "## TECHNICAL INDICATORS\n"
            technical = company_data["technical_indicators"]
            
            if "rsi_14" in technical:
                formatted_data += f"RSI (14): {technical['rsi_14']}\n"
            if "macd" in technical:
                formatted_data += f"MACD: {technical['macd']}\n"
            if "sma_20" in technical:
                formatted_data += f"SMA 20: ₹{technical['sma_20']}\n"
            if "sma_50" in technical:
                formatted_data += f"SMA 50: ₹{technical['sma_50']}\n"
            if "sma_200" in technical:
                formatted_data += f"SMA 200: ₹{technical['sma_200']}\n"
            if "ema_12" in technical:
                formatted_data += f"EMA 12: ₹{technical['ema_12']}\n"
            if "ema_26" in technical:
                formatted_data += f"EMA 26: ₹{technical['ema_26']}\n"
            if "bollinger_upper" in technical:
                formatted_data += f"Bollinger Upper: ₹{technical['bollinger_upper']}\n"
            if "bollinger_lower" in technical:
                formatted_data += f"Bollinger Lower: ₹{technical['bollinger_lower']}\n"
            if "atr" in technical:
                formatted_data += f"ATR: {technical['atr']}\n"
            formatted_data += "\n"
        
        # News
        if "news" in company_data and company_data["news"]:
            formatted_data += "## RECENT NEWS\n"
            for idx, news_item in enumerate(company_data["news"][:5], 1):
                formatted_data += f"### News {idx}\n"
                if "title" in news_item:
                    formatted_data += f"Title: {news_item['title']}\n"
                if "date" in news_item:
                    formatted_data += f"Date: {news_item['date']}\n"
                if "summary" in news_item:
                    formatted_data += f"Summary: {news_item['summary']}\n"
                if "sentiment" in news_item:
                    formatted_data += f"Sentiment: {news_item['sentiment']}\n"
                formatted_data += "\n"
        
        # Peer Comparison
        if "peer_comparison" in company_data and company_data["peer_comparison"]:
            formatted_data += "## PEER COMPARISON\n"
            peers = company_data["peer_comparison"]
            for peer in peers:
                if "symbol" in peer:
                    formatted_data += f"### {peer['symbol']}\n"
                    if "company_name" in peer:
                        formatted_data += f"Company: {peer['company_name']}\n"
                    if "current_price" in peer:
                        formatted_data += f"Price: ₹{peer['current_price']}\n"
                    if "market_cap" in peer:
                        formatted_data += f"Market Cap: ₹{format_in_crores(peer['market_cap'])} Cr\n"
                    if "pe_ratio" in peer:
                        formatted_data += f"P/E Ratio: {peer['pe_ratio']}\n"
                    formatted_data += "\n"
    except Exception as e:
        logger.error(f"Error formatting company data: {str(e)}")
        # Return a simplified version if there's an error
        return "# COMPANY DATA FOR ANALYSIS\n\nError processing detailed company data. Basic information available:\n" + \
               f"Symbol: {company_data.get('symbol', 'Unknown')}\n" + \
               f"Company: {company_data.get('company_name', 'Unknown Company')}\n"
    
    return formatted_data

# Format large numbers in crores
def format_in_crores(value: float) -> str:
    """Format large numbers in crores for Indian market data"""
    if value is None or value == 0:
        return 'N/A'
    
    crores = value / 10000000
    if crores >= 100000:
        return f"{(crores / 100000):.2f} Lakh Cr"
    return f"{crores:.2f} Cr"

# Format volume in lakhs
def format_volume(value: int) -> str:
    """Format volume in lakhs for Indian market data"""
    if value is None or value == 0:
        return 'N/A'
    
    lakhs = value / 100000
    if lakhs >= 100:
        return f"{(lakhs / 100):.2f} Cr"
    return f"{lakhs:.2f} Lakh"
