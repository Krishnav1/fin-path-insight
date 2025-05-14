import os
import logging
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from app.core.config import settings
from datetime import datetime

logger = logging.getLogger(__name__)

# Initialize Gemini API
def init_gemini():
    """Initialize the Google Gemini API client"""
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
    try:
        # Initialize Gemini if not already initialized
        init_gemini()
        
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
        raise

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
    try:
        # Initialize Gemini if not already initialized
        init_gemini()
        
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
        
        # Return the response text
        return response.text
    except Exception as e:
        logger.error(f"Error generating text response: {str(e)}")
        raise

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
    try:
        # Initialize Gemini if not already initialized
        init_gemini()
        
        # Format the company data for the prompt
        formatted_data = format_company_data_for_prompt(company_data)
        
        # Create the system prompt
        system_prompt = f"""
You are a senior equity research analyst and financial strategist with deep knowledge of global finance, macroeconomics, and fundamental analysis. Given the following structured financial and market data of a company, generate a high-quality, professional-grade investment report. The tone should be neutral, objective, and insightful like a top-tier sell-side analyst.

Your analysis should include:

1. Business Summary & Strategic Position
   - Core business model with a clear analogy to help investors understand
   - Competitive positioning in the industry
   - Key revenue drivers and business segments

2. Enhanced Financial Analysis
   - Key metrics with plain-English explanations
   - Free Cash Flow (FCF) analysis and implications
   - Segment-wise revenue breakdown where available
   - Earnings quality assessment
   - Trend analysis for 3-year data where available

3. Macro & Industry Context
   - How current macroeconomic factors impact this specific business
   - Industry position relative to peers (using comparative metrics)
   - Sector trends and how the company is positioned to benefit or face challenges

4. Comprehensive SWOT Analysis
   - Strengths: Competitive advantages, financial strengths, market position
   - Weaknesses: Areas of concern in operations, financials, or market position
   - Opportunities: Growth vectors, market expansion, new products/services
   - Threats: Competitive pressures, regulatory risks, macroeconomic headwinds

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
    try:
        # Basic company information
        formatted_data = f"""
==== COMPANY OVERVIEW ====
Name: {company_data.get('company', {}).get('name', company_data.get('symbol', 'N/A'))}
Ticker: {company_data.get('symbol', 'N/A')}.NS
Sector: {company_data.get('company', {}).get('sector', 'N/A')}
Industry: {company_data.get('company', {}).get('industry', 'N/A')}
"""

        # Market data
        formatted_data += f"""
==== MARKET DATA ====
Current Price: ₹{company_data.get('currentPrice', 0):.2f}
Day Change: {'+' if company_data.get('dayChangePct', 0) > 0 else ''}{company_data.get('dayChangePct', 0):.2f}%
Market Cap: ₹{format_in_crores(company_data.get('company', {}).get('marketCap', 0))}
"""

        # Add historical performance if available
        if company_data.get('history') and len(company_data.get('history', [])) > 0:
            history = company_data.get('history', [])
            # Calculate 52-week high/low
            high_52_week = max([day.get('High', 0) for day in history])
            low_52_week = min([day.get('Low', 0) for day in history])
            
            # Calculate 1-year return
            oldest_price = history[0].get('Close', 0)
            latest_price = history[-1].get('Close', 0)
            year_return = ((latest_price - oldest_price) / oldest_price) * 100 if oldest_price > 0 else 0
            
            formatted_data += f"""
==== PERFORMANCE METRICS ====
52-Week High: ₹{high_52_week:.2f}
52-Week Low: ₹{low_52_week:.2f}
1-Year Return: {'+' if year_return > 0 else ''}{year_return:.2f}%
Period Change: {'+' if company_data.get('periodChangePct', 0) > 0 else ''}{company_data.get('periodChangePct', 0):.2f}%
"""

        # Add financial ratios if available
        if company_data.get('company', {}).get('financials'):
            financials = company_data.get('company', {}).get('financials', {})
            formatted_data += f"""
