from sentence_transformers import CrossEncoder, SentenceTransformer
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
import numpy as np
import pandas as pd
import os

# Debug flag to control printing of debug information
DEBUG = True

CURRENT_FILE_PATH = Path(__file__).resolve().parent

# Database constants
DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/appdb"
)

ACTIVITIES_TABLE = "activity"
ACTIVITY_TAGS_TABLE = "activity_variety_tag"
TAGS_COLUMN = "tag_name"
ACTIVITY_ID_COLUMN = "mission_id"
ACTIVITY_TITLE_COLUMN = "activity_title"


# Constants for model designations and filenames
BACKEND = "onnx"  
TAG_MODEL_DESIGNATION = "all-MiniLM-L6-v2"
TAG_MODEL_FILENAME = "tag_model"
CROSS_ENCODER_DESIGNATION = "cross-encoder/ms-marco-MiniLM-L6-v2"
CROSS_ENCODER_FILENAME = "cross_encoder"
ONNX_MODEL_FILENAME = "onnx/model.onnx"

# --------------------------------------------------------------------------
# Database Functions
# --------------------------------------------------------------------------

# Dictionary mapping database names to their corresponding CSV filenames
# database_names = { 
#                 "open_spaces": "open_space_location_db.csv", 
#                 "postcode": "postcode_location_db.csv", 
#                 "activities": "activities_db.csv" 
#                   }

# def load_database(database_name: str, database_folder_path: str) -> pd.DataFrame:
#     """ Load a database CSV file into a pandas DataFrame. """
#     filepath = os.path.join(database_folder_path, database_names[database_name])
#     if DEBUG == True:
#         print(f"Loading {database_name} database from {filepath}...")

    # return pd.read_csv(filepath)

_engine: Engine | None = None

def get_db_engine() -> Engine:
    """ Get a SQLAlchemy engine for the PostgreSQL database. If the engine does not exist, create it. """
    global _engine
    if _engine is None:
        _engine = create_engine(DATABASE_URL)
    return _engine

def load_activities_from_db() -> pd.DataFrame:
    """ Load activities and their associated tags from the database into a pandas DataFrame. """
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

def _create_model(model_designation: str):
    """ Create a model based on the provided designation. """
    if model_designation == TAG_MODEL_DESIGNATION:
        return SentenceTransformer(model_designation, backend = BACKEND, model_kwargs={"file_name": ONNX_MODEL_FILENAME})
    elif model_designation == CROSS_ENCODER_DESIGNATION:
        return CrossEncoder(model_designation, backend = BACKEND, model_kwargs={"file_name": ONNX_MODEL_FILENAME})
    else:
        raise ValueError(f"Unknown model designation: {model_designation}")

def load_model(model_filename: str, model_designation: str):
    """ Load the tag model from the local directory if it exists, otherwise download it. """
    # Determine correct file path for loading model
    model_folder = CURRENT_FILE_PATH / "models"
    model_dir = model_folder / model_filename

    if model_dir.exists() and any(model_dir.iterdir()):
        return _create_model(model_designation)
    else:
        # Make a new model and save it locally for future use
        model = _create_model(model_designation)
        model.save_pretrained(str(model_dir))
        return model

# Extract the activity tags
def parse_tags(raw: str):
    """ 
    Parse the raw string of tags into a list of individual tags. 
    Tags are expected to be separated by the '|' character. 

    Args:
        raw (str): The raw string of tags.
    """
    if not isinstance(raw, str) or not raw.strip():
        return []

    return [tag.lower().strip() for tag in raw.split("|") if tag.strip()]

# def map_tags_to_activities(activities_df: pd.DataFrame):
#     """ 
#     Create a mapping of tags to the indexes of activities that have that tag. 
    
#     Args:
#         activities_df (pd.DataFrame): DataFrame containing activity data with a 'variety_tags' column.
#     """
#     # Make vocabulary of unique tags
#     activities_df["tag_list"] = activities_df['variety_tags'].apply(parse_tags)
#     tag_vocab = sorted({tag for tags in activities_df['tag_list'] for tag in tags})
#     tag_activity_indexes: dict[str, list] = {tag: [] for tag in tag_vocab}

#     # Map each tag to the indexes of activities that have that tag
#     for _, row in activities_df.iterrows():
#         for tag in row["tag_list"]:
#             tag_activity_indexes[tag].append(row["mission_id"])

#     # Enrich tags with a template for embedding (helps avoid label sparsity ruining embeddings)
#     tag_vocab = [f"activity type: {tag}" for tag in tag_vocab]

#     # DEBUG: Print the tag vocabulary and the mapping of tags to activity indexes
#     if DEBUG == True:
#         print("Tag Vocabulary:", tag_vocab)
#         print("Tag-Activity Indexes:", tag_activity_indexes)

#     return tag_vocab, tag_activity_indexes

# Encode the tag vocabulary and activity descriptions into embeddings
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

