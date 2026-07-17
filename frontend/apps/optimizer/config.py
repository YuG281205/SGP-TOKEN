import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_MODELS = [
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
]

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")