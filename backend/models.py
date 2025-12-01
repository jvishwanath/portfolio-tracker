from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel

class Transaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ticker: str
    type: str  # "buy" or "sell"
    quantity: float
    price: float
    date: datetime = Field(default_factory=datetime.utcnow)

class Watchlist(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ticker: str
