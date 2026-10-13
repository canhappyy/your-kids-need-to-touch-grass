"""Two-stage hybrid candidate ranking engine for activities.

Architecture Overview:
1. **Stage 1 (Bi-Encoder Tag Similarity):**
   Encodes the user's free-text interest string using an ONNX-optimized `SentenceTransformer`
   (`all-MiniLM-L6-v2`) and calculates cosine similarities against precomputed variety tag embeddings.
   Aggregates the top N (default 3) tag similarities for each candidate to generate a base tag score.
2. **Stage 2 (Cross-Encoder Re-Ranking):**
   Extracts the top candidate pool (up to 50 items) based on tag scores, and pairs each candidate's
   rich description with the user input for deep semantic relevance scoring using an ONNX-optimized
   `CrossEncoder` (`ms-marco-MiniLM-L6-v2`).
3. **Score Blending & Deterministic Sorting:**
   Normalizes tag scores and cross-encoder scores to [0, 1] using min-max scaling, combines them
   using configured weights (0.4 tag weight + 0.6 cross-encoder weight), and uses `missionId` as a
   deterministic tie-breaker.
"""

import json
import os
from functools import lru_cache
from pathlib import Path

import numpy as np

# Number of top matching tags per activity to sum for Stage 1 tag scoring
TOP_N_TAGS = 3

# Relative weight of tag similarity in the final blended score
TAG_WEIGHT = 0.4

# Relative weight of cross-encoder text similarity in the final blended score
CROSS_ENCODER_WEIGHT = 0.6

# Maximum number of top Stage 1 candidates passed to the computationally intensive cross-encoder
CROSS_ENCODER_MAX_CANDIDATES = 50

# Root directory of the ai_recommendation package
CURRENT_DIR = Path(__file__).resolve().parent


def _normalise(values: np.ndarray | list[float]) -> np.ndarray:
    """Applies Min-Max normalization scaling values to the range [0.0, 1.0].

    Safeguards against zero-variance arrays (where max == min) by returning
    a constant midpoint value of 0.5 to preserve stability.

    Args:
        values: 1D array-like structure of numerical scores.

    Returns:
        np.ndarray: Normalized 1D float array where min is 0.0 and max is 1.0.
    """
    values = np.asarray(values, dtype=float)
    low, high = values.min(), values.max()
    if high - low < 1e-9:
        return np.full(values.shape, 0.5, dtype=float)
    return (values - low) / (high - low)


@lru_cache(maxsize=1)
def load_runtime() -> tuple:
    """Loads and caches in-memory singletons for ONNX models and precomputed tag indices.

    Configures transformers to run in offline mode using pre-baked ONNX model files
    packaged within the Docker container for low-latency Lambda cold starts.

    Returns:
        tuple: A 4-tuple consisting of:
            - `tag_model` (SentenceTransformer): Sentence transformer model for query vectorization.
            - `cross_encoder` (CrossEncoder): Cross-encoder model for pairwise text scoring.
            - `tag_vocab` (list[str]): List of distinct variety tags in index order.
            - `tag_embeddings` (np.ndarray): 2D numpy array of precomputed normalized tag vectors.

    Raises:
        RuntimeError: If baked ONNX model directories are missing from the runtime container.
    """
    # Enforce offline execution to avoid runtime network calls to Hugging Face
    os.environ.setdefault("HF_HUB_OFFLINE", "1")
    os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")
    from sentence_transformers import CrossEncoder, SentenceTransformer

    tag_model_path = CURRENT_DIR / "models" / "tag_model"
    cross_encoder_path = CURRENT_DIR / "models" / "cross_encoder"
    if not tag_model_path.is_dir() or not cross_encoder_path.is_dir():
        raise RuntimeError("Baked AI models are missing from the runtime image.")

    # Initialize ONNX runtime sentence transformer bi-encoder
    tag_model = SentenceTransformer(
        str(tag_model_path),
        backend="onnx",
        model_kwargs={"file_name": "onnx/model.onnx"},
        local_files_only=True,
    )

    # Initialize ONNX runtime cross-encoder
    cross_encoder = CrossEncoder(
        str(cross_encoder_path),
        backend="onnx",
        model_kwargs={"file_name": "onnx/model.onnx"},
        local_files_only=True,
    )

    # Load cached vocabulary and embedding matrix
    tag_vocab = json.loads((CURRENT_DIR / "cache" / "tag_vocab.json").read_text())
    tag_embeddings = np.load(CURRENT_DIR / "cache" / "tag_embeddings.npy")
    return tag_model, cross_encoder, tag_vocab, tag_embeddings


