from django.urls import path

from . import views

urlpatterns = [
    path("assignments/", views.AssignmentCreateView.as_view()),
    path("assignments/recent/", views.AssignmentRecentView.as_view()),
    path(
        "assignments/<uuid:assignment_id>/status/",
        views.AssignmentStatusView.as_view(),
    ),
    path(
        "assignments/<uuid:assignment_id>/",
        views.AssignmentDeleteView.as_view(),
    ),
    path("auth/login/", views.AuthLoginView.as_view()),
    path("auth/logout/", views.AuthLogoutView.as_view()),
]
