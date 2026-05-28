import json

from rest_framework import serializers

from .models import Assignment


class QuestionTypeItemSerializer(serializers.Serializer):
    type = serializers.CharField(max_length=100)
    count = serializers.IntegerField(min_value=1)
    marks_per_question = serializers.IntegerField(min_value=1)


class AssignmentCreateSerializer(serializers.ModelSerializer):
    question_types = QuestionTypeItemSerializer(many=True)
    uploaded_file = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Assignment
        fields = [
            "id",
            "due_date",
            "question_types",
            "additional_instructions",
            "uploaded_file",
        ]
        read_only_fields = ["id"]

    def to_internal_value(self, data):
        # When submitted as multipart/form-data, DRF receives a QueryDict where
        # question_types is a JSON-encoded string. We convert it to a standard dict
        # first to safely replace the string with the parsed JSON list.
        if hasattr(data, "dict"):
            mutable = {}
            for key in data.keys():
                # get() returns the file object for FileFields and the string for TextFields
                mutable[key] = data.get(key)
        else:
            mutable = data.copy() if hasattr(data, "copy") else dict(data)

        raw_qt = mutable.get("question_types")
        if isinstance(raw_qt, str):
            try:
                mutable["question_types"] = json.loads(raw_qt)
            except (json.JSONDecodeError, TypeError):
                pass

        return super().to_internal_value(mutable)

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


class AssignmentRecentSerializer(serializers.ModelSerializer):
    paper_title = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = [
            "id",
            "status",
            "total_marks",
            "number_of_questions",
            "due_date",
            "created_at",
            "paper_title",
        ]

    def get_paper_title(self, obj):
        if getattr(obj, "generated_paper", None) and obj.generated_paper.content:
            return obj.generated_paper.content.get("title", "Assessment Paper")
        return obj.title or "Assessment Paper"


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)
