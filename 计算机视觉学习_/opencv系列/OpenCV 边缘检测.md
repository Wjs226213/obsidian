# OpenCV 边缘检测

边缘检测用于找出图像中亮度变化剧烈的区域，是图像处理和计算机视觉的基础操作。

## Canny 边缘检测

Canny 是最常用的边缘检测算法，原理是找出灰度图上"亮度变化最剧烈"的地方。

```python
import cv2
import numpy as np

img = cv2.imread("image.jpg")

# Canny 边缘检测
# 参数: 输入图像, 低阈值, 高阈值
# 低于低阈值的不是边缘，高于高阈值的是边缘，之间的看是否与高阈值相连
canny_edges = cv2.Canny(img, 10, 200)

cv2.imshow("Original", img)
cv2.imshow("Canny Edges", canny_edges)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

### Canny 算法原理

1. **灰度化**: 先将图像转为灰度图
2. **高斯滤波**: 平滑图像，去除噪声
3. **计算梯度**: 用 Sobel 算子计算梯度幅值和方向
4. **非极大值抑制**: 细化边缘，只保留梯度方向上的最大值
5. **双阈值检测**: 用高阈值和低阈值确定强边缘和弱边缘
6. **边缘连接**: 弱边缘如果与强边缘相连则保留

### 阈值选择

| 阈值组合 | 效果 |
|----------|------|
| 低阈值小，高阈值大 | 检测到更多边缘，可能有噪声 |
| 低阈值大，高阈值小 | 检测到更少边缘，更干净 |
| 常用比例 | 高阈值 : 低阈值 ≈ 3:1 或 2:1 |

---

## 形态学操作：膨胀与腐蚀

边缘检测后常配合形态学操作增强或细化边缘。

### 膨胀（Dilate）

使边缘变粗，连接断裂的边缘。

```python
# 参数: 输入图像, 结构元素(核)
kernel = np.ones((2, 2), np.uint8)
dilated = cv2.dilate(canny_edges, kernel)
```

### 腐蚀（Erode）

使边缘变细，去除细小噪声。

```python
eroded = cv2.erode(dilated, kernel)
```

### 完整流程示例

```python
import cv2
import numpy as np

img = cv2.imread("image.jpg")

# 1. Canny 边缘检测
canny_edges = cv2.Canny(img, 10, 200)

# 2. 膨胀：连接断裂的边缘
kernel = np.ones((2, 2), np.uint8)
dilated = cv2.dilate(canny_edges, kernel)

# 3. 腐蚀：去除细小噪声
eroded = cv2.erode(dilated, kernel)

cv2.imshow("Original", img)
cv2.imshow("Canny", canny_edges)
cv2.imshow("Dilated", dilated)
cv2.imshow("Eroded", eroded)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

---

## 其他边缘检测方法

### Sobel 算子

```python
# 计算 x 方向梯度
sobel_x = cv2.Sobel(img, cv2.CV_64F, 1, 0, ksize=3)

# 计算 y 方向梯度
sobel_y = cv2.Sobel(img, cv2.CV_64F, 0, 1, ksize=3)

# 合并梯度
sobel = cv2.magnitude(sobel_x, sobel_y)
```

### Laplacian 算子

```python
laplacian = cv2.Laplacian(img, cv2.CV_64F)
```

---

## 方法对比

| 方法 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| Canny | 效果好，双阈值抑制噪声 | 计算量较大 | 通用边缘检测 |
| Sobel | 计算快，对噪声有一定容忍 | 边缘较粗 | 实时处理 |
| Laplacian | 对细节敏感 | 噪声敏感 | 需要精细边缘 |

---

## 常用函数速查

| 函数 | 用途 |
|------|------|
| `cv2.Canny()` | Canny 边缘检测 |
| `cv2.Sobel()` | Sobel 梯度计算 |
| `cv2.Laplacian()` | Laplacian 边缘检测 |
| `cv2.dilate()` | 膨胀操作 |
| `cv2.erode()` | 腐蚀操作 |
