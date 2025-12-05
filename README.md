# NVest AI

A full-stack web application for tracking stock portfolios with real-time market data, AI-powered chatbot assistant (via MCP), and comprehensive portfolio analytics.

## Documentation

For full project documentation, including setup, API usage, MCP integration, and Cloud Run deployment, please refer to the main [Project Documentation](PROJECT_DOCUMENTATION.md).

## Features

- 📊 **Portfolio Management**: Track buy/sell transactions with automatic average cost calculation
- 📈 **Real-time Market Data**: Live stock prices from Yahoo Finance
- 🤖 **AI Financial Advisor**: OpenAI-powered chatbot with Model Context Protocol (MCP) integration
- 🌐 **Web Search**: AI can search the web for real-time market news
- 👀 **Watchlist**: Monitor stocks without holding them
- 📉 **Interactive Charts**: Historical price data with multiple time periods
- 🔄 **Auto-refresh**: Automatic data updates

## Quick Start

### Backend

1.  Navigate to `backend/`:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Run the server:
    ```bash
    uvicorn main:app --reload --port 8080
    ```

### Frontend

1.  Navigate to `frontend/`:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the dev server:
    ```bash
    npm run dev
    ```

## Tech Stack

- **Backend**: Python FastAPI, SQLModel (SQLite), AsyncOpenAI, MCP (Model Context Protocol)
- **Frontend**: React 19, Vite, Bootstrap 5, Recharts
- **AI**: OpenAI GPT-4o, MCP Server for tools (Web Search, Portfolio Management)

## License

MIT
