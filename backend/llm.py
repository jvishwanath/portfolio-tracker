import os
import json
from google import genai
from google.genai import types
from openai import OpenAI
from duckduckgo_search import DDGS

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

    def generate_response(self, context: str, user_query: str) -> str:
        # Default to Gemini if available
        if self.gemini_client:
            return self._generate_gemini(context, user_query)
        elif self.openai_client:
            return self._generate_openai(context, user_query)
        else:
            return "No AI API keys found. Please set GEMINI_API_KEY or OPENAI_API_KEY in your environment variables."

    def _generate_gemini(self, context: str, user_query: str) -> str:
        try:
            grounding_tool = types.Tool(
                google_search=types.GoogleSearch()
            )
            config = types.GenerateContentConfig(
                tools=[grounding_tool]
            )
            response = self.gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=f"{context}\n\nUser Question: {user_query}",
                config=config,
            )
            return response.text
        except Exception as e:
            # Fallback to OpenAI if Gemini fails and OpenAI is available
            if self.openai_client:
                print(f"Gemini failed, falling back to OpenAI: {e}")
                return self._generate_openai(context, user_query)
            raise e

    def _web_search(self, query: str) -> str:
        """Performs a web search using DuckDuckGo."""
        try:
            # Use the synchronous version of DDGS
            results = DDGS().text(query, max_results=5)
            if not results:
                return "No search results found."
            return json.dumps(results)
        except Exception as e:
            return f"Error performing search: {str(e)}"

    def _generate_openai(self, context: str, user_query: str) -> str:
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
                    
                    if function_name == "web_search":
                        search_query = function_args.get("query")
                        print(f"OpenAI requesting search for: {search_query}")
                        function_response = self._web_search(search_query)
                        
                        # Add the tool response to the conversation history
                        messages.append({
                            "tool_call_id": tool_call.id,
                            "role": "tool",
                            "name": "web_search",
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
