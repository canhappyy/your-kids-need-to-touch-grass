"""Offline candidate ranking pipeline and CLI execution script.

This module provides offline batch processing and local command-line execution for ranking
activities from the PostgreSQL database or a custom pandas DataFrame. It shares the same
underlying two-stage ranking core as the serverless Lambda handler.
"""

import argparse
import json
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd
from sentence_transformers import CrossEncoder, SentenceTransformer

try:
    from ai_recommendation import recommendation_functions as rf
    from ai_recommendation.ranker import rank_candidate_records
except ModuleNotFoundError:
    import recommendation_functions as rf
    from ranker import rank_candidate_records

# --------------------------------------------------------------------------
# Config
# --------------------------------------------------------------------------
TOP_N_TAGS = 3                          # Number of top similar tags to consider for matching activities
TAG_WEIGHT = 0.4                        # Weight assigned to the tag similarity score in the final ranking
CROSS_ENCODER_MAX_CANDIDATES = 50       # Maximum number of candidate activities passed to cross-encoder
CROSS_ENCODER_WEIGHT = 0.6              # Weight assigned to the cross-encoder score in the final ranking

# Global variables to hold models and embeddings for caching
_tag_model = _cross_encoder = _tag_vocab = _tag_embeddings = None


# --------------------------------------------------------------------------
# Loading & Reading Data
# --------------------------------------------------------------------------
def load_tag_index(database: pd.DataFrame | None, model: SentenceTransformer) -> tuple[list[str], np.ndarray]:
    """Loads a precomputed index of variety tags and their corresponding vector embeddings from cache.

    Args:
        database: Optional DataFrame (unused, reserved for dynamic index rebuilds).
        model: SentenceTransformer model used for encoding.

    Returns:
        tuple[list[str], np.ndarray]: A 2-tuple of:
            - `tag_vocab` (list[str]): List of distinct variety tags.
            - `tag_embeddings` (np.ndarray): 2D array of precomputed normalized embeddings.

    Raises:
        FileNotFoundError: If any required cache files are missing from the `cache/` directory.
    """
    # Resolve filepaths for cached vocabulary and embeddings
    cache_filepath = rf.CURRENT_FILE_PATH / "cache"
    vocab_filepath = cache_filepath / "tag_vocab.json"
    embeddings_filepath = cache_filepath / "tag_embeddings.npy"
    tag_map_filepath = cache_filepath / "tag_to_activity_map.json"

    # Check if required files exist, & raise an error if any are missing
    missing = [path for path in [vocab_filepath, embeddings_filepath, tag_map_filepath] if not path.exists()]
    
    if missing:
        raise FileNotFoundError(
            f"Missing required files: {', '.join(str(path) for path in missing)}. "
            "Please run build_tag_index.py to generate them."
        )

    # Load tag vocabulary & embeddings from cache files
    tag_vocab = json.loads(vocab_filepath.read_text())
    tag_embeddings = np.load(embeddings_filepath)

    return tag_vocab, tag_embeddings


def _load_once() -> tuple[SentenceTransformer, CrossEncoder, list[str], np.ndarray]:
    """Loads the tag model, cross-encoder, and tag vocabulary/embeddings into memory as singletons.

    Ensures models are only loaded once per process to optimize performance.

    Returns:
        tuple: A 4-tuple containing:
            - `tag_model` (SentenceTransformer): Loaded tag model for computing query embeddings.
            - `cross_encoder` (CrossEncoder): Loaded cross-encoder for scoring descriptions against query.
            - `tag_vocab` (list[str]): List of unique tags from the database.
            - `tag_embeddings` (np.ndarray): Precomputed normalized embeddings for all tags.
    """
    global _tag_model, _cross_encoder, _tag_vocab, _tag_embeddings

    if _tag_model is None:
        _tag_model = rf.load_model(rf.TAG_MODEL_FILENAME, rf.TAG_MODEL_DESIGNATION)
        _cross_encoder = rf.load_model(rf.CROSS_ENCODER_FILENAME, rf.CROSS_ENCODER_DESIGNATION)
        _tag_vocab, _tag_embeddings = load_tag_index(None, _tag_model)

    return _tag_model, _cross_encoder, _tag_vocab, _tag_embeddings


