# Tesseract OCR 文本检测

使用 Tesseract OCR 从图像中检测和识别文本，支持多种语言。

## 环境配置

### 安装 Tesseract

1. 下载安装包: https://github.com/UB-Mannheim/tesseract/wiki
2. 安装时勾选需要的语言包（如 English、Chinese）
3. 记录安装路径，如: `C:\Users\user\AppData\Local\Programs\Tesseract-OCR\tesseract.exe`

### 安装 Python 包

```bash
pip install pytesseract opencv-python
```

### 配置路径

```python
import pytesseract

# 指定 Tesseract 可执行文件路径
pytesseract.pytesseract.tesseract_cmd = r'C:\Users\user\AppData\Local\Programs\Tesseract-OCR\tesseract.exe'
```

---

## 基础文本检测

```python
import cv2
import pytesseract

# 读取图片
image = cv2.imread("image.jpg")
image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

# 检测文本（返回每个字符/单词的位置和内容）
data = pytesseract.image_to_data(image_rgb, output_type=pytesseract.Output.DICT)

# 在图片上画框
for i in range(len(data['text'])):
    if int(data['conf'][i]) > 30 and data['text'][i].strip():
        (x, y, w, h) = (data['left'][i], data['top'][i], 
                        data['width'][i], data['height'][i])
        cv2.rectangle(image, (x, y), (x + w, y + h), (0, 255, 0), 2)
        cv2.putText(image, data['text'][i], (x, y - 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)

cv2.imshow("Text Detection", image)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

### `image_to_data()` 返回字典

| 键 | 说明 |
|----|------|
| `text` | 检测到的文本 |
| `conf` | 置信度（-1表示未检测到） |
| `left` | 边界框左上角 x 坐标 |
| `top` | 边界框左上角 y 坐标 |
| `width` | 边界框宽度 |
| `height` | 边界框高度 |

---

## 简化文本提取

```python
# 只提取文本内容（不获取位置信息）
text = pytesseract.image_to_string(image_rgb, lang='eng')
print(text)
```

---

## 视频文本检测

### 逐帧检测并保存

```python
import cv2
import pytesseract
import os

video_path = "video.mp4"
cap = cv2.VideoCapture(video_path)

# 创建输出文件夹
output_dir = "detected_frames"
os.makedirs(output_dir, exist_ok=True)

frame_count = 0
save_interval = 30  # 每 30 帧保存一张

while True:
    ret, frame = cap.read()
    if not ret:
        break
    
    frame_count += 1
    
    # 只保存部分帧
    if frame_count % save_interval == 0:
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        data = pytesseract.image_to_data(frame_rgb, output_type=pytesseract.Output.DICT)
        
        # 画框
        for i in range(len(data['text'])):
            if int(data['conf'][i]) > 30 and data['text'][i].strip():
                (x, y, w, h) = (data['left'][i], data['top'][i],
                                data['width'][i], data['height'][i])
                cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
                cv2.putText(frame, data['text'][i], (x, y - 5),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
        
        # 保存图片
        output_path = os.path.join(output_dir, f"frame_{frame_count:06d}.jpg")
        cv2.imwrite(output_path, frame)

cap.release()
```

### 实时视频检测

```python
import cv2
import pytesseract

video_path = "video.mp4"
cap = cv2.VideoCapture(video_path)

# 获取视频信息
fps = cap.get(cv2.CAP_PROP_FPS)
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

# 创建输出视频
output_path = "output_with_boxes.mp4"
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

while True:
    ret, frame = cap.read()
    if not ret:
        break
    
    # 检测文本
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
    try:
        data = pytesseract.image_to_data(frame_rgb, lang='eng', 
                                         output_type=pytesseract.Output.DICT)
        
        detected_texts = []
        for i in range(len(data['text'])):
            if int(data['conf'][i]) > 30 and data['text'][i].strip():
                (x, y, w, h) = (data['left'][i], data['top'][i],
                                data['width'][i], data['height'][i])
                cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
                cv2.putText(frame, data['text'][i], (x, y - 5),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
                detected_texts.append(data['text'][i])
        
        # 显示检测到的文本
        if detected_texts:
            cv2.putText(frame, f"Texts: {', '.join(detected_texts[:3])}", 
                       (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
    
    except Exception as e:
        print(f"检测出错: {e}")
    
    out.write(frame)

cap.release()
out.release()
```

---

## 置信度过滤

```python
# 只保留置信度大于 30 的检测结果
for i in range(len(data['text'])):
    conf = int(data['conf'][i])
    text = data['text'][i].strip()
    
    if conf > 30 and text:
        # 绘制检测结果
        pass
```

### 置信度参考

| 置信度范围 | 说明 |
|------------|------|
| 80-100 | 高置信度，非常可靠 |
| 50-80 | 中等置信度，基本可靠 |
| 30-50 | 低置信度，需要人工验证 |
| < 30 | 不可靠，建议过滤 |

---

## 常见问题

### 中文识别

```python
# 指定中文语言包
text = pytesseract.image_to_string(image_rgb, lang='chi_sim')
```

### 预处理增强识别效果

```python
# 灰度化
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

# 二值化
_, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

# 降噪
denoised = cv2.GaussianBlur(binary, (3, 3), 0)

# 再进行 OCR
text = pytesseract.image_to_string(denoised, lang='eng')
```

---

## 常用函数速查

| 函数 | 用途 |
|------|------|
| `pytesseract.image_to_string()` | 提取文本内容 |
| `pytesseract.image_to_data()` | 提取文本及位置信息 |
| `pytesseract.image_to_boxes()` | 提取字符级位置信息 |
| `pytesseract.image_to_osd()` | 检测图像方向和脚本 |
