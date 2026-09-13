"""
    Run this manually when activities.csv changes (e.g., new activities, edited tags)
"""

# Import required libraries
import json, os
import recommendation_functions as rf

DEBUG = True

def write_json_to_file(current_filepath, data, filename):
    """ Write data to a JSON file. """
    filepath = current_filepath / "cache" / filename
    filepath.write_text(json.dumps(data))

def build_tag_index():
    """ Build an index of tags and their corresponding embeddings. """
    # Load activities database
    current_filepath, _, database_folder_path = rf.get_file_paths()
    # activities_filepath = os.path.join(database_folder_path, "activities_db.csv")
    activities_df = rf.load_database("activities", database_folder_path)

    if DEBUG:
        print("Activities DataFrame loaded successfully.")
        print(activities_df.head())

    # Build tag index
    activities_df["tag_list"] = activities_df["variety_tags"].apply(rf.parse_tags)
    tag_vocab = sorted({tag for tags in activities_df["tag_list"] for tag in tags})
    tag_activity_indexes: dict[str, list] = {tag: [] for tag in tag_vocab}

    print("Mapping tags to activities...")

    # Map each tag to the indexes of activities that have that tag
    for _, row in activities_df.iterrows():
        for tag in row["tag_list"]:
            tag_activity_indexes[tag].append(row["mission_id"])

    print("Tags mapped to activities.")

    # Enrich tags with a template for embedding (helps avoid label sparsity ruining embeddings)
    # tag_vocab = [f"activity type: {tag}" for tag in tag_vocab]

    # Load the tag model
    tag_model = rf.load_model(current_filepath, "tag_model", "all-MiniLM-L6-v2")

    # Save tag vocabulary and embeddings to files
    rf.embed(tag_model, tag_vocab, "tag", current_filepath)
    write_json_to_file(current_filepath, tag_vocab, "tag_vocab.json")
    write_json_to_file(current_filepath, tag_activity_indexes, "tag_to_activity_map.json")

    print("Tag index built and saved successfully.")

if __name__ == "__main__":
    build_tag_index()