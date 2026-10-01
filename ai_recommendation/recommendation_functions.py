from sentence_transformers import CrossEncoder, SentenceTransformer
from pathlib import Path
import numpy as np
import pandas as pd
import os

# Debug flag to control printing of debug information
DEBUG = True

# Constants for model designations and filenames
BACKEND = "onnx"  
TAG_MODEL_DESIGNATION = "all-MiniLM-L6-v2"
TAG_MODEL_FILENAME = "tag_model"
CROSS_ENCODER_DESIGNATION = "cross-encoder/ms-marco-MiniLM-L6-v2"
CROSS_ENCODER_FILENAME = "cross_encoder"
ONNX_MODEL_FILENAME = "onnx/model.onnx"

# Dictionary mapping database names to their corresponding CSV filenames
database_names = { 
                "open_spaces": "open_space_location_db.csv", 
                "postcode": "postcode_location_db.csv", 
                "activities": "activities_db.csv" 
                  }

def get_file_paths():
    """ Get the current file path and root folder path. """
    current_filepath = Path(__file__).resolve().parent
    root_folder_path = current_filepath.parent
    database_folder_path = os.path.join(root_folder_path, "pipeline", "data", "processed")
    return current_filepath, root_folder_path, database_folder_path

def load_database(database_name: str, database_folder_path: str) -> pd.DataFrame:
    """ Load a database CSV file into a pandas DataFrame. """
    filepath = os.path.join(database_folder_path, database_names[database_name])
    if DEBUG == True:
        print(f"Loading {database_name} database from {filepath}...")

    return pd.read_csv(filepath)

def load_embeddings(filename: str) -> np.ndarray:
    """ Load embeddings from a .npy file. """
    filepath = os.path.join(current_filepath, f"{filename}_embeddings.npy")
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

def load_model(current_filepath: Path, model_filename: str, model_designation: str):
    """ Load the tag model from the local directory if it exists, otherwise download it. """
    # Determine correct file path for loading model
    model_folder = current_filepath / "models"
    model_dir = model_folder / model_filename

    if model_dir.exists() and any(model_dir.iterdir()):
        return _create_model(model_designation)
    else:
        # Make a new model and save it locally for future use
        model = _create_model(model_designation)
        model.save_pretrained(str(model_dir))
        return model

# Import activity tags & descriptions from database
# Combine repo filepath with relative path to the database
current_filepath, root_folder_path, database_folder_path = get_file_paths()
activities_filepath = os.path.join(database_folder_path, "activities_db.csv")
activities_df = pd.read_csv(activities_filepath)

# Extract the activity tags
def parse_tags(raw: str):
    """ 
    Parse the raw string of tags into a list of individual tags. 
    Tags are expected to be separated by the '|' character. 

    Args:
        raw (str): The raw string of tags.
    """
    if not raw or pd.isna(raw):
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
def embed(model: SentenceTransformer, text: list[str], filename: str, current_filepath: Path):
    """ Encode the text into embeddings using the provided model and save them to a .npy file. """
    embed_filepath = current_filepath / "cache" / f"{filename}_embeddings.npy"

    if DEBUG == True:
        print(f"Encoding {len(text)} items from {text} into embeddings...")
    embeddings = model.encode(text, batch_size = 64, normalize_embeddings = True, show_progress_bar = True)

    if DEBUG == True:
        print(f"Saving embeddings to {embed_filepath}...")
    np.save(str(embed_filepath), embeddings)

    if DEBUG == True:
            print(f"Embeddings saved.")

    return embeddings

def _min_max_normalize(array: np.ndarray) -> np.ndarray:
    """ Normalise an array to the range [0, 1] using min-max scaling. """
    low, high = array.min(), array.max()
    if high - low < 1e-9:
        # If all values are the same, return an array of 0.5 (midpoint of [0, 1])
        return np.full_like(array, 0.5, dtype = float)

    # Normalised value = (value - min) / (max - min)
    return (array - low) / (high - low)

