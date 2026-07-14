from ..benchmark.local_benchmark import LocalBenchmark
from ..models import PromptHistory


class OptimizerService:

    def __init__(self):
        self.local_benchmark = LocalBenchmark()

    def optimize(
        self,
        user,
        prompt,
        optimization_level,
        provider,
    ):

        optimization_level = optimization_level.lower()
        provider = provider.lower()

        if optimization_level == "light":
            return self._light_pipeline(
            user,
            prompt,
            provider,
        )

        elif optimization_level == "balanced":
            return self._balanced_pipeline(
                user,
                prompt,
                provider,
            )

        elif optimization_level == "aggressive":
            return self._aggressive_pipeline(
                user,
                prompt,
                provider,
            )

        return {
            "success": False,
            "message": "Invalid optimization level."
        }

    # -------------------------------------------------------
    # LIGHT PIPELINE
    # -------------------------------------------------------

    def _light_pipeline(
        self,
        user,
        prompt,
        provider,
    ):

        result = self.local_benchmark.compare(prompt)

        history = PromptHistory.objects.create(

            user=user,

            original_prompt=result["original_prompt"],

            optimized_prompt=result["optimized_prompt"],

            ai_model=provider,

            optimization_level="light",

            original_input_tokens=result["original_input_tokens"],

            original_output_tokens=result["original_output_tokens"],

            optimized_input_tokens=result["optimized_input_tokens"],

            optimized_output_tokens=result["optimized_output_tokens"],

            original_total_tokens=result["original_total_tokens"],

            optimized_total_tokens=result["optimized_total_tokens"],

            tokens_saved=result["tokens_saved"],

            estimated_cost_saved=result["estimated_cost_saved"],

            processing_time=result["processing_time"],

            status=result["status"],
        )

        return {
            "success": True,
            "history_id": history.id,
            **result,
        }

    # -------------------------------------------------------
    # BALANCED PIPELINE
    # -------------------------------------------------------

    def _balanced_pipeline(
        self,
        user,
        prompt,
        provider,
    ):

        return {
            "success": False,
            "message": "Balanced pipeline is under development."
        }

    # -------------------------------------------------------
    # AGGRESSIVE PIPELINE
    # -------------------------------------------------------

    def _aggressive_pipeline(
        self,
        user,
        prompt,
        provider,
    ):

        return {
            "success": False,
            "message": "Aggressive pipeline is under development."
        }