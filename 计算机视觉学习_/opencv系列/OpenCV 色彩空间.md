# OpenCV 色彩空间

色彩空间是描述颜色的数学模型，不同色彩空间适用于不同的图像处理任务。

## 常见色彩空间转换

```python
import cv2
import numpy as np
import os

img = cv2.imread(os.path.join(".", "img_2.png"))
img = cv2.resize(img, (400, 400))
```

### BGR → 灰度图

```python
img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
cv2.imshow("img_gray", img_gray)
```

**用途**: 简化图像处理、减少计算量、用于阈值处理

### BGR → RGB

```python
img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
cv2.imshow("img_rgb", img_rgb)
```

**用途**: OpenCV 默认读取为 BGR，显示时通常需要转为 RGB

### BGR → HSV

```python
img_hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV)
cv2.imshow("img_hsv", img_hsv)
```

**用途**: 颜色检测、颜色分割

---

## HSV 颜色空间详解

HSV 是一种把"颜色（H）"、"鲜艳度（S）"和"亮度（V）"分开描述的颜色格式。

| 通道 | 名称 | 范围 | 说明 |
|------|------|------|------|
| **H (Hue)** | 色相 | 0-179 | 颜色类型（红、绿、蓝等） |
| **S (Saturation)** | 饱和度 | 0-255 | 颜色纯度，值越高颜色越鲜艳 |
| **V (Value)** | 亮度 | 0-255 | 颜色明暗程度 |

### HSV 颜色范围参考

| 颜色 | H 范围 | S 范围 | V 范围 |
|------|--------|--------|--------|
| 红色 | 0-10, 156-179 | 43-255 | 46-255 |
| 橙色 | 11-25 | 43-255 | 46-255 |
| 黄色 | 26-34 | 43-255 | 46-255 |
| 绿色 | 35-85 | 43-255 | 46-255 |
| 蓝色 | 100-124 | 43-255 | 46-255 |

### HSV 应用示例：颜色检测

```python
import cv2
import numpy as np

img = cv2.imread("image.jpg")
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

# 定义红色范围
lower_red = np.array([0, 43, 46])
upper_red = np.array([10, 255, 255])

# 创建掩码
mask = cv2.inRange(hsv, lower_red, upper_red)

# 提取红色区域
result = cv2.bitwise_and(img, img, mask=mask)

cv2.imshow("Original", img)
cv2.imshow("Red Mask", mask)
cv2.imshow("Red Result", result)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

---

## 色彩空间转换总结

| 转换 | 函数 | 主要用途 |
|------|------|----------|
| BGR → Gray | `cv2.COLOR_BGR2GRAY` | 简化处理、边缘检测 |
| BGR → RGB | `cv2.COLOR_BGR2RGB` | 显示、与其他库兼容 |
| BGR → HSV | `cv2.COLOR_BGR2HSV` | 颜色检测、分割 |
| BGR → LAB | `cv2.COLOR_BGR2LAB` | 颜色相似度计算 |
| BGR → YCrCb | `cv2.COLOR_BGR2YCrCb` | 人脸检测 |
