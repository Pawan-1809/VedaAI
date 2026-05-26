from rest_framework import serializers

from .models import Assignment


class QuestionTypeItemSerializer(serializers.Serializer):
    type = serializers.CharField(max_length=100)
    count = serializers.IntegerField(min_value=1)
    marks_per_question = serializers.IntegerField(min_value=1)


class AssignmentCreateSerializer(serializers.ModelSerializer):
    question_types = QuestionTypeItemSerializer(many=True)

    class Meta:
        model = Assignment
        fields = [
            "id",
            "due_date",
            "question_types",
            "additional_instructions",
        ]
        read_only_fields = ["id"]

    def validate_question_types(self, value):
        if not value:
            raise serializers.ValidationError(
                "At least one question type is required."
            )

        seen_types = set()
        for item in value:
            qt = item["type"]
            if qt in seen_types:
                raise serializers.ValidationError(
                    f"Duplicate question type: {qt}"
                )
            seen_types.add(qt)

        return value
