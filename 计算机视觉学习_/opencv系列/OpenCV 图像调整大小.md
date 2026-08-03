# OpenCV 图像调整大小

图像调整大小是计算机视觉中的基础操作，用于改变图像分辨率或裁剪图像区域。

## 图像缩放

使用 `cv2.resize()` 改变图像尺寸。

```python
import cv2
import os

img = cv2.imread(os.path.join(".", "img.png"))

# 缩放到指定尺寸 (宽度, 高度)
resized_img = cv2.resize(img, (400, 400))

# 或者按比例缩放
scale_percent = 50  # 缩放50%
width = int(img.shape[1] * scale_percent / 100)
height = int(img.shape[0] * scale_percent / 100)
resized_img = cv2.resize(img, (width, height))

cv2.imshow("Original", img)
cv2.imshow("Resized", resized_img)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

### `cv2.resize()` 参数

| 参数 | 说明 |
|------|------|
| `src` | 输入图像 |
| `dsize` | 输出尺寸 `(width, height)` |
| `fx, fy` | 缩放因子（与 dsize 二选一） |
| `interpolation` | 插值方法 |

### 插值方法

| 方法 | 常量 | 适用场景 |
|------|------|----------|
| 最近邻 | `cv2.INTER_NEAREST` | 快速但质量低 |
| 双线性 | `cv2.INTER_LINEAR` | 默认，平衡速度和质量 |
| 双三次 | `cv2.INTER_CUBIC` | 质量好但较慢 |
| Lanczos | `cv2.INTER_LANCZOS4` | 高质量缩放 |

---

## 图像裁剪

通过数组切片直接裁剪图像区域。

```python
img = cv2.imread("image.png")

# 裁剪: img[上:下, 左:右]
cropped_img = img[0:200, 0:500]  # 高度200, 宽度500

cv2.imshow("Cropped", cropped_img)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

### 裁剪坐标说明

```
原点(0,0) ────────────────────→ X轴(宽度)
    │
    │   ┌─────────────────┐
    │   │  裁剪区域        │
    │   │  [y1:y2, x1:x2] │
    │   └─────────────────┘
    │
    ↓
  Y轴(高度)
```

---

## 视频帧调整

从摄像头捕获并调整帧大小。

```python
ved = cv2.VideoCapture(0)

while True:
    ret, frame = ved.read()
    if not ret:
        break
    
    # 调整帧大小
    frame = cv2.resize(frame, (600, 600))
    cv2.imshow("frame", frame)
    
    if cv2.waitKey(1) & 0xff == ord('q'):
        break

ved.release()
cv2.destroyAllWindows()
```

---

## 调整大小的注意事项

| 情况 | 建议 |
|------|------|
| **缩小图像** | 先模糊再缩放，避免锯齿 |
| **放大图像** | 使用高质量插值（INTER_CUBIC 或 INTER_LANCZOS4） |
| **保持宽高比** | 计算缩放比例时保持原始比例 |
| **实时处理** | 使用 INTER_NEAREST 或 INTER_LINEAR 保证速度 |
