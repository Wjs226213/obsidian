# MediaPipe 人脸检测与模糊

使用 MediaPipe 进行人脸检测，并对检测到的人脸进行模糊处理，常用于隐私保护。

## 基础人脸检测

```python
import cv2 as cv
import mediapipe as mp

# 初始化 MediaPipe 人脸检测
mp_face_detection = mp.solutions.face_detection
face_detection = mp_face_detection.FaceDetection(
    min_detection_confidence=0.5,  # 最小检测置信度
    model_selection=0  # 0: 近处(<2m), 1: 远处(>2m)
)

# 读取图片
img = cv.imread("image.jpg")

# MediaPipe 需要 RGB 格式
img_rgb = cv.cvtColor(img, cv.COLOR_BGR2RGB)

# 进行检测
results = face_detection.process(img_rgb)

# 处理检测结果
if results.detections is not None:
    for detection in results.detections:
        # 获取边界框
        location_data = detection.location_data
        bbox = location_data.relative_bounding_box
        
        # 转换为像素坐标
        H, W, _ = img.shape
        x1 = int(bbox.xmin * W)
        y1 = int(bbox.ymin * H)
        w = int(bbox.width * W)
        h = int(bbox.height * H)
        
        # 绘制矩形
        cv.rectangle(img, (x1, y1), (x1 + w, y1 + h), (255, 0, 0), 3)

cv.imshow("Face Detection", img)
cv.waitKey(0)
cv.destroyAllWindows()
```

---

## 人脸模糊处理类

封装成类，避免每帧重复创建检测器：

```python
import cv2 as cv
import mediapipe as mp

class FaceBlurrer:
    """人脸模糊处理器"""
    
    def __init__(self):
        self.mp_face_detection = mp.solutions.face_detection
        self.face_detection = self.mp_face_detection.FaceDetection(
            min_detection_confidence=0.5,
            model_selection=0  # 0 适合近处 (< 2m)
        )
    
    def process(self, img):
        """处理单帧图像，模糊所有人脸"""
        H, W, _ = img.shape
        
        # 转换为 RGB
        img_rgb = cv.cvtColor(img, cv.COLOR_BGR2RGB)
        out = self.face_detection.process(img_rgb)
        
        if out.detections is not None:
            for detection in out.detections:
                location_data = detection.location_data
                bbox = location_data.relative_bounding_box
                
                x1, y1, w, h = bbox.xmin, bbox.ymin, bbox.width, bbox.height
                x1 = int(x1 * W)
                y1 = int(y1 * H)
                w = int(w * W)
                h = int(h * H)
                
                # 确保坐标不越界
                x1 = max(0, x1)
                y1 = max(0, y1)
                w = min(w, W - x1)
                h = min(h, H - y1)
                
                if w > 0 and h > 0:
                    # 绘制矩形（可选）
                    cv.rectangle(img, (x1, y1), (x1 + w, y1 + h), (255, 0, 0), 3)
                    
                    # 模糊人脸区域
                    img[y1:y1 + h, x1:x1 + w] = cv.blur(
                        img[y1:y1 + h, x1:x1 + w], (30, 30)
                    )
        
        return img
    
    def release(self):
        """释放检测器资源"""
        self.face_detection.close()
```

---

## 实时视频人脸模糊

```python
import cv2

# 使用摄像头
cap = cv2.VideoCapture(0)

# 或使用视频文件
# cap = cv2.VideoCapture("video.mp4")

blurrer = FaceBlurrer()

while True:
    ret, frame = cap.read()
    if not ret:
        break
    
    # 水平翻转（镜像效果）
    frame = cv2.flip(frame, 1)
    
    # 处理帧
    result = blurrer.process(frame)
    
    # 显示结果
    cv2.imshow("Face Blur", result)
    
    # 按 q 退出
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# 释放资源
blurrer.release()
cap.release()
cv2.destroyAllWindows()
```

---

## model_selection 参数说明

| 值 | 适用距离 | 说明 |
|----|----------|------|
| 0 | < 2 米 | 适合近距离场景（自拍、视频通话） |
| 1 | > 2 米 | 适合远距离场景（监控、人群） |

---

## 注意事项

1. **颜色空间**: MediaPipe 需要 RGB 格式，OpenCV 默认读取为 BGR，需要转换
2. **坐标归一化**: MediaPipe 返回的是归一化坐标（0-1），需要乘以图像尺寸转换为像素坐标
3. **边界检查**: 转换坐标后需要检查是否越界，避免数组索引错误
4. **资源释放**: 处理完成后调用 `release()` 释放检测器资源

---

## 常用函数速查

| 函数 | 用途 |
|------|------|
| `mp.solutions.face_detection.FaceDetection()` | 创建人脸检测器 |
| `face_detection.process()` | 执行人脸检测 |
| `cv.blur()` | 均值模糊 |
| `cv.GaussianBlur()` | 高斯模糊 |
