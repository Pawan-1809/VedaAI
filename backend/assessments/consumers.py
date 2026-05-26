import json
import logging

from channels.generic.websocket import AsyncJsonWebsocketConsumer

logger = logging.getLogger(__name__)


class AssignmentConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.assignment_id = self.scope["url_route"]["kwargs"]["assignment_id"]
        self.group_name = f"assignment_{self.assignment_id}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def generation_complete(self, event):
        await self.send_json({
            "type": "generation_complete",
            "status": event["status"],
            "paper": event["paper"],
        })

    async def generation_failed(self, event):
        await self.send_json({
            "type": "generation_failed",
            "status": event["status"],
            "error": event.get("error", "Generation failed"),
        })
