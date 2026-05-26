from django.contrib import admin

from .models import Assignment, GeneratedPaper


class GeneratedPaperInline(admin.StackedInline):
    model = GeneratedPaper
    extra = 0
    readonly_fields = ("id", "generated_at")


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ("title", "subject", "grade_level", "status", "due_date", "created_at")
    list_filter = ("status", "subject", "grade_level")
    search_fields = ("title", "subject")
    readonly_fields = ("id", "created_at", "updated_at")
    inlines = [GeneratedPaperInline]


@admin.register(GeneratedPaper)
class GeneratedPaperAdmin(admin.ModelAdmin):
    list_display = ("assignment", "generated_at")
    readonly_fields = ("id", "generated_at")
