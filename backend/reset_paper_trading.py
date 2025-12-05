"""
Reset paper trading for all users (for testing)
"""

import sqlite3
from pathlib import Path

def reset_paper_trading():
    """Reset paper trading status for all users"""
    
    db_path = Path(__file__).parent / "portfolio.db"
    
    if not db_path.exists():
        print("Database doesn't exist")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Reset all users' paper trading status
        cursor.execute("""
            UPDATE user 
            SET paper_trading_enabled = 0,
                cash_balance = 0.0,
                total_deposited = 0.0,
                total_withdrawn = 0.0
        """)
        
        # Delete all cash transactions
        cursor.execute("DELETE FROM cashtransaction")
        
        conn.commit()
        print("✅ Paper trading reset for all users")
        print("   - paper_trading_enabled = False")
        print("   - cash_balance = 0")
        print("   - All cash transactions deleted")
        
    except Exception as e:
        print(f"❌ Reset failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    reset_paper_trading()
