from django.urls import path
from .views import OptimizePromptAPIView,PromptHistoryAPIView,AnalyticsAPIView,PromptAnalysisAPIView

urlpatterns = [
    path("optimize/",OptimizePromptAPIView.as_view(),name="optimize-promt"),
    path("history/",PromptHistoryAPIView.as_view(),name="history"),
    path("analytics/",AnalyticsAPIView.as_view(),name="analytics_api"),
    path("prompt_analysis/",PromptAnalysisAPIView.as_view(),name="prompt_analysis"),
]