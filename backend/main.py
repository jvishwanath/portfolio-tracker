from fastapi import FastAPI, HTTPException, Depends, Body, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from database import create_db_and_tables, engine
from models import Transaction, Watchlist
import yfinance as yf
from typing import List, Dict
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()
api_router = APIRouter(prefix="/api")

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

def get_session():
    with Session(engine) as session:
        yield session

# --- Watchlist Endpoints ---

@api_router.get("/watchlist", response_model=List[Watchlist])
def get_watchlist(session: Session = Depends(get_session)):
    watchlist = session.exec(select(Watchlist)).all()
    return watchlist

@api_router.post("/watchlist", response_model=Watchlist)
def add_to_watchlist(item: Watchlist, session: Session = Depends(get_session)):
    session.add(item)
    session.commit()
    session.refresh(item)
    return item

@api_router.delete("/watchlist/{item_id}")
def remove_from_watchlist(item_id: int, session: Session = Depends(get_session)):
    item = session.get(Watchlist, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    session.delete(item)
    session.commit()
    return {"ok": True}

# --- Transaction Endpoints ---

@api_router.get("/transactions", response_model=List[Transaction])
def get_transactions(session: Session = Depends(get_session)):
    transactions = session.exec(select(Transaction)).all()
    return transactions

@api_router.post("/transactions", response_model=Transaction)
def add_transaction(transaction: Transaction, session: Session = Depends(get_session)):
    # Debug print
    print(f"Received transaction: {transaction}")
    print(f"Date type: {type(transaction.date)}")
    
    # Force conversion if it's a string (though Pydantic should have done it)
    if isinstance(transaction.date, str):
        from datetime import datetime
        try:
            transaction.date = datetime.fromisoformat(transaction.date.replace('Z', '+00:00'))
        except ValueError:
            # Fallback or error
            pass
            
    session.add(transaction)
    session.commit()
    session.refresh(transaction)
    return transaction

# --- Stock Data Endpoints ---

@api_router.get("/stock/{ticker}")
def get_stock_data(ticker: str):
    stock = yf.Ticker(ticker)
    info = stock.info
    # Basic info
    return {
        "symbol": info.get("symbol", ticker),
        "longName": info.get("longName"),
        "currentPrice": info.get("currentPrice") or info.get("regularMarketPrice"),
        "previousClose": info.get("previousClose"),
    }

@api_router.get("/stock/{ticker}/history")
def get_stock_history(ticker: str, period: str = "1mo"):
    stock = yf.Ticker(ticker)
    hist = stock.history(period=period)
    data = []
    for date, row in hist.iterrows():
        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "close": row["Close"]
        })
    return data

@api_router.get("/stock/{ticker}/current")
def get_current_price(ticker: str):
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        price = info.get("currentPrice") or info.get("regularMarketPrice")
        previous_close = info.get("previousClose") or info.get("regularMarketPreviousClose")
        if price:
            return {
                "ticker": ticker, 
                "price": price,
                "previous_close": previous_close
            }
        else:
            raise HTTPException(status_code=404, detail=f"Price not found for {ticker}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/portfolio/summary")
def get_portfolio_summary(session: Session = Depends(get_session)):
    transactions = session.exec(select(Transaction).order_by(Transaction.date)).all()
    holdings = {}
    
    for t in transactions:
        if t.ticker not in holdings:
            holdings[t.ticker] = {"quantity": 0, "total_cost": 0.0}
        
        if t.type == "buy":
            holdings[t.ticker]["quantity"] += t.quantity
            holdings[t.ticker]["total_cost"] += (t.quantity * t.price)
        elif t.type == "sell":
            if holdings[t.ticker]["quantity"] > 0:
                # Calculate average cost per share BEFORE reducing quantity
                avg_cost = holdings[t.ticker]["total_cost"] / holdings[t.ticker]["quantity"]
                # Reduce total cost by the cost of shares sold
                holdings[t.ticker]["total_cost"] -= (t.quantity * avg_cost)
                holdings[t.ticker]["quantity"] -= t.quantity
            else:
                # Should not happen if data is consistent, but handle gracefully
                holdings[t.ticker]["quantity"] -= t.quantity
    
    summary = []
    total_portfolio_value = 0.0
    
    for ticker, data in holdings.items():
        if data["quantity"] > 0:
            stock = yf.Ticker(ticker)
            # Fetch live price (this might be slow for many stocks, in prod use batch or cache)
            # For demo, it's fine.
            try:
                current_price = stock.fast_info.last_price
            except:
                current_price = 0.0
            
            market_value = data["quantity"] * current_price
            total_portfolio_value += market_value
            
            summary.append({
                "ticker": ticker,
                "quantity": data["quantity"],
                "average_cost": data["total_cost"] / data["quantity"] if data["quantity"] > 0 else 0, # This is rough if sold
                "current_price": current_price,
                "market_value": market_value,
                "gain_loss": market_value - data["total_cost"] # This is also rough if sold
            })
            
    return {"holdings": summary, "total_value": total_portfolio_value}

# --- Chatbot Endpoint ---

from llm import LLMService

# Initialize LLM Service
llm_service = LLMService()

@api_router.post("/chat")
def chat_endpoint(query: Dict[str, str] = Body(...), session: Session = Depends(get_session)):
    user_query = query.get("query", "")
    
    # Get portfolio context
    summary_data = get_portfolio_summary(session)
    holdings_text = ", ".join([f"{h['ticker']} ({h['quantity']} shares)" for h in summary_data['holdings'] if h['quantity'] > 0])
    total_value = summary_data['total_value']
    
    context = f"""
    You are a helpful financial advisor assistant for a portfolio tracker app.
    The user's current portfolio value is ${total_value:,.2f}.
    Current holdings: {holdings_text if holdings_text else "None"}.
    
    Answer the user's question based on this context and your general financial knowledge.
    Keep answers short, concise and helpful.
    """
    
    try:
        response_text = llm_service.generate_response(context, user_query)
        return {"response": response_text}
    except Exception as e:
        return {"response": f"Error communicating with AI: {str(e)}"}

# Include API router
app.include_router(api_router)

# --- Serve Frontend (Must be last) ---
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Determine the correct path to frontend dist
# In Docker: /app/frontend/dist
# In local dev: ../frontend/dist
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/dist"))

# Mount static assets (JS, CSS, images)
if os.path.exists(os.path.join(FRONTEND_DIST, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")
else:
    print(f"Warning: Assets directory not found at {os.path.join(FRONTEND_DIST, 'assets')}")

# Catch-all route for SPA (React Router)
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # If API route wasn't matched above, serve index.html
    # Check if file exists in dist (e.g. favicon.ico)
    dist_path = os.path.join(FRONTEND_DIST, full_path)
    if os.path.exists(dist_path) and os.path.isfile(dist_path):
        return FileResponse(dist_path)
    
    # Otherwise return index.html
    index_path = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"error": f"Frontend not built. Looking for: {index_path}"}

