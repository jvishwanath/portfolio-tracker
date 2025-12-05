"""
Debug script to replicate enable_paper_trading logic and capture traceback
"""
import sys
import traceback
from sqlmodel import Session, select
from database import engine
from models import User, CashTransaction

def debug_enable_paper_trading():
    print("Starting debug of enable_paper_trading logic...")
    
    with Session(engine) as session:
        # 1. Get a test user (create one if needed to ensure clean state)
        statement = select(User).where(User.email == "debug_test@example.com")
        user = session.exec(statement).first()
        
        if not user:
            print("Creating debug test user...")
            user = User(email="debug_test@example.com", is_guest=True)
            session.add(user)
            session.commit()
            session.refresh(user)
            print(f"Created user with ID: {user.id}")
        else:
            print(f"Found existing user with ID: {user.id}")
            # Reset state
            user.paper_trading_enabled = False
            user.cash_balance = 0.0
            user.total_deposited = 0.0
            session.add(user)
            session.commit()
            session.refresh(user)
            print("Reset user state.")

        # 2. Replicate the endpoint logic exactly
        try:
            initial_deposit = 10000.0
            print(f"Attempting to enable paper trading with deposit: {initial_deposit}")

            if user.paper_trading_enabled:
                print("User already enabled (unexpected after reset)")
                return

            user.paper_trading_enabled = True
            user.cash_balance = initial_deposit
            user.total_deposited = initial_deposit
            
            print("Creating CashTransaction object...")
            cash_txn = CashTransaction(
                type="deposit",
                amount=initial_deposit,
                note="Initial paper trading deposit",
                user_id=user.id
            )
            
            print("Adding user and transaction to session...")
            session.add(user)
            session.add(cash_txn)
            
            print("Committing session...")
            session.commit()
            
            print("Refreshing user...")
            session.refresh(user)
            
            print("✅ Success! Paper trading enabled.")
            print(f"User Balance: {user.cash_balance}")
            print(f"Transaction ID: {cash_txn.id}")

        except Exception as e:
            print("\n❌ CRITICAL ERROR CAUGHT:")
            print("-" * 60)
            traceback.print_exc()
            print("-" * 60)
            session.rollback()

if __name__ == "__main__":
    debug_enable_paper_trading()
