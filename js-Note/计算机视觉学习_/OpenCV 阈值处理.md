# OpenCV 阈值处理

## 手动阈值处理

使用 `cv2.threshold()` 手动设置阈值进行二值化处理。

```python
import cv2

# 读取图片并转为灰度图
img = cv2.imread("img_3.png")
gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# 手动设置阈值
# 参数: 灰度图, 阈值(200), 最大值(255), 阈值类型
ret, threshold_img = cv2.threshold(gray_img, 200, 255, cv2.THRESH_BINARY)

# 高斯模糊去噪
final_img = cv2.GaussianBlur(threshold_img, (3, 3), 0)

cv2.waitKey(0)
cv2.destroyAllWindows()
```

### `cv2.threshold()` 参数说明

| 参数 | 说明 |
|------|------|
| `src` | 输入的灰度图 |
| `thresh` | 阈值（0-255） |
| `maxval` | 像素值超过阈值时设置的最大值 |
| `type` | 阈值类型（`THRESH_BINARY` 等） |

### 阈值类型

- `cv2.THRESH_BINARY`: 超过阈值设为最大值，否则为0
- `cv2.THRESH_BINARY_INV`: 反向二值化
- `cv2.THRESH_TRUNC`: 截断阈值
- `cv2.THRESH_TOZERO`: 低于阈值设为0

---

## 自适应阈值处理

使用 `cv2.adaptiveThreshold()` 自动计算阈值，适用于光照不均匀的图像。

```python
# 自适应阈值
# 参数: 灰度图, 最大值, 自适应方法, 阈值类型, 块大小, 偏差值
threshold_img = cv2.adaptiveThreshold(
    gray_img, 
    255, 
    cv2.ADAPTIVE_THRESH_GAUSSIAN_C,  # 高斯加权
    cv2.THRESH_BINARY, 
    13,  # 块大小（必须为奇数）
    9    # 偏差值C
)

cv2.imshow("Threshold", threshold_img)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

### `cv2.adaptiveThreshold()` 参数说明

| 参数 | 说明 |
|------|------|
| `src` | 输入的灰度图 |
| `maxValue` | 像素值超过阈值时设置的最大值 |
| `adaptiveMethod` | 自适应方法（`GAUSSIAN_C` 或 `MEAN_C`） |
| `thresholdType` | 阈值类型 |
| `blockSize` | 计算阈值的邻域块大小（必须为奇数） |
| `C` | 从均值或加权均值中减去的常数 |

### 自适应方法

- `cv2.ADAPTIVE_THRESH_MEAN_C`: 邻域内像素平均值
- `cv2.ADAPTIVE_THRESH_GAUSSIAN_C`: 邻域内像素的高斯加权和

### 使用场景

- **手动阈值**: 适合光照均匀、对比度明显的图像
- **自适应阈值**: 适合光照不均匀、阴影较多的图像（如扫描文档）
