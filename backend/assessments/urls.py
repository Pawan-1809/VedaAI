from django.urls import path

from . import views

urlpatterns = [
    path("assignments/", views.AssignmentCreateView.as_view()),
]
