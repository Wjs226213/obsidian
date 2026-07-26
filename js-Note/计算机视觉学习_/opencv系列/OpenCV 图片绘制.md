# OpenCV 图片绘制

在图像上绘制几何图形和文字，常用于标注检测结果、绘制边界框等。

## 基础绘制函数

```python
import cv2
import numpy as np

# 创建空白画布
img = np.zeros((500, 500, 3), dtype=np.uint8)
```

### 绘制矩形

```python
# 参数: 图像, 左上角坐标, 右下角坐标, 颜色(BGR), 线宽(-1为填充)
cv2.rectangle(img, (50, 50), (450, 450), (0, 255, 0), 2)

# 填充矩形
cv2.rectangle(img, (100, 100), (200, 200), (255, 0, 0), -1)
```

### 绘制圆形

```python
# 参数: 图像, 圆心坐标, 半径, 颜色(BGR), 线宽(-1为填充)
cv2.circle(img, (250, 250), 100, (0, 0, 255), 5)
```

### 绘制直线

```python
# 参数: 图像, 起点, 终点, 颜色(BGR), 线宽
cv2.line(img, (0, 0), (500, 500), (255, 255, 0), 3)
```

### 绘制多边形

```python
# 定义顶点
pts = np.array([[100, 50], [200, 300], [50, 200]], np.int32)
pts = pts.reshape((-1, 1, 2))

# 参数: 图像, 顶点数组, 是否闭合, 颜色, 线宽
cv2.polylines(img, [pts], True, (0, 255, 255), 2)
```

---

## 添加文字

```python
# 参数: 图像, 文字, 起始坐标, 字体, 字号, 颜色(BGR), 线宽
cv2.putText(img, "Hello, OpenCV!", (50, 100),
            cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 255, 0), 2)
```

### `cv2.putText()` 参数说明

| 参数 | 说明 |
|------|------|
| `img` | 输入图像 |
| `text` | 要绘制的字符串 |
| `org` | 文字左下角坐标 (x, y) |
| `fontFace` | 字体类型 |
| `fontScale` | 字体缩放比例 |
| `color` | 文字颜色 (BGR) |
| `thickness` | 字体粗细（线宽） |

### 常用字体

| 字体常量 | 说明 |
|----------|------|
| `cv2.FONT_HERSHEY_SIMPLEX` | 正常大小无衬线字体 |
| `cv2.FONT_HERSHEY_COMPLEX` | 正常大小有衬线字体 |
| `cv2.FONT_HERSHEY_TRIPLEX` | 正常大小有衬线字体（比COMPLEX更细） |
| `cv2.FONT_HERSHEY_DUPLEX` | 正常大小有衬线字体（比COMPLEX更粗） |

---

## 实际应用：标注检测结果

```python
import cv2

img = cv2.imread("image.jpg")

# 绘制检测框
x, y, w, h = 100, 100, 200, 150
cv2.rectangle(img, (x, y), (x + w, y + h), (0, 255, 0), 2)

# 添加标签
label = "Object: 0.95"
cv2.putText(img, label, (x, y - 10),
            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

cv2.imshow("Detection Result", img)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

---

## 常用函数速查

| 函数 | 用途 |
|------|------|
| `cv2.rectangle()` | 绘制矩形 |
| `cv2.circle()` | 绘制圆形 |
| `cv2.line()` | 绘制直线 |
| `cv2.polylines()` | 绘制多边形 |
| `cv2.putText()` | 添加文字 |
| `cv2.putText()` 中文显示 | 需要使用 PIL/Pillow 处理 |
