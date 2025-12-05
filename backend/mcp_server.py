#!/usr/bin/env python3
"""
NVest AI MCP Server

This MCP server provides tools for managing a stock portfolio through natural language.
It connects to the NVest AI FastAPI backend.
"""

import asyncio
import os
from datetime import datetime
from typing import Any, Optional, List
import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent
import logging
import requests
from lxml import html
import urllib3

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Configure logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    filename='mcp_server.log',
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
PORT = os.getenv("PORT", "8080")
API_BASE_URL = os.getenv("PORTFOLIO_API_URL", f"http://localhost:{PORT}")
USER_EMAIL = os.getenv("PORTFOLIO_USER_EMAIL", "")
USER_PASSWORD = os.getenv("PORTFOLIO_USER_PASSWORD", "")
ACCESS_TOKEN = os.getenv("PORTFOLIO_ACCESS_TOKEN", "")

# Global variables for authentication
access_token: Optional[str] = None
client = httpx.AsyncClient(timeout=30.0)


async def authenticate() -> str:
    """Authenticate with the NVest AI API and return access token."""
    global access_token
    
    if ACCESS_TOKEN:
        access_token = ACCESS_TOKEN
        return access_token
    
    if not USER_EMAIL or not USER_PASSWORD:
        raise ValueError("Either PORTFOLIO_ACCESS_TOKEN or (PORTFOLIO_USER_EMAIL and PORTFOLIO_USER_PASSWORD) must be set")
    
    response = await client.post(
        f"{API_BASE_URL}/api/auth/token",
        data={
            "username": USER_EMAIL,
            "password": USER_PASSWORD
        }
    )
    response.raise_for_status()
    data = response.json()
    access_token = data["access_token"]
    return access_token


async def get_headers() -> dict:
    """Get headers with authentication token."""
    global access_token
    
    if not access_token:
        await authenticate()
    
    return {"Authorization": f"Bearer {access_token}"}


async def api_request(method: str, endpoint: str, **kwargs) -> dict:
    """Make an authenticated API request."""
    headers = await get_headers()
    
    try:
        response = await client.request(
            method,
            f"{API_BASE_URL}{endpoint}",
            headers=headers,
            **kwargs
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            await authenticate()
            headers = await get_headers()
            response = await client.request(
                method,
                f"{API_BASE_URL}{endpoint}",
                headers=headers,
                **kwargs
            )
            response.raise_for_status()
            return response.json()
        raise


# Initialize MCP server
app = Server("portfolio-tracker")


@app.list_tools()
async def list_tools() -> List[Tool]:
    """List available portfolio management tools."""
    logger.info("Listing tools")
    return [
        Tool(
            name="buy_stock",
            description="Record a stock purchase transaction.",
            inputSchema={
                "type": "object",
                "properties": {
                    "ticker": {"type": "string", "description": "Stock ticker symbol"},
                    "quantity": {"type": "number", "description": "Number of shares"},
                    "price": {"type": "number", "description": "Price per share in USD"},
                    "date": {"type": "string", "description": "Transaction date (YYYY-MM-DD)", "default": datetime.now().strftime("%Y-%m-%d")}
                },
                "required": ["ticker", "quantity", "price"]
            }
        ),
        Tool(
            name="sell_stock",
            description="Record a stock sale transaction.",
            inputSchema={
                "type": "object",
                "properties": {
                    "ticker": {"type": "string", "description": "Stock ticker symbol"},
                    "quantity": {"type": "number", "description": "Number of shares"},
                    "price": {"type": "number", "description": "Price per share in USD"},
                    "date": {"type": "string", "description": "Transaction date (YYYY-MM-DD)", "default": datetime.now().strftime("%Y-%m-%d")}
                },
                "required": ["ticker", "quantity", "price"]
            }
        ),
        Tool(
            name="get_portfolio_summary",
            description="Get current portfolio holdings and total value.",
            inputSchema={"type": "object", "properties": {}}
        ),
        Tool(
            name="get_stock_price",
            description="Get the current price for a stock ticker.",
            inputSchema={
                "type": "object",
                "properties": {
                    "ticker": {"type": "string", "description": "Stock ticker symbol"}
                },
                "required": ["ticker"]
            }
        ),
        Tool(
            name="add_to_watchlist",
            description="Add a stock to the watchlist.",
            inputSchema={
                "type": "object",
                "properties": {
                    "ticker": {"type": "string", "description": "Stock ticker symbol"}
                },
                "required": ["ticker"]
            }
        ),
        Tool(
            name="get_watchlist",
            description="Get all stocks in the watchlist.",
            inputSchema={"type": "object", "properties": {}}
        ),
        Tool(
            name="remove_from_watchlist",
            description="Remove a stock from the watchlist.",
            inputSchema={
                "type": "object",
                "properties": {
                    "ticker": {"type": "string", "description": "Stock ticker symbol"}
                },
                "required": ["ticker"]
            }
        ),
        Tool(
            name="get_transaction_history",
            description="Get all transaction history.",
            inputSchema={"type": "object", "properties": {}}
        ),
        Tool(
            name="web_search",
            description="Search the web for financial news and market updates.",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The search query"},
                    "max_results": {"type": "integer", "description": "Max results (default: 5)", "default": 5}
                },
                "required": ["query"]
            }
        )
    ]


