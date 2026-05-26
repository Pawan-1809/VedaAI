import uuid

from django.db import models


class Assignment(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending"
        PROCESSING = "processing"
        COMPLETED = "completed"
        FAILED = "failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, blank=True, default="")
    subject = models.CharField(max_length=255, blank=True, default="")
    grade_level = models.CharField(max_length=100, blank=True, default="")
    due_date = models.DateField()
    question_types = models.JSONField(default=list)
    number_of_questions = models.PositiveIntegerField(default=0)
    total_marks = models.PositiveIntegerField(default=0)
    additional_instructions = models.TextField(blank=True, default="")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if self.question_types:
            self.number_of_questions = sum(
                qt.get("count", 0) for qt in self.question_types
            )
            self.total_marks = sum(
                qt.get("count", 0) * qt.get("marks_per_question", 0)
                for qt in self.question_types
            )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title or 'Untitled'} — {self.subject or 'No subject'}"


class GeneratedPaper(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assignment = models.OneToOneField(
        Assignment,
        on_delete=models.CASCADE,
        related_name="generated_paper",
    )
    content = models.JSONField()
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-generated_at"]

    def __str__(self):
        return f"Paper for {self.assignment}"
