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

from django.core.mail import send_mail
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

            uid = urlsafe_base64_encode(
                force_bytes(user.pk)
            )

            token = default_token_generator.make_token(user)

            verification_link = (
                f"http://127.0.0.1:8000/api/verify-email/{uid}/{token}/"
            )

            send_mail(
                subject="Verify your Email",
                message=f"""
                Hello {user.username},

                Thank you for registering.

                Please click the link below to verify your email.

                {verification_link}

                If you did not register, please ignore this email.
                """,
                                from_email=settings.DEFAULT_FROM_EMAIL,
                                recipient_list=[user.email],
                                fail_silently=False,
                            )

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


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import LoginSerializer


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

        # Return serializer errors
        return Response(
            {
                "message": serializer.errors.get("non_field_errors", ["Login Failed"])[0]
            },
            status=status.HTTP_400_BAD_REQUEST
        )