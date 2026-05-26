import json
import logging
import re

logger = logging.getLogger(__name__)


def strip_markdown_json(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*\n?", "", text)
    text = re.sub(r"\n?```\s*$", "", text)
    return text.strip()


def parse_llm_json(raw_text: str) -> dict:
    cleaned = strip_markdown_json(raw_text)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    json_match = re.search(r"\{[\s\S]*\}", cleaned)
    if json_match:
        try:
            return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass

    logger.error("Failed to parse LLM response as JSON: %s", cleaned[:500])
    raise ValueError("LLM returned malformed JSON that could not be parsed.")
