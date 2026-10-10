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
    """ Get a SQLAlchemy engine for PostgreSQL database. If engine does not exist, create it. """
    global _engine
    if _engine is None:
        _engine = create_engine(DATABASE_URL)
    return _engine

def load_activities_from_db() -> pd.DataFrame:
    """ Load activities & their associated tags from database into a pandas DataFrame. """
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
    """ Load embeddings from a .npy file. """
    filepath = os.path.join(CURRENT_FILE_PATH, f"{filename}_embeddings.npy")
    if DEBUG == True:
        print(f"Loading embeddings from {filepath}...")
    return np.load(filepath)

def _create_model(model_designation: str, source: str | None = None):
    """ Create a model based on the provided designation. """
    src = source if source is not None else model_designation

    if model_designation == TAG_MODEL_DESIGNATION:
        return SentenceTransformer(src, backend = BACKEND, model_kwargs={"file_name": ONNX_MODEL_FILENAME})
    elif model_designation == CROSS_ENCODER_DESIGNATION:
        return CrossEncoder(src, backend = BACKEND, model_kwargs={"file_name": ONNX_MODEL_FILENAME})
    else:
        raise ValueError(f"Unknown model designation: {model_designation}")

def load_model(model_filename: str, model_designation: str):
    """ Load the tag model from the local directory if it exists, otherwise download it. """
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
def parse_tags(raw: str):
    """ 
    Parse the raw string of tags into a list of individual tags. 
    Tags are expected to be separated by the '|' character. 

    Args:
        raw (str): Raw string of tags.
    """
    if not isinstance(raw, str) or not raw.strip():
        return []

    return [tag.lower().strip() for tag in raw.split("|") if tag.strip()]

# Encode tag vocabulary & activity descriptions into embeddings
def embed(model: SentenceTransformer, text: list[str], filename: str) -> np.ndarray:
    """ Encode the text into embeddings using the provided model and save them to a .npy file. """
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
    """ Normalise an array to the range [0, 1] using min-max scaling. """
    low, high = array.min(), array.max()
    if high - low < 1e-9:
        # If all values are the same, return an array of 0.5 (midpoint of [0, 1])
        return np.full_like(array, 0.5, dtype = float)

    # Normalised value = (value - min) / (max - min)
    return (array - low) / (high - low)
