# Paper Trading Feature Implementation

## ✅ Backend Implementation Complete

### Database Changes
- **User Model** - Added fields:
  - `paper_trading_enabled`: Boolean flag
  - `cash_balance`: Current cash balance
  - `total_deposited`: Total deposits made
  - `total_withdrawn`: Total withdrawals made

- **New Model**: `CashTransaction`
  - Tracks all cash deposits and withdrawals
  - Fields: type, amount, date, note, user_id

### API Endpoints Added

1. **POST `/api/paper-trading/enable`**
   - Enable paper trading with initial deposit (default $10,000)
   - Creates initial cash transaction record

2. **GET `/api/paper-trading/status`**
   - Get current paper trading status and cash balance

3. **POST `/api/paper-trading/cash`**
   - Deposit or withdraw cash
   - Body: `{transaction_type: "deposit"|"withdrawal", amount: number, note: string}`

4. **GET `/api/paper-trading/profit-loss`**
   - Calculate overall P/L
   - Returns: cash_balance, portfolio_value, total_account_value, net_deposits, profit_loss, profit_loss_percentage

### Transaction Logic Updated
- **Buy transactions**: Check cash balance before allowing purchase
- **Sell transactions**: Add proceeds to cash balance
- Returns error if insufficient funds

## 📋 Frontend Implementation Needed

### 1. Paper Trading Activation Modal
**Component**: `PaperTradingWelcome.jsx`
- Show on first login if paper_trading_enabled = false
- "Start Paper Trading" button
- Input for initial deposit amount
- "Maybe Later" option (shows watchlist-only mode)

### 2. Cash Management Modal  
**Component**: `CashManagementModal.jsx`
- Tabs for Deposit / Withdrawal
- Amount input
- Note/description field
- Current balance display
- Transaction history

### 3. UI Updates to App.jsx

**Add Cash Balance Panel** (next to portfolio value):
```jsx
<Card>
  <Card.Body>
    <h6>Cash Balance</h6>
    <h3>${cashBalance.toFixed(2)}</h3>
    <Button onClick={() => setShowCashModal(true)}>
      Manage Cash
    </Button>
  </Card.Body>
</Card>
```

**Add P/L Display**:
```jsx
<Card>
  <Card.Body>
    <h6>Total P/L</h6>
    <h3 className={profitLoss >= 0 ? 'text-success' : 'text-danger'}>
      ${profitLoss.toFixed(2)} ({profitLossPct.toFixed(2)}%)
    </h3>
    <small>Net Deposits: ${netDeposits.toFixed(2)}</small>
  </Card.Body>
</Card>
```

### 4. Update Holdings Table
- Show "Insufficient Funds" error when trying to buy without cash
- Update balance immediately after transactions

### 5. Navigation Updates
- Add "Paper Trading" button in navbar (if enabled)
- Show "Start Paper Trading" button if not enabled
- Hide buy/sell features if paper trading not enabled (watchlist only)

## 🔄 Frontend API Calls Needed

```javascript
// Check paper trading status on load
const checkPaperTrading = async () => {
  const response = await axios.get('/api/paper-trading/status');
  setPaperTradingEnabled(response.data.enabled);
  setCashBalance(response.data.cash_balance);
};

// Enable paper trading
const enablePaperTrading = async (initialDeposit) => {
  await axios.post('/api/paper-trading/enable', null, {
    params: { initial_deposit: initialDeposit }
  });
  await checkPaperTrading();
};

// Manage cash
const manageCash = async (type, amount, note) => {
  await axios.post('/api/paper-trading/cash', null, {
    params: { transaction_type: type, amount, note }
  });
  await checkPaperTrading();
};

// Get P/L
const fetchProfitLoss = async () => {
  const response = await axios.get('/api/paper-trading/profit-loss');
  setProfitLoss(response.data.profit_loss);
  setProfitLossPct(response.data.profit_loss_percentage);
  setNetDeposits(response.data.net_deposits);
};
```

## 🎨 UI/UX Flow

1. **New User Login**:
   - Show welcome modal: "Start Paper Trading with $10,000?"
   - If yes → Enable paper trading, show dashboard
   - If no → Show watchlist-only mode

2. **Existing User (paper trading disabled)**:
   - Show prominent "Start Paper Trading" button
   - Watchlist features available
   - Buy/sell buttons disabled

3. **Paper Trading Enabled**:
   - Full dashboard with cash balance
   - Buy/sell with balance validation
   - P/L tracking
   - Cash management button

## 🧪 Testing

Run backend:
```bash
cd backend
.venv/bin/python migrate_simple.py  # Run migration first
.venv/bin/uvicorn main:app --reload --port 8080
```

Test endpoints:
```bash
# Get status
curl http://localhost:8080/api/paper-trading/status -H "Authorization: Bearer <token>"

# Enable paper trading
curl -X POST http://localhost:8080/api/paper-trading/enable?initial_deposit=10000 -H "Authorization: Bearer <token>"

# Deposit cash
curl -X POST "http://localhost:8080/api/paper-trading/cash?transaction_type=deposit&amount=5000&note=Test" -H "Authorization: Bearer <token>"

# Get P/L
curl http://localhost:8080/api/paper-trading/profit-loss -H "Authorization: Bearer <token>"
```

## 📊 Summary

**Backend**: ✅ Complete
- Database schema updated
- All API endpoints implemented
- Transaction validation added
- P/L calculation working

**Frontend**: ⏳ Needs Implementation
- Paper trading welcome modal
- Cash management modal
- Balance display panels
- P/L display
- Navigation updates
- API integration

The backend is production-ready. Frontend implementation will complete the paper trading feature!
