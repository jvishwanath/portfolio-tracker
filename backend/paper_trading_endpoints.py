# Paper Trading Endpoints - Add these to main.py after the transactions section

from models import CashTransaction

# --- Paper Trading Endpoints ---

@api_router.post("/paper-trading/enable")
def enable_paper_trading(
    initial_deposit: float = 10000.0,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Enable paper trading for user with initial deposit"""
    if current_user.paper_trading_enabled:
        raise HTTPException(status_code=400, detail="Paper trading already enabled")
    
    current_user.paper_trading_enabled = True
    current_user.cash_balance = initial_deposit
    current_user.total_deposited = initial_deposit
    
    # Record initial deposit
    cash_txn = CashTransaction(
        type="deposit",
        amount=initial_deposit,
        note="Initial paper trading deposit",
        user_id=current_user.id
    )
    
    session.add(current_user)
    session.add(cash_txn)
    session.commit()
    session.refresh(current_user)
    
    return {
        "message": "Paper trading enabled",
        "cash_balance": current_user.cash_balance,
        "initial_deposit": initial_deposit
    }

@api_router.get("/paper-trading/status")
def get_paper_trading_status(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get paper trading status and balance"""
    return {
        "enabled": current_user.paper_trading_enabled,
        "cash_balance": current_user.cash_balance,
        "total_deposited": current_user.total_deposited,
        "total_withdrawn": current_user.total_withdrawn
    }

@api_router.post("/paper-trading/cash")
def manage_cash(
    transaction_type: str,  # "deposit" or "withdrawal"
    amount: float,
    note: str = "",
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Deposit or withdraw cash from paper trading account"""
    if not current_user.paper_trading_enabled:
        raise HTTPException(status_code=400, detail="Paper trading not enabled")
    
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    if transaction_type == "deposit":
        current_user.cash_balance += amount
        current_user.total_deposited += amount
    elif transaction_type == "withdrawal":
        if current_user.cash_balance < amount:
            raise HTTPException(status_code=400, detail="Insufficient cash balance")
        current_user.cash_balance -= amount
        current_user.total_withdrawn += amount
    else:
        raise HTTPException(status_code=400, detail="Invalid transaction type")
    
    # Record transaction
    cash_txn = CashTransaction(
        type=transaction_type,
        amount=amount,
        note=note,
        user_id=current_user.id
    )
    
    session.add(current_user)
    session.add(cash_txn)
    session.commit()
    session.refresh(current_user)
    
    return {
        "message": f"{transaction_type.capitalize()} successful",
        "amount": amount,
        "new_balance": current_user.cash_balance
    }

@api_router.get("/paper-trading/cash-history")
def get_cash_history(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get cash transaction history"""
    if not current_user.paper_trading_enabled:
        raise HTTPException(status_code=400, detail="Paper trading not enabled")
    
    statement = select(CashTransaction).where(
        CashTransaction.user_id == current_user.id
    ).order_by(CashTransaction.date.desc())
    
    transactions = session.exec(statement).all()
    
    return [
        {
            "id": txn.id,
            "type": txn.type,
            "amount": txn.amount,
            "date": txn.date.isoformat(),
            "note": txn.note
        }
        for txn in transactions
    ]

@api_router.get("/paper-trading/profit-loss")
def get_profit_loss(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Calculate overall profit/loss"""
    if not current_user.paper_trading_enabled:
        raise HTTPException(status_code=400, detail="Paper trading not enabled")
    
    # Get portfolio summary
    summary = get_portfolio_summary(session, current_user)
    portfolio_value = summary['total_value']
    
    # Calculate total account value (cash + portfolio)
    total_account_value = current_user.cash_balance + portfolio_value
    
    # Calculate net deposits (deposits - withdrawals)
    net_deposits = current_user.total_deposited - current_user.total_withdrawn
    
    # Profit/Loss = Total Account Value - Net Deposits
    profit_loss = total_account_value - net_deposits
    profit_loss_pct = (profit_loss / net_deposits * 100) if net_deposits > 0 else 0
    
    return {
        "cash_balance": current_user.cash_balance,
        "portfolio_value": portfolio_value,
        "total_account_value": total_account_value,
        "net_deposits": net_deposits,
        "profit_loss": profit_loss,
        "profit_loss_percentage": profit_loss_pct
    }
