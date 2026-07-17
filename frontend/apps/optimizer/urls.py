from django.urls import path
from .views import OptimizePromptAPIView,PromptHistoryAPIView

urlpatterns = [
    path("optimize/",OptimizePromptAPIView.as_view(),name="optimize-promt"),
    path("history/",PromptHistoryAPIView.as_view(),name="history")
]