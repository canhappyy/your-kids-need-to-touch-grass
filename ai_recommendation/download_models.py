"""Download and export ONNX models during the Docker Lambda container build.

This script runs during container image building (see Dockerfile) to download the
`all-MiniLM-L6-v2` bi-encoder and `ms-marco-MiniLM-L6-v2` cross-encoder from Hugging Face,
convert/export their weights to optimized ONNX computational graphs (`onnx/model.onnx`),
and save them inside `models/tag_model/` and `models/cross_encoder/`.
"""

from pathlib import Path

from sentence_transformers import CrossEncoder, SentenceTransformer

# Base paths for persisting pre-baked models
ROOT = Path(__file__).resolve().parent
MODEL_ROOT = ROOT / "models"


def main() -> None:
    """Downloads Hugging Face models and persists them with ONNX runtime graphs."""
    MODEL_ROOT.mkdir(parents=True, exist_ok=True)

    # Export bi-encoder tag model to ONNX format
    tag_model = SentenceTransformer(
        "all-MiniLM-L6-v2",
        backend="onnx",
        model_kwargs={"file_name": "onnx/model.onnx"},
    )
    tag_model.save_pretrained(str(MODEL_ROOT / "tag_model"))

    # Export cross-encoder reranking model to ONNX format
    cross_encoder = CrossEncoder(
        "cross-encoder/ms-marco-MiniLM-L6-v2",
        backend="onnx",
        model_kwargs={"file_name": "onnx/model.onnx"},
    )
    cross_encoder.save_pretrained(str(MODEL_ROOT / "cross_encoder"))


if __name__ == "__main__":
    main()

