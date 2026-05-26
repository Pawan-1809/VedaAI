from rest_framework import generics, status
from rest_framework.response import Response

from .models import Assignment
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
