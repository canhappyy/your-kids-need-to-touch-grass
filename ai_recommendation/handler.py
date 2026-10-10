"""AWS Lambda entry point for private activity ranking microservice.

This module exposes the main serverless handler invoked by Next.js via AWS IAM OIDC.
It validates the incoming request payload, manages warm model runtimes across invocations,
executes the hybrid semantic ranking algorithm, and emits structured JSON observability logs.
"""

import json
import time

try:
    from ai_recommendation.ranker import CURRENT_DIR, load_runtime, rank_candidate_records
except ModuleNotFoundError:
    from ranker import CURRENT_DIR, load_runtime, rank_candidate_records


# Track cold starts for performance metrics and observability
_cold_start = True

# Pre-load ONNX models and tag index into module memory if baked models exist
_runtime = (
    load_runtime()
    if (CURRENT_DIR / "models" / "tag_model").is_dir()
    and (CURRENT_DIR / "models" / "cross_encoder").is_dir()
    else None
)


def _validate_request(event: dict) -> tuple[str, str, list[dict]]:
    """Validates and sanitizes the incoming AWS Lambda invocation payload.

    Args:
        event: Dict containing invocation arguments from the Next.js backend.
            Expected structure:
            - `requestId` (str): Non-empty unique request correlation UUID.
            - `freeText` (str): User-provided interest description (1-150 characters).
            - `candidates` (list[dict]): Array of up to 1000 candidate activities with
              `missionId`, `title`, optional `description`, and `varietyTags`.

    Returns:
        tuple[str, str, list[dict]]: A 3-tuple consisting of:
            - `request_id`: Cleaned request ID string.
            - `free_text`: Trimmed search prompt string.
            - `cleaned`: List of sanitized candidate activity dictionaries.

    Raises:
        ValueError: If any input field fails schema, type, or constraint validations
            (e.g., missing fields, string length bounds, duplicate mission IDs).
    """
    if not isinstance(event, dict):
        raise ValueError("Request must be an object.")

    # Validate requestId
    request_id = event.get("requestId")
    if not isinstance(request_id, str) or not request_id.strip():
        raise ValueError("requestId must be a non-empty string.")

    # Validate freeText input bounds
    free_text = event.get("freeText")
    if not isinstance(free_text, str) or not free_text.strip() or len(free_text.strip()) > 150:
        raise ValueError("freeText must contain 1 to 150 characters.")

    # Validate candidate array bounds
    candidates = event.get("candidates")
    if not isinstance(candidates, list) or len(candidates) > 1000:
        raise ValueError("candidates must be an array with at most 1000 items.")

    seen = set()
    cleaned = []
    # Validate each candidate item
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


def handler(event: dict, _context) -> dict:
    """AWS Lambda entry point for activity recommendation ranking.

    Executes a two-stage hybrid ranking process:
    1. Validates input schema (`requestId`, `freeText`, `candidates`).
    2. Runs vector tag matching + cross-encoder reranking over candidates.
    3. Formats response payload with original `requestId` and ranked `missionId` list.
    4. Logs structured performance telemetry (execution time, candidate count, cold start status).

    Args:
        event: Dict containing invocation payload.
        _context: AWS Lambda context object (unused).

    Returns:
        dict: Structured response object containing:
            - `requestId` (str): Correlation ID matching the input request.
            - `rankedMissionIds` (list[str]): Ordered list of mission IDs from best to worst match.

    Raises:
        Exception: Re-raises any error occurring during validation or model inference
            after emitting an `ai_ranking_failed` structured error log.
    """
    global _cold_start
    started_at = time.perf_counter()
    request_id = "invalid"
    candidate_count = 0
    try:
        # Validate request payload and parse candidate records
        request_id, free_text, candidates = _validate_request(event)
        candidate_count = len(candidates)

        # Execute candidate ranking using warm runtime if cached, or on-demand loading
        ranked_ids = (
            rank_candidate_records(free_text, candidates, *_runtime)
            if _runtime is not None
            else rank_candidate_records(free_text, candidates)
        )
        return {"requestId": request_id, "rankedMissionIds": ranked_ids}
    except Exception as error:
        # Emit structured error log for CloudWatch metric filters and alerting
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
        # Emit completion telemetry with latency and cold start indicators
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

