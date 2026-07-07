from django.urls import path
from .views import SavePromptAPIView

urlpatterns = [
    path("save-prompt/",SavePromptAPIView.as_view(),name="save-prompt"),
]