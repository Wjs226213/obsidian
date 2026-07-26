# OpenCV 轮廓处理

轮廓是图像中连续的点组成的曲线，常用于形状检测、目标分割、面积计算等。

## 基础轮廓检测

```python
import cv2 as cv
import numpy as np

img = cv.imread("image.jpg")
gray_img = cv.cvtColor(img, cv.COLOR_BGR2GRAY)
```

### 二值化处理

轮廓检测前需要先进行二值化处理。

```python
# 手动阈值二值化
ret, thresh = cv.threshold(gray_img, 127, 255, cv.THRESH_BINARY)

# 对于目标颜色是黑色的图像，使用反转二值化
ret, thresh_inv = cv.threshold(gray_img, 127, 255, cv.THRESH_BINARY_INV)
```

---

## 查找轮廓

```python
# 参数: 输入图像, 轮廓检索模式, 轮廓近似方法
contours, hierarchy = cv.findContours(
    thresh, 
    cv.RETR_TREE,      # 检索所有轮廓并建立层级关系
    cv.CHAIN_APPROX_SIMPLE  # 只保留端点（压缩水平、垂直、对角线段）
)
```

### 轮廓检索模式

| 模式 | 说明 |
|------|------|
| `cv.RETR_EXTERNAL` | 只检测最外层轮廓 |
| `cv.RETR_LIST` | 检测所有轮廓，不建立层级关系 |
| `cv.RETR_TREE` | 检测所有轮廓，建立完整层级关系 |
| `cv.RETR_CCOMP` | 检测所有轮廓，建立2层层级关系 |

### 轮廓近似方法

| 方法 | 说明 |
|------|------|
| `cv.CHAIN_APPROX_NONE` | 保存所有轮廓点 |
| `cv.CHAIN_APPROX_SIMPLE` | 压缩轮廓，只保留端点 |

---

## 绘制轮廓

```python
# 绘制所有轮廓
cv.drawContours(img, contours, -1, (0, 255, 0), 2)

# 绘制单个轮廓
cv.drawContours(img, contours, 0, (0, 255, 0), 2)
```

### `cv.drawContours()` 参数说明

| 参数 | 说明 |
|------|------|
| `image` | 目标图像 |
| `contours` | 轮廓列表 |
| `contourIdx` | 轮廓索引（-1表示绘制所有） |
| `color` | 轮廓颜色 (BGR) |
| `thickness` | 线宽（-1为填充） |

---

## 轮廓特征计算

### 面积与周长

```python
for cnt in contours:
    # 计算面积
    area = cv.contourArea(cnt)
    
    # 计算周长
    perimeter = cv.arcLength(cnt, True)  # True表示闭合曲线
    
    print(f"面积: {area}, 周长: {perimeter}")
```

### 边界矩形

```python
for cnt in contours:
    if cv.contourArea(cnt) > 200:  # 过滤小轮廓
        # 获取边界矩形
        x, y, w, h = cv.boundingRect(cnt)
        
        # 绘制矩形
        cv.rectangle(img, (x, y), (x + w, y + h), (180, 50, 180), 2)
```

### 旋转边界矩形

```python
for cnt in contours:
    # 获取旋转矩形
    rect = cv.minAreaRect(cnt)
    box = cv.boxPoints(rect)
    box = np.int0(box)
    
    cv.drawContours(img, [box], 0, (0, 0, 255), 2)
```

### 圆形拟合

```python
for cnt in contours:
    (x, y), radius = cv.minEnclosingCircle(cnt)
    center = (int(x), int(y))
    radius = int(radius)
    cv.circle(img, center, radius, (255, 0, 0), 2)
```

---

## 完整示例

```python
import cv2 as cv
import numpy as np

img = cv.imread("image.jpg")
gray_img = cv.cvtColor(img, cv.COLOR_BGR2GRAY)

# 二值化
ret, thresh = cv.threshold(gray_img, 127, 255, cv.THRESH_BINARY_INV)

# 查找轮廓
contours, hierarchy = cv.findContours(
    thresh, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE
)

# 绘制轮廓和边界框
for cnt in contours:
    if cv.contourArea(cnt) > 200:
        # 绘制轮廓（绿色）
        cv.drawContours(img, cnt, -1, (0, 255, 0), 2)
        
        # 绘制边界矩形（紫色）
        x1, y1, w, h = cv.boundingRect(cnt)
        cv.rectangle(img, (x1, y1), (x1 + w, y1 + h), (180, 50, 180), 2)

cv.imshow("Original", img)
cv.imshow("Threshold", thresh)
cv.waitKey(0)
cv.destroyAllWindows()
```

---

## 常用函数速查

| 函数 | 用途 |
|------|------|
| `cv.findContours()` | 查找轮廓 |
| `cv.drawContours()` | 绘制轮廓 |
| `cv.contourArea()` | 计算轮廓面积 |
| `cv.arcLength()` | 计算轮廓周长 |
| `cv.boundingRect()` | 获取边界矩形 |
| `cv.minAreaRect()` | 获取旋转边界矩形 |
| `cv.minEnclosingCircle()` | 圆形拟合 |
