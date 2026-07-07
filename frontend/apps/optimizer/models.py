from django.db import models
from django.contrib.auth.models import User


class PromptHistory(models.Model):

    AI_MODELS = [
        ("gpt-4o", "GPT-4o"),
        ("gpt-4.1", "GPT-4.1"),
        ("gemini", "Gemini"),
        ("claude", "Claude"),
        ("deepseek", "DeepSeek"),
        ("llama", "Llama"),
    ]
    STATUS_CHOICES = [
    ("pending", "Pending"),
    ("completed", "Completed"),
    ("failed", "Failed"),
    ]

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )

    OPTIMIZATION_LEVELS = [
        ("light", "Light"),
        ("balanced", "Balanced"),
        ("aggressive", "Aggressive"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="prompt_history"
    )

    # User's original prompt
    original_prompt = models.TextField(blank=True,
                                       null=True)

    # AI optimized prompt
    optimized_prompt = models.TextField(
        blank=True,
        null=True
    )

    ai_model = models.CharField(
        max_length=20,
        choices=AI_MODELS
    )

    optimization_level = models.CharField(
        max_length=20,
        choices=OPTIMIZATION_LEVELS,
        default="balanced"
    )

    original_tokens = models.PositiveIntegerField(default=0)

    optimized_tokens = models.PositiveIntegerField(default=0)

    tokens_saved = models.PositiveIntegerField(default=0)

    estimated_cost_saved = models.DecimalField(
        max_digits=10,
        decimal_places=6,
        default=0
    )

    processing_time = models.FloatField(
        default=0
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )
    

    def __str__(self):
        return f"{self.user.username} | {self.ai_model} | {self.created_at.strftime('%d-%m-%Y %H:%M')}"