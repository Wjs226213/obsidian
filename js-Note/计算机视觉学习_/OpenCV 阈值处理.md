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

---

## 3. 阈值批量测试（Matplotlib 可视化）

使用 Matplotlib 批量测试不同阈值效果，快速找到最佳阈值。

```python
import cv2
import matplotlib.pyplot as plt
import numpy as np

# 设置中文字体
plt.rcParams['font.sans-serif'] = ['SimHei']
plt.rcParams['axes.unicode_minus'] = False

# 读取图片（灰度图）
img = cv2.imread("img_3.png", 0)

# 设置参数
threshold_start = 50    # 起始阈值
threshold_end = 230     # 结束阈值
threshold_step = 5      # 间隔

# 计算阈值范围
thresholds = range(threshold_start, threshold_end + 1, threshold_step)
num_images = len(thresholds)

# 计算网格布局
cols = 6  # 每行显示 6 张
rows = (num_images + cols - 1) // cols

# 创建画布
fig, axes = plt.subplots(rows, cols, figsize=(20, 4 * rows))
fig.suptitle(f"阈值测试：{threshold_start} ~ {threshold_end}，间隔 {threshold_step}",
             fontsize=16, y=0.98)

# 遍历阈值，生成二值化图像
for i, thresh_val in enumerate(thresholds):
    row = i // cols
    col = i % cols

    # 二值化
    ret, thresh_img = cv2.threshold(img, thresh_val, 255, cv2.THRESH_BINARY)

    # 显示
    axes[row, col].imshow(thresh_img, cmap='gray')
    axes[row, col].set_title(f"阈值 = {thresh_val}", fontsize=10)
    axes[row, col].axis('off')

# 隐藏多余的子图
for i in range(num_images, rows * cols):
    row = i // cols
    col = i % cols
    axes[row, col].axis('off')

# 调整布局并显示
plt.tight_layout()
plt.show()
```

### 参数说明

| 参数 | 说明 |
|------|------|
| `threshold_start` | 起始阈值（建议从 50 开始） |
| `threshold_end` | 结束阈值（建议到 230） |
| `threshold_step` | 步长（5 为常用值） |
| `cols` | 每行显示的图片数量 |

### 使用技巧

1. **批量测试**: 一次测试多个阈值，快速对比效果
2. **可视化**: 用 Matplotlib 网格展示，直观比较
3. **自动布局**: 根据图片数量自动计算行数
4. **隐藏空位**: 多余的子图位置自动隐藏

### 适用场景

- 需要选择最佳阈值时
- 图像对比度不明确时
- 批量处理多张图像前的参数调优
