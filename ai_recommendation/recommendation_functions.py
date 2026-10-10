"""Shared utility functions and database helpers for AI recommendation services.

Provides database connectivity via SQLAlchemy, model instantiation with ONNX backends,
tag text parsing, batch vector embedding computation, and array normalization routines.
"""

from sentence_transformers import CrossEncoder, SentenceTransformer
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
import numpy as np
import pandas as pd
import os

# Debug flag to control printing of debug information
DEBUG = True

CURRENT_FILE_PATH = Path(__file__).resolve().parent

load_dotenv(
    CURRENT_FILE_PATH / "ai.env"
)  

# Database constants
DATABASE_URL = os.environ.get("DATABASE_URL")

ACTIVITIES_TABLE = "activity"
ACTIVITY_TAGS_TABLE = "activity_variety_tag"
TAGS_COLUMN = "tag_name"
ACTIVITY_ID_COLUMN = "mission_id"
ACTIVITY_TITLE_COLUMN = "activity_title"


# Constants for model designations & filenames
BACKEND = "onnx"  
TAG_MODEL_DESIGNATION = "all-MiniLM-L6-v2"
TAG_MODEL_FILENAME = "tag_model"
CROSS_ENCODER_DESIGNATION = "cross-encoder/ms-marco-MiniLM-L6-v2"
CROSS_ENCODER_FILENAME = "cross_encoder"
ONNX_MODEL_FILENAME = "onnx/model.onnx"

# --------------------------------------------------------------------------
# Database Functions
# --------------------------------------------------------------------------

# Global variable to hold SQLAlchemy engine
_engine: Engine | None = None

def get_db_engine() -> Engine:
    """Gets or creates a singleton SQLAlchemy Engine instance for PostgreSQL.

    Returns:
        Engine: SQLAlchemy Engine connected to `DATABASE_URL`.
    """
    global _engine
    if _engine is None:
        _engine = create_engine(DATABASE_URL)
    return _engine

def load_activities_from_db() -> pd.DataFrame:
    """Loads activities and aggregates their associated variety tags into a DataFrame.

    Executes SQL queries against `activity` and `activity_variety_tag` tables,
    cleans tag strings, groups tags by `mission_id` into Python lists, and performs
    a left join to ensure every activity has a valid `tag_list` column.

    Returns:
        pd.DataFrame: DataFrame containing all activity records with a `tag_list` column.
    """
    engine = get_db_engine()

    # Load activities & their tags from database
    activities = pd.read_sql(f"SELECT * FROM {ACTIVITIES_TABLE}", engine)
    tag_rows = pd.read_sql(f"SELECT {ACTIVITY_ID_COLUMN}, {TAGS_COLUMN} FROM {ACTIVITY_TAGS_TABLE}", engine)

    # Clean & merge tags into activities DataFrame (left joined on mission_id)
    tag_rows[TAGS_COLUMN] = tag_rows[TAGS_COLUMN].str.lower().str.strip()
    tag_lists = tag_rows.groupby(ACTIVITY_ID_COLUMN)[TAGS_COLUMN].apply(list).rename("tag_list")
    activities = activities.merge(tag_lists, on=ACTIVITY_ID_COLUMN, how="left")

    # Ensure that the 'tag_list' column is a list for all activities, even if they have no tags (as a result of the left join)
    activities["tag_list"] = activities["tag_list"].apply(lambda x: x if isinstance(x, list) else [])
    return activities

# --------------------------------------------------------------------------
# Model Functions
# --------------------------------------------------------------------------
def load_embeddings(filename: str) -> np.ndarray:
    """Loads a precomputed embedding matrix from a `.npy` file.

    Args:
        filename: Base name of the embeddings file (excluding `_embeddings.npy` suffix).

    Returns:
        np.ndarray: Loaded 2D numpy array of embeddings.
    """
    filepath = os.path.join(CURRENT_FILE_PATH, f"{filename}_embeddings.npy")
    if DEBUG == True:
        print(f"Loading embeddings from {filepath}...")
    return np.load(filepath)

