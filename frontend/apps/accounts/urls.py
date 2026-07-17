from django.urls import path
from . import views

urlpatterns = [
    path('', views.signup, name='signup'),
    path('login/', views.login, name='login'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('check_email/',views.check_email,name='check_email'),
    path('email_verified/',views.email_verified,name='email_verified'),
    path('verification_fail/',views.varification_failed,name='verification_failed'),
    path('history/',views.history_page,name='history_page')
]