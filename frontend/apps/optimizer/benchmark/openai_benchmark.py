import time
from openai import OpenAI


class OpenAIBenchmark:
    def __init__(self, api_key: str):
        """
        Initialize the OpenAI client.
        """
        self.client = OpenAI(api_key=api_key)

    def benchmark(
        self,
        prompt: str,
        model: str = "gpt-5.5",
        max_output_tokens: int = 1000,
    ) -> dict:
        """
        Sends the prompt to OpenAI and returns benchmark statistics.
        """

        start_time = time.perf_counter()

        response = self.client.responses.create(
            model=model,    
            input=prompt,
            max_output_tokens=max_output_tokens,
        )

        latency = round(time.perf_counter() - start_time, 3)

        usage = response.usage

        return {
            "provider": "OpenAI",
            "model": model,
            "response": response.output_text,
            "input_tokens": usage.input_tokens,
            "output_tokens": usage.output_tokens,
            "total_tokens": usage.total_tokens,
            "latency_seconds": latency,
        }

    def compare(
        self,
        original_prompt: str,
        optimized_prompt: str,
        model: str = "gpt-5.5",
        max_output_tokens: int = 1000,
    ) -> dict:
        """
        Benchmarks both prompts and compares their usage.
        """

        original = self.benchmark(
            original_prompt,
            model,
            max_output_tokens,
        )

        optimized = self.benchmark(
            optimized_prompt,
            model,
            max_output_tokens,
        )

        return {
            "original": original,
            "optimized": optimized,
            "comparison": {
                "input_tokens_saved":
                    original["input_tokens"] - optimized["input_tokens"],

                "output_tokens_saved":
                    original["output_tokens"] - optimized["output_tokens"],

                "total_tokens_saved":
                    original["total_tokens"] - optimized["total_tokens"],

                "latency_difference":
                    round(
                        original["latency_seconds"]
                        - optimized["latency_seconds"],
                        3,
                    ),
            },
        }