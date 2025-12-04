from fastapi import FastAPI, HTTPException, Depends, Body, APIRouter, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from database import create_db_and_tables, engine
from models import Transaction, Watchlist, User
import yfinance as yf
from typing import List, Dict
from dotenv import load_dotenv
from auth import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    create_refresh_token,
    verify_refresh_token,
    get_current_user, 
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS
)
from datetime import timedelta
import os

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

# --- Auth Endpoints ---

@api_router.post("/auth/signup")
def signup(user_data: Dict[str, str], session: Session = Depends(get_session)):
    email = user_data.get("email")
    password = user_data.get("password")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")
        
    existing_user = session.exec(select(User).where(User.email == email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = get_password_hash(password)
    new_user = User(email=email, hashed_password=hashed_password, provider="local")
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    return {"message": "User created successfully"}

@api_router.post("/auth/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == form_data.username)).first()
    if not user or not user.hashed_password or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = create_refresh_token(
        data={"sub": user.email}, expires_delta=refresh_token_expires
    )
    
    return {
        "access_token": access_token, 
        "refresh_token": refresh_token, 
        "token_type": "bearer"
    }

@api_router.post("/auth/refresh")
async def refresh_token(
    refresh_token: str = Body(..., embed=True), 
    session: Session = Depends(get_session)
):
    user = await verify_refresh_token(refresh_token, session)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.post("/auth/guest")
def guest_login(session: Session = Depends(get_session)):
    # Create or retrieve a guest user (simplified: creating a new random guest each time or reusing a fixed one)
    # For better UX, we'll create a unique guest based on a random email
    import uuid
    guest_email = f"guest_{uuid.uuid4()}@example.com"
    
    guest_user = User(email=guest_email, is_guest=True, provider="guest")
    session.add(guest_user)
    session.commit()
    
    access_token = create_access_token(data={"sub": guest_email})
    refresh_token = create_refresh_token(data={"sub": guest_email})
    
    return {
        "access_token": access_token, 
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@api_router.get("/auth/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {"email": current_user.email, "is_guest": current_user.is_guest}

@api_router.post("/auth/logout")
def logout(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    if current_user.is_guest:
        # Fetch the user in the current session
        user = session.get(User, current_user.id)
        if user:
            # Delete all guest user's transactions
            transactions = session.exec(select(Transaction).where(Transaction.user_id == user.id)).all()
            for transaction in transactions:
                session.delete(transaction)
            
            # Delete all guest user's watchlist items
            watchlist_items = session.exec(select(Watchlist).where(Watchlist.user_id == user.id)).all()
            for item in watchlist_items:
                session.delete(item)
            
            # Delete the guest user
            session.delete(user)
            session.commit()
            
            return {"message": "Guest user and all data deleted"}
    
    return {"message": "Logged out"}

# --- Watchlist Endpoints ---

@api_router.get("/watchlist", response_model=List[Watchlist])
def get_watchlist(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    watchlist = session.exec(select(Watchlist).where(Watchlist.user_id == current_user.id)).all()
    return watchlist

@api_router.post("/watchlist", response_model=Watchlist)
def add_to_watchlist(
    item: Watchlist, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    item.user_id = current_user.id
    session.add(item)
    session.commit()
    session.refresh(item)
    return item

@api_router.delete("/watchlist/{item_id}")
def remove_from_watchlist(
    item_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    item = session.get(Watchlist, item_id)
    if not item or item.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Item not found")
    session.delete(item)
    session.commit()
    return {"ok": True}

# --- Transaction Endpoints ---

@api_router.get("/transactions", response_model=List[Transaction])
def get_transactions(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    transactions = session.exec(select(Transaction).where(Transaction.user_id == current_user.id)).all()
    return transactions

@api_router.post("/transactions", response_model=Transaction)
def add_transaction(
    transaction: Transaction, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Force conversion if it's a string
    if isinstance(transaction.date, str):
        from datetime import datetime
        try:
            transaction.date = datetime.fromisoformat(transaction.date.replace('Z', '+00:00'))
        except ValueError:
            pass
            
    transaction.user_id = current_user.id
    session.add(transaction)
    session.commit()
    session.refresh(transaction)
    return transaction

# --- Stock Data Endpoints (Public) ---

@api_router.get("/stock/{ticker}")
def get_stock_data(ticker: str):
    stock = yf.Ticker(ticker)
    info = stock.info
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
        
        # Get company name and truncate to 30 characters
        company_name = info.get("shortName") or info.get("longName") or ticker
        if len(company_name) > 30:
            company_name = company_name[:27] + "..."
        
        if price:
            return {
                "ticker": ticker, 
                "price": price,
                "previous_close": previous_close,
                "company_name": company_name
            }
        else:
            raise HTTPException(status_code=404, detail=f"Price not found for {ticker}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/portfolio/summary")
def get_portfolio_summary(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    transactions = session.exec(
        select(Transaction)
        .where(Transaction.user_id == current_user.id)
        .order_by(Transaction.date)
    ).all()
    
    holdings = {}
    
    for t in transactions:
        if t.ticker not in holdings:
            holdings[t.ticker] = {"quantity": 0, "total_cost": 0.0}
        
        if t.type == "buy":
            holdings[t.ticker]["quantity"] += t.quantity
            holdings[t.ticker]["total_cost"] += (t.quantity * t.price)
        elif t.type == "sell":
            if holdings[t.ticker]["quantity"] > 0:
                avg_cost = holdings[t.ticker]["total_cost"] / holdings[t.ticker]["quantity"]
                holdings[t.ticker]["total_cost"] -= (t.quantity * avg_cost)
                holdings[t.ticker]["quantity"] -= t.quantity
            else:
                holdings[t.ticker]["quantity"] -= t.quantity
    
    summary = []
    total_portfolio_value = 0.0
    
    for ticker, data in holdings.items():
        if data["quantity"] > 0:
            stock = yf.Ticker(ticker)
            try:
                current_price = stock.fast_info.last_price
                info = stock.info
                # Get company name and truncate to 30 characters
                company_name = info.get("shortName") or info.get("longName") or ticker
                if len(company_name) > 30:
                    company_name = company_name[:27] + "..."
            except:
                current_price = 0.0
                company_name = ticker
            
            market_value = data["quantity"] * current_price
            total_portfolio_value += market_value
            
            summary.append({
                "ticker": ticker,
                "company_name": company_name,
                "quantity": data["quantity"],
                "average_cost": data["total_cost"] / data["quantity"] if data["quantity"] > 0 else 0,
                "current_price": current_price,
                "market_value": market_value,
                "gain_loss": market_value - data["total_cost"]
            })
            
    return {"holdings": summary, "total_value": total_portfolio_value}

# --- Chatbot Endpoint ---

from llm import LLMService

# Initialize LLM Service
llm_service = LLMService()

@api_router.post("/chat")
async def chat_endpoint(
    query: Dict[str, str] = Body(...), 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    authorization: str = Header(None)
):
    user_query = query.get("query", "")
    
    # Extract access token for MCP (Gemini path)
    access_token = None
    if authorization and authorization.startswith("Bearer "):
        access_token = authorization.split(" ")[1]
    
    # Get portfolio context
    summary_data = get_portfolio_summary(session, current_user)
    holdings_text = ", ".join([f"{h['ticker']} ({h['quantity']} shares)" for h in summary_data['holdings'] if h['quantity'] > 0])
    total_value = summary_data['total_value']
    
    context = f"""
    You are a helpful financial advisor assistant for a portfolio tracker app.
    The user's current portfolio value is ${total_value:,.2f}.
    Current holdings: {holdings_text if holdings_text else "None"}.
    
    Provide insights based on the user's portfolio and market trends.
    Keep answers short, concise and helpful.
    """
    
    try:
        response_text = await llm_service.generate_response(context, user_query, access_token)
        return {"response": response_text}
    except Exception as e:
        return {"response": f"Error communicating with AI: {str(e)}"}

# Include API router
app.include_router(api_router)

# --- Serve Frontend (Must be last) ---
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/dist"))

if os.path.exists(os.path.join(FRONTEND_DIST, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")
else:
    print(f"Warning: Assets directory not found at {os.path.join(FRONTEND_DIST, 'assets')}")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    dist_path = os.path.join(FRONTEND_DIST, full_path)
    if os.path.exists(dist_path) and os.path.isfile(dist_path):
        return FileResponse(dist_path)
    
    index_path = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"error": f"Frontend not built. Looking for: {index_path}"}
