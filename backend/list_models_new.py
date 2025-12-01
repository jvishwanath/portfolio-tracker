from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)
    print("Listing models...")
    for m in client.models.list():
        print(m.name)
else:
    print("No API Key found")