def _create_model(model_designation: str, source: str | None = None):
    """Instantiates a SentenceTransformer or CrossEncoder with ONNX runtime backend.

    Args:
        model_designation: Model name identifier (e.g. `all-MiniLM-L6-v2` or `cross-encoder/ms-marco-MiniLM-L6-v2`).
        source: Optional directory path or Hugging Face repository ID. Defaults to `model_designation`.

    Returns:
        SentenceTransformer | CrossEncoder: The initialized model.

    Raises:
        ValueError: If `model_designation` is unrecognized.
    """
    src = source if source is not None else model_designation

    if model_designation == TAG_MODEL_DESIGNATION:
        return SentenceTransformer(src, backend = BACKEND, model_kwargs={"file_name": ONNX_MODEL_FILENAME})
    elif model_designation == CROSS_ENCODER_DESIGNATION:
        return CrossEncoder(src, backend = BACKEND, model_kwargs={"file_name": ONNX_MODEL_FILENAME})
    else:
        raise ValueError(f"Unknown model designation: {model_designation}")

def load_model(model_filename: str, model_designation: str):
    """Loads a model from the local directory if cached, otherwise downloads and persists it.

    Args:
        model_filename: Directory name within `models/` where the model is stored.
        model_designation: Hugging Face model identifier for download fallback.

    Returns:
        SentenceTransformer | CrossEncoder: Loaded model instance.
    """
    # Determine correct file path for loading model
    model_dir = CURRENT_FILE_PATH / "models" / model_filename

    if model_dir.exists() and any(model_dir.iterdir()):
        return _create_model(model_designation, str(model_dir))
    else:
        # Make a new model and save it locally for future use
        model = _create_model(model_designation)
        model.save_pretrained(str(model_dir))
        return model

# Extract activity tags
def parse_tags(raw: str) -> list[str]:
    """Parses a pipe-delimited raw tag string into a list of normalized lowercase tags.

    Args:
        raw (str): Raw pipe-delimited string of tags (e.g. "Nature | Creative").

    Returns:
        list[str]: Cleaned list of lowercase tag strings.
    """
    if not isinstance(raw, str) or not raw.strip():
        return []

    return [tag.lower().strip() for tag in raw.split("|") if tag.strip()]

# Encode tag vocabulary & activity descriptions into embeddings
def embed(model: SentenceTransformer, text: list[str], filename: str) -> np.ndarray:
    """Encodes a list of text strings into normalized vector embeddings and saves them to disk.

    Args:
        model (SentenceTransformer): Sentence transformer model used for encoding.
        text (list[str]): List of text strings to embed.
        filename (str): Base name for saving the `.npy` file inside the `cache/` directory.

    Returns:
        np.ndarray: 2D numpy array of normalized embedding vectors.
    """
    embed_filepath = CURRENT_FILE_PATH / "cache" / f"{filename}_embeddings.npy"

    if DEBUG == True:
        print(f"Encoding {len(text)} items from {text} into embeddings...")
    embeddings = model.encode(text, batch_size = 64, normalize_embeddings = True, show_progress_bar = True)

    if DEBUG == True:
        print(f"Saving embeddings to {embed_filepath}...")
    np.save(str(embed_filepath), embeddings)

    if DEBUG == True:
            print(f"Embeddings saved.")

    return embeddings

def _min_max_normalise(array: np.ndarray) -> np.ndarray:
    """Normalizes an array to the range [0.0, 1.0] using Min-Max scaling.

    Args:
        array (np.ndarray): Input numpy numerical array.

    Returns:
        np.ndarray: Scaled array where minimum is 0.0 and maximum is 1.0 (or 0.5 for uniform arrays).
    """
    low, high = array.min(), array.max()
    if high - low < 1e-9:
        # If all values are the same, return an array of 0.5 (midpoint of [0, 1])
        return np.full_like(array, 0.5, dtype = float)

    # Normalised value = (value - min) / (max - min)
    return (array - low) / (high - low)
