import logging
import mimetypes
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError
from pathlib import Path

from asgiref.sync import async_to_sync
from celery import shared_task
from channels.layers import get_channel_layer
from django.conf import settings
from django.db import transaction
from google import genai
from google.genai import types as genai_types
from google.genai.errors import APIError

from .llm_utils import parse_llm_json
from .models import Assignment, GeneratedPaper

logger = logging.getLogger(__name__)

MAX_RETRIES = 2
LLM_TIMEOUT_SECONDS = 60


class LLMTimeoutError(Exception):
    pass


def build_prompt(assignment: Assignment) -> str:
    qt_lines = "\n".join(
        f"  - Type: {qt['type']}, Count: {qt['count']}, "
        f"Marks per question: {qt['marks_per_question']}"
        for qt in assignment.question_types
    )

    total_q = sum(qt.get("count", 0) for qt in assignment.question_types)
    total_m = sum(
        qt.get("count", 0) * qt.get("marks_per_question", 0)
        for qt in assignment.question_types
    )

    instructions = assignment.additional_instructions or "None"

    image_note = ""
    if assignment.uploaded_file:
        image_note = (
            "\n\nIMPORTANT: A reference image/document has been provided alongside "
            "this prompt. Carefully analyze its content (text, diagrams, topics, "
            "syllabus information) and use it as the PRIMARY source material for "
            "generating questions. The questions MUST be directly relevant to the "
            "content shown in the uploaded material."
        )

    return f"""You are an expert academic question paper generator.

Generate a structured question paper based on the following requirements:

Due Date: {assignment.due_date}
Question Types:
{qt_lines}
Total Questions: {total_q}
Total Marks: {total_m}
Additional Instructions: {instructions}{image_note}

RULES:
1. Create separate sections for each question type.
2. Each question must be unique, relevant, and academically appropriate.
3. Assign a difficulty level of "Easy", "Moderate", or "Hard" to each question.
4. Distribute difficulties roughly evenly within each section.
5. Include an answer key with brief answers for each question.
6. Output ONLY raw, valid JSON with no markdown, no explanation, no extra text.

OUTPUT FORMAT (strict JSON):
{{
  "title": "<descriptive paper title based on the content/subject>",
  "subject": "<detected or inferred subject>",
  "grade_level": "<detected or inferred class/grade>",
  "institution": "Delhi Public School, Sector-4, Bokaro",
  "duration": "3 Hours",
  "total_marks": {total_m},
  "sections": [
    {{
      "name": "Section A",
      "type": "<question type>",
      "instruction": "Attempt all questions",
      "questions": [
        {{
          "number": 1,
          "text": "<question text>",
          "type": "<question type>",
          "marks": <marks>,
          "difficulty": "Easy|Moderate|Hard"
        }}
      ]
    }}
  ],
  "answer_key": [
    {{
      "number": 1,
      "answer": "<brief answer>"
    }}
  ]
}}

Generate the paper now. Output ONLY the JSON."""


def notify_client(assignment_id, event_type, payload):
    channel_layer = get_channel_layer()
    group_name = f"assignment_{assignment_id}"
    async_to_sync(channel_layer.group_send)(group_name, payload)


def generate_content_with_timeout(client, prompt, image_path=None):
    contents = []

    if image_path:
        file_path = Path(image_path)
        if file_path.exists():
            mime_type = mimetypes.guess_type(str(file_path))[0] or "image/jpeg"
            image_bytes = file_path.read_bytes()
            contents.append(
                genai_types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
            )
            logger.info("Attached image (%s, %d bytes) to LLM prompt", mime_type, len(image_bytes))

    contents.append(prompt)

    executor = ThreadPoolExecutor(max_workers=1)
    future = executor.submit(
        client.models.generate_content,
        model="gemini-2.5-flash",
        contents=contents,
    )

    try:
        return future.result(timeout=LLM_TIMEOUT_SECONDS)
    except FutureTimeoutError as exc:
        future.cancel()
        raise LLMTimeoutError(
            f"LLM generation exceeded {LLM_TIMEOUT_SECONDS} seconds."
        ) from exc
    finally:
        executor.shutdown(wait=False, cancel_futures=True)


def fail_assignment(assignment, assignment_id, error_msg):
    assignment.status = Assignment.Status.FAILED
    assignment.save(update_fields=["status", "updated_at"])
    logger.error("Assignment %s failed: %s", assignment_id, error_msg)

    try:
        notify_client(
            assignment_id,
            "generation_failed",
            {
                "type": "generation_failed",
                "status": "failed",
                "error": error_msg,
            },
        )
    except Exception:
        logger.exception(
            "Failed to notify client about failed assignment %s.",
            assignment_id,
        )


@shared_task(bind=True, max_retries=MAX_RETRIES, soft_time_limit=65, time_limit=75)
def generate_assessment_task(self, assignment_id):
    assignment = Assignment.objects.get(id=assignment_id)
    assignment.status = Assignment.Status.PROCESSING
    assignment.save(update_fields=["status", "updated_at"])

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        prompt = build_prompt(assignment)

        image_path = None
        if assignment.uploaded_file:
            image_path = assignment.uploaded_file.path

        response = generate_content_with_timeout(client, prompt, image_path)

        raw_text = response.text
        logger.info("LLM response length: %d chars", len(raw_text))

        paper_json = parse_llm_json(raw_text)

        with transaction.atomic():
            GeneratedPaper.objects.update_or_create(
                assignment=assignment,
                defaults={"content": paper_json},
            )

            assignment.status = Assignment.Status.COMPLETED
            assignment.save(update_fields=["status", "updated_at"])
            logger.info("Assignment %s completed successfully.", assignment_id)

            notify_client(
                assignment_id,
                "generation_complete",
                {
                    "type": "generation_complete",
                    "status": "completed",
                    "paper": paper_json,
                },
            )

    except LLMTimeoutError as exc:
        fail_assignment(
            assignment,
            assignment_id,
            "AI generation timed out. Please try again.",
        )

    except (ValueError, APIError) as exc:
        logger.error("API or parse error for %s: %s", assignment_id, exc)
        if self.request.retries < MAX_RETRIES:
            countdown = 5 if isinstance(exc, APIError) else 3
            self.retry(countdown=countdown, exc=exc)
        else:
            error_msg = (
                "Gemini API is currently experiencing high demand. Please try again in a few moments."
                if isinstance(exc, APIError)
                else "Failed to parse AI response after multiple retries."
            )
            fail_assignment(assignment, assignment_id, error_msg)

    except Exception as exc:
        logger.exception("Unexpected error for %s: %s", assignment_id, exc)
        fail_assignment(
            assignment,
            assignment_id,
            "Generation failed unexpectedly. Please try again.",
        )
