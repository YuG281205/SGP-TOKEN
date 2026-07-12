"""
Gemini LLM Adapter

This adapter is responsible only for communicating
with Google's Gemini API.
"""

import os
import time

from dotenv import load_dotenv
from google import genai

from adapters.base_adapter import BaseLLMAdapter


load_dotenv()


class GeminiAdapter(BaseLLMAdapter):

    def __init__(self):

        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in .env")

        self.client = genai.Client(api_key=self.api_key)

    def optimize(self, prompt: str) -> dict:

        start_time = time.time()

        try:

            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
            )

            execution_time = round(time.time() - start_time, 2)

            return {
                "success": True,
                "provider": "Gemini",
                "model": self.model,
                "optimized_prompt": response.text.strip(),
                "execution_time": execution_time,
                "error": None,
            }

        except Exception as e:

            execution_time = round(time.time() - start_time, 2)

            return {
                "success": False,
                "provider": "Gemini",
                "model": self.model,
                "optimized_prompt": "",
                "execution_time": execution_time,
                "error": str(e),
            }