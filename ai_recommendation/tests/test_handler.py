"""Unit tests for the AWS Lambda ranking handler module."""

import pytest

from ai_recommendation import handler as handler_module


def request(**overrides) -> dict:
    """Helper fixture creating a valid mock Lambda invocation payload."""
    value = {
        "requestId": "request-1",
        "freeText": "dinosaurs",
        "candidates": [
            {
                "missionId": "MIS-001",
                "title": "Nature walk",
                "description": None,
                "varietyTags": ["nature"],
            }
        ],
    }
    value.update(overrides)
    return value


def test_returns_ranked_ids_with_matching_request_id(monkeypatch):
    """Verifies that the handler returns ranked mission IDs and echoes the request ID."""
    monkeypatch.setattr(
        handler_module,
        "rank_candidate_records",
        lambda free_text, candidates: [candidates[0]["missionId"]],
    )

    assert handler_module.handler(request(), None) == {
        "requestId": "request-1",
        "rankedMissionIds": ["MIS-001"],
    }


@pytest.mark.parametrize("free_text", ["", "   ", "x" * 151])
def test_rejects_invalid_free_text(free_text):
    """Verifies that empty strings, whitespace, or excessively long text are rejected."""
    with pytest.raises(ValueError, match="freeText"):
        handler_module.handler(request(freeText=free_text), None)


def test_rejects_duplicate_candidate_ids():
    """Verifies that candidate lists with duplicate mission IDs trigger a validation error."""
    duplicate = request()["candidates"][0].copy()

    with pytest.raises(ValueError, match="duplicate"):
        handler_module.handler(
            request(candidates=[request()["candidates"][0], duplicate]),
            None,
        )

