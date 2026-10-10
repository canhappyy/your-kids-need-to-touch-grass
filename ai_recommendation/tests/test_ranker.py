"""Unit tests for the candidate ranking core and model runtime loader."""

import json
import sys
from types import SimpleNamespace

import numpy as np

from ai_recommendation import ranker
from ai_recommendation.ranker import rank_candidate_records


class TagModel:
    """Mock SentenceTransformer model returning fixed mock query embeddings."""

    def encode(self, _text, normalize_embeddings=True):
        assert normalize_embeddings is True
        return np.array([1.0, 0.0])


class CrossEncoder:
    """Mock CrossEncoder recording evaluated pairs and returning configurable scores."""

    def __init__(self, scores=None):
        self.pairs = []
        self.scores = scores

    def predict(self, pairs):
        self.pairs = pairs
        if self.scores is not None:
            return np.array(self.scores[: len(pairs)], dtype=float)
        return np.ones(len(pairs), dtype=float)


def candidate(mission_id: str, description: str | None = "description", tags: list[str] | None = None) -> dict:
    """Helper fixture creating a candidate activity dict."""
    return {
        "missionId": mission_id,
        "title": f"Activity {mission_id}",
        "description": description,
        "varietyTags": tags or ["nature"],
    }


def test_limits_cross_encoder_to_top_50_candidates():
    """Verifies that only the top 50 candidates from Stage 1 are passed to the cross-encoder."""
    candidates = [candidate(f"MIS-{index:03d}") for index in range(51)]
    cross_encoder = CrossEncoder()

    ranked = rank_candidate_records(
        "nature",
        candidates,
        TagModel(),
        cross_encoder,
        ["nature", "creative"],
        np.array([[1.0, 0.0], [0.0, 1.0]]),
    )

    # Cross-encoder should evaluate exactly 50 pairs
    assert len(cross_encoder.pairs) == 50
    # All 51 candidates must be retained in the final output
    assert sorted(ranked) == sorted(item["missionId"] for item in candidates)


def test_uses_empty_text_for_missing_descriptions():
    """Verifies that activities with None description safely fall back to an empty string."""
    cross_encoder = CrossEncoder()

    rank_candidate_records(
        "drawing",
        [candidate("MIS-001", description=None, tags=["creative"])],
        TagModel(),
        cross_encoder,
        ["nature", "creative"],
        np.array([[1.0, 0.0], [0.0, 1.0]]),
    )

    assert cross_encoder.pairs == [["drawing", ""]]


def test_breaks_equal_scores_by_mission_id():
    """Verifies that ties in final scores are broken deterministically by mission ID."""
    ranked = rank_candidate_records(
        "nature",
        [candidate("MIS-002"), candidate("MIS-001")],
        TagModel(),
        CrossEncoder([0.5, 0.5]),
        ["nature", "creative"],
        np.array([[1.0, 0.0], [0.0, 1.0]]),
    )

    assert ranked == ["MIS-001", "MIS-002"]


def test_runtime_models_load_once(monkeypatch, tmp_path):
    """Verifies that load_runtime caches loaded models and indices as a singleton."""
    (tmp_path / "models" / "tag_model").mkdir(parents=True)
    (tmp_path / "models" / "cross_encoder").mkdir(parents=True)
    (tmp_path / "cache").mkdir()
    (tmp_path / "cache" / "tag_vocab.json").write_text(json.dumps(["nature"]))
    np.save(tmp_path / "cache" / "tag_embeddings.npy", np.array([[1.0]]))
    loads = []

    class FakeModel:
        def __init__(self, path, **_kwargs):
            loads.append(path)

    monkeypatch.setattr(ranker, "CURRENT_DIR", tmp_path)
    monkeypatch.setitem(
        sys.modules,
        "sentence_transformers",
        SimpleNamespace(SentenceTransformer=FakeModel, CrossEncoder=FakeModel),
    )
    ranker.load_runtime.cache_clear()

    first = ranker.load_runtime()
    second = ranker.load_runtime()

    assert first is second
    assert len(loads) == 2
    ranker.load_runtime.cache_clear()

