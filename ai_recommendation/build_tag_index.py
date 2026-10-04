"""
    Run this manually when activities.csv changes (e.g., new activities, edited tags)
"""

# Import required libraries
import json, os
import recommendation_functions as rf

DEBUG = True

def write_json_to_file(data, filename, current_filepath=rf.CURRENT_FILE_PATH):
    """ Write data to a JSON file. """
    filepath = current_filepath / "cache" / filename
    filepath.write_text(json.dumps(data))

def build_tag_index():
    """ Build an index of tags and their corresponding embeddings. """
    # Load activities database
    # activities_filepath = os.path.join(database_folder_path, "activities_db.csv")
    activities_df = rf.load_activities_from_db()

    if DEBUG:
        print("Activities DataFrame loaded successfully.")
        print(activities_df.head())

    # Build tag index
    # activities_df["tag_list"] = activities_df[rf.TAGS_COLUMN].apply(rf.parse_tags)
    tag_vocab = sorted({tag for tags in activities_df["tag_list"] for tag in tags})
    tag_activity_indexes: dict[str, list] = {tag: [] for tag in tag_vocab}

    if rf.DEBUG:
        print(f"Unique tags extracted: {len(tag_vocab)}")
        print(f"Sample tags: {tag_vocab[:10]}")

    print("Mapping tags to activities...")

    # Map each tag to the indexes of activities that have that tag
    for _, row in activities_df.iterrows():
        for tag in row["tag_list"]:
            tag_activity_indexes[tag].append(row["mission_id"])

    print("Tags mapped to activities.")
    if rf.DEBUG:
        print("Tag-Activity Indexes:", {tag: tag_activity_indexes[tag] for tag in list(tag_activity_indexes)[:10]})

    # Enrich tags with a template for embedding (helps avoid label sparsity ruining embeddings)
    # tag_vocab = [f"activity type: {tag}" for tag in tag_vocab]

    # Load the tag model
    tag_model = rf.load_model("tag_model", "all-MiniLM-L6-v2")

    # Save tag vocabulary and embeddings to files
    rf.embed(tag_model, tag_vocab, "tag")
    write_json_to_file(tag_vocab, "tag_vocab.json")
    write_json_to_file(tag_activity_indexes, "tag_to_activity_map.json")

    print("Tag index built and saved successfully.")

if __name__ == "__main__":
    build_tag_index()