import time
from google import genai


class GeminiBenchmark:
    def __init__(self, api_key: str):
        """
        Initialize Gemini client.
        """
        self.client = genai.Client(api_key=api_key)

    def benchmark(
        self,
        prompt: str,
        model: str = "gemini-2.5-flash",
        max_output_tokens: int = 1000,
    ) -> dict:
        """
        Sends a prompt to Gemini and returns benchmark data.
        """

        start_time = time.perf_counter()

        response = self.client.models.generate_content(
            model=model,
            contents=prompt,
            config={
                "max_output_tokens": max_output_tokens,
            },
        )

        latency = round(time.perf_counter() - start_time, 3)

        usage = response.usage_metadata

        return {
            "provider": "Gemini",
            "model": model,
            "response": response.text,
            "input_tokens": usage.prompt_token_count,
            "output_tokens": usage.candidates_token_count,
            "total_tokens": usage.total_token_count,
            "latency_seconds": latency,
        }

    def compare(
        self,
        original_prompt: str,
        optimized_prompt: str,
        model: str = "gemini-2.5-flash",
        max_output_tokens: int = 1000,
    ) -> dict:
        """
        Compare original and optimized prompts.
        """

        original = self.benchmark(
            prompt=original_prompt,
            model=model,
            max_output_tokens=max_output_tokens,
        )

        optimized = self.benchmark(
            prompt=optimized_prompt,
            model=model,
            max_output_tokens=max_output_tokens,
        )

        tokens_saved = (
            original["total_tokens"]
            - optimized["total_tokens"]
        )

        processing_time = round(
            original["latency_seconds"]
            + optimized["latency_seconds"],
            3,
        )

        # Replace this with real Gemini pricing if desired
        estimated_cost_saved = round(
            tokens_saved * 0.000001,
            6,
        )

        return {

            "original_prompt": original_prompt,

            "optimized_prompt": optimized_prompt,

            "ai_model": model,

            "original_tokens": original["total_tokens"],

            "optimized_tokens": optimized["total_tokens"],

            "tokens_saved": tokens_saved,

            "estimated_cost_saved": estimated_cost_saved,

            "processing_time": processing_time,

            "status": "completed",

            # Optional (useful for frontend even if not stored)
            "original_response": original["response"],

            "optimized_response": optimized["response"],

            # Optional (for debugging)
            "original_input_tokens": original["input_tokens"],
            "original_output_tokens": original["output_tokens"],

            "optimized_input_tokens": optimized["input_tokens"],
            "optimized_output_tokens": optimized["output_tokens"],
        }