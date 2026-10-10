"""Offline variety tag indexing script for AI recommendation ranking.

Run this script manually whenever the activities database changes (e.g. new activities added,
existing variety tags modified). It extracts the complete vocabulary of unique tags from the database,
computes normalized sentence embeddings using `all-MiniLM-L6-v2`, and generates the following artifacts
in `cache/`:
1. `tag_vocab.json`: Sorted array of unique variety tag strings.
2. `tag_embeddings.npy`: 2D numpy matrix of precomputed vector embeddings.
3. `tag_to_activity_map.json`: Mapping of each variety tag to associated mission IDs.
"""

import json
from pathlib import Path

try:
    from ai_recommendation import recommendation_functions as rf
except ModuleNotFoundError:
    import recommendation_functions as rf


def write_json_to_file(data, filename: str, current_filepath: Path = rf.CURRENT_FILE_PATH) -> None:
    """Writes a Python data structure to a JSON file inside the `cache/` directory.

    Args:
        data: JSON-serializable Python object (dict, list, etc.).
        filename: Destination filename within `cache/` (e.g. `tag_vocab.json`).
        current_filepath: Root package path. Defaults to `rf.CURRENT_FILE_PATH`.
    """
    filepath = current_filepath / "cache" / filename
    filepath.parent.mkdir(parents=True, exist_ok=True)
    filepath.write_text(json.dumps(data))


def build_tag_index() -> None:
    """Extracts variety tags from PostgreSQL, computes ONNX embeddings, and saves cache files.

    Pipeline Steps:
    1. Loads activities and variety tags from database via `load_activities_from_db()`.
    2. Builds sorted vocabulary of unique tags across all activities.
    3. Maps each tag to its corresponding list of `mission_id` strings.
    4. Encodes tag vocabulary using `all-MiniLM-L6-v2` bi-encoder into normalized embeddings.
    5. Persists `tag_vocab.json`, `tag_embeddings.npy`, and `tag_to_activity_map.json` to disk.
    """
    # Load activities database
    activities_df = rf.load_activities_from_db()

    if rf.DEBUG:
        print("Activities DataFrame loaded successfully.")
        print(activities_df.head())

    # Extract sorted set of unique variety tags
    tag_vocab = sorted({tag for tags in activities_df["tag_list"] for tag in tags})
    tag_activity_indexes: dict[str, list] = {tag: [] for tag in tag_vocab}

    if rf.DEBUG:
        print(f"Unique tags extracted: {len(tag_vocab)}")
        print(f"Sample tags: {tag_vocab[:10]}")
        print("Mapping tags to activities...")

    # Map each tag to the list of mission IDs that contain that tag
    for _, row in activities_df.iterrows():
        for tag in row["tag_list"]:
            tag_activity_indexes[tag].append(row["mission_id"])

    if rf.DEBUG:
        print("Tags mapped to activities.")
        print("Tag-Activity Indexes sample:", {tag: tag_activity_indexes[tag] for tag in list(tag_activity_indexes)[:5]})

    # Load the sentence transformer tag model
    tag_model = rf.load_model("tag_model", "all-MiniLM-L6-v2")

    # Compute and save tag vector embeddings and JSON maps to the cache folder
    rf.embed(tag_model, tag_vocab, "tag")
    write_json_to_file(tag_vocab, "tag_vocab.json")
    write_json_to_file(tag_activity_indexes, "tag_to_activity_map.json")

    if rf.DEBUG:
        print("Tag index built and saved successfully.")


if __name__ == "__main__":
    build_tag_index()