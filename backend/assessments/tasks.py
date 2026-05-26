import json
import logging

from celery import shared_task
from django.conf import settings
from google import genai

from .llm_utils import parse_llm_json
from .models import Assignment, GeneratedPaper

logger = logging.getLogger(__name__)

MAX_RETRIES = 2


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

    return f"""You are an expert academic question paper generator.

Generate a structured question paper based on the following requirements:

Due Date: {assignment.due_date}
Question Types:
{qt_lines}
Total Questions: {total_q}
Total Marks: {total_m}
Additional Instructions: {instructions}

RULES:
1. Create separate sections for each question type.
2. Each question must be unique, relevant, and academically appropriate.
3. Assign a difficulty level of "Easy", "Moderate", or "Hard" to each question.
4. Distribute difficulties roughly evenly within each section.
5. Output ONLY raw, valid JSON with no markdown, no explanation, no extra text.

OUTPUT FORMAT (strict JSON):
{{
  "title": "Assessment Paper",
  "total_marks": {total_m},
  "sections": [
    {{
      "name": "Section A",
      "type": "<question type>",
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
  ]
}}

Generate the paper now. Output ONLY the JSON."""


@shared_task(bind=True, max_retries=MAX_RETRIES)
def generate_assessment_task(self, assignment_id):
    assignment = Assignment.objects.get(id=assignment_id)
    assignment.status = Assignment.Status.PROCESSING
    assignment.save()

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        prompt = build_prompt(assignment)

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        raw_text = response.text
        logger.info("LLM response length: %d chars", len(raw_text))

        paper_json = parse_llm_json(raw_text)

        GeneratedPaper.objects.update_or_create(
            assignment=assignment,
            defaults={"content": paper_json},
        )

        assignment.status = Assignment.Status.COMPLETED
        assignment.save()
        logger.info("Assignment %s completed successfully.", assignment_id)

    except ValueError as exc:
        logger.error("JSON parse failed for %s: %s", assignment_id, exc)
        if self.request.retries < MAX_RETRIES:
            self.retry(countdown=3, exc=exc)
        else:
            assignment.status = Assignment.Status.FAILED
            assignment.save()
            logger.error("Assignment %s failed after %d retries.", assignment_id, MAX_RETRIES)

    except Exception as exc:
        logger.error("Unexpected error for %s: %s", assignment_id, exc)
        assignment.status = Assignment.Status.FAILED
        assignment.save()
