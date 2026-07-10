 # YOLO + MediaPipe 手部检测

结合 YOLO 目标检测和 MediaPipe 手部关键点检测的高性能方案。

## 项目结构

- `app.py` - 主程序
- `yolov8n.pt` - YOLO 模型权重

---

## 1. 性能配置参数

```python
# 视频配置
CAMERA_INDEX = 0
WINDOW_WIDTH = 640
WINDOW_HEIGHT = 480

# 性能优化关键参数
SKIP_FRAMES = 2          # 跳过帧数（越大越快，但检测越不连续）
YOLO_CONFIDENCE = 0.3    # YOLO 置信度阈值（降低提高检测率）

# MediaPipe 配置
MP_DETECTION_CONF = 0.5  # 检测置信度
MP_TRACKING_CONF = 0.5   # 跟踪置信度
MAX_HANDS = 2            # 最大检测手数
```

### 性能优化策略

| 参数                   | 作用     | 权衡              |
| -------------------- | ------ | --------------- |
| `SKIP_FRAMES`        | 跳过帧检测  | 值越大速度越快，但检测不连续  |
| `YOLO_CONFIDENCE`    | 降低检测阈值 | 检测更多但可能误检       |
| `model_complexity=0` | 使用轻量模型 | 速度最快，精度略降       |
| 降低处理分辨率              | 缩小处理尺寸 | 速度提升，但坐标需映射回原尺寸 |

---

## 2. YOLO 初始化

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

### GPU 加速检测

- 优先使用 CUDA GPU
- 自动回退到 CPU 模式
- PyTorch 版本需支持 CUDA

---

## 3. MediaPipe 手部检测初始化

```python
import mediapipe as mp

def init_mediapipe():
    """初始化 MediaPipe（降低精度提高速度）"""
    mp_hands = mp.solutions.hands
    mp_drawing = mp.solutions.drawing_utils
    mp_drawing_styles = mp.solutions.drawing_styles

    hands = mp_hands.Hands(
        static_image_mode=False,      # 视频模式（连续跟踪）
        max_num_hands=MAX_HANDS,      # 最大手数
        min_detection_confidence=MP_DETECTION_CONF,
        min_tracking_confidence=MP_TRACKING_CONF,
        model_complexity=0            # 0=轻量模型（最快）
    )
    
    return hands, mp_drawing, mp_drawing_styles
```

### MediaPipe 参数说明

| 参数 | 说明 |
|------|------|
| `static_image_mode` | False=视频模式，True=图片模式 |
| `max_num_hands` | 最大检测手数 |
| `min_detection_confidence` | 检测置信度阈值 |
| `min_tracking_confidence` | 跟踪置信度阈值 |
| `model_complexity` | 模型复杂度（0=轻量，1=全模型） |

---

## 4. 帧处理流程

### 4.1 降低处理分辨率

```python
def process_frame(frame, yolo_model, hands, mp_drawing, mp_drawing_styles):
    """处理单帧（优化版）"""
    # 缩小处理尺寸（加快速度）
    small_frame = cv2.resize(frame, (320, 240))
    rgb_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
```

### 4.2 YOLO 检测

```python
    # ========== YOLO 检测（使用小尺寸图片） ==========
    results = yolo_model(small_frame, verbose=False, conf=YOLO_CONFIDENCE)

    # 将检测结果映射回原始尺寸
    scale_x = frame.shape[1] / 320
    scale_y = frame.shape[0] / 240

    for result in results:
        for box in result.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            # 放大到原始尺寸
            x1, y1, x2, y2 = int(x1 * scale_x), int(y1 * scale_y), int(x2 * scale_x), int(y2 * scale_y)
            conf = float(box.conf[0])
            
            if conf > YOLO_CONFIDENCE:
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 1)
                label = f'{result.names[int(box.cls[0])]}: {conf:.2f}'
                cv2.putText(frame, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 0), 1)
```

### 4.3 MediaPipe 手部检测

```python
    # ========== MediaPipe 手部检测（只在小图上检测） ==========
    hand_results = hands.process(rgb_frame)
    
    if hand_results.multi_hand_landmarks:
        for hand_landmarks in hand_results.multi_hand_landmarks:
            # 放大关键点到原始尺寸
            h, w = frame.shape[:2]
            landmarks = []
            for lm in hand_landmarks.landmark:
                landmarks.append((int(lm.x * w), int(lm.y * h)))

            # 绘制关键点
            for i, (x, y) in enumerate(landmarks):
                cv2.circle(frame, (x, y), 2, (255, 0, 0), -1)
            
            # 绘制连接线
            connections = mp.solutions.hands.HAND_CONNECTIONS
            for connection in connections:
                idx1, idx2 = connection
                cv2.line(frame, landmarks[idx1], landmarks[idx2], (0, 255, 255), 1)
    
    return frame
```

---

## 5. 主循环与帧跳过

```python
def main():
    frame_count = 0
    processed_frame = None
    prev_time = time.time()

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.flip(frame, 1)  # 镜像翻转
        frame_count += 1

        # 只在指定帧执行检测
        if frame_count % SKIP_FRAMES == 0:
            processed_frame = process_frame(
                frame, yolo_model, hands,
                mp_drawing, mp_drawing_styles
            )
        elif processed_frame is not None:
            # 复用上一帧的检测结果（解决画面空白问题）
            frame = processed_frame

        # FPS 计算
        curr_time = time.time()
        fps = 1 / (curr_time - prev_time + 0.001)
        prev_time = curr_time
        
        cv2.putText(frame, f'FPS: {int(fps)}', (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
```

### 帧跳过策略

- 每 `SKIP_FRAMES` 帧执行一次检测
- 中间帧复用上一帧检测结果
- 避免画面空白，保持视觉连续性

---

## 6. 坐标映射

关键点：小尺寸检测 → 大尺寸显示

```python
# 计算缩放比例
scale_x = frame.shape[1] / 320   # 原始宽度 / 处理宽度
scale_y = frame.shape[0] / 240   # 原始高度 / 处理高度

# YOLO 边界框映射
x1 = int(x1 * scale_x)
y1 = int(y1 * scale_y)

# MediaPipe 关键点映射
landmarks.append((int(lm.x * w), int(lm.y * h)))
```

---

## 7. 性能对比

| 配置 | FPS | 检测效果 |
|------|-----|----------|
| 原始分辨率 + 每帧检测 | ~10 | 最准确 |
| 降低分辨率 + 跳帧=2 | ~25 | 平衡 |
| 降低分辨率 + 跳帧=4 | ~40 | 最快但不连续 |

---

## 8. 常见问题

### Q: 为什么检测结果有延迟？
A: `SKIP_FRAMES` 值过大，或 `model_complexity=0` 导致精度下降。

### Q: GPU 加速不生效？
A: 检查 PyTorch CUDA 支持：`torch.cuda.is_available()`。

### Q: 手部关键点检测不到？
A: 降低 `min_detection_confidence` 和 `min_tracking_confidence`。

### Q: 画面闪烁？
A: 确保 `elif processed_frame is not None:` 逻辑正确，复用上一帧结果。