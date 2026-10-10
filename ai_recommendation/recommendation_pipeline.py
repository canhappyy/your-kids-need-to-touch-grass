import json, time, argparse, sys
import numpy as np
import pandas as pd
import recommendation_functions as rf
from sentence_transformers import SentenceTransformer, CrossEncoder
from pathlib import Path

# --------------------------------------------------------------------------
# Config
# --------------------------------------------------------------------------
TOP_N_TAGS = 3                          # Number of top similar tags to consider for matching activities
TAG_WEIGHT = 0.4                        # Weight assigned to the tag similarity score in the final ranking
CROSS_ENCODER_MAX_CANDIDATES = 50       # Maximum number of candidate activities to consider for cross-encoder scoring (can be adjusted based on performance and accuracy trade-offs)
CROSS_ENCODER_WEIGHT = 0.6              # Weight assigned to the cross-encoder score in the final ranking

# Global variables to hold models and embeddings
_tag_model = _cross_encoder = _tag_vocab = _tag_embeddings = None


# --------------------------------------------------------------------------
# Loading & Reading Data
# --------------------------------------------------------------------------
# Load the databases
def load_tag_index(database: pd.DataFrame, model: SentenceTransformer):
    """ Load a pre-computed index of tags (mapped to activities) and their corresponding embeddings."""
    # Load tag vocabulary & embeddings from cache
    cache_filepath = rf.CURRENT_FILE_PATH / "cache"
    vocab_filepath = cache_filepath / "tag_vocab.json"
    embeddings_filepath = cache_filepath / "tag_embeddings.npy"
    tag_map_filepath = cache_filepath / "tag_to_activity_map.json"

    # Check if required files exist, & raise an error if any are missing
    missing = [path for path in [vocab_filepath, embeddings_filepath, tag_map_filepath] if not path.exists()]
    
    if missing:
        raise FileNotFoundError(
            f"Missing required files: {', '.join(str(path) for path in missing)}. Please run build_tag_index.py to generate them.")

    # Load tag vocabulary & embeddings from cache files
    tag_vocab = json.loads(vocab_filepath.read_text())
    tag_embeddings = np.load(embeddings_filepath)
    # tag_to_activity_map = json.loads(tag_map_filepath.read_text())

    return tag_vocab, tag_embeddings

def _load_once():
    """ Load the tag model, cross-encoder, and tag vocabulary/embeddings from cache if they haven't been loaded yet. 
        Ensure that these resources are only loaded once to optimise performance and avoid redundant loading.

    Returns:
        tuple: A tuple containing loaded tag model, cross-encoder, tag vocabulary, and tag embeddings.
            - tag_model (SentenceTransformer): Loaded tag model for computing embeddings.
            - cross_encoder (CrossEncoder): Loaded cross-encoder for scoring activity descriptions against user input.
            - tag_vocab (list): List of unique tags extracted from the activities database.
            - tag_embeddings (np.ndarray): Precomputed embeddings for the tags.
    """
    # Load tag model & cross-encoder, then retrieve tag vocabulary and embeddings from cache
    global _tag_model, _cross_encoder, _tag_vocab, _tag_embeddings

    if _tag_model is None:
        _tag_model = rf.load_model(rf.TAG_MODEL_FILENAME, rf.TAG_MODEL_DESIGNATION)
        _cross_encoder = rf.load_model(rf.CROSS_ENCODER_FILENAME, rf.CROSS_ENCODER_DESIGNATION)
        _tag_vocab, _tag_embeddings = load_tag_index(None, _tag_model)

    return _tag_model, _cross_encoder, _tag_vocab, _tag_embeddings

# --------------------------------------------------------------------------
# Processing Data
# --------------------------------------------------------------------------
def compute_tag_similarities(free_text: str, activities_df: pd.DataFrame, tag_model: SentenceTransformer, 
                             tag_vocab: list, tag_embeddings: np.ndarray, top_n_tags: int = TOP_N_TAGS) -> np.ndarray:
    """ 
    Compute the top N most similar tags to the user's free text input. 
    
    Args:
        free_text (str): User's free text input describing their child's interests.
        activities_df (pd.DataFrame): DataFrame containing activities and their associated tags.
        tag_model (SentenceTransformer): Model used to compute embeddings for tags.
        tag_vocab (list): List of unique tags extracted from the activities database.
        tag_embeddings (np.ndarray): Precomputed embeddings for the tags.
        top_n_tags (int): Number of top similar tags to consider for matching activities.

    Returns:
        np.ndarray: Array of similarity scores for each activity based on the top N similar tags.

    """
    if rf.DEBUG:
        print("Computing tag similarities...")

    # Create a mapping from tags to their indices in tag_vocab
    tag_to_index = {tag: i for i, tag in enumerate(tag_vocab)}

    # Compute embedding for the user's free text input
    query_embedding = tag_model.encode(free_text, normalize_embeddings = True)

    # Compute cosine similarities between query embedding and tag embeddings
    similarities = tag_embeddings @ query_embedding

    def score_tags(tag_list: list[str]) -> float:
        """Score a group of tags based on their cosine similarity to the user's input. """
        indices = [tag_to_index[tag] for tag in tag_list if tag in tag_to_index]

        # If no tags are found in vocab, no similarity
        if not indices:
            return 0.0

        # Get the top N most similar tags & sum their similarities to compute
        top = np.sort(similarities[np.array(indices)])[-top_n_tags:]
        return float(top.sum())
    return activities_df["tag_list"].apply(score_tags).to_numpy()

