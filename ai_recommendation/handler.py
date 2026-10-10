"""AWS Lambda entry point for private activity ranking."""

import json
import time

from ai_recommendation.ranker import CURRENT_DIR, load_runtime, rank_candidate_records


_cold_start = True
_runtime = (
    load_runtime()
    if (CURRENT_DIR / "models" / "tag_model").is_dir()
    and (CURRENT_DIR / "models" / "cross_encoder").is_dir()
    else None
)


def _validate_request(event):
    if not isinstance(event, dict):
        raise ValueError("Request must be an object.")

    request_id = event.get("requestId")
    if not isinstance(request_id, str) or not request_id.strip():
        raise ValueError("requestId must be a non-empty string.")

    free_text = event.get("freeText")
    if not isinstance(free_text, str) or not free_text.strip() or len(free_text.strip()) > 150:
        raise ValueError("freeText must contain 1 to 150 characters.")

    candidates = event.get("candidates")
    if not isinstance(candidates, list) or len(candidates) > 1000:
        raise ValueError("candidates must be an array with at most 1000 items.")

    seen = set()
    cleaned = []
    for candidate in candidates:
        if not isinstance(candidate, dict):
            raise ValueError("Each candidate must be an object.")
        mission_id = candidate.get("missionId")
        title = candidate.get("title")
        description = candidate.get("description")
        tags = candidate.get("varietyTags")
        if not isinstance(mission_id, str) or not mission_id.strip() or len(mission_id) > 50:
            raise ValueError("Each candidate needs a valid missionId.")
        if mission_id in seen:
            raise ValueError("Candidate mission IDs must not contain duplicates.")
        if not isinstance(title, str) or not title.strip():
            raise ValueError("Each candidate needs a title.")
        if description is not None and not isinstance(description, str):
            raise ValueError("Candidate description must be a string or null.")
        if not isinstance(tags, list) or not all(isinstance(tag, str) for tag in tags):
            raise ValueError("Candidate varietyTags must be an array of strings.")
        seen.add(mission_id)
        cleaned.append(
            {
                "missionId": mission_id,
                "title": title,
                "description": description,
                "varietyTags": [tag.strip().lower() for tag in tags if tag.strip()],
            }
        )

    return request_id.strip(), free_text.strip(), cleaned


def handler(event, _context):
    global _cold_start
    started_at = time.perf_counter()
    request_id = "invalid"
    candidate_count = 0
    try:
        request_id, free_text, candidates = _validate_request(event)
        candidate_count = len(candidates)
        ranked_ids = (
            rank_candidate_records(free_text, candidates, *_runtime)
            if _runtime is not None
            else rank_candidate_records(free_text, candidates)
        )
        return {"requestId": request_id, "rankedMissionIds": ranked_ids}
    except Exception as error:
        print(
            json.dumps(
                {
                    "event": "ai_ranking_failed",
                    "requestId": request_id,
                    "candidateCount": candidate_count,
                    "errorClass": type(error).__name__,
                }
            )
        )
        raise
    finally:
        print(
            json.dumps(
                {
                    "event": "ai_ranking_finished",
                    "requestId": request_id,
                    "candidateCount": candidate_count,
                    "durationMs": round((time.perf_counter() - started_at) * 1000),
                    "coldStart": _cold_start,
                }
            )
        )
        _cold_start = False
