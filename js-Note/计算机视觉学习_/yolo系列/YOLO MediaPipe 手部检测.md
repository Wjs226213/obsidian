# YOLO + MediaPipe 手部检测

高性能机器视觉演示：结合 YOLO 目标检测和 MediaPipe 手部关键点检测。

## 项目概述

实时检测摄像头画面中的物体和手部关键点，通过多种优化手段提升性能。

### 主要优化策略

| 策略 | 说明 | 性能影响 |
|------|------|----------|
| 降低分辨率 | 处理 320x240 而非原始尺寸 | 显著提升 |
| 跳帧检测 | 每 N 帧检测一次，复用结果 | 显著提升 |
| 降低置信度阈值 | YOLO 从 0.5 降到 0.3 | 检测率提升 |
| 轻量 MediaPipe | `model_complexity=0` | 显著提升 |

---

## 配置参数

```python
# YOLO 配置
YOLO_MODEL = 'yolov8n.pt'  # 使用轻量级 nano 模型
YOLO_CONFIDENCE = 0.3       # 置信度阈值

# 性能配置
WINDOW_WIDTH = 640           # 窗口宽度
WINDOW_HEIGHT = 480          # 窗口高度
SKIP_FRAMES = 2             # 跳过帧数

# MediaPipe 配置
MP_DETECTION_CONF = 0.5     # 检测置信度
MP_TRACKING_CONF = 0.5      # 跟踪置信度
MAX_HANDS = 2               # 最大手部数量
```

---

## YOLO 初始化

```python
from ultralytics import YOLO
import torch

def init_yolo(model_path):
    """初始化 YOLO（使用 GPU 加速）"""
    model = YOLO(model_path)
    
    # 尝试使用 GPU
    if torch.cuda.is_available():
        model.to('cuda')
        print("[INFO] YOLO 使用 GPU 加速")
    else:
        print("[INFO] YOLO 使用 CPU 模式")
    
    return model
```

---

## MediaPipe 初始化

```python
import mediapipe as mp

def init_mediapipe():
    """初始化 MediaPipe（降低精度提高速度）"""
    mp_hands = mp.solutions.hands
    mp_drawing = mp.solutions.drawing_utils
    
    hands = mp_hands.Hands(
        static_image_mode=False,        # 视频模式（跟踪）
        max_num_hands=MAX_HANDS,
        min_detection_confidence=MP_DETECTION_CONF,
        min_tracking_confidence=MP_TRACKING_CONF,
        model_complexity=0              # 轻量模型
    )
    
    return hands, mp_drawing
```

### MediaPipe 参数说明

| 参数 | 说明 |
|------|------|
| `static_image_mode` | False=跟踪模式（更快），True=检测模式 |
| `model_complexity` | 0=轻量（最快），1=完整（准确） |
| `min_detection_confidence` | 检测置信度阈值 |
| `min_tracking_confidence` | 跟踪置信度阈值 |

---

## 帧处理流程

```python
def process_frame(frame, yolo_model, hands, mp_drawing):
    """处理单帧（优化版）"""
    # 1. 缩小处理尺寸
    small_frame = cv2.resize(frame, (320, 240))
    rgb_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
    
    # 2. YOLO 目标检测（在小图上）
    results = yolo_model(small_frame, verbose=False, conf=YOLO_CONFIDENCE)
    
    # 3. 坐标映射回原始尺寸
    scale_x = frame.shape[1] / 320
    scale_y = frame.shape[0] / 240
    
    for result in results:
        for box in result.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            # 映射坐标
            x1, y1 = int(x1 * scale_x), int(y1 * scale_y)
            x2, y2 = int(x2 * scale_x), int(y2 * scale_y)
            
            # 绘制检测框
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 1)
    
    # 4. MediaPipe 手部检测
    hand_results = hands.process(rgb_frame)
    if hand_results.multi_hand_landmarks:
        for hand_landmarks in hand_results.multi_hand_landmarks:
            # 绘制关键点
            for lm in hand_landmarks.landmark:
                x, y = int(lm.x * w), int(lm.y * h)
                cv2.circle(frame, (x, y), 2, (255, 0, 0), -1)
    
    return frame
```

---

## 性能优化技巧

### 1. 分辨率优化

```python
# 原始分辨率: 640x480 = 307,200 像素
# 优化后: 320x240 = 76,800 像素（减少 75%）
small_frame = cv2.resize(frame, (320, 240))
```

### 2. 跳帧检测

```python
frame_count = 0
processed_frame = None

while True:
    ret, frame = cap.read()
    frame_count += 1
    
    # 每 N 帧检测一次
    if frame_count % SKIP_FRAMES == 0:
        processed_frame = process_frame(frame, ...)
    elif processed_frame is not None:
        frame = processed_frame  # 复用上一帧结果
```

### 3. 坐标映射

```python
# 检测在小图上进行，绘制在原图上
scale_x = frame.shape[1] / 320
scale_y = frame.shape[0] / 240

# 小图坐标 → 原图坐标
x1_orig = int(x1_small * scale_x)
y1_orig = int(y1_small * scale_y)
```

---

## 依赖安装

```bash
pip install opencv-python
pip install mediapipe
pip install ultralytics
pip install torch  # GPU 加速（可选）
```

---

## 常见问题

| 问题 | 解决方案 |
|------|----------|
| 检测帧率低 | 增大 `SKIP_FRAMES`，降低分辨率 |
| 检测不到物体 | 降低 `YOLO_CONFIDENCE` |
| 手部检测不稳定 | 降低 `MP_TRACKING_CONF` |
| GPU 未使用 | 安装 CUDA 版 PyTorch |
