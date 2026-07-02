from django.shortcuts import render


def signup(request):
    return render(request, "accounts/signup.html")


def login(request):
    return render(request, "accounts/login.html")


def dashboard(request):
    return render(request, "accounts/dashboard.html")

def check_email(request):
    return render(request,"accounts/check_email.html")

def email_verified(request):
    return render(request,"accounts/email_verified.html")

def varification_failed(request):
    return render(request,"accounts/verification_fail.html")