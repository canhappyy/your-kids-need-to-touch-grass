"""Download and export ONNX models while building the Lambda image."""

from pathlib import Path

from sentence_transformers import CrossEncoder, SentenceTransformer


ROOT = Path(__file__).resolve().parent
MODEL_ROOT = ROOT / "models"


def main():
    tag_model = SentenceTransformer(
        "all-MiniLM-L6-v2",
        backend="onnx",
        model_kwargs={"file_name": "onnx/model.onnx"},
    )
    tag_model.save_pretrained(str(MODEL_ROOT / "tag_model"))

    cross_encoder = CrossEncoder(
        "cross-encoder/ms-marco-MiniLM-L6-v2",
        backend="onnx",
        model_kwargs={"file_name": "onnx/model.onnx"},
    )
    cross_encoder.save_pretrained(str(MODEL_ROOT / "cross_encoder"))


if __name__ == "__main__":
    main()
