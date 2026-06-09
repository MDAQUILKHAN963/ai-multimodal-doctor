# Colab Training Walkthrough — Zero to Trained Model

**IMPORTANT FIX:** Previous training used `rescale=1./255` which caused the model
to always predict 25% (uniform random). ResNet-50 requires `preprocess_input`
from Keras, not simple rescaling. The cells below use the correct preprocessing.

---

## Part A — One-time setup

### A1. Kaggle account + API token
1. https://www.kaggle.com → Settings → API → **Create Legacy API Key**
2. Open kaggle.json in Notepad → copy username and key
3. In Colab: 🔑 left sidebar → Add two Secrets:
   - `KAGGLE_USERNAME` = username from kaggle.json
   - `KAGGLE_KEY` = key from kaggle.json
   - **Notebook access: ON** for both

---

## Part B — Open Colab with GPU

1. https://colab.research.google.com → New notebook
2. **Runtime → Change runtime type → T4 GPU → Save**

---

## Part C — Notebook cells (copy one by one)

### Cell 1 — Auth + download
```python
import os
from google.colab import userdata

os.environ['KAGGLE_USERNAME'] = userdata.get('KAGGLE_USERNAME')
os.environ['KAGGLE_KEY']      = userdata.get('KAGGLE_KEY')

!pip install -q kagglehub
import kagglehub

print("Downloading dataset...")
raw_dataset_path = kagglehub.dataset_download(
    "tawsifurrahman/covid19-radiography-database"
)
print("Downloaded to:", raw_dataset_path)
```

### Cell 2 — Restructure folders
```python
import shutil, glob, random, os

DATASET_PATH = '/content/dataset'
train_dir = os.path.join(DATASET_PATH, 'train')
test_dir  = os.path.join(DATASET_PATH, 'test')

classes_map = {
    'Normal':          'Normal',
    'COVID':           'COVID',
    'Viral Pneumonia': 'Pneumonia',
    'Lung_Opacity':    'Lung Opacity',
}

for split in ['train', 'test']:
    for cls in classes_map.values():
        os.makedirs(os.path.join(DATASET_PATH, split, cls), exist_ok=True)

base_search_dir = os.path.join(raw_dataset_path, 'COVID-19_Radiography_Dataset')
if not os.path.exists(base_search_dir):
    base_search_dir = raw_dataset_path

random.seed(42)
PER_CLASS_CAP = 3000  # Raised from 1500 for better accuracy

for raw_class, target_class in classes_map.items():
    images = glob.glob(os.path.join(base_search_dir, raw_class, 'images', '*.png'))
    if not images:
        images = glob.glob(os.path.join(base_search_dir, raw_class, '*.png'))

    random.shuffle(images)
    images = images[:PER_CLASS_CAP]
    split_idx = int(len(images) * 0.8)

    for img in images[:split_idx]:
        shutil.copy(img, os.path.join(train_dir, target_class, os.path.basename(img)))
    for img in images[split_idx:]:
        shutil.copy(img, os.path.join(test_dir, target_class, os.path.basename(img)))

    print(f"{raw_class:20s} -> {target_class:15s}: {split_idx} train / {len(images)-split_idx} val")
```

### Cell 3 — Imports
```python
import tensorflow as tf
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.applications.resnet50 import preprocess_input
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import ModelCheckpoint, ReduceLROnPlateau

IMG_SIZE   = (224, 224)
BATCH_SIZE = 32
EPOCHS     = 15
NUM_CLASSES = 4

print(f"TF {tf.__version__} | GPU: {bool(tf.config.list_physical_devices('GPU'))}")
```

### Cell 4 — Data generators (FIXED preprocessing)
```python
# KEY FIX: Use preprocessing_function=preprocess_input instead of rescale=1./255
# ResNet-50 ImageNet weights require preprocess_input (mean subtraction + BGR)
# Using rescale=1./255 causes 25% uniform predictions (model never learns)

train_datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input,   # ← CORRECT for ResNet50
    rotation_range=15,
    zoom_range=0.15,
    width_shift_range=0.1,
    height_shift_range=0.1,
    horizontal_flip=True,
    shear_range=0.1,
)
test_datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input,   # ← same at inference
)

train_generator = train_datagen.flow_from_directory(
    train_dir,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
)
validation_generator = test_datagen.flow_from_directory(
    test_dir,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
)

print("Class indices (label order):", train_generator.class_indices)
```