@app.call_tool()
async def call_tool(name: str, arguments: Any) -> List[TextContent]:
    """Handle tool calls."""
    logger.info(f"Calling tool: {name} with args: {arguments}")
    
    try:
        if name == "buy_stock":
            result = await api_request(
                "POST", "/api/transactions",
                json={
                    "ticker": arguments["ticker"].upper(),
                    "type": "buy",
                    "quantity": arguments["quantity"],
                    "price": arguments["price"],
                    "date": arguments.get("date", datetime.now().strftime("%Y-%m-%d"))
                }
            )
            return [TextContent(
                type="text",
                text=f"✅ Bought {arguments['quantity']} shares of {arguments['ticker'].upper()} at ${arguments['price']:.2f}"
            )]
        
        elif name == "sell_stock":
            result = await api_request(
                "POST", "/api/transactions",
                json={
                    "ticker": arguments["ticker"].upper(),
                    "type": "sell",
                    "quantity": arguments["quantity"],
                    "price": arguments["price"],
                    "date": arguments.get("date", datetime.now().strftime("%Y-%m-%d"))
                }
            )
            return [TextContent(
                type="text",
                text=f"✅ Sold {arguments['quantity']} shares of {arguments['ticker'].upper()} at ${arguments['price']:.2f}"
            )]
        
        elif name == "get_portfolio_summary":
            result = await api_request("GET", "/api/portfolio/summary")
            holdings = result.get("holdings", [])
            total_value = result.get("total_value", 0)
            
            if not holdings:
                return [TextContent(type="text", text="📊 Your portfolio is empty.")]
            
            output = f"📊 **Portfolio Summary**\n\nTotal Value: ${total_value:,.2f}\n\nHoldings:\n"
            for stock in holdings:
                gain_loss_pct = (stock['gain_loss'] / (stock['market_value'] - stock['gain_loss']) * 100) if stock['market_value'] != stock['gain_loss'] else 0
                output += f"\n{stock['ticker']}: {stock['quantity']} shares @ ${stock['current_price']:.2f}\n"
                output += f"  Gain/Loss: ${stock['gain_loss']:.2f} ({gain_loss_pct:+.2f}%)\n"
            
            return [TextContent(type="text", text=output)]
        
        elif name == "get_stock_price":
            result = await api_request("GET", f"/api/stock/{arguments['ticker'].upper()}/current")
            output = f"📈 {arguments['ticker'].upper()}: ${result['price']:.2f}"
            if result.get('previous_close'):
                change = result['price'] - result['previous_close']
                change_pct = (change / result['previous_close']) * 100
                output += f" ({change:+.2f}, {change_pct:+.2f}%)"
            return [TextContent(type="text", text=output)]
        
        elif name == "add_to_watchlist":
            await api_request("POST", "/api/watchlist", json={"ticker": arguments["ticker"].upper()})
            return [TextContent(type="text", text=f"👁️ Added {arguments['ticker'].upper()} to watchlist")]
        
        elif name == "get_watchlist":
            result = await api_request("GET", "/api/watchlist")
            if not result:
                return [TextContent(type="text", text="👁️ Watchlist is empty")]
            
            output = "👁️ **Watchlist**\n\n"
            for item in result:
                output += f"{item['ticker']}\n"
            return [TextContent(type="text", text=output)]
        
        elif name == "remove_from_watchlist":
            watchlist = await api_request("GET", "/api/watchlist")
            item = next((w for w in watchlist if w['ticker'] == arguments['ticker'].upper()), None)
            if not item:
                return [TextContent(type="text", text=f"❌ {arguments['ticker'].upper()} not in watchlist")]
            await api_request("DELETE", f"/api/watchlist/{item['id']}")
            return [TextContent(type="text", text=f"✅ Removed {arguments['ticker'].upper()} from watchlist")]
        
        elif name == "get_transaction_history":
            result = await api_request("GET", "/api/transactions")
            if not result:
                return [TextContent(type="text", text="📜 No transactions")]
            
            output = "📜 **Transaction History**\n\n"
            for txn in sorted(result, key=lambda x: x['date'], reverse=True)[:20]:
                emoji = "🟢" if txn['type'] == 'buy' else "🔴"
                output += f"{emoji} {txn['date']}: {txn['type'].upper()} {txn['quantity']} {txn['ticker']} @ ${txn['price']:.2f}\n"
            return [TextContent(type="text", text=output)]
        
        elif name == "web_search":
            query = arguments["query"]
            max_results = arguments.get("max_results", 5)
            logger.info(f"Web search: {query}")
            
            try:
                headers = {"User-Agent": "Mozilla/5.0"}
                response = requests.post(
                    "https://html.duckduckgo.com/html/",
                    data={"q": query},
                    headers=headers,
                    timeout=15,
                    verify=False
                )
                response.raise_for_status()
                
                tree = html.fromstring(response.content)
                result_elements = tree.xpath('//div[contains(@class, "result__body")]')
                
                results = []
                for elem in result_elements[:max_results]:
                    title_elem = elem.xpath('.//a[contains(@class, "result__a")]')
                    snippet_elem = elem.xpath('.//a[contains(@class, "result__snippet")]')
                    
                    if title_elem:
                        title = title_elem[0].text_content().strip()
                        href = title_elem[0].get('href')
                        snippet = snippet_elem[0].text_content().strip() if snippet_elem else ""
                        results.append(f"**{title}**\n{snippet}\n{href}")
                
                if not results:
                    return [TextContent(type="text", text=f"No results for '{query}'")]
                
                return [TextContent(type="text", text="\n\n".join(results))]
                
            except Exception as e:
                logger.error(f"Search failed: {e}", exc_info=True)
                return [TextContent(type="text", text=f"Search failed: {str(e)}")]
        
        else:
            return [TextContent(type="text", text=f"Unknown tool: {name}")]
    
    except Exception as e:
        logger.error(f"Tool execution failed: {e}", exc_info=True)
        return [TextContent(type="text", text=f"❌ Error: {str(e)}")]


async def main():
    """Run the MCP server."""
    try:
        logger.info("Starting MCP server")
        async with stdio_server() as (read_stream, write_stream):
            await app.run(read_stream, write_stream, app.create_initialization_options())
    except Exception as e:
        logger.error(f"Server crashed: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    asyncio.run(main())
