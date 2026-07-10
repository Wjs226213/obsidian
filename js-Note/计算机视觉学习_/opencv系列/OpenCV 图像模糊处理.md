# OpenCV 图像模糊处理

图像模糊（平滑）是通过对每个像素及其邻域像素进行计算来去除噪声、使图像特征更平滑的技术。

## 均值模糊 (Mean Blur)

最简单的模糊方法，计算邻域内所有像素的平均值。

```python
import cv2

kernel = 5  # 核大小

img = cv2.imread("image.png")

# 均值模糊
blur_img = cv2.blur(img, (kernel, kernel))

cv2.imshow("original", img)
cv2.imshow("blurred", blur_img)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

### `cv2.blur()` 参数

| 参数 | 说明 |
|------|------|
| `src` | 输入图像 |
| `ksize` | 核大小，如 `(5, 5)` |

---

## 高斯模糊 (Gaussian Blur)

使用高斯核进行加权平均，中心像素权重更大，效果更自然。

```python
# 高斯模糊
# 参数: 图像, 核大小, 标准差(0表示自动计算)
gass = cv2.GaussianBlur(img, (kernel, kernel), 0)

cv2.imshow("gass", gass)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

### `cv2.GaussianBlur()` 参数

| 参数 | 说明 |
|------|------|
| `src` | 输入图像 |
| `ksize` | 高斯核大小（必须为奇数） |
| `sigmaX` | X方向的标准差，0表示自动计算 |

---

## 中值模糊 (Median Blur)

取邻域内所有像素的中值，对去除椒盐噪声特别有效。

```python
# 中值模糊
# 参数: 图像, 核大小（必须为奇数）
median_blur_img = cv2.medianBlur(img, kernel)

cv2.imshow("median_image_", median_blur_img)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

### `cv2.medianBlur()` 参数

| 参数 | 说明 |
|------|------|
| `src` | 输入图像 |
| `ksize` | 核大小（必须为奇数） |

---

## 模糊方法对比

| 方法 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **均值模糊** | 计算简单、速度快 | 边缘模糊严重 | 快速去噪 |
| **高斯模糊** | 保留更多边缘信息 | 计算量稍大 | 通用去噪、预处理 |
| **中值模糊** | 去除椒盐噪声效果好 | 对高斯噪声效果一般 | 椒盐噪声去除 |

---

## 核大小的影响

- **核越小**: 模糊程度低，保留更多细节
- **核越大**: 模糊程度高，噪声去除更彻底，但细节丢失

常用核大小: `3x3`, `5x5`, `7x7`（必须为奇数）
