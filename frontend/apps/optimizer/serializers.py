from rest_framework import serializers
from .models import PromptHistory

class PromptHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PromptHistory
        fields = ["original_prompt",
                  "ai_model",
                  "optimization_level",
                  ]
        
    def create(self,validated_data):
        return PromptHistory.objects.create(
            user = self.context["request"].user,
            **validated_data
        )