#!/usr/bin/env python3
"""
Comprehensive MCP Server Test Suite
Tests all portfolio management tools and web search functionality
"""

import asyncio
import os
import sys
import requests
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from datetime import datetime

# ANSI color codes for pretty output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

class MCPServerTester:
    def __init__(self):
        self.passed_tests = 0
        self.failed_tests = 0
        self.access_token = None
        
    def print_header(self, text):
        """Print a section header"""
        print(f"\n{BLUE}{'='*60}")
        print(f"{text}")
        print(f"{'='*60}{RESET}\n")
    
    def print_test(self, name, passed, details=""):
        """Print test result"""
        if passed:
            self.passed_tests += 1
            print(f"{GREEN}✓{RESET} {name}")
        else:
            self.failed_tests += 1
            print(f"{RED}✗{RESET} {name}")
        if details:
            print(f"  {details}")
    
    def get_guest_token(self):
        """Get a guest access token from the backend"""
        try:
            response = requests.post("http://localhost:8080/api/auth/guest")
            response.raise_for_status()
            self.access_token = response.json()["access_token"]
            self.print_test("Get guest access token", True, f"Token: {self.access_token[:20]}...")
            return True
        except Exception as e:
            self.print_test("Get guest access token", False, f"Error: {e}")
            return False
    
    async def test_mcp_connection(self):
        """Test 1: MCP Server Connection"""
        self.print_header("TEST 1: MCP Server Connection")
        
        env = os.environ.copy()
        env["PORTFOLIO_API_URL"] = "http://localhost:8080"
        env["PORTFOLIO_ACCESS_TOKEN"] = self.access_token
        
        server_script = os.path.join(os.path.dirname(__file__), "mcp_server.py")
        
        server_params = StdioServerParameters(
            command=sys.executable,
            args=[server_script],
            env=env
        )
        
        try:
            async with stdio_client(server_params) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    self.print_test("MCP session initialization", True)
                    return session, read, write
        except Exception as e:
            self.print_test("MCP session initialization", False, f"Error: {e}")
            return None, None, None
    
    async def test_list_tools(self, session):
        """Test 2: List Available Tools"""
        self.print_header("TEST 2: List Available Tools")
        
        try:
            tools_response = await session.list_tools()
            tools = tools_response.tools
            
            expected_tools = [
                "buy_stock", "sell_stock", "get_portfolio_summary",
                "get_stock_price", "add_to_watchlist", "get_watchlist",
                "remove_from_watchlist", "get_transaction_history", "web_search"
            ]
            
            tool_names = [tool.name for tool in tools]
            
            self.print_test(f"Found {len(tools)} tools", len(tools) == 9)
            
            for expected in expected_tools:
                found = expected in tool_names
                self.print_test(f"  Tool: {expected}", found)
            
            return tools
        except Exception as e:
            self.print_test("List tools", False, f"Error: {e}")
            return []
    
    async def test_portfolio_summary(self, session):
        """Test 3: Get Portfolio Summary"""
        self.print_header("TEST 3: Get Portfolio Summary")
        
        try:
            result = await session.call_tool("get_portfolio_summary", {})
            text = "\n".join([item.text for item in result.content if hasattr(item, 'text')])
            
            # Check if response contains expected content
            has_portfolio_info = "portfolio" in text.lower() or "holdings" in text.lower()
            self.print_test("Get portfolio summary", has_portfolio_info, f"Response: {text[:100]}...")
            return text
        except Exception as e:
            self.print_test("Get portfolio summary", False, f"Error: {e}")
            return None
    
    async def test_stock_price(self, session):
        """Test 4: Get Stock Price"""
        self.print_header("TEST 4: Get Stock Price")
        
        test_tickers = ["AAPL", "MSFT", "GOOGL"]
        
        for ticker in test_tickers:
            try:
                result = await session.call_tool("get_stock_price", {"ticker": ticker})
                text = "\n".join([item.text for item in result.content if hasattr(item, 'text')])
                
                # Check if response contains price information
                has_price = "$" in text and ticker in text
                self.print_test(f"Get {ticker} price", has_price, text)
            except Exception as e:
                self.print_test(f"Get {ticker} price", False, f"Error: {e}")
    
    async def test_buy_stock(self, session):
        """Test 5: Buy Stock Transaction"""
        self.print_header("TEST 5: Buy Stock Transaction")
        
        try:
            result = await session.call_tool("buy_stock", {
                "ticker": "TSLA",
                "quantity": 5,
                "price": 250.00
            })
            text = "\n".join([item.text for item in result.content if hasattr(item, 'text')])
            
            # Check if transaction was successful
            success = "successfully" in text.lower() or "✅" in text
            self.print_test("Buy 5 TSLA @ $250", success, text)
            return success
        except Exception as e:
            self.print_test("Buy stock", False, f"Error: {e}")
            return False
    
    async def test_sell_stock(self, session):
        """Test 6: Sell Stock Transaction"""
        self.print_header("TEST 6: Sell Stock Transaction")
        
        try:
            result = await session.call_tool("sell_stock", {
                "ticker": "TSLA",
                "quantity": 2,
                "price": 260.00
            })
            text = "\n".join([item.text for item in result.content if hasattr(item, 'text')])
            
            # Check if transaction was successful
            success = "successfully" in text.lower() or "✅" in text
            self.print_test("Sell 2 TSLA @ $260", success, text)
            return success
        except Exception as e:
            self.print_test("Sell stock", False, f"Error: {e}")
            return False
    
    async def test_transaction_history(self, session):
        """Test 7: Get Transaction History"""
        self.print_header("TEST 7: Get Transaction History")
        
        try:
            result = await session.call_tool("get_transaction_history", {})
            text = "\n".join([item.text for item in result.content if hasattr(item, 'text')])
            
            # Check if response contains transaction info
            has_transactions = "tsla" in text.lower() or "transaction" in text.lower()
            self.print_test("Get transaction history", has_transactions, f"Response: {text[:200]}...")
            return text
        except Exception as e:
            self.print_test("Get transaction history", False, f"Error: {e}")
            return None
    
    async def test_watchlist_operations(self, session):
        """Test 8: Watchlist Operations"""
        self.print_header("TEST 8: Watchlist Operations")
        
        # Add to watchlist
        try:
            result = await session.call_tool("add_to_watchlist", {"ticker": "NVDA"})
            text = "\n".join([item.text for item in result.content if hasattr(item, 'text')])
            success = "added" in text.lower() or "👁️" in text
            self.print_test("Add NVDA to watchlist", success, text)
        except Exception as e:
            self.print_test("Add to watchlist", False, f"Error: {e}")
        
        # Get watchlist
        try:
            result = await session.call_tool("get_watchlist", {})
            text = "\n".join([item.text for item in result.content if hasattr(item, 'text')])
            has_nvda = "nvda" in text.lower()
            self.print_test("Get watchlist (contains NVDA)", has_nvda, text)
        except Exception as e:
            self.print_test("Get watchlist", False, f"Error: {e}")
        
        # Remove from watchlist
        try:
            result = await session.call_tool("remove_from_watchlist", {"ticker": "NVDA"})
            text = "\n".join([item.text for item in result.content if hasattr(item, 'text')])
            success = "removed" in text.lower() or "✅" in text
            self.print_test("Remove NVDA from watchlist", success, text)
        except Exception as e:
            self.print_test("Remove from watchlist", False, f"Error: {e}")
    
    async def test_web_search(self, session):
        """Test 9: Web Search"""
        self.print_header("TEST 9: Web Search")
        
        search_queries = [
            ("Tesla stock news", "tesla"),
            ("Apple earnings report", "apple"),
            ("NVIDIA AI chips", "nvidia")
        ]
        
        for query, expected_keyword in search_queries:
            try:
                result = await session.call_tool("web_search", {
                    "query": query,
                    "max_results": 2
                })
                text = "\n".join([item.text for item in result.content if hasattr(item, 'text')])
                
                # Check if search returned relevant results
                has_results = len(text) > 50 and expected_keyword.lower() in text.lower()
                self.print_test(f"Search: '{query}'", has_results, f"Found {len(text)} chars of results")
            except Exception as e:
                self.print_test(f"Search: '{query}'", False, f"Error: {e}")
    
    async def test_portfolio_after_transactions(self, session):
        """Test 10: Verify Portfolio After Transactions"""
        self.print_header("TEST 10: Verify Portfolio After Transactions")
        
        try:
            result = await session.call_tool("get_portfolio_summary", {})
            text = "\n".join([item.text for item in result.content if hasattr(item, 'text')])
            
            # Check if portfolio now contains TSLA
            has_tsla = "tsla" in text.lower()
            self.print_test("Portfolio contains TSLA", has_tsla, f"Portfolio: {text[:200]}...")
            return text
        except Exception as e:
            self.print_test("Verify portfolio", False, f"Error: {e}")
            return None
    
    async def run_all_tests(self):
        """Run all tests"""
        print(f"\n{BLUE}{'='*60}")
        print(f"MCP SERVER COMPREHENSIVE TEST SUITE")
        print(f"{'='*60}{RESET}\n")
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        # Get authentication token
        if not self.get_guest_token():
            print(f"\n{RED}Cannot proceed without authentication token{RESET}")
            print(f"{YELLOW}Make sure the backend is running: uvicorn main:app --reload --port 8080{RESET}")
            return
        
        # Connect to MCP server
        env = os.environ.copy()
        env["PORTFOLIO_API_URL"] = "http://localhost:8080"
        env["PORTFOLIO_ACCESS_TOKEN"] = self.access_token
        
        server_script = os.path.join(os.path.dirname(__file__), "mcp_server.py")
        server_params = StdioServerParameters(
            command=sys.executable,
            args=[server_script],
            env=env
        )
        
        try:
            async with stdio_client(server_params) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    self.print_test("MCP session initialization", True)
                    
                    # Run all tests
                    await self.test_list_tools(session)
                    await self.test_portfolio_summary(session)
                    await self.test_stock_price(session)
                    await self.test_buy_stock(session)
                    await self.test_sell_stock(session)
                    await self.test_transaction_history(session)
                    await self.test_watchlist_operations(session)
                    await self.test_web_search(session)
                    await self.test_portfolio_after_transactions(session)
                    
        except Exception as e:
            self.print_test("MCP session", False, f"Error: {e}")
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        total = self.passed_tests + self.failed_tests
        pass_rate = (self.passed_tests / total * 100) if total > 0 else 0
        
        print(f"\n{BLUE}{'='*60}")
        print(f"TEST SUMMARY")
        print(f"{'='*60}{RESET}\n")
        print(f"Total Tests: {total}")
        print(f"{GREEN}Passed: {self.passed_tests}{RESET}")
        print(f"{RED}Failed: {self.failed_tests}{RESET}")
        print(f"Pass Rate: {pass_rate:.1f}%\n")
        
        if self.failed_tests == 0:
            print(f"{GREEN}🎉 ALL TESTS PASSED! 🎉{RESET}\n")
        else:
            print(f"{YELLOW}⚠️  Some tests failed. Please review the output above.{RESET}\n")

async def main():
    tester = MCPServerTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())
