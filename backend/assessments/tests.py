import time
import uuid
from unittest.mock import MagicMock, patch

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from channels.testing import WebsocketCommunicator
from django.test import TestCase, TransactionTestCase, override_settings

from config.asgi import application

from .models import Assignment, GeneratedPaper
from .tasks import LLMTimeoutError, generate_assessment_task


SAMPLE_PAYLOAD = {
    "due_date": "2026-06-15",
    "question_types": [
        {
            "type": "Multiple Choice Questions",
            "count": 2,
            "marks_per_question": 1,
        },
        {
            "type": "Short Questions",
            "count": 1,
            "marks_per_question": 5,
        },
    ],
    "additional_instructions": "Focus on Newton's laws.",
}

SAMPLE_PAPER = {
    "title": "Smoke Test Assessment",
    "total_marks": 7,
    "sections": [
        {
            "name": "Section A",
            "type": "Multiple Choice Questions",
            "questions": [
                {
                    "number": 1,
                    "text": "Which law describes inertia?",
                    "type": "Multiple Choice Questions",
                    "marks": 1,
                    "difficulty": "Easy",
                },
                {
                    "number": 2,
                    "text": "What is the SI unit of force?",
                    "type": "Multiple Choice Questions",
                    "marks": 1,
                    "difficulty": "Easy",
                },
            ],
        },
        {
            "name": "Section B",
            "type": "Short Questions",
            "questions": [
                {
                    "number": 3,
                    "text": "Explain action and reaction forces.",
                    "type": "Short Questions",
                    "marks": 5,
                    "difficulty": "Moderate",
                }
            ],
        },
    ],
}


class AssignmentApiSmokeTests(TestCase):
    def test_create_assignment_valid_payload_queues_celery_task(self):
        with patch("assessments.views.generate_assessment_task.delay") as delay:
            response = self.client.post(
                "/api/assignments/",
                data=SAMPLE_PAYLOAD,
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 202)
        assignment = Assignment.objects.get(id=response.json()["id"])
        self.assertEqual(assignment.status, Assignment.Status.PENDING)
        self.assertEqual(assignment.number_of_questions, 3)
        self.assertEqual(assignment.total_marks, 7)
        delay.assert_called_once_with(str(assignment.id))

    def test_create_assignment_rejects_invalid_marks_before_queueing(self):
        payload = {
            **SAMPLE_PAYLOAD,
            "question_types": [
                {
                    "type": "Multiple Choice Questions",
                    "count": 2,
                    "marks_per_question": -1,
                }
            ],
        }

        with patch("assessments.views.generate_assessment_task.delay") as delay:
            response = self.client.post(
                "/api/assignments/",
                data=payload,
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Assignment.objects.count(), 0)
        delay.assert_not_called()


class FakeGeminiResponse:
    text = """
    {
      "title": "Smoke Test Assessment",
      "total_marks": 7,
      "sections": [
        {
          "name": "Section A",
          "type": "Multiple Choice Questions",
          "questions": [
            {
              "number": 1,
              "text": "Which law describes inertia?",
              "type": "Multiple Choice Questions",
              "marks": 1,
              "difficulty": "Easy"
            },
            {
              "number": 2,
              "text": "What is the SI unit of force?",
              "type": "Multiple Choice Questions",
              "marks": 1,
              "difficulty": "Easy"
            }
          ]
        },
        {
          "name": "Section B",
          "type": "Short Questions",
          "questions": [
            {
              "number": 3,
              "text": "Explain action and reaction forces.",
              "type": "Short Questions",
              "marks": 5,
              "difficulty": "Moderate"
            }
          ]
        }
      ]
    }
    """


class FakeMalformedGeminiResponse:
    text = """
    Here is the generated paper:

    ```json
    {
      title: "Smoke Test Assessment",
      "total_marks": 7,
      "sections": [
        {
          "name": "Section A",
          "type": "Multiple Choice Questions",
          "questions": [
            {
              "number": 1,
              "text": "Which law describes inertia?",
              "type": "Multiple Choice Questions",
              "marks": 1,
              "difficulty": "Easy",
            },
          ],
        },
      ],
    }
    ```
    """


