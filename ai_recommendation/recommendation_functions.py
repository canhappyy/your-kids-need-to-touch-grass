from sentence_transformers import SentenceTransformer
from pathlib import Path
import numpy as np
import pandas as pd
import os

# Debug flag to control printing of debug information
debug = True

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
    return current_filepath, root_folder_path

def load_database(database_name: str) -> pd.DataFrame:
    """ Load a database CSV file into a pandas DataFrame. """
    filepath = os.path.join(root_folder_path, "data", "processed", database_names[database_name])
    if debug == True:
        print(f"Loading {database_name} database from {filepath}...")
    return pd.read_csv(filepath)


def load_embeddings(filename: str) -> np.ndarray:
    """ Load embeddings from a .npy file. """
    filepath = os.path.join(current_filepath, f"{filename}_embeddings.npy")
    if debug == True:
        print(f"Loading embeddings from {filepath}...")
    return np.load(filepath)

# Import activity tags & descriptions from database
# Combine repo filepath with relative path to the database
current_filepath, root_folder_path = get_file_paths()
activities_filepath = os.path.join(root_folder_path, "data", "processed", "activities_db.csv")
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

def map_tags_to_activities(activities_df: pd.DataFrame):
    """ 
    Create a mapping of tags to the indexes of activities that have that tag. 
    
    Args:
        activities_df (pd.DataFrame): DataFrame containing activity data with a 'variety_tags' column.
    """
    # Make vocabulary of unique tags and map each tag to the indexes of activities that have that tag
    activities_df["tag_list"] = activities_df['variety_tags'].apply(parse_tags)
    tag_vocab = sorted({tag for tags in activities_df['tag_list'] for tag in tags})
    tag_activity_indexes: dict[str, list] = {tag: [] for tag in tag_vocab}

    for _, row in activities_df.iterrows():
        for tag in row["tag_list"]:
            tag_activity_indexes[tag].append(row["mission_id"])

    # Enrich tags with a template for embedding (helps avoid label sparsity ruining embeddings)
    tag_vocab = [f"activity type: {tag}" for tag in tag_vocab]

    # DEBUG: Print the tag vocabulary and the mapping of tags to activity indexes
    if debug == True:
        print("Tag Vocabulary:", tag_vocab)
        print("Tag-Activity Indexes:", tag_activity_indexes)

    return tag_vocab, tag_activity_indexes

# Load separate language models for encoding tags and descriptions, respectively
tag_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
description_model = SentenceTransformer('sentence-transformers/multi-qa-MiniLM-L6-cos-v1')

# Encode the tag vocabulary and activity descriptions into embeddings
def embed(model: SentenceTransformer, text: list[str], filename: str):
    """ Encode the text into embeddings using the provided model and save them to a .npy file. """
    if debug == True:
        print(f"Encoding {len(text)} items from {text} into embeddings...")
    embeddings = model.encode(text, batch_size = 64, normalize_embeddings = True, show_progress_bar = True)
    if debug == True:
        print(f"Saving embeddings to {filename}_embeddings.npy...")
    np.save(f"{filename}_embeddings.npy", embeddings)

