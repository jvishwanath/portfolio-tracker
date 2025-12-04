import os
import json
from typing import Optional
from google import genai
from google.genai import types
from openai import OpenAI
from ddgs import DDGS

class LLMService:
    def __init__(self):
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")
        
        self.gemini_client = None
        self.openai_client = None
        
        if self.gemini_key:
            try:
                self.gemini_client = genai.Client(api_key=self.gemini_key)
            except Exception as e:
                print(f"Failed to initialize Gemini client: {e}")
                
        if self.openai_key:
            try:
                self.openai_client = OpenAI(api_key=self.openai_key)
            except Exception as e:
                print(f"Failed to initialize OpenAI client: {e}")

    async def generate_response(self, context: str, user_query: str, access_token: Optional[str] = None) -> str:
        # Prioritize OpenAI for stability (simple ddgs, no MCP complexity)
        if self.openai_client:
            return await self._generate_openai(context, user_query, access_token)
        elif self.gemini_client:
            return await self._generate_gemini(context, user_query, access_token)
        else:
            return "No AI API keys found. Please set GEMINI_API_KEY or OPENAI_API_KEY in your environment variables."

    async def _generate_gemini(self, context: str, user_query: str, access_token: Optional[str] = None) -> str:
        """Generate response using Gemini with Google Search grounding."""
        try:
            print("[Gemini] Calling Gemini with Google Search...")
            
            # Use Google Search grounding (built-in to Gemini)
            grounding_tool = types.Tool(google_search=types.GoogleSearch())
            config = types.GenerateContentConfig(tools=[grounding_tool])
            
            response = self.gemini_client.models.generate_content(
                model="gemini-2.0-flash-exp",
                contents=f"{context}\n\nUser Question: {user_query}",
                config=config
            )
            
            # Extract text from response
            if hasattr(response, 'text') and response.text:
                print("[Gemini] Success")
                return response.text
            
            # Try to extract from candidates
            if hasattr(response, 'candidates') and response.candidates:
                for candidate in response.candidates:
                    if hasattr(candidate, 'content') and candidate.content:
                        if hasattr(candidate.content, 'parts') and candidate.content.parts:
                            for part in candidate.content.parts:
                                if hasattr(part, 'text') and part.text:
                                    print("[Gemini] Success (from parts)")
                                    return part.text
            
            print("[Gemini] Empty response, falling back to OpenAI")
            if self.openai_client:
                return self._generate_openai(context, user_query)
            return "I apologize, but I couldn't generate a response."
                
        except Exception as e:
            print(f"[Gemini] Error: {e}")
            if self.openai_client:
                print("[Gemini] Falling back to OpenAI...")
                return self._generate_openai(context, user_query)
            return f"Error communicating with AI: {str(e)}"

    def _web_search(self, query: str) -> str:
        """Performs a web search using DuckDuckGo."""
        try:
            results = DDGS().text(query, max_results=5)
            if not results:
                return "No search results found."
            return json.dumps(results)
        except Exception as e:
            return f"Error performing search: {str(e)}"

    async def _execute_portfolio_tool(self, tool_name: str, arguments: dict, access_token: str) -> str:
        """Execute portfolio management tools by calling the backend API."""
        import httpx
        
        headers = {"Authorization": f"Bearer {access_token}"}
        api_url = os.getenv("PORTFOLIO_API_URL", "http://localhost:8080")
        
        async with httpx.AsyncClient() as client:
            try:
                if tool_name == "buy_stock":
                    transaction_data = {
                        "ticker": arguments["ticker"].upper(),
                        "type": "buy",
                        "quantity": arguments["quantity"],
                        "price": arguments["price"]
                    }
                    # Only add date if explicitly provided
                    if arguments.get("date"):
                        transaction_data["date"] = arguments["date"]
                    
                    response = await client.post(
                        f"{api_url}/api/transactions",
                        json=transaction_data,
                        headers=headers
                    )
                    response.raise_for_status()
                    return f"✅ Successfully bought {arguments['quantity']} shares of {arguments['ticker'].upper()} at ${arguments['price']:.2f}"
                
                elif tool_name == "sell_stock":
                    transaction_data = {
                        "ticker": arguments["ticker"].upper(),
                        "type": "sell",
                        "quantity": arguments["quantity"],
                        "price": arguments["price"]
                    }
                    # Only add date if explicitly provided
                    if arguments.get("date"):
                        transaction_data["date"] = arguments["date"]
                    
                    response = await client.post(
                        f"{api_url}/api/transactions",
                        json=transaction_data,
                        headers=headers
                    )
                    response.raise_for_status()
                    return f"✅ Successfully sold {arguments['quantity']} shares of {arguments['ticker'].upper()} at ${arguments['price']:.2f}"
                
                elif tool_name == "get_stock_price":
                    response = await client.get(
                        f"{api_url}/api/stock/{arguments['ticker'].upper()}/current",
                        headers=headers
                    )
                    response.raise_for_status()
                    data = response.json()
                    return f"📈 {arguments['ticker'].upper()}: ${data['price']:.2f}"
                
                return f"Unknown tool: {tool_name}"
            except Exception as e:
                return f"Error executing {tool_name}: {str(e)}"

    async def _generate_openai(self, context: str, user_query: str, access_token: str = None) -> str:
        try:
            # Define the tools available to OpenAI
            tools = [
                {
                    "type": "function",
                    "function": {
                        "name": "web_search",
                        "description": "Search the internet for real-time information, news, or stock prices.",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "query": {
                                    "type": "string",
                                    "description": "The search query to look up."
                                }
                            },
                            "required": ["query"]
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "buy_stock",
                        "description": "Record a stock purchase transaction in the portfolio.",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "ticker": {
                                    "type": "string",
                                    "description": "Stock ticker symbol (e.g., AAPL, MSFT)"
                                },
                                "quantity": {
                                    "type": "number",
                                    "description": "Number of shares to buy"
                                },
                                "price": {
                                    "type": "number",
                                    "description": "Price per share in USD"
                                }
                            },
                            "required": ["ticker", "quantity", "price"]
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "sell_stock",
                        "description": "Record a stock sale transaction in the portfolio.",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "ticker": {
                                    "type": "string",
                                    "description": "Stock ticker symbol (e.g., AAPL, MSFT)"
                                },
                                "quantity": {
                                    "type": "number",
                                    "description": "Number of shares to sell"
                                },
                                "price": {
                                    "type": "number",
                                    "description": "Price per share in USD"
                                }
                            },
                            "required": ["ticker", "quantity", "price"]
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "get_stock_price",
                        "description": "Get the current price for a stock ticker.",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "ticker": {
                                    "type": "string",
                                    "description": "Stock ticker symbol (e.g., AAPL, MSFT)"
                                }
                            },
                            "required": ["ticker"]
                        }
                    }
                }
            ]

            messages = [
                {"role": "system", "content": context},
                {"role": "user", "content": user_query}
            ]

            # First call: Ask OpenAI
            response = self.openai_client.chat.completions.create(
                model="gpt-4o", 
                messages=messages,
                tools=tools,
                tool_choice="auto"
            )
            
            response_message = response.choices[0].message
            tool_calls = response_message.tool_calls

            # Check if OpenAI wants to use a tool
            if tool_calls:
                # Add the assistant's request to the conversation history
                messages.append(response_message)
                
                # Execute the tool calls
                for tool_call in tool_calls:
                    function_name = tool_call.function.name
                    function_args = json.loads(tool_call.function.arguments)
                    
                    print(f"[OpenAI] Calling tool: {function_name} with {function_args}")
                    
                    if function_name == "web_search":
                        search_query = function_args.get("query")
                        function_response = self._web_search(search_query)
                    elif function_name in ["buy_stock", "sell_stock", "get_stock_price"]:
                        if not access_token:
                            function_response = "Error: Authentication required for portfolio operations"
                        else:
                            function_response = await self._execute_portfolio_tool(function_name, function_args, access_token)
                    else:
                        function_response = f"Unknown function: {function_name}"
                    
                    # Add the tool response to the conversation history
                    messages.append({
                        "tool_call_id": tool_call.id,
                        "role": "tool",
                        "name": function_name,
                        "content": function_response,
                    })
                
                # Second call: Get the final answer from OpenAI using the tool results
                second_response = self.openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=messages
                )
                return second_response.choices[0].message.content
            
            # If no tool was called, return the direct response
            return response_message.content

        except Exception as e:
            raise e
