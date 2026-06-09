"""
ResNet-50 fine-tuning on COVID-19 Radiography dataset (4 classes).
TensorFlow / Keras version.

Run this in Google Colab (or Kaggle). See training/README.md for the
step-by-step walkthrough.

Output:
  checkpoints/xray_classifier.keras   (model weights + architecture)
  checkpoints/class_names.json        (label order, e.g. ["COVID", ...])

Copy both into ../ml_server/models/ and set USE_REAL_MODEL=1 in
../ml_server/.env to switch FastAPI from dummy to real inference.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications.resnet50 import ResNet50, preprocess_input

IMAGE_SIZE = (224, 224)
DEFAULT_DATA = Path("data/COVID-19_Radiography_Dataset")
DEFAULT_OUT = Path("checkpoints/xray_classifier.keras")


def build_model(num_classes: int) -> tf.keras.Model:
    base = ResNet50(weights="imagenet", include_top=False, input_shape=(*IMAGE_SIZE, 3))
    base.trainable = False  # transfer learning — freeze backbone, train head only

    inputs = layers.Input(shape=(*IMAGE_SIZE, 3))
    x = layers.Lambda(preprocess_input, name="preprocess")(inputs)
    x = base(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)

    model = models.Model(inputs, outputs, name="xray_resnet50")
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def load_datasets(data_dir: Path, batch_size: int):
    train_ds = tf.keras.utils.image_dataset_from_directory(
        data_dir,
        validation_split=0.2,
        subset="training",
        seed=42,
        image_size=IMAGE_SIZE,
        batch_size=batch_size,
        label_mode="int",
    )
    val_ds = tf.keras.utils.image_dataset_from_directory(
        data_dir,
        validation_split=0.2,
        subset="validation",
        seed=42,
        image_size=IMAGE_SIZE,
        batch_size=batch_size,
        label_mode="int",
    )
    class_names = train_ds.class_names

    augment = tf.keras.Sequential([
        layers.RandomFlip("horizontal"),
        layers.RandomRotation(0.05),
    ])
    train_ds = train_ds.map(lambda x, y: (augment(x, training=True), y),
                            num_parallel_calls=tf.data.AUTOTUNE)

    autotune = tf.data.AUTOTUNE
    train_ds = train_ds.cache().prefetch(autotune)
    val_ds = val_ds.cache().prefetch(autotune)
    return train_ds, val_ds, class_names


def run(data_dir: Path, out_path: Path, epochs: int, batch_size: int):
    print(f"[train] TF {tf.__version__} | GPU available: {bool(tf.config.list_physical_devices('GPU'))}")

    train_ds, val_ds, class_names = load_datasets(data_dir, batch_size)
    print(f"[train] classes: {class_names}")

    model = build_model(num_classes=len(class_names))
    model.summary()

    out_path.parent.mkdir(parents=True, exist_ok=True)
    callbacks = [
        tf.keras.callbacks.ModelCheckpoint(
            str(out_path), monitor="val_accuracy", save_best_only=True, verbose=1
        ),
        tf.keras.callbacks.EarlyStopping(
            monitor="val_accuracy", patience=3, restore_best_weights=True
        ),
    ]

    model.fit(train_ds, validation_data=val_ds, epochs=epochs, callbacks=callbacks)

    # Save class names alongside the model so vision.py knows label order.
    class_names_path = out_path.parent / "class_names.json"
    class_names_path.write_text(json.dumps(class_names))
    print(f"[train] saved {out_path} and {class_names_path}")

    val_loss, val_acc = model.evaluate(val_ds, verbose=0)
    print(f"[train] final val_loss={val_loss:.4f} val_accuracy={val_acc:.4f}")
    print("[train] WRITE THIS NUMBER DOWN — goes on your resume.")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--data-dir", type=Path, default=DEFAULT_DATA)
    p.add_argument("--out", type=Path, default=DEFAULT_OUT)
    p.add_argument("--epochs", type=int, default=10)
    p.add_argument("--batch-size", type=int, default=32)
    args = p.parse_args()
    run(args.data_dir, args.out, args.epochs, args.batch_size)
