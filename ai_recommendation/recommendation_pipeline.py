from pathlib import Path
from math import radians, sin, cos, sqrt, atan2
import numpy as np
import pandas as pd
import recommendation_functions as rf
from sentence_transformers import SentenceTransformer, CrossEncoder

# --------------------------------------------------------------------------
# Config
# --------------------------------------------------------------------------
TAG_MODEL_NAME = "all-MiniLM-L6-v2"
CROSS_ENCODER_NAME = "cross-encoder/ms-marco-MiniLM-L6-v2"

TOP_K = 5
RADIUS_KM = 1.0

# Flag to control printing of debug information
debug = True

# --------------------------------------------------------------------------
# Loading & Reading Data
# --------------------------------------------------------------------------
# Load the databases
activities_df = rf.load_database("activities")
postcode_df = rf.load_database("postcodes")
open_spaces_df = rf.load_database("open_spaces")

tag_model = SentenceTransformer(TAG_MODEL_NAME)

def build_tag_index(database: pd.DataFrame, model: SentenceTransformer):
    """ Build an index of tags and their corresponding embeddings. """
    tag_vocab, tag_to_activity_map = rf.map_tags_to_activities(database)

    # If embeddings are not already saved, compute and save them
    try:
        tag_embeddings = rf.load_embeddings("tag")
    except FileNotFoundError:
        if debug:
            print("Tag embeddings not found. Computing embeddings...")
        tag_embeddings = model.encode(tag_vocab, convert_to_numpy=True)
        tag_embeddings = rf.embed(model, tag_vocab, "tag")

    return tag_vocab, tag_embeddings, tag_to_activity_map