def rank_candidate_records(
    free_text: str,
    candidates: list[dict],
    tag_model=None,
    cross_encoder=None,
    tag_vocab=None,
    tag_embeddings=None,
) -> list[str]:
    """Ranks a list of candidate activity records against a user free-text query.

    Algorithm Steps:
    1. Encodes `free_text` into a normalized query embedding vector.
    2. Computes cosine similarities with all precomputed tag vectors via matrix multiplication.
    3. For each candidate, sums its top `TOP_N_TAGS` tag similarity scores.
    4. Splits candidates into a top pool (up to 50) and remainder.
    5. Evaluates candidate descriptions in the top pool against `free_text` with the cross-encoder.
    6. Fuses normalized tag and cross-encoder scores (0.4 * tag + 0.6 * cross-encoder).
    7. Sorts candidates descending by blended score (or tag score for remainder) with `missionId` tie-breaker.

    Args:
        free_text: User-entered search prompt (e.g. "loves active climbing games").
        candidates: List of candidate dicts with `missionId`, `title`, `description`, `varietyTags`.
        tag_model: Optional pre-loaded `SentenceTransformer` instance.
        cross_encoder: Optional pre-loaded `CrossEncoder` instance.
        tag_vocab: Optional list of tag strings matching `tag_embeddings` rows.
        tag_embeddings: Optional 2D array of tag embeddings.

    Returns:
        list[str]: Array of candidate `missionId` strings ordered from highest to lowest relevance.

    Raises:
        ValueError: If `free_text` is empty or only whitespace.
    """
    free_text = free_text.strip()
    if not free_text:
        raise ValueError("freeText must not be empty.")
    if not candidates:
        return []

    # Ensure models and vocab are loaded
    if tag_model is None:
        tag_model, cross_encoder, tag_vocab, tag_embeddings = load_runtime()

    # Map tag names to row indices in the precomputed embedding matrix
    tag_to_index = {tag.lower(): index for index, tag in enumerate(tag_vocab)}

    # Vectorize search query and compute dot product cosine similarities against all tags
    query_embedding = tag_model.encode(free_text, normalize_embeddings=True)
    similarities = np.asarray(tag_embeddings) @ query_embedding

    # Stage 1: Compute candidate tag scores by summing top matching tag similarities
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

    # Sort candidates by tag score to select the top candidate pool for deep cross-encoding
    scored.sort(key=lambda item: (-item["tag_score"], item["missionId"]))
    cross_pool = scored[:CROSS_ENCODER_MAX_CANDIDATES]
    remainder = scored[CROSS_ENCODER_MAX_CANDIDATES:]

    # Stage 2: Cross-encoder re-ranking on query-description text pairs
    pairs = [
        [free_text, candidate.get("description") or ""]
        for candidate in cross_pool
    ]
    cross_scores = np.asarray(cross_encoder.predict(pairs), dtype=float)
    tag_scores = np.asarray([item["tag_score"] for item in cross_pool])

    # Blend normalized scores: 40% tag similarity + 60% cross-encoder semantic score
    final_scores = (
        TAG_WEIGHT * _normalise(tag_scores)
        + CROSS_ENCODER_WEIGHT * _normalise(cross_scores)
    )
    for candidate, final_score in zip(cross_pool, final_scores):
        candidate["final_score"] = float(final_score)

    # Sort cross-encoder pool by blended score, and remainder by tag score
    cross_pool.sort(
        key=lambda item: (-item["final_score"], item["missionId"])
    )
    remainder.sort(key=lambda item: (-item["tag_score"], item["missionId"]))

    # Return final concatenated list of ranked mission IDs
    return [item["missionId"] for item in [*cross_pool, *remainder]]

