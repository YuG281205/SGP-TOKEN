import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_MODELS = [
    'invalid-name',
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash",
]

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")