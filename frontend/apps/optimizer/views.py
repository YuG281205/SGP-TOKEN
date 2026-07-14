from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .serializers import OptimizePromptSerializer
from .services.optimizer_service import OptimizerService


class OptimizePromptAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = OptimizePromptSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        service = OptimizerService()

        result = service.optimize(

            user=request.user,

            prompt=data["prompt"],

            optimization_level=data["optimization_level"],

            provider=data["ai_model"],

        )

        if result["success"]:
            return Response(
                result,
                status=status.HTTP_200_OK
            )

        return Response(
            result,
            status=status.HTTP_400_BAD_REQUEST
        )