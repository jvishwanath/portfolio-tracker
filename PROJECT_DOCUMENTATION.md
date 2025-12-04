# Portfolio Tracker - Complete Project Documentation

## Table of Contents

1. [Project Overview](#project-overview)
   - [Features](#features)
   - [Tech Stack](#tech-stack)
   - [Project Structure](#project-structure)
2. [MCP Server Integration](#mcp-server-integration)
   - [What is MCP?](#what-is-mcp)
   - [Available Tools](#available-tools)
   - [Architecture](#architecture)
3. [Quick Start Guide](#quick-start-guide)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Running Locally](#running-locally)
4. [Chat Assistant Integration](#chat-assistant-integration)
   - [How It Works](#how-it-works)
   - [User Flow](#user-flow)
   - [Example Interactions](#example-interactions)
5. [Cloud Run Deployment](#cloud-run-deployment)
   - [Port Configuration](#port-configuration)
   - [Deployment Steps](#deployment-steps)
   - [Database Setup](#database-setup)
   - [CI/CD](#cicd-with-github-actions)

---

## Project Overview

A full-stack web application for tracking stock portfolios with real-time market data, AI-powered chatbot assistant, and comprehensive portfolio analytics.

### Features

- 📊 **Portfolio Management**: Track buy/sell transactions with automatic average cost calculation
- 📈 **Real-time Market Data**: Live stock prices from Yahoo Finance
- 🤖 **AI Financial Advisor**: OpenAI/Gemini-powered chatbot with portfolio context and internet access
- 👀 **Watchlist**: Monitor stocks without holding them
- 📉 **Interactive Charts**: Historical price data with multiple time periods
- 🌐 **Market Overview**: Track DOW, NASDAQ, S&P 500, BTC, ETH, XRP
- 🔄 **Auto-refresh**: Automatic data updates
- ⏰ **Timestamps**: Last updated indicators for all data sections

### Tech Stack

#### Backend
- **Framework**: Python FastAPI
- **Database**: SQLModel with SQLite (Dev) / PostgreSQL (Prod)
- **Data Source**: yfinance (Yahoo Finance)
- **AI**: OpenAI GPT-4o / Google Gemini 2.0 Flash
- **Protocol**: MCP (Model Context Protocol)
- **Package Manager**: uv

#### Frontend
- **Framework**: React 19 with Vite
- **UI Library**: Bootstrap 5 + react-bootstrap
- **Charts**: Recharts
- **Icons**: Lucide React + Bootstrap Icons
- **HTTP Client**: Axios

### Project Structure

- **`backend/`**: FastAPI application
  - **`main.py`**: Entry point and API routes
  - **`llm.py`**: AI service with MCP integration
  - **`mcp_server.py`**: MCP server implementation
  - **`mcp_in_app.py`**: In-app MCP client
  - **`models.py`**: Database schemas
- **`frontend/`**: React application
  - **`src/components/`**: UI components (Chart, Watchlist, Chat, etc.)
  - **`src/context/`**: State management (Auth)

---

## MCP Server Integration

This project implements the **Model Context Protocol (MCP)** to allow AI assistants to interact with the portfolio tracker application through natural language.

### What is MCP?

MCP is a standard protocol that enables AI models to interact with external tools and data sources. In this project, we use MCP to give the AI assistant the ability to:
- Buy and sell stocks
- Check portfolio value
- Manage watchlists
- Get real-time stock prices

### Available Tools

The MCP server provides the following tools:

1. **`buy_stock`**: Record stock purchases
2. **`sell_stock`**: Record stock sales
3. **`get_portfolio_summary`**: View current holdings and total value
4. **`get_stock_price`**: Get current price for any stock
5. **`add_to_watchlist`**: Add stocks to watchlist
6. **`get_watchlist`**: View watchlist with prices
7. **`remove_from_watchlist`**: Remove stocks from watchlist
8. **`get_transaction_history`**: View transaction history
9. **`web_search`**: Search the internet for financial news

### Architecture

The system uses a unified MCP architecture that works both for the in-app chat and external clients (like Claude Desktop).

```
User Query → Chat Endpoint (async)
           ↓
Extract Access Token from Header
           ↓
LLM Service (OpenAI/Gemini)
           ↓
Spawns MCP Server Process (mcp_server.py)
           ↓
Communicates via stdio
           ↓
MCP Server Calls Backend API (localhost:8080)
           ↓
Uses User's Session Token
```

---

## Quick Start Guide

### Prerequisites

- Python 3.12+
- Node.js 18+
- OpenAI API Key (or Gemini API Key)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd portfolio-tracker
   ```

2. **Backend Setup**
   ```bash
   cd backend
   # Create virtual env and install dependencies
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Environment Configuration**
   Create `backend/.env`:
   ```bash
   OPENAI_API_KEY=sk-...
   SECRET_KEY=your-secret-key
   # Optional
   # GEMINI_API_KEY=...
   # DATABASE_URL=postgresql://...
   ```

### Running Locally

1. **Start Backend**
   ```bash
   cd backend
   .venv/bin/uvicorn main:app --reload --port 8080
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access Application**
   Open `http://localhost:5173` in your browser.

---

## Chat Assistant Integration

The in-app chat assistant is fully integrated with the MCP tools, allowing users to manage their portfolio using natural language.

### How It Works

1. **Authentication**: The chat endpoint extracts the user's JWT token from the request header.
2. **Context**: The LLM is provided with the user's current portfolio summary and a list of available tools.
3. **Tool Execution**: When the LLM decides to use a tool (e.g., "buy stock"), it sends a tool call.
4. **MCP Client**: The backend executes the tool via the MCP server using the user's session token, ensuring security and data isolation.
5. **Response**: The tool result is fed back to the LLM, which generates a natural language response.

### User Flow

1. User asks: **"Buy 10 shares of AAPL at $150"**
2. LLM calls: `buy_stock(ticker="AAPL", quantity=10, price=150)`
3. Backend executes tool
4. Tool returns: "✅ Successfully bought 10 shares..."
5. LLM responds: "I've purchased 10 shares of AAPL for you at $150 per share, totaling $1,500."

### Example Interactions

**Portfolio Management**
> **User**: "What stocks do I own?"
> **AI**: "You currently own: AAPL (10 shares), MSFT (5 shares)..."

**Stock Information**
> **User**: "What's the current price of GOOGL?"
> **AI**: "Google (GOOGL) is currently trading at $142.50..."

**Combined Queries**
> **User**: "What's NVDA trading at? If it's under $500, buy 2 shares"
> **AI**: Checks price, then buys if condition is met.

---

## Cloud Run Deployment

The application is optimized for deployment on Google Cloud Run.

### Port Configuration

The application uses **port 8080** by default, which is the standard for Google Cloud Run.
- **Environment Variable**: `PORT`
- **Default**: `8080`
- **Frontend Proxy**: Configured to respect `PORT` env var.

### Deployment Steps

1. **Build Docker Image**
   ```bash
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/portfolio-tracker
   ```

2. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy portfolio-tracker \
     --image gcr.io/YOUR_PROJECT_ID/portfolio-tracker \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars "DATABASE_URL=postgresql://...,SECRET_KEY=...,OPENAI_API_KEY=sk-..."
   ```

### Database Setup

Recommended: **Cloud SQL (PostgreSQL)**

1. Create Cloud SQL instance
2. Create database and user
3. Connect Cloud Run to Cloud SQL:
   ```bash
   gcloud run deploy portfolio-tracker \
     --add-cloudsql-instances PROJECT_ID:REGION:INSTANCE_NAME \
     --set-env-vars "DATABASE_URL=postgresql://user:pass@/dbname?host=/cloudsql/INSTANCE_CONNECTION_NAME"
   ```

### CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml` to automate deployment on push to main branch.

```yaml
name: Deploy to Cloud Run
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      - name: Deploy
        run: |
          gcloud builds submit --tag gcr.io/${{ secrets.GCP_PROJECT_ID }}/portfolio-tracker
          gcloud run deploy portfolio-tracker --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/portfolio-tracker --region us-central1
```

---

**🎉 Enjoy using your AI-powered Portfolio Tracker!**
