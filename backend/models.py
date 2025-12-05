from typing import Optional, List
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import UniqueConstraint

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: Optional[str] = None
    provider: str = Field(default="local") # local, google, guest
    is_guest: bool = Field(default=False)
    
    # Paper Trading Fields
    paper_trading_enabled: bool = Field(default=False)
    cash_balance: float = Field(default=0.0)
    total_deposited: float = Field(default=0.0)  # Track total deposits
    total_withdrawn: float = Field(default=0.0)  # Track total withdrawals
    
    transactions: List["Transaction"] = Relationship(back_populates="user")
    watchlist_items: List["Watchlist"] = Relationship(back_populates="user")
    cash_transactions: List["CashTransaction"] = Relationship(back_populates="user")

class Transaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ticker: str
    type: str  # "buy" or "sell"
    quantity: float
    price: float
    date: datetime = Field(default_factory=datetime.utcnow)
    
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    user: Optional[User] = Relationship(back_populates="transactions")

class Watchlist(SQLModel, table=True):
    __tablename__ = "watchlist"
    __table_args__ = (
        UniqueConstraint("user_id", "ticker", name="uq_user_ticker"),
        # Ensure a user cannot have duplicate tickers in their watchlist
        {"sqlite_autoincrement": True},
    )
    
    id: Optional[int] = Field(default=None, primary_key=True)
    ticker: str = Field(index=True)
    
    user_id: Optional[int] = Field(default=None, foreign_key="user.id", index=True)
    user: Optional[User] = Relationship(back_populates="watchlist_items")

class CashTransaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    type: str  # "deposit" or "withdrawal"
    amount: float
    date: datetime = Field(default_factory=datetime.utcnow)
    note: Optional[str] = None
    
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    user: Optional[User] = Relationship(back_populates="cash_transactions")
