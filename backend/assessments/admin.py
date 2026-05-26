from django.contrib import admin

from .models import Assignment, GeneratedPaper


class GeneratedPaperInline(admin.StackedInline):
    model = GeneratedPaper
    extra = 0
    readonly_fields = ("id", "generated_at")


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ("title", "subject", "status", "number_of_questions", "total_marks", "due_date", "created_at")
    list_filter = ("status",)
    search_fields = ("title", "subject")
    readonly_fields = ("id", "number_of_questions", "total_marks", "created_at", "updated_at")
    inlines = [GeneratedPaperInline]


@admin.register(GeneratedPaper)
class GeneratedPaperAdmin(admin.ModelAdmin):
    list_display = ("assignment", "generated_at")
    readonly_fields = ("id", "generated_at")