==== FINANCIAL RATIOS ====
P/E Ratio: {financials.get('pe', 'N/A')}
EPS: ₹{financials.get('eps', 'N/A')}
ROE: {financials.get('roe', 'N/A')}%
Debt-to-Equity: {financials.get('debtToEquity', 'N/A')}
Dividend Yield: {financials.get('dividendYield', 'N/A')}%
"""

        # Add recent trading activity if available
        if company_data.get('history') and len(company_data.get('history', [])) > 0:
            recent_days = company_data.get('history', [])[-5:]
            recent_days.reverse()  # Show most recent first
            
            formatted_data += """
==== RECENT TRADING ACTIVITY ===="""
            
            for day in recent_days:
                date = day.get('Date', '')
                formatted_date = date if isinstance(date, str) else date.strftime('%Y-%m-%d')
                formatted_data += f"""
{formatted_date}: Open ₹{day.get('Open', 0):.2f}, High ₹{day.get('High', 0):.2f}, Low ₹{day.get('Low', 0):.2f}, Close ₹{day.get('Close', 0):.2f}, Volume {format_volume(day.get('Volume', 0))}"""

        # Add news if available
        if company_data.get('news') and len(company_data.get('news', [])) > 0:
            news = company_data.get('news', [])[:3]  # Get top 3 news items
            
            formatted_data += """
==== RECENT NEWS ===="""
            
            for item in news:
                date = item.get('date', '')
                formatted_date = date if isinstance(date, str) else date.strftime('%Y-%m-%d')
                formatted_data += f"""
- {item.get('title', 'N/A')} ({formatted_date})
  {item.get('summary', 'No summary available')}"""

        return formatted_data
    except Exception as e:
        logger.error(f"Error formatting company data for prompt: {str(e)}")
        return f"Company: {company_data.get('symbol', 'N/A')}\nPrice: ₹{company_data.get('currentPrice', 0)}"

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


async def generate_financial_analysis(symbol: str, financial_data: Dict[str, Any], news_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generate structured financial analysis using Google Gemini
    
    Args:
        symbol: Stock symbol
        financial_data: Financial data including price, fundamentals, technicals
        news_data: News data related to the symbol
        
    Returns:
        Structured analysis with technical, fundamental, news impact, sentiment, and conclusion
    """
    try:
        # Initialize Gemini if not already initialized
        init_gemini()
        
        # Format the data for the prompt
        formatted_data = f"""Please analyze the following financial data for {symbol} and provide a structured analysis:

==== PRICE DATA ====
Current Price: {financial_data.get('price', 'N/A')}
Change: {financial_data.get('change', 'N/A')} ({financial_data.get('change_percent', 'N/A')}%)

==== TECHNICAL INDICATORS ====
RSI: {financial_data.get('technical', {}).get('rsi', 'N/A')}
MACD: {financial_data.get('technical', {}).get('macd', 'N/A')}
Signal: {financial_data.get('technical', {}).get('signal', 'N/A')}

==== FUNDAMENTALS ====
P/E Ratio: {financial_data.get('fundamentals', {}).get('ratios', {}).get('peRatio', 'N/A')}
EV/EBITDA: {financial_data.get('fundamentals', {}).get('ratios', {}).get('enterpriseValueToEBITDA', 'N/A')}
Dividend Yield: {financial_data.get('fundamentals', {}).get('ratios', {}).get('dividendYield', 'N/A')}%

==== ANALYST RATINGS ====
"""
        
        # Add analyst ratings if available
        if financial_data.get('ratings'):
            for rating in financial_data.get('ratings', [])[:3]:
                formatted_data += f"{rating.get('analyst', 'Analyst')}: {rating.get('rating', 'N/A')} (Target: {rating.get('targetPrice', 'N/A')})\n"
        
        # Add news data
        formatted_data += "\n==== RECENT NEWS ====\n"
        for news in news_data[:3]:
            formatted_data += f"- {news.get('title', 'N/A')} ({news.get('publishedAt', 'N/A')})\n"
            formatted_data += f"  {news.get('description', 'N/A')}\n"
        
        # Create the system prompt
        system_prompt = """You are a senior financial analyst providing insights on stocks. Analyze the given data and provide a structured response with the following sections:

1. Technical Analysis: Interpret the technical indicators and price action (50 words max)
2. Fundamental Analysis: Evaluate the company's financial health and valuation (50 words max)
3. News Impact: Assess how recent news might affect the stock (50 words max)
4. Sentiment: Summarize the overall market sentiment and analyst opinions (50 words max)
5. Conclusion: Provide a balanced investment perspective (50 words max)

Total content should be 250 words or less. End with a disclaimer and suggest 3 related questions the user might want to ask.
"""
        
        # Generate response
        response = await generate_text_response(
            prompt=formatted_data,
            system_prompt=system_prompt
        )
        
        # Parse the structured response
        sections = parse_structured_response(response)
    except Exception as e:
        logger.error(f"Error generating financial analysis: {str(e)}")
        return {
            "technical": "Unable to generate technical analysis at this time.",
            "fundamental": "Unable to generate fundamental analysis at this time.",
            "news_impact": "Unable to analyze news impact at this time.",
            "sentiment": "Unable to determine market sentiment at this time.",
            "conclusion": "Analysis unavailable. Please try again later.",
            "disclaimer": "This is not financial advice. Always do your own research.",
            "related_questions": [
                "What are the recent earnings results?",
                "How does this compare to industry peers?",
                "What is the long-term outlook for this stock?"
            ]
        }

