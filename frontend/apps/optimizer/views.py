from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .serializers import PromptHistorySerializer


class SavePromptAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        print("Request Data:", request.data)
        print("User:", request.user)

        serializer = PromptHistorySerializer(
            data=request.data,
            context={"request": request}
        )

        print("Is Valid:", serializer.is_valid())

        if serializer.is_valid():
            prompt = serializer.save()
            print("Saved ID:", prompt.id)

            return Response({
                "message": "Saved successfully"
            })

        print(serializer.errors)

        return Response(serializer.errors, status=400)