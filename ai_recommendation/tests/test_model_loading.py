"""Unit tests for the model loader functions in recommendation_functions."""

from pathlib import Path

from ai_recommendation import recommendation_functions as functions


def test_load_model_uses_existing_local_directory(monkeypatch, tmp_path):
    """Verifies that load_model loads from the local models directory if cached files exist."""
    model_dir = tmp_path / "models" / functions.TAG_MODEL_FILENAME
    model_dir.mkdir(parents=True)
    (model_dir / "config.json").write_text("{}")
    captured = {}

    def fake_create(designation, source=None):
        captured["designation"] = designation
        captured["source"] = source
        return object()

    monkeypatch.setattr(functions, "CURRENT_FILE_PATH", Path(tmp_path))
    monkeypatch.setattr(functions, "_create_model", fake_create)

    functions.load_model(
        functions.TAG_MODEL_FILENAME,
        functions.TAG_MODEL_DESIGNATION,
    )

    assert captured == {
        "designation": functions.TAG_MODEL_DESIGNATION,
        "source": str(model_dir),
    }

