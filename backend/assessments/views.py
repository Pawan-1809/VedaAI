from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Assignment, GeneratedPaper
from .serializers import AssignmentCreateSerializer
from .tasks import generate_assessment_task


class AssignmentCreateView(generics.CreateAPIView):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        assignment = serializer.save()
        generate_assessment_task.delay(str(assignment.id))
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

        return Response(data)
