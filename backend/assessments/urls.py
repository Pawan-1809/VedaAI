from django.urls import path

from . import views

urlpatterns = [
    path("assignments/", views.AssignmentCreateView.as_view()),
    path(
        "assignments/<uuid:assignment_id>/status/",
        views.AssignmentStatusView.as_view(),
    ),
]