# --------------------------------------------------------------------------
# Processing Data
# --------------------------------------------------------------------------
def compute_tag_similarities(
    free_text: str,
    activities_df: pd.DataFrame,
    tag_model: SentenceTransformer,
    tag_vocab: list[str],
    tag_embeddings: np.ndarray,
    top_n_tags: int = TOP_N_TAGS,
) -> np.ndarray:
    """Computes tag similarity scores for each activity in a DataFrame against the user prompt.

    Args:
        free_text: User's free-text input describing their child's interests.
        activities_df: DataFrame containing activities and their associated `tag_list`.
        tag_model: SentenceTransformer model used to compute query embeddings.
        tag_vocab: List of unique tags matching rows of `tag_embeddings`.
        tag_embeddings: Precomputed embedding matrix for the tags.
        top_n_tags: Number of top similar tags to sum for each activity.

    Returns:
        np.ndarray: Array of aggregated similarity scores corresponding to each DataFrame row.
    """
    if rf.DEBUG:
        print("Computing tag similarities...")

    # Create a mapping from tags to their indices in tag_vocab
    tag_to_index = {tag: i for i, tag in enumerate(tag_vocab)}

    # Compute embedding for the user's free text input
    query_embedding = tag_model.encode(free_text, normalize_embeddings=True)

    # Compute cosine similarities between query embedding and tag embeddings
    similarities = tag_embeddings @ query_embedding

    def score_tags(tag_list: list[str]) -> float:
        """Scores a group of tags by summing top-N cosine similarities."""
        indices = [tag_to_index[tag] for tag in tag_list if tag in tag_to_index]

        # If no tags are found in vocab, return 0
        if not indices:
            return 0.0

        # Sum the top N most similar tags
        top = np.sort(similarities[np.array(indices)])[-top_n_tags:]
        return float(top.sum())

    return activities_df["tag_list"].apply(score_tags).to_numpy()


def rank_relevance(
    free_text: str,
    activities_df: pd.DataFrame,
    tag_model: SentenceTransformer,
    cross_encoder: CrossEncoder,
    tag_vocab: list[str],
    tag_embeddings: np.ndarray,
    tag_weight: float = TAG_WEIGHT,
    cross_encoder_weight: float = CROSS_ENCODER_WEIGHT,
    top_n_tags: int = TOP_N_TAGS,
    cross_encoder_max_candidates: int = CROSS_ENCODER_MAX_CANDIDATES,
) -> pd.DataFrame:
    """Ranks activities DataFrame based on a combination of tag similarity and cross-encoder scoring.

    Args:
        free_text: User's free-text prompt describing child interests.
        activities_df: DataFrame containing activities with `description` and `tag_list` columns.
        tag_model: SentenceTransformer model for tag encoding.
        cross_encoder: Cross-encoder model for pairwise text scoring.
        tag_vocab: List of unique tag strings.
        tag_embeddings: Precomputed tag embedding matrix.
        tag_weight: Relative weight for tag similarity scores (default 0.4).
        cross_encoder_weight: Relative weight for cross-encoder scores (default 0.6).
        top_n_tags: Number of top tags to aggregate per activity.
        cross_encoder_max_candidates: Maximum candidates evaluated by the cross-encoder.

    Returns:
        pd.DataFrame: DataFrame containing activities sorted descending by combined score.
    """
    if rf.DEBUG:
        print("Ranking activities...")

    # Load data and ensure no NaN values in descriptions
    df = activities_df.copy()
    df["description"] = df["description"].fillna("")  

    # Compute tag similarity scores for each activity
    df["tag_score"] = compute_tag_similarities(free_text, df, tag_model, tag_vocab, tag_embeddings, top_n_tags)

    # Select a pool of candidate activities for cross-encoder scoring based on tag similarity scores
    if len(df) <= cross_encoder_max_candidates:
        cross_encoder_pool, remainder = df, df.iloc[0:0]
    else:
        # Pre-select top candidates based on tag similarity scores
        cross_encoder_pool = df.nlargest(cross_encoder_max_candidates, "tag_score")
        remainder = df.drop(cross_encoder_pool.index)

    if not cross_encoder_pool.empty:
        # Prepare pairs of (user input, activity description) for cross-encoder scoring
        pairs = [[free_text, desc] for desc in cross_encoder_pool["description"].tolist()]
        cross_encoder_pool["cross_encoder_score"] = cross_encoder.predict(pairs)

        # Normalise the tag similarity scores and cross-encoder scores to [0, 1]
        normalised_tag_scores = rf._min_max_normalise(cross_encoder_pool["tag_score"].to_numpy())
        normalised_cross_encoder_scores = rf._min_max_normalise(cross_encoder_pool["cross_encoder_score"].to_numpy())

        # Combine normalised scores using given weights to compute final scores
        cross_encoder_pool["final_score"] = (tag_weight * normalised_tag_scores) + (cross_encoder_weight * normalised_cross_encoder_scores)
        cross_encoder_pool = cross_encoder_pool.sort_values("final_score", ascending=False)

    if not remainder.empty:
        # For activities outside cross-encoder pool, sort by tag score
        remainder = remainder.sort_values("tag_score", ascending=False)

    return pd.concat([cross_encoder_pool, remainder])