✅ Expected: `Found ~9600 images belonging to 4 classes`

### Cell 5 — Build model
```python
print("Building ResNet-50 (downloading ImageNet weights ~100 MB)...")

base_model = ResNet50(weights='imagenet', include_top=False,
                      input_shape=(*IMG_SIZE, 3))

# Freeze all backbone layers
base_model.trainable = False

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(512, activation='relu')(x)
x = Dropout(0.4)(x)
predictions = Dense(NUM_CLASSES, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=predictions)
model.compile(
    optimizer=Adam(learning_rate=1e-3),
    loss='categorical_crossentropy',
    metrics=['accuracy'],
)

trainable = sum(tf.keras.backend.count_params(w) for w in model.trainable_weights)
print(f"Trainable params: {trainable:,} (head only — backbone frozen)")
```

### Cell 6 — Train (Phase 1: head only)
```python
checkpoint = ModelCheckpoint(
    'xray_classifier.h5', monitor='val_accuracy',
    verbose=1, save_best_only=True, mode='max',
)
reduce_lr = ReduceLROnPlateau(
    monitor='val_loss', factor=0.3, patience=2, min_lr=1e-6, verbose=1,
)

print("Phase 1: Training classification head (backbone frozen)...")
history = model.fit(
    train_generator,
    epochs=EPOCHS,
    validation_data=validation_generator,
    callbacks=[checkpoint, reduce_lr],
)

best_val_acc = max(history.history['val_accuracy'])
print(f"\nPhase 1 best val_accuracy: {best_val_acc:.4f}  ({best_val_acc*100:.1f}%)")
```

⏱ Expected: ~2-3 min/epoch × 15 = 30-45 min. Should reach **85-94% val_accuracy**.
First epoch ~40% (random init) → steadily improves.

### Cell 7 — Fine-tune (Phase 2: unfreeze last 30 layers)
```python
# Unfreeze last 30 layers of ResNet-50 for fine-tuning
for layer in base_model.layers[-30:]:
    layer.trainable = True

# Lower LR for fine-tuning to avoid destroying pretrained features
model.compile(
    optimizer=Adam(learning_rate=1e-5),
    loss='categorical_crossentropy',
    metrics=['accuracy'],
)

print("Phase 2: Fine-tuning last 30 layers of ResNet-50...")
history2 = model.fit(
    train_generator,
    epochs=5,
    validation_data=validation_generator,
    callbacks=[checkpoint, reduce_lr],
)

best_val_acc2 = max(history2.history['val_accuracy'])
print(f"\nPhase 2 best val_accuracy: {best_val_acc2:.4f}  ({best_val_acc2*100:.1f}%)")
print("WRITE THIS NUMBER DOWN — goes on your resume!")
```

### Cell 8 — Confusion matrix (for resume)
```python
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix

validation_generator.reset()
y_pred_probs = model.predict(validation_generator, verbose=1)
y_pred = np.argmax(y_pred_probs, axis=1)
y_true = validation_generator.classes
class_names = list(train_generator.class_indices.keys())

print("\nConfusion Matrix:")
print(confusion_matrix(y_true, y_pred))
print("\nClassification Report:")
print(classification_report(y_true, y_pred, target_names=class_names))
```

### Cell 9 — Save class_names + download
```python
import json
from google.colab import files

class_names = list(train_generator.class_indices.keys())
print("Final class order:", class_names)

with open('class_names.json', 'w') as f:
    json.dump(class_names, f)

files.download('xray_classifier.h5')
files.download('class_names.json')
```

---

## Part D — Drop model into ML server

1. Move `xray_classifier.h5` → `ml_server/models/`
2. Move `class_names.json` → `ml_server/models/`
3. `ml_server/.env` → `USE_REAL_MODEL=1`
4. Restart uvicorn

---

## Part E — Numbers for resume

- [ ] Phase 1 best `val_accuracy`
- [ ] Phase 2 best `val_accuracy` (after fine-tuning)
- [ ] Per-class F1 scores from confusion matrix
- [ ] Dataset size (train + val)
- [ ] Architecture: ResNet-50 + GAP + Dense 512 + Dropout 0.4 + softmax 4
