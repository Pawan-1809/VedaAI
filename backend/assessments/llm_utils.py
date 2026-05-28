import json
import logging
import re
from ast import literal_eval

logger = logging.getLogger(__name__)


def strip_markdown_json(text: str) -> str:
    text = text.strip().lstrip("\ufeff")

    fenced_match = re.search(
        r"```(?:json|JSON)?\s*(?P<body>[\s\S]*?)\s*```",
        text,
    )
    if fenced_match:
        return fenced_match.group("body").strip()

    text = re.sub(r"^```(?:json|JSON)?\s*\n?", "", text)
    text = re.sub(r"\n?```\s*$", "", text)
    return text.strip()


def _extract_balanced_json_object(text: str) -> str | None:
    start = text.find("{")
    if start == -1:
        return None

    depth = 0
    in_string = False
    escape = False
    quote = ""

    for index in range(start, len(text)):
        char = text[index]

        if in_string:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == quote:
                in_string = False
            continue

        if char in ('"', "'"):
            in_string = True
            quote = char
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return text[start : index + 1]

    return None


def _repair_common_json_issues(text: str) -> str:
    repaired = text.strip()
    repaired = repaired.replace("\u201c", '"').replace("\u201d", '"')
    repaired = repaired.replace("\u2018", "'").replace("\u2019", "'")
    repaired = re.sub(r"//.*?$", "", repaired, flags=re.MULTILINE)
    repaired = re.sub(r"/\*[\s\S]*?\*/", "", repaired)
    repaired = re.sub(r",\s*([}\]])", r"\1", repaired)
    repaired = re.sub(
        r"([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:",
        r'\1"\2":',
        repaired,
    )
    return repaired


def _loads_lenient_json(candidate: str) -> dict:
    attempts = [candidate, _repair_common_json_issues(candidate)]

    for attempt in attempts:
        try:
            parsed = json.loads(attempt)
        except json.JSONDecodeError:
            continue
        if isinstance(parsed, dict):
            return parsed
        raise ValueError("LLM JSON payload must be an object.")

    try:
        parsed = literal_eval(_repair_common_json_issues(candidate))
    except (ValueError, SyntaxError):
        parsed = None

    if isinstance(parsed, dict):
        return parsed

    raise ValueError("LLM returned malformed JSON that could not be parsed.")


def _validate_generated_paper(payload: dict) -> dict:
    sections = payload.get("sections")
    if not isinstance(sections, list) or not sections:
        raise ValueError("LLM JSON is missing a non-empty sections array.")

    for section in sections:
        if not isinstance(section, dict):
            raise ValueError("LLM JSON contains an invalid section.")
        questions = section.get("questions")
        if not isinstance(questions, list):
            raise ValueError("LLM JSON section is missing questions.")

    return payload


def parse_llm_json(raw_text: str) -> dict:
    cleaned = strip_markdown_json(raw_text)

    candidates = [cleaned]

    balanced_candidate = _extract_balanced_json_object(cleaned)
    if balanced_candidate and balanced_candidate not in candidates:
        candidates.append(balanced_candidate)

    decoder = json.JSONDecoder()
    for index, char in enumerate(cleaned):
        if char != "{":
            continue
        try:
            parsed, _ = decoder.raw_decode(cleaned[index:])
        except json.JSONDecodeError:
            continue
        if isinstance(parsed, dict):
            return _validate_generated_paper(parsed)

    for candidate in candidates:
        try:
            return _validate_generated_paper(_loads_lenient_json(candidate))
        except ValueError:
            continue

    logger.error("Failed to parse LLM response as JSON: %s", cleaned[:500])
    raise ValueError("LLM returned malformed JSON that could not be parsed.")
