"""Pure candidate ranking used by the CLI and Lambda handler."""

import json
import os
from functools import lru_cache
from pathlib import Path

import numpy as np


TOP_N_TAGS = 3
TAG_WEIGHT = 0.4
CROSS_ENCODER_WEIGHT = 0.6
CROSS_ENCODER_MAX_CANDIDATES = 50
CURRENT_DIR = Path(__file__).resolve().parent


def _normalise(values):
    values = np.asarray(values, dtype=float)
    low, high = values.min(), values.max()
    if high - low < 1e-9:
        return np.full(values.shape, 0.5, dtype=float)
    return (values - low) / (high - low)


@lru_cache(maxsize=1)
def load_runtime():
    os.environ.setdefault("HF_HUB_OFFLINE", "1")
    os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")
    from sentence_transformers import CrossEncoder, SentenceTransformer

    tag_model_path = CURRENT_DIR / "models" / "tag_model"
    cross_encoder_path = CURRENT_DIR / "models" / "cross_encoder"
    if not tag_model_path.is_dir() or not cross_encoder_path.is_dir():
        raise RuntimeError("Baked AI models are missing from the runtime image.")

    tag_model = SentenceTransformer(
        str(tag_model_path),
        backend="onnx",
        model_kwargs={"file_name": "onnx/model.onnx"},
        local_files_only=True,
    )
    cross_encoder = CrossEncoder(
        str(cross_encoder_path),
        backend="onnx",
        model_kwargs={"file_name": "onnx/model.onnx"},
        local_files_only=True,
    )
    tag_vocab = json.loads((CURRENT_DIR / "cache" / "tag_vocab.json").read_text())
    tag_embeddings = np.load(CURRENT_DIR / "cache" / "tag_embeddings.npy")
    return tag_model, cross_encoder, tag_vocab, tag_embeddings


def rank_candidate_records(
    free_text,
    candidates,
    tag_model=None,
    cross_encoder=None,
    tag_vocab=None,
    tag_embeddings=None,
):
    free_text = free_text.strip()
    if not free_text:
        raise ValueError("freeText must not be empty.")
    if not candidates:
        return []

    if tag_model is None:
        tag_model, cross_encoder, tag_vocab, tag_embeddings = load_runtime()

    tag_to_index = {tag.lower(): index for index, tag in enumerate(tag_vocab)}
    query_embedding = tag_model.encode(free_text, normalize_embeddings=True)
    similarities = np.asarray(tag_embeddings) @ query_embedding

    scored = []
    for candidate in candidates:
        indices = [
            tag_to_index[tag.strip().lower()]
            for tag in candidate["varietyTags"]
            if tag.strip().lower() in tag_to_index
        ]
        tag_score = 0.0
        if indices:
            tag_score = float(
                np.sort(similarities[np.asarray(indices)])[-TOP_N_TAGS:].sum()
            )
        scored.append({**candidate, "tag_score": tag_score})

    scored.sort(key=lambda item: (-item["tag_score"], item["missionId"]))
    cross_pool = scored[:CROSS_ENCODER_MAX_CANDIDATES]
    remainder = scored[CROSS_ENCODER_MAX_CANDIDATES:]

    pairs = [
        [free_text, candidate.get("description") or ""]
        for candidate in cross_pool
    ]
    cross_scores = np.asarray(cross_encoder.predict(pairs), dtype=float)
    tag_scores = np.asarray([item["tag_score"] for item in cross_pool])
    final_scores = (
        TAG_WEIGHT * _normalise(tag_scores)
        + CROSS_ENCODER_WEIGHT * _normalise(cross_scores)
    )
    for candidate, final_score in zip(cross_pool, final_scores):
        candidate["final_score"] = float(final_score)

    cross_pool.sort(
        key=lambda item: (-item["final_score"], item["missionId"])
    )
    remainder.sort(key=lambda item: (-item["tag_score"], item["missionId"]))
    return [item["missionId"] for item in [*cross_pool, *remainder]]
