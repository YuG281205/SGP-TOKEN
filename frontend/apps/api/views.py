from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import RegisterSerializer,LoginSerializer
from rest_framework.permissions import AllowAny


from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes

from django.core.mail import send_mail
from django.conf import settings

from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.models import User

from rest_framework_simplejwt.tokens import RefreshToken

class TestAPIView(APIView):
    def get(self, request):
        return Response({"message": "Hello, this is a test API view."})

class RegisterAPIView(APIView):
    permission_classes = [AllowAny]
    def post(self,request):
        serializer = RegisterSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            uid = urlsafe_base64_encode(force_bytes(user.pk))

            token = default_token_generator.make_token(user)

            verification_link = (
                f"http://127.0.0.1:8000/api/verify-email/{uid}/{token}/"
            )

            send_mail(
                subject="Verify your Email",
                message=f"Click the link to verify your account:\n\n{verification_link}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            return Response({
                "message":"User Registered Successfully..."
            },
            status=status.HTTP_201_CREATED
            )
        else:
            print(serializer.errors)
            return Response(
                serializer.errors, status=status.HTTP_400_BAD_REQUEST
                
            )
        
class VerifyEmailAPIView(APIView):

    permission_classes = [AllowAny]

    def get(self, request, uidb64, token):

        try:

            uid = urlsafe_base64_decode(uidb64).decode()

            user = User.objects.get(pk=uid)

        except Exception:

            return Response(
                {"message": "Invalid Link"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if default_token_generator.check_token(user, token):

            user.is_active = True
            user.save()

            return Response(
                {"message": "Email Verified Successfully"}
            )

        return Response(
            {"message": "Invalid or Expired Token"},
            status=status.HTTP_400_BAD_REQUEST
        )




class LoginAPIView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():

            user = serializer.validated_data["user"]

            refresh = RefreshToken.for_user(user)

            return Response({

                "message": "Login Successful",

                "access": str(refresh.access_token),

                "refresh": str(refresh),

                "username": user.username,

                "email": user.email

            }, status=status.HTTP_200_OK)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )