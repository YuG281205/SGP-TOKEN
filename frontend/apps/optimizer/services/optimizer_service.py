import os

from dotenv import load_dotenv

from ..benchmark.local_benchmark import LocalBenchmark
from ..benchmark.LLMBenchmark import GeminiBenchmark
from ..prompt_builder.builder import PromptBuilder
from ..models import PromptHistory
from ..routers.gemini_routers import GeminiRouter
from .evaluation_services import EvaluationService
from threading import Thread

from apps.comparison1.services.comparison_service import ComparisonService,PromptnatusComparisonService,NumstackComparisonService

load_dotenv()


class OptimizerService:

    def __init__(self):

        self.local_benchmark = LocalBenchmark()

        self.prompt_builder = PromptBuilder()

        self.gemini_router = GeminiRouter()

        self.gemini_benchmark = GeminiBenchmark()

    # ==========================================================
    # MAIN OPTIMIZER
    # ==========================================================

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

    # ==========================================================
    # LIGHT PIPELINE
    # ==========================================================

    def _light_pipeline(

        self,

        user,

        prompt,

        provider,

    ):

        # -----------------------------------------
        # STEP 1 : Local Optimization
        # -----------------------------------------

        result = self.local_benchmark.compare(

            prompt

        )

        # -----------------------------------------
        # STEP 2 : AI Evaluation
        # -----------------------------------------

        semantic_accuracy = (

            EvaluationService.semantic_accuracy(

                result["original_prompt"],

                result["optimized_prompt"],

            )

        )

        optimization_score = (

            EvaluationService.optimization_score(

                result["original_total_tokens"],

                result["tokens_saved"],

            )

        )

        quality_rating = (

            EvaluationService.quality_rating(

                semantic_accuracy,

                optimization_score,

            )

        )

        # -----------------------------------------
        # STEP 3 : Save History
        # -----------------------------------------

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

            semantic_accuracy=semantic_accuracy,

            optimization_score=optimization_score,

            quality_rating=quality_rating,

        )

        return {

            "success": True,

            "history_id": history.id,

            **result,

            "semantic_accuracy": semantic_accuracy,

            "optimization_score": optimization_score,

            "quality_rating": quality_rating,

        }
        # ==========================================================
    # BALANCED PIPELINE
    # ==========================================================

    def _balanced_pipeline(

        self,

        user,

        prompt,

        provider,

    ):

        # -----------------------------------------
        # STEP 1 : Local Optimization
        # -----------------------------------------

        # local_result = self.local_benchmark.compare(

        #     prompt

        # )

        # cleaned_prompt = local_result["optimized_prompt"]

        # -----------------------------------------
        # STEP 2 : Build Prompt for Gemini
        # -----------------------------------------

        llm_prompt = self.prompt_builder.build_balanced_prompt(

            prompt

        )

        # -----------------------------------------
        # STEP 3 : Gemini Optimization
        # -----------------------------------------

        llm_result = self.gemini_router.optimize(

            llm_prompt

        )

        if not llm_result["success"]:

            return {

                "success": False,

                "message": llm_result["error"],

            }

        final_prompt = llm_result["optimized_prompt"]

        # -----------------------------------------
        # STEP 4 : Benchmark
        # -----------------------------------------

        benchmark = self.gemini_benchmark.compare(

            original_prompt=prompt,

            optimized_prompt=final_prompt,

        )

        if not benchmark["success"]:

            return {

                "success": False,

                "message": benchmark.get(

                    "error",

                    "Benchmark failed."

                ),

            }

        # -----------------------------------------
        # STEP 5 : AI Evaluation
        # -----------------------------------------

        semantic_accuracy = (

            EvaluationService.semantic_accuracy(

                benchmark["original_prompt"],

                benchmark["optimized_prompt"],

            )

        )

        optimization_score = (

            EvaluationService.optimization_score(

                benchmark["original_tokens"],

                benchmark["tokens_saved"],

            )

        )

        quality_rating = (

            EvaluationService.quality_rating(

                semantic_accuracy,

                optimization_score,

            )

        )

        # -----------------------------------------
        # STEP 6 : Save History
        # -----------------------------------------

        history = PromptHistory.objects.create(

            user=user,

            original_prompt=benchmark["original_prompt"],

            optimized_prompt=benchmark["optimized_prompt"],

            ai_model=benchmark["ai_model"],

            optimization_level="balanced",

            original_input_tokens=benchmark["original_input_tokens"],

            original_output_tokens=benchmark["original_output_tokens"],

            optimized_input_tokens=benchmark["optimized_input_tokens"],

            optimized_output_tokens=benchmark["optimized_output_tokens"],

            original_total_tokens=benchmark["original_tokens"],

            optimized_total_tokens=benchmark["optimized_tokens"],

            tokens_saved=benchmark["tokens_saved"],

            estimated_cost_saved=benchmark["estimated_cost_saved"],

            processing_time=benchmark["processing_time"],

            status=benchmark["status"],

            semantic_accuracy=semantic_accuracy,

            optimization_score=optimization_score,

            quality_rating=quality_rating,

        )
        Thread(
        target=ComparisonService.compare,
        args=(history.id,),
        daemon=True,
        ).start()

        Thread(
                target=PromptnatusComparisonService.compare,
                args=(history.id,),
                daemon=True,
                ).start()

        Thread(
            target=NumstackComparisonService.compare,
            args=(history.id,),
            daemon=True,
        ).start()
        
        return {

            "success": True,

            "history_id": history.id,

            **benchmark,

            "semantic_accuracy": semantic_accuracy,

            "optimization_score": optimization_score,

            "quality_rating": quality_rating,

        }
    

    # ==========================================================
    # AGGRESSIVE PIPELINE
    # ==========================================================

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

