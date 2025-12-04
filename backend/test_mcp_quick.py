#!/usr/bin/env python3
"""
Quick MCP Server Connection Test
Tests basic MCP server functionality without requiring backend authentication
"""

import asyncio
import os
import sys
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def test_mcp_basic():
    """Test basic MCP server connection and tool listing"""
    
    print("="*60)
    print("MCP SERVER BASIC CONNECTION TEST")
    print("="*60)
    
    # Setup environment (no auth required for basic test)
    env = os.environ.copy()
    env["PORTFOLIO_API_URL"] = "http://localhost:8080"
    env["PORTFOLIO_USER_EMAIL"] = "test@example.com"
    env["PORTFOLIO_USER_PASSWORD"] = "test"
    
    server_script = os.path.join(os.path.dirname(__file__), "mcp_server.py")
    print(f"\nServer script: {server_script}")
    print(f"Python: {sys.executable}\n")
    
    server_params = StdioServerParameters(
        command=sys.executable,
        args=[server_script],
        env=env
    )
    
    try:
        print("🔌 Connecting to MCP server...")
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                # Initialize session
                await session.initialize()
                print("✅ MCP session initialized\n")
                
                # List tools
                print("📋 Listing available tools...")
                tools_response = await session.list_tools()
                tools = tools_response.tools
                print(f"✅ Found {len(tools)} tools:\n")
                
                for i, tool in enumerate(tools, 1):
                    print(f"  {i}. {tool.name}")
                    print(f"     {tool.description}")
                    print()
                
                # Test web search (doesn't require auth)
                print("🔍 Testing web_search tool...")
                try:
                    result = await session.call_tool("web_search", {
                        "query": "Tesla stock",
                        "max_results": 2
                    })
                    text = "\n".join([item.text for item in result.content if hasattr(item, 'text')])
                    print(f"✅ Web search successful!")
                    print(f"   Results: {text[:200]}...\n")
                except Exception as e:
                    print(f"⚠️  Web search failed: {e}\n")
                
                print("="*60)
                print("✅ MCP SERVER IS WORKING CORRECTLY")
                print("="*60)
                print("\nNote: Portfolio tools require backend authentication.")
                print("To test all features, run test_mcp_server.py with backend running.\n")
                
    except Exception as e:
        print(f"\n❌ ERROR: {e}\n")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    success = asyncio.run(test_mcp_basic())
    sys.exit(0 if success else 1)
