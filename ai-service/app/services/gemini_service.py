import os
import google.generativeai as genai
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or not api_key.strip():
        print("[Gemini Service] Warning: GEMINI_API_KEY environment variable is not set or empty.")
        return None
    try:
        genai.configure(api_key=api_key)
        return genai
    except Exception as e:
        print(f"[Gemini Service] Error configuring Gemini API: {e}")
        return None

def generate_gemini_response(prompt: str, json_format: bool = False, temperature: float = 0.7) -> Optional[str]:
    client = get_gemini_client()
    if not client:
        return None
    try:
        model = client.GenerativeModel('gemini-flash-latest')
        if json_format:
            # Request JSON output structure
            config = {
                "response_mime_type": "application/json",
                "temperature": temperature
            }
            response = model.generate_content(prompt, generation_config=config, request_options={"timeout": 30.0})
        else:
            config = {
                "temperature": temperature
            }
            response = model.generate_content(prompt, generation_config=config, request_options={"timeout": 30.0})
        return response.text
    except Exception as e:
        print(f"[Gemini Service] API call failed: {e}")
        return None