def parse_structured_response(response: str) -> Dict[str, Any]:
    """
    Parse the structured response from Gemini
    
    Args:
        response: Raw response from Gemini
        
    Returns:
        Dictionary with structured sections
    """
    sections = {
        "technical": "",
        "fundamental": "",
        "news_impact": "",
        "sentiment": "",
        "conclusion": "",
        "disclaimer": "",
        "related_questions": []
    }
    
    # Simple parsing logic - can be enhanced for better accuracy
    current_section = None
    related_questions = []
    
    for line in response.split('\n'):
        line = line.strip()
        
        if not line:
            continue
        
        # Check for section headers
        if "technical analysis" in line.lower() or "technical:" in line.lower():
            current_section = "technical"
            sections[current_section] = ""
        elif "fundamental analysis" in line.lower() or "fundamental:" in line.lower():
            current_section = "fundamental"
            sections[current_section] = ""
        elif "news impact" in line.lower() or "news:" in line.lower():
            current_section = "news_impact"
            sections[current_section] = ""
        elif "sentiment" in line.lower():
            current_section = "sentiment"
            sections[current_section] = ""
        elif "conclusion" in line.lower():
            current_section = "conclusion"
            sections[current_section] = ""
        elif "disclaimer" in line.lower():
            current_section = "disclaimer"
            sections[current_section] = ""
        elif line.startswith("?") or line.startswith("-") or "question" in line.lower():
            # This might be a related question
            question = line.replace("?", "").replace("-", "").strip()
            if question and len(question) > 10:
                related_questions.append(question + "?")
        elif current_section:
            # Add content to current section
            if sections[current_section]:
                sections[current_section] += " " + line
            else:
                sections[current_section] = line
    
    # Clean up the sections
    for key in sections:
        if key != "related_questions" and sections[key]:
            # Remove section headers from content
            for header in ["Technical Analysis:", "Fundamental Analysis:", "News Impact:", "Sentiment:", "Conclusion:", "Disclaimer:"]:
                sections[key] = sections[key].replace(header, "").strip()
    
    # Add related questions
    sections["related_questions"] = related_questions[:3]  # Limit to 3 questions
    
    return sections
