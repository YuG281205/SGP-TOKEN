from django.shortcuts import redirect

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import (
    urlsafe_base64_encode,
    urlsafe_base64_decode
)
from django.utils.encoding import force_bytes

from django.core.mail import EmailMultiAlternatives
from django.conf import settings

from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, LoginSerializer


class TestAPIView(APIView):

    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "message": "Hello, this is a test API."
        })


class RegisterAPIView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():

            user = serializer.save()

            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)

            verification_link = (
                f"http://127.0.0.1:8000/api/verify-email/{uid}/{token}/"
            )

            subject = "Verify Your Email"

            text_content = f"""
Hello {user.username},

Thank you for registering.

Please verify your email by clicking the link below:

{verification_link}

If you did not create this account, please ignore this email.
"""

            html_content = f"""
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body {{
                                font-family: Arial, sans-serif;
                                background-color: #f4f4f4;
                                padding: 30px;
                            }}

                            .container {{
                                max-width: 600px;
                                margin: auto;
                                background: white;
                                padding: 30px;
                                border-radius: 8px;
                                text-align: center;
                            }}

                            h2 {{
                                color: #333;
                            }}

                            p {{
                                color: #555;
                                font-size: 16px;
                                line-height: 1.6;
                            }}

                            .button {{
                                display: inline-block;
                                margin-top: 20px;
                                padding: 14px 28px;
                                background-color: #0d6efd;
                                color: white !important;
                                text-decoration: none;
                                border-radius: 5px;
                                font-size: 16px;
                                font-weight: bold;
                            }}

                            .footer {{
                                margin-top: 30px;
                                font-size: 13px;
                                color: gray;
                            }}
                        </style>
                    </head>

                    <body>

                    <div class="container">

                        <h2>Welcome to SGP</h2>

                        <p>Hello <strong>{user.username}</strong>,</p>

                        <p>
                            Thank you for creating your account.
                        </p>

                        <p>
                            Please verify your email address by clicking the button below.
                        </p>

                        <a href="{verification_link}" class="button">
                            Verify Email
                        </a>

                        <p class="footer">
                            If you didn't create this account, you can safely ignore this email.
                        </p>

                    </div>

                    </body>
                    </html>
                    """

            email = EmailMultiAlternatives(
                subject,
                text_content,
                settings.DEFAULT_FROM_EMAIL,
                [user.email]
            )

            email.attach_alternative(html_content, "text/html")
            email.send()

            return Response(
                {
                    "message": "Registration successful. Please check your email."
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class VerifyEmailAPIView(APIView):

    permission_classes = [AllowAny]

    def get(self, request, uidb64, token):

        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)

        except Exception:
            return redirect("verification_failed")

        if default_token_generator.check_token(user, token):

            user.is_active = True
            user.save()

            return redirect("email_verified")

        return redirect("verification_failed")


class LoginAPIView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():

            user = serializer.validated_data["user"]

            if not user.is_active:
                return Response(
                    {
                        "message": "Please verify your email before logging in."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "message": "Login Successful",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "username": user.username,
                    "email": user.email
                },
                status=status.HTTP_200_OK
            )

        return Response(
            {
                "message": serializer.errors.get("message", ["Login Failed"])[0]
            },
            status=status.HTTP_400_BAD_REQUEST
        )