def rank_activities(free_text: str, activities_df: pd.DataFrame | None = None) -> pd.DataFrame:
    """Ranks activities using the shared hybrid ranking core and returns sorted DataFrame.

    Args:
        free_text: User's free-text input describing child interests.
        activities_df: Optional DataFrame of activities. If omitted, loads from database.

    Returns:
        pd.DataFrame: DataFrame of activities sorted by relevance rank.

    Raises:
        ValueError: If `free_text` is empty or whitespace only.
    """
    # Validate input query
    if not free_text or not free_text.strip():
        raise ValueError("Free text input cannot be empty or whitespace. Nothing to rank.")
    if activities_df is None:
        activities_df = rf.load_activities_from_db()

    # Load tag model, cross-encoder, and tag cache
    tag_model, cross_encoder, tag_vocab, tag_embeddings = _load_once()

    # Format DataFrame rows into candidate dicts
    candidates = [
        {
            "missionId": str(row[rf.ACTIVITY_ID_COLUMN]),
            "title": str(row[rf.ACTIVITY_TITLE_COLUMN]),
            "description": None if pd.isna(row.get("description")) else str(row.get("description")),
            "varietyTags": row.get("tag_list") if isinstance(row.get("tag_list"), list) else [],
        }
        for _, row in activities_df.iterrows()
    ]

    # Execute ranking via core ranker
    ranked_ids = rank_candidate_records(
        free_text,
        candidates,
        tag_model,
        cross_encoder,
        tag_vocab,
        tag_embeddings,
    )
    rank_by_id = {mission_id: index for index, mission_id in enumerate(ranked_ids)}
    return (
        activities_df.assign(
            _rank=activities_df[rf.ACTIVITY_ID_COLUMN].astype(str).map(rank_by_id)
        )
        .sort_values("_rank", kind="stable")
        .drop(columns="_rank")
    )


if __name__ == "__main__":
    # Parse command-line arguments for user's free text input and options
    parser = argparse.ArgumentParser(description="Rank activities based on child interests free text.")
    parser.add_argument("free_text_input", nargs="?", help="User's free text input describing their child's interests.")
    parser.add_argument("--out", help="Write JSON output to this filepath as well as printing to console.")
    parser.add_argument("--debug", action="store_true", help="Enable debug mode for detailed output.")
    parser.add_argument("--verbose", action="store_true", help="Print timing & top 10 ranked activities to console.")
    args = parser.parse_args()

    # Show debug messages if --debug flag is set
    rf.DEBUG = args.debug

    # Get user's free text input from command-line argument or interactive stdin prompt
    if args.free_text_input:
        free_text_input = args.free_text_input.strip()
    else:
        if sys.stdin.isatty():
            print("What is your child interested in? \n", end="", file=sys.stderr, flush=True)
            free_text_input = sys.stdin.readline().strip()

    # Raise an error if free text input is empty
    if not free_text_input:
        sys.exit("Free text input cannot be empty. Please provide a valid input.")

    # Time the ranking process
    start = time.perf_counter()
    ranked_activities = rank_activities(free_text_input)
    end = time.perf_counter()
    elapsed_time = end - start

    # Extract the mission IDs of the ranked activities and convert to JSON for output
    mission_ids = ranked_activities[rf.ACTIVITY_ID_COLUMN].tolist()
    json_output = json.dumps(mission_ids)

    # Print verbose summary if requested
    if args.verbose:
        print(f"Ranked {len(ranked_activities)} activities in {elapsed_time:.2f} seconds.")
        print(ranked_activities[[rf.ACTIVITY_ID_COLUMN, rf.ACTIVITY_TITLE_COLUMN]].head(10), file=sys.stderr)

    # Write output to file if requested
    if args.out:
        Path(args.out).write_text(json_output)
    print(json_output)

