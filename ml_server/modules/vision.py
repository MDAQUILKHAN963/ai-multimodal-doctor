"""
X-ray classification + Grad-CAM heatmap (TensorFlow / Keras).

Week 1: returns deterministic-but-fake predictions so the React -> Node ->
FastAPI plumbing can be tested without a trained model.

Week 3: once you drop your trained Keras model into
ml_server/models/xray_classifier.keras (or .h5) and set USE_REAL_MODEL=1
in .env, this module loads it lazily and serves real predictions with
Grad-CAM overlays.
"""

from __future__ import annotations

import base64
import hashlib
import io
import json
import os
from pathlib import Path

CLASSES_FALLBACK = ["COVID", "Lung Opacity", "Normal", "Pneumonia"]
MODELS_DIR = Path(__file__).parent.parent / "models"

_model = None
_class_names: list[str] | None = None


def _find_model_path() -> Path | None:
    for name in ("xray_classifier.keras", "xray_classifier.h5"):
        path = MODELS_DIR / name
        if path.exists():
            return path
    return None


def _load_model_lazy():
    global _model, _class_names
    if _model is not None:
        return _model, _class_names

    model_path = _find_model_path()
    if model_path is None:
        raise FileNotFoundError(
            f"No trained model found in {MODELS_DIR}. "
            "Drop xray_classifier.keras (or .h5) into that folder."
        )

    import tensorflow as tf  # imported lazily so the dummy path stays light

    _model = tf.keras.models.load_model(model_path, compile=False)

    class_names_file = MODELS_DIR / "class_names.json"
    if class_names_file.exists():
        _class_names = json.loads(class_names_file.read_text())
    else:
        _class_names = CLASSES_FALLBACK

    print(f"[vision] loaded model from {model_path} | classes={_class_names}")
    return _model, _class_names


def predict_xray(image_bytes: bytes) -> dict:
    use_real = os.getenv("USE_REAL_MODEL") == "1" and _find_model_path() is not None
    if use_real:
        return _real_predict(image_bytes)
    return _dummy_predict(image_bytes)


def _dummy_predict(image_bytes: bytes) -> dict:
    """Deterministic fake prediction based on the image hash."""
    h = int(hashlib.sha256(image_bytes).hexdigest(), 16)
    label_idx = h % len(CLASSES_FALLBACK)
    confidence = 0.65 + ((h >> 8) % 30) / 100.0
    tiny_png_b64 = (
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAj"
        "CB0C8AAAAASUVORK5CYII="
    )
    return {
        "label": CLASSES_FALLBACK[label_idx],
        "confidence": round(confidence, 4),
        "classes": CLASSES_FALLBACK,
        "heatmap_base64": tiny_png_b64,
        "model": "dummy-v0",
    }


def _real_predict(image_bytes: bytes) -> dict:
    import numpy as np
    from PIL import Image
    import tensorflow as tf

    model, class_names = _load_model_lazy()

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((224, 224))
    arr = np.array(img, dtype=np.float32)

    # Match training preprocessing: preprocess_input (NOT rescale=1./255)
    # preprocess_input does mean subtraction + RGB->BGR for ResNet50 ImageNet weights
    from tensorflow.keras.applications.resnet50 import preprocess_input
    batch = np.expand_dims(preprocess_input(arr.copy()), axis=0)

    probs = model(batch, training=False).numpy()[0]
    idx = int(np.argmax(probs))
    confidence = float(probs[idx])

    heatmap_b64 = _gradcam_heatmap(model, batch, idx, arr.astype(np.uint8))

    return {
        "label": class_names[idx],
        "confidence": round(confidence, 4),
        "classes": class_names,
        "heatmap_base64": heatmap_b64,
        "probs": [round(float(p), 4) for p in probs],
        "model": "resnet50-keras-v1",
    }


def _gradcam_heatmap(model, batch, class_idx: int, original_arr) -> str:
    """Compute Grad-CAM and return a base64-encoded PNG overlay."""
    import numpy as np
    import tensorflow as tf
    import cv2

    last_conv = _find_last_conv_layer(model)

    grad_model = tf.keras.models.Model(
        inputs=model.inputs,
        outputs=[model.get_layer(last_conv).output, model.output],
    )

    with tf.GradientTape() as tape:
        conv_out, predictions = grad_model(batch)
        loss = predictions[:, class_idx]

    grads = tape.gradient(loss, conv_out)
    pooled = tf.reduce_mean(grads, axis=(0, 1, 2))
    conv_out = conv_out[0]
    heatmap = tf.reduce_sum(conv_out * pooled, axis=-1).numpy()

    heatmap = np.maximum(heatmap, 0)
    if heatmap.max() > 0:
        heatmap = heatmap / heatmap.max()
    heatmap = cv2.resize(heatmap, (224, 224))
    heatmap_uint8 = np.uint8(255 * heatmap)
    color = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)

    original_bgr = cv2.cvtColor(original_arr.astype(np.uint8), cv2.COLOR_RGB2BGR)
    overlay = cv2.addWeighted(original_bgr, 0.6, color, 0.4, 0)

    ok, buf = cv2.imencode(".png", overlay)
    if not ok:
        return ""
    return base64.b64encode(buf.tobytes()).decode("ascii")


def _find_last_conv_layer(model) -> str:
    """Walk the model in reverse to find the last Conv2D layer."""
    from tensorflow.keras.layers import Conv2D

    def walk(layer):
        if hasattr(layer, "layers"):
            for inner in reversed(layer.layers):
                yield from walk(inner)
        else:
            yield layer

    for layer in walk(model):
        if isinstance(layer, Conv2D):
            return layer.name
    raise ValueError("No Conv2D layer found in model")