def rank_relevance(free_text: str, activities_df: pd.DataFrame, tag_model: SentenceTransformer, 
                    cross_encoder: CrossEncoder, tag_vocab: list, tag_embeddings: np.ndarray, 
                    tag_weight: float = 0.4, cross_encoder_weight: float = CROSS_ENCODER_WEIGHT, 
                    top_n_tags: int = TOP_N_TAGS, cross_encoder_max_candidates: int = CROSS_ENCODER_MAX_CANDIDATES) -> pd.DataFrame:
    """ 
    Rank activities based on a combination of tag similarity and cross-encoder scoring. 
    The tag similarity score is computed based on the cosine similarity between the user's input and the tags associated with each activity.
    Cross-encoder refines ranking by scoring activity descriptions against the user's free text input, for a more nuanced understanding of relevance.
    
    Args:
        free_text (str): User's free text input describing their child's interests.
        activities_df (pd.DataFrame): DataFrame containing activities and their associated tags.
        tag_model (SentenceTransformer): Model used to compute embeddings for tags.
        cross_encoder (CrossEncoder): Cross-encoder model used to score activity descriptions against user input.
        tag_vocab (list): List of unique tags extracted from the activities database.
        tag_embeddings (np.ndarray): Precomputed embeddings for the tags.
        tag_weight (float): Weight assigned to the tag similarity score in the final ranking.
        cross_encoder_weight (float): Weight assigned to the cross-encoder score in the final ranking.
        top_n_tags (int): Number of top similar tags to consider for matching activities.
        cross_encoder_max_candidates (int): Maximum number of candidate activities to consider for cross-encoder scoring.

    Returns:
        pd.DataFrame: DataFrame containing activities ranked by their combined score.
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
        # If pool is too large, pre-select top N activities based on tag similarity scores
        cross_encoder_pool = df.nlargest(cross_encoder_max_candidates, "tag_score")
        remainder = df.drop(cross_encoder_pool.index)

    if not cross_encoder_pool.empty:
        # Prepare pairs of (user input, activity description) for cross-encoder scoring
        pairs = [[free_text, desc] for desc in cross_encoder_pool["description"].tolist()]
        cross_encoder_pool["cross_encoder_score"] = cross_encoder.predict(pairs)

        # Normalise the tag similarity scores and cross-encoder scores to the range [0, 1]
        normalised_tag_scores = rf._min_max_normalise(cross_encoder_pool["tag_score"].to_numpy())
        normalised_cross_encoder_scores = rf._min_max_normalise(cross_encoder_pool["cross_encoder_score"].to_numpy())

        # Combine normalised scores using given weights to compute final scores for ranking
        cross_encoder_pool["final_score"] = (tag_weight * normalised_tag_scores) + (cross_encoder_weight * normalised_cross_encoder_scores)
        cross_encoder_pool = cross_encoder_pool.sort_values("final_score", ascending = False)

    if not remainder.empty:
        # For activities not in cross-encoder pool, normalise tag similarity scores and assign them as final scores
        remainder = remainder.sort_values("tag_score", ascending = False)

    return pd.concat([cross_encoder_pool, remainder])

def rank_activities(free_text: str, activities_df: pd.DataFrame | None = None) -> pd.DataFrame:
    """
    Rank activities based on the user's free text input describing their child's interests.

    Args:
        free_text (str): User's free text input describing their child's interests.
        activities_df (pd.DataFrame | None): Optional DataFrame containing activities and their associated tags. 
            If not provided, the function will load the activities database.
    
    Returns:
        pd.DataFrame: DataFrame containing activities ranked by their combined score based on tag similarity 
            and cross-encoder scoring.

    """
    # Raise an error if free text input is empty/all whitespace, load activities database if custom one not provided
    if not free_text or not free_text.strip():
        raise ValueError("Free text input cannot be empty or whitespace. Nothing to rank.")
    if activities_df is None:
        activities_df = rf.load_activities_from_db()

    # Load tag model & cross-encoder, then retrieve tag vocabulary and embeddings from cache
    tag_model, cross_encoder, tag_vocab, tag_embeddings = _load_once()

    return rank_relevance(free_text, activities_df, tag_model, cross_encoder, tag_vocab, tag_embeddings)

if __name__ == "__main__":
    # Example user preferences
    # free_text_input = "I want to go hiking and explore nature."

    # Parse command-line arguments for user's free text input
    parser = argparse.ArgumentParser()
    parser.add_argument("free_text_input", nargs="?", help="User's free text input describing their child's interests.")
    parser.add_argument("--out", help= "Write JSON output to this filepath as well as printing to console.")
    parser.add_argument("--debug", action="store_true", help="Enable debug mode for detailed output.")
    parser.add_argument("--verbose", action="store_true", help="Print timing & top 10 ranked activities to console")
    args = parser.parse_args()

    # Show debug messages if --debug flag is set
    rf.DEBUG = args.debug

    # Get user's free text input from command-line argument or prompt for input if not provided
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

    # Print the top 10 ranked activities along with their scores and the time taken for ranking if --verbose flag is set
    if args.verbose:
        # Print the top 10 ranked activities along with their scores and the time taken for ranking
        print(f"Ranked {len(ranked_activities)} activities in {elapsed_time:.2f} seconds.")
        print(ranked_activities[[rf.ACTIVITY_ID_COLUMN, rf.ACTIVITY_TITLE_COLUMN, "tag_score", "cross_encoder_score", "final_score"]].head(10), file=sys.stderr)

    # Print the JSON output to the console if --out flag is not set, otherwise write to specified file and print to console
    if args.out:
        Path(args.out).write_text(json_output)
    print(json_output)  