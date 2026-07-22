from uuid import uuid4

from apps.optimizer.models import PromptHistory
from apps.optimizer.benchmark.LLMBenchmark import GeminiBenchmark
from apps.comparison1.models import ComparisonHistory
from apps.comparison1.services.aiven_service import AivenService
from apps.optimizer.utils.semantic_similarity import (
    calculate_semantic_accuracy,
)


class ComparisonService:

    @staticmethod
    def token_reduction_score(original_tokens, saved_tokens):

        if original_tokens == 0:
            return 0

        return round(
            (saved_tokens / original_tokens) * 100,
            2
        )

    @staticmethod
    def compare(history_id):

        history = PromptHistory.objects.get(
            id=history_id,
        )

        # Generate unique screenshot filename
        filename = f"{uuid4().hex}.png"

        # Optimize using Aiven
        aiven_optimized_prompt = AivenService.optimize(
            history.original_prompt,
            screenshot_name=filename,
        )

        # Benchmark using Gemini
        benchmark = GeminiBenchmark()

        benchmark_result = benchmark.compare(
            original_prompt=history.original_prompt,
            optimized_prompt=aiven_optimized_prompt,
        )

        if not benchmark_result["success"]:

            comparison = ComparisonHistory.objects.create(
                history=history,
                optimizer_name="aiven",
                optimized_prompt=aiven_optimized_prompt,
                optimized_prompt_image=f"comparison_images/{filename}",
                status="failed",
                error_message=benchmark_result["error"],
            )

            return comparison

        # Semantic accuracy
        semantic_accuracy = calculate_semantic_accuracy(
            history.original_prompt,
            aiven_optimized_prompt,
        )

        # Token reduction score
        optimization_score = ComparisonService.token_reduction_score(
            benchmark_result["original_tokens"],
            benchmark_result["tokens_saved"],
        )

        comparison = ComparisonHistory.objects.create(
            history=history,
            optimizer_name="aiven",
            optimized_prompt=aiven_optimized_prompt,
            optimized_input_tokens=benchmark_result[
                "optimized_input_tokens"
            ],
            optimized_output_tokens=benchmark_result[
                "optimized_output_tokens"
            ],
            optimized_total_tokens=benchmark_result[
                "optimized_tokens"
            ],
            tokens_saved=benchmark_result[
                "tokens_saved"
            ],
            semantic_accuracy=semantic_accuracy,
            optimization_score=optimization_score,
            estimated_cost_saved=benchmark_result[
                "estimated_cost_saved"
            ],
            processing_time=benchmark_result[
                "processing_time"
            ],
            optimized_prompt_image=f"comparison_images/{filename}",
            status="completed",
        )

        return comparison