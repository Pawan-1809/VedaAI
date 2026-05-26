from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(
        r"ws/assignments/(?P<assignment_id>[0-9a-f-]+)/$",
        consumers.AssignmentConsumer.as_asgi(),
    ),
]