@override_settings(GEMINI_API_KEY="test-key")
class GenerationTaskSmokeTests(TestCase):
    def test_task_calls_llm_saves_paper_and_broadcasts_completion_under_15s(self):
        assignment = Assignment.objects.create(**SAMPLE_PAYLOAD)

        client = MagicMock()
        client.models.generate_content.return_value = FakeGeminiResponse()

        started = time.monotonic()
        with (
            patch("assessments.tasks.genai.Client", return_value=client) as genai_client,
            patch("assessments.tasks.notify_client") as notify_client,
        ):
            result = generate_assessment_task.apply(args=(str(assignment.id),), throw=True)
        elapsed = time.monotonic() - started

        self.assertIsNone(result.result)
        assignment.refresh_from_db()
        paper = GeneratedPaper.objects.get(assignment=assignment)

        self.assertLess(elapsed, 15)
        self.assertEqual(assignment.status, Assignment.Status.COMPLETED)
        self.assertEqual(paper.content["title"], "Smoke Test Assessment")
        genai_client.assert_called_once_with(api_key="test-key")
        client.models.generate_content.assert_called_once()
        notify_client.assert_called_once_with(
            str(assignment.id),
            "generation_complete",
            {
                "type": "generation_complete",
                "status": "completed",
                "paper": paper.content,
            },
        )

    def test_task_repairs_markdown_and_slightly_malformed_llm_json(self):
        assignment = Assignment.objects.create(**SAMPLE_PAYLOAD)

        client = MagicMock()
        client.models.generate_content.return_value = FakeMalformedGeminiResponse()

        with (
            patch("assessments.tasks.genai.Client", return_value=client),
            patch("assessments.tasks.notify_client") as notify_client,
        ):
            generate_assessment_task.apply(args=(str(assignment.id),), throw=True)

        assignment.refresh_from_db()
        paper = GeneratedPaper.objects.get(assignment=assignment)

        self.assertEqual(assignment.status, Assignment.Status.COMPLETED)
        self.assertEqual(paper.content["title"], "Smoke Test Assessment")
        self.assertEqual(paper.content["sections"][0]["questions"][0]["marks"], 1)
        notify_client.assert_called_once()

    def test_task_timeout_marks_failed_and_notifies_client(self):
        assignment = Assignment.objects.create(**SAMPLE_PAYLOAD)

        with (
            patch("assessments.tasks.genai.Client"),
            patch(
                "assessments.tasks.generate_content_with_timeout",
                side_effect=LLMTimeoutError("Timed out"),
            ),
            patch("assessments.tasks.notify_client") as notify_client,
        ):
            generate_assessment_task.apply(args=(str(assignment.id),), throw=True)

        assignment.refresh_from_db()

        self.assertEqual(assignment.status, Assignment.Status.FAILED)
        self.assertFalse(GeneratedPaper.objects.filter(assignment=assignment).exists())
        notify_client.assert_called_once()
        self.assertEqual(notify_client.call_args.args[1], "generation_failed")
        self.assertIn("timed out", notify_client.call_args.args[2]["error"])

    def test_success_save_rolls_back_if_websocket_broadcast_fails(self):
        assignment = Assignment.objects.create(**SAMPLE_PAYLOAD)

        client = MagicMock()
        client.models.generate_content.return_value = FakeGeminiResponse()

        with (
            patch("assessments.tasks.genai.Client", return_value=client),
            patch(
                "assessments.tasks.notify_client",
                side_effect=RuntimeError("channel layer unavailable"),
            ),
        ):
            generate_assessment_task.apply(args=(str(assignment.id),), throw=True)

        assignment.refresh_from_db()

        self.assertEqual(assignment.status, Assignment.Status.FAILED)
        self.assertFalse(GeneratedPaper.objects.filter(assignment=assignment).exists())


@override_settings(
    CHANNEL_LAYERS={
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer",
        }
    }
)
class AssignmentWebSocketSmokeTests(TransactionTestCase):
    def test_generation_complete_group_event_reaches_websocket_client(self):
        async_to_sync(self._assert_generation_complete_event)()

    async def _assert_generation_complete_event(self):
        assignment_id = uuid.uuid4()
        communicator = WebsocketCommunicator(
            application,
            f"/ws/assignments/{assignment_id}/",
        )

        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        await get_channel_layer().group_send(
            f"assignment_{assignment_id}",
            {
                "type": "generation_complete",
                "status": "completed",
                "paper": SAMPLE_PAPER,
            },
        )

        message = await communicator.receive_json_from(timeout=1)
        self.assertEqual(message["type"], "generation_complete")
        self.assertEqual(message["status"], "completed")
        self.assertEqual(message["paper"]["title"], "Smoke Test Assessment")

        await communicator.disconnect()
