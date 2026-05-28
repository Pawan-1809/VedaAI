from django.contrib.auth import authenticate
from rest_framework import generics, status
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Assignment, GeneratedPaper
from .serializers import (
    AssignmentCreateSerializer,
    AssignmentRecentSerializer,
    LoginSerializer,
)
from .tasks import generate_assessment_task


class AssignmentCreateView(generics.CreateAPIView):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentCreateSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        assignment = serializer.save()
        
        try:
            generate_assessment_task.delay(str(assignment.id))
        except Exception as e:
            assignment.delete() # Rollback
            return Response(
                {"detail": f"Failed to connect to Celery/Redis background worker: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
            
        return Response(
            {"id": str(assignment.id)},
            status=status.HTTP_202_ACCEPTED,
        )


class AssignmentStatusView(APIView):
    def get(self, request, assignment_id):
        try:
            assignment = Assignment.objects.get(id=assignment_id)
        except Assignment.DoesNotExist:
            return Response(
                {"error": "Assignment not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        data = {
            "id": str(assignment.id),
            "status": assignment.status,
        }

        if assignment.status == Assignment.Status.COMPLETED:
            try:
                paper = GeneratedPaper.objects.get(assignment=assignment)
                data["paper"] = paper.content
            except GeneratedPaper.DoesNotExist:
                data["paper"] = None
        elif assignment.status == Assignment.Status.FAILED:
            data["error"] = "Generation failed. Please try again."

        return Response(data)


class AssignmentRecentView(generics.ListAPIView):
    serializer_class = AssignmentRecentSerializer

    def get_queryset(self):
        limit = self.request.query_params.get("limit", "20")
        try:
            limit_value = max(1, min(int(limit), 100))
        except ValueError:
            limit_value = 20

        return (
            Assignment.objects.filter(status=Assignment.Status.COMPLETED)
            .select_related("generated_paper")
            .order_by("-created_at")[:limit_value]
        )


class AssignmentDeleteView(APIView):
    def delete(self, request, assignment_id):
        try:
            assignment = Assignment.objects.get(id=assignment_id)
        except Assignment.DoesNotExist:
            return Response(
                {"error": "Assignment not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        assignment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AuthLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )

        if not user:
            return Response(
                {"detail": "Invalid username or password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "token": token.key,
                "user": {
                    "username": user.username,
                    "email": user.email,
                },
            }
        )


class AuthLogoutView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if hasattr(request.user, "auth_token"):
            request.user.auth_token.delete()
        return Response({"detail": "Logged out."})
