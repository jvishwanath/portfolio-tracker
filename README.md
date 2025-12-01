# Stock Portfolio Tracker

A full-stack web application for tracking stock portfolios with real-time market data, AI-powered chatbot assistant, and comprehensive portfolio analytics.

## Features

- 📊 **Portfolio Management**: Track buy/sell transactions with automatic average cost calculation
- 📈 **Real-time Market Data**: Live stock prices from Yahoo Finance
- 🤖 **AI Financial Advisor**: Gemini-powered chatbot with portfolio context and internet access
- 👀 **Watchlist**: Monitor stocks without holding them
- 📉 **Interactive Charts**: Historical price data with multiple time periods
- 🌐 **Market Overview**: Track DOW, NASDAQ, S&P 500, BTC, ETH, XRP
- 🔄 **Auto-refresh**: Automatic data updates (Holdings: 2min, Watchlist: 1min, Indices: 5min)
- ⏰ **Timestamps**: Last updated indicators for all data sections

## Tech Stack

### Backend
- **Framework**: Python FastAPI
- **Database**: SQLModel with SQLite
- **Data Source**: yfinance (Yahoo Finance)
- **AI**: Google Gemini API (gemini-2.5-flash)
- **Package Manager**: uv

### Frontend
- **Framework**: React 19 with Vite
- **UI Library**: Bootstrap 5 + react-bootstrap
- **Charts**: Recharts
- **Icons**: Lucide React + Bootstrap Icons
- **HTTP Client**: Axios

## Setup & Run

### Prerequisites
- Python 3.12+
- Node.js 18+
- uv (Python package manager)
- Gemini API Key

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Create `.env` file:
   ```bash
   echo "GEMINI_API_KEY=your_api_key_here" > .env
   ```

3. Install dependencies:
   ```bash
   uv sync
   ```

4. Run the server:
   ```bash
   uv run uvicorn main:app --reload --port 8010
   ```
   Server runs at `http://localhost:8010`

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the dev server:
   ```bash
   npm run dev
   ```
   App runs at `http://localhost:5173`

## Project Structure

### Backend (`backend/`)

- **`main.py`**: FastAPI application entry point
  - API routes with `/api` prefix
  - Portfolio summary calculation with chronological transaction processing
  - Stock data endpoints (current price, history)
  - Gemini chatbot integration with Google Search
  - Static file serving for production deployment
  
- **`models.py`**: SQLModel database schemas
  - `Transaction`: Buy/sell records (ticker, type, price, quantity, date)
  - `Watchlist`: Monitored stock tickers
  
- **`database.py`**: SQLite database connection and table creation

- **`requirements.txt`**: Python dependencies for Docker builds

- **`pyproject.toml`**: uv project configuration

### Frontend (`frontend/src/`)

- **`App.jsx`**: Main application component
  - Global state management (holdings, portfolio value, last updated)
  - Layout orchestration
  - Auto-refresh intervals
  
- **`components/TransactionModal.jsx`**: Buy/sell transaction form
  - Auto-fetches current stock price on ticker input
  - Pre-fills data when triggered from holdings table
  
- **`components/HoldingsTable.jsx`**: Portfolio holdings display
  - Sortable columns
  - In-row Buy/Sell actions
  - Gain/loss calculations with color coding
  - Last updated timestamp
  
- **`components/Watchlist.jsx`**: Stock watchlist widget
  - Add/remove tickers
  - Real-time price updates
  - Price change indicators (% and $)
  - Click to view chart
  
- **`components/StockChart.jsx`**: Interactive price chart
  - Multiple time periods (1D, 1W, 1M, 3M, 1Y)
  - Price change display
  - Close button
  
- **`components/MarketIndices.jsx`**: Market overview panel
  - Major indices (DOW, NASDAQ, S&P 500)
  - Cryptocurrencies (BTC, ETH, XRP)
  - Change indicators with trending icons
  
- **`components/ChatWidget.jsx`**: AI chatbot modal
  - Portfolio-aware responses
  - Internet-enabled via Google Search
  - Conversation history

## API Endpoints

### Portfolio & Transactions
- `GET /api/portfolio/summary` - Portfolio holdings and total value
- `GET /api/transactions` - All transactions
- `POST /api/transactions` - Add new transaction

### Watchlist
- `GET /api/watchlist` - Get watchlist items
- `POST /api/watchlist` - Add to watchlist
- `DELETE /api/watchlist/{id}` - Remove from watchlist

### Stock Data
- `GET /api/stock/{ticker}` - Stock info
- `GET /api/stock/{ticker}/current` - Current price + previous close
- `GET /api/stock/{ticker}/history?period={period}` - Historical data

### AI Assistant
- `POST /api/chat` - Chat with AI advisor

## Docker Deployment

See [README_DEPLOY.md](README_DEPLOY.md) for Google Cloud Run deployment instructions.

### Quick Docker Build
```bash
docker build -t portfolio-tracker .
docker run -p 8080:8080 -e GEMINI_API_KEY=your_key portfolio-tracker
```

Visit `http://localhost:8080`

## Environment Variables

- `GEMINI_API_KEY` (required): Google Gemini API key for chatbot functionality

## License

MIT
