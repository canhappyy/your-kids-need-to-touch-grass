import json
import sys
from types import SimpleNamespace

import numpy as np

from ai_recommendation import ranker
from ai_recommendation.ranker import rank_candidate_records


class TagModel:
    def encode(self, _text, normalize_embeddings=True):
        assert normalize_embeddings is True
        return np.array([1.0, 0.0])


class CrossEncoder:
    def __init__(self, scores=None):
        self.pairs = []
        self.scores = scores

    def predict(self, pairs):
        self.pairs = pairs
        if self.scores is not None:
            return np.array(self.scores[: len(pairs)], dtype=float)
        return np.ones(len(pairs), dtype=float)


def candidate(mission_id, description="description", tags=None):
    return {
        "missionId": mission_id,
        "title": f"Activity {mission_id}",
        "description": description,
        "varietyTags": tags or ["nature"],
    }


def test_limits_cross_encoder_to_top_50_candidates():
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

    assert len(cross_encoder.pairs) == 50
    assert sorted(ranked) == sorted(item["missionId"] for item in candidates)


def test_uses_empty_text_for_missing_descriptions():
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
