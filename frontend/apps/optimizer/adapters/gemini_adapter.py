import os
import time

from dotenv import load_dotenv
from google import genai

from optimizer.adapters.base_adapter import BaseLLMAdapter

load_dotenv()


class GeminiAdapter(BaseLLMAdapter):
    """
    Gemini Adapter

    Responsible only for communicating with Gemini API.
    """

    def __init__(self):

        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found.")

        self.client = genai.Client(api_key=self.api_key)

    def optimize(self, prompt: str) -> dict:

        start_time = time.perf_counter()

        try:

            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
            )

            latency = round(time.perf_counter() - start_time, 3)

            usage = response.usage_metadata

            return {

                "success": True,

                "provider": "Gemini",

                "model": self.model,

                "optimized_prompt": response.text.strip(),

                "usage": {

                    "input_tokens": usage.prompt_token_count,

                    "output_tokens": usage.candidates_token_count,

                    "total_tokens": usage.total_token_count,
                },

                "execution_time": latency,

                "error": None,
            }

        except Exception as e:

            latency = round(time.perf_counter() - start_time, 3)

            return {

                "success": False,

                "provider": "Gemini",

                "model": self.model,

                "optimized_prompt": "",

                "usage": {

                    "input_tokens": 0,

                    "output_tokens": 0,

                    "total_tokens": 0,
                },

                "execution_time": latency,

                "error": str(e),
            }