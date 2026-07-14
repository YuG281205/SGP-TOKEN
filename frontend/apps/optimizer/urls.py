from django.urls import path
from .views import OptimizePromptAPIView

urlpatterns = [
    path("optimize/",OptimizePromptAPIView.as_view(),name="optimize-promt"),
]