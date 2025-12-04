"""
In-App MCP Integration

This module provides integration between the chat assistant and MCP server tools.
It allows the chat assistant to use MCP tools with the user's session token.
"""

import asyncio
import os
from typing import Dict, Any, Optional
import httpx


class InAppMCPClient:
    """Client for using MCP tools within the app with user's session token."""
    
    def __init__(self, access_token: str, api_base_url: str = None):
        """
        Initialize the in-app MCP client.
        
        Args:
            access_token: User's JWT access token from their session
            api_base_url: Base URL of the portfolio tracker API (defaults to PORT env var)
        """
        if api_base_url is None:
            port = os.getenv("PORT", "8080")
            api_base_url = f"http://localhost:{port}"
        
        self.access_token = access_token
        self.api_base_url = api_base_url
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def get_headers(self) -> Dict[str, str]:
        """Get headers with authentication token."""
        return {"Authorization": f"Bearer {self.access_token}"}
    
    async def api_request(self, method: str, endpoint: str, **kwargs) -> dict:
        """Make an authenticated API request."""
        headers = await self.get_headers()
        
        response = await self.client.request(
            method,
            f"{self.api_base_url}{endpoint}",
            headers=headers,
            **kwargs
        )
        response.raise_for_status()
        return response.json()
    
    async def buy_stock(self, ticker: str, quantity: float, price: float, date: Optional[str] = None) -> str:
        """Buy stock."""
        from datetime import datetime
        
        result = await self.api_request(
            "POST",
            "/api/transactions",
            json={
                "ticker": ticker.upper(),
                "type": "buy",
                "quantity": quantity,
                "price": price,
                "date": date or datetime.now().strftime("%Y-%m-%d")
            }
        )
        return f"✅ Successfully bought {quantity} shares of {ticker.upper()} at ${price:.2f} per share.\nTotal cost: ${quantity * price:.2f}"
    
    async def sell_stock(self, ticker: str, quantity: float, price: float, date: Optional[str] = None) -> str:
        """Sell stock."""
        from datetime import datetime
        
        result = await self.api_request(
            "POST",
            "/api/transactions",
            json={
                "ticker": ticker.upper(),
                "type": "sell",
                "quantity": quantity,
                "price": price,
                "date": date or datetime.now().strftime("%Y-%m-%d")
            }
        )
        return f"✅ Successfully sold {quantity} shares of {ticker.upper()} at ${price:.2f} per share.\nTotal proceeds: ${quantity * price:.2f}"
    
    async def get_portfolio_summary(self) -> str:
        """Get portfolio summary."""
        result = await self.api_request("GET", "/api/portfolio/summary")
        holdings = result.get("holdings", [])
        total_value = result.get("total_value", 0)
        
        if not holdings:
            return "📊 Your portfolio is empty. Start by buying some stocks!"
        
        output = f"📊 **Portfolio Summary**\n\n"
        output += f"**Total Portfolio Value: ${total_value:,.2f}**\n\n"
        output += "Holdings:\n"
        
        for stock in holdings:
            gain_loss_pct = (stock['gain_loss'] / (stock['market_value'] - stock['gain_loss']) * 100) if stock['market_value'] != stock['gain_loss'] else 0
            gain_emoji = "📈" if stock['gain_loss'] >= 0 else "📉"
            
            output += f"\n{stock['ticker']} - {stock.get('company_name', stock['ticker'])}\n"
            output += f"  • Quantity: {stock['quantity']} shares\n"
            output += f"  • Avg Cost: ${stock['average_cost']:.2f}\n"
            output += f"  • Current Price: ${stock['current_price']:.2f}\n"
            output += f"  • Market Value: ${stock['market_value']:.2f}\n"
            output += f"  • Gain/Loss: {gain_emoji} ${stock['gain_loss']:.2f} ({gain_loss_pct:+.2f}%)\n"
        
        return output
    
    async def get_stock_price(self, ticker: str) -> str:
        """Get current stock price."""
        result = await self.api_request("GET", f"/api/stock/{ticker.upper()}/current")
        
        output = f"📈 **{ticker.upper()}** - {result.get('company_name', ticker)}\n\n"
        output += f"Current Price: ${result['price']:.2f}\n"
        
        if result.get('previous_close'):
            change = result['price'] - result['previous_close']
            change_pct = (change / result['previous_close']) * 100
            change_emoji = "📈" if change >= 0 else "📉"
            output += f"Previous Close: ${result['previous_close']:.2f}\n"
            output += f"Change: {change_emoji} ${change:+.2f} ({change_pct:+.2f}%)"
        
        return output
    
    async def add_to_watchlist(self, ticker: str) -> str:
        """Add stock to watchlist."""
        await self.api_request(
            "POST",
            "/api/watchlist",
            json={"ticker": ticker.upper()}
        )
        return f"👁️ Added {ticker.upper()} to your watchlist."
    
    async def get_watchlist(self) -> str:
        """Get watchlist."""
        result = await self.api_request("GET", "/api/watchlist")
        
        if not result:
            return "👁️ Your watchlist is empty."
        
        output = "👁️ **Watchlist**\n\n"
        
        for item in result:
            ticker = item['ticker']
            try:
                price_data = await self.api_request("GET", f"/api/stock/{ticker}/current")
                change = price_data['price'] - price_data.get('previous_close', price_data['price'])
                change_pct = (change / price_data.get('previous_close', price_data['price'])) * 100 if price_data.get('previous_close') else 0
                change_emoji = "📈" if change >= 0 else "📉"
                
                output += f"{ticker} - {price_data.get('company_name', ticker)}\n"
                output += f"  ${price_data['price']:.2f} {change_emoji} ${change:+.2f} ({change_pct:+.2f}%)\n\n"
            except:
                output += f"{ticker}\n  (Price unavailable)\n\n"
        
        return output
    
    async def remove_from_watchlist(self, ticker: str) -> str:
        """Remove stock from watchlist."""
        watchlist = await self.api_request("GET", "/api/watchlist")
        item = next((w for w in watchlist if w['ticker'] == ticker.upper()), None)
        
        if not item:
            return f"❌ {ticker.upper()} is not in your watchlist."
        
        await self.api_request("DELETE", f"/api/watchlist/{item['id']}")
        return f"✅ Removed {ticker.upper()} from your watchlist."
    
    async def get_transaction_history(self) -> str:
        """Get transaction history."""
        result = await self.api_request("GET", "/api/transactions")
        
        if not result:
            return "📜 No transaction history found."
        
        output = "📜 **Transaction History**\n\n"
        
        for txn in sorted(result, key=lambda x: x['date'], reverse=True)[:20]:
            emoji = "🟢" if txn['type'] == 'buy' else "🔴"
            output += f"{emoji} {txn['date']} - {txn['type'].upper()} {txn['quantity']} {txn['ticker']} @ ${txn['price']:.2f}\n"
        
        return output
    
    async def execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> str:
        """
        Execute a tool by name with given arguments.
        
        This is the main entry point for the chat assistant to call MCP tools.
        
        Args:
            tool_name: Name of the tool to execute
            arguments: Dictionary of arguments for the tool
            
        Returns:
            String result from the tool execution
        """
        try:
            if tool_name == "buy_stock":
                return await self.buy_stock(
                    arguments["ticker"],
                    arguments["quantity"],
                    arguments["price"],
                    arguments.get("date")
                )
            elif tool_name == "sell_stock":
                return await self.sell_stock(
                    arguments["ticker"],
                    arguments["quantity"],
                    arguments["price"],
                    arguments.get("date")
                )
            elif tool_name == "get_portfolio_summary":
                return await self.get_portfolio_summary()
            elif tool_name == "get_stock_price":
                return await self.get_stock_price(arguments["ticker"])
            elif tool_name == "add_to_watchlist":
                return await self.add_to_watchlist(arguments["ticker"])
            elif tool_name == "get_watchlist":
                return await self.get_watchlist()
            elif tool_name == "remove_from_watchlist":
                return await self.remove_from_watchlist(arguments["ticker"])
            elif tool_name == "get_transaction_history":
                return await self.get_transaction_history()
            else:
                return f"❌ Unknown tool: {tool_name}"
        except Exception as e:
            return f"❌ Error: {str(e)}"
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


# Tool definitions for the LLM to understand what tools are available
AVAILABLE_TOOLS = [
    {
        "name": "buy_stock",
        "description": "Record a stock purchase transaction",
        "parameters": {
            "ticker": "Stock ticker symbol (e.g., AAPL, MSFT)",
            "quantity": "Number of shares to buy",
            "price": "Price per share in USD",
            "date": "Transaction date (optional, defaults to today)"
        }
    },
    {
        "name": "sell_stock",
        "description": "Record a stock sale transaction",
        "parameters": {
            "ticker": "Stock ticker symbol",
            "quantity": "Number of shares to sell",
            "price": "Price per share in USD",
            "date": "Transaction date (optional)"
        }
    },
    {
        "name": "get_portfolio_summary",
        "description": "Get current portfolio holdings and total value",
        "parameters": {}
    },
    {
        "name": "get_stock_price",
        "description": "Get current price for a stock",
        "parameters": {
            "ticker": "Stock ticker symbol"
        }
    },
    {
        "name": "add_to_watchlist",
        "description": "Add a stock to watchlist",
        "parameters": {
            "ticker": "Stock ticker symbol"
        }
    },
    {
        "name": "get_watchlist",
        "description": "Get all stocks in watchlist",
        "parameters": {}
    },
    {
        "name": "remove_from_watchlist",
        "description": "Remove a stock from watchlist",
        "parameters": {
            "ticker": "Stock ticker symbol"
        }
    },
    {
        "name": "get_transaction_history",
        "description": "Get transaction history",
        "parameters": {}
    }
]
