from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib import messages
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout


def signup(request):
    if request.method == "POST":

        username = request.POST.get("Username")
        email = request.POST.get("Email")
        password = request.POST.get("Password")
        confirm_password = request.POST.get("CPassword")

        # Check if passwords match
        if password != confirm_password:
            messages.error(request, "Passwords do not match.")
            return redirect("signup")

        # Check if username already exists
        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists.")
            return redirect("signup")

        # Check if email already exists
        if User.objects.filter(email=email).exists():
            messages.error(request, "Email already exists.")
            return redirect("signup")

        # Create the user
        User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        messages.success(request, "Account created successfully.")
        return redirect("login")

    return render(request, "accounts/signup.html")

def login(request):
    if request.method == "POST":
        username =  request.POST.get("Username")
        password = request.POST.get("Password")
        
        user = authenticate(request, username=username, password=password)
        if user is not None:
            auth_login(request,user)
            messages.success(request, "Logged in successfully.")
            return redirect("dashboard")
        
        else:
            messages.error(request, "Invalid username or password.")
            return redirect("login")
        
    return render(request, "accounts/login.html")

def dashboard(request):
    return render(request, "accounts/dashboard.html")
   