# CIFAR-10 + ResNet18 训练流程

使用 ResNet18 在 CIFAR-10 数据集上训练图像分类模型。

---

## 1. 环境与配置

```python
BATCH_SIZE = 128       # 批次大小
NUM_EPOCHS = 10        # 训练轮数
LEARNING_RATE = 0.001  # 初始学习率
NUM_CLASSES = 10       # CIFAR-10 类别数
DEVICE = "cpu"         # 自动选择 CPU/CUDA
```

### 硬件检测

优先使用 CUDA GPU，否则回退到 CPU。

---

## 2. 数据加载与预处理

### 2.1 训练集数据增强

| 操作 | 说明 |
|------|------|
| `RandomCrop(32, padding=4)` | 随机裁剪，padding 4 像素 |
| `RandomHorizontalFlip()` | 随机水平翻转（50% 概率） |
| `ToTensor()` | 转为 Tensor，值归一化到 [0,1] |
| `Normalize(mean, std)` | 按 CIFAR-10 全局均值和标准差标准化 |

### CIFAR-10 标准化参数

```python
mean = (0.4914, 0.4822, 0.4465)
std  = (0.2470, 0.2435, 0.2616)
```

### 2.2 测试集

仅做 `ToTensor` + `Normalize`，不做数据增强（保持评估一致性）。

### 2.3 DataLoader 参数

```python
train_loader = DataLoader(trainset, batch_size=128, shuffle=True,  num_workers=2)
test_loader  = DataLoader(testset,  batch_size=128, shuffle=False, num_workers=2)
```

| 参数 | 说明 |
|------|------|
| `shuffle=True` | 训练集每轮打乱顺序 |
| `shuffle=False` | 测试集固定顺序 |
| `num_workers=2` | 2 个子进程并行加载数据 |

---

## 3. 模型构建

### 3.1 ResNet18 结构

使用 `torchvision.models.resnet18(weights=None)`：

- 从随机初始化开始训练（不使用 ImageNet 预训练权重）
- 输入：3×32×32（CIFAR-10 原始尺寸）
- 主干网络：4 个残差阶段（stage），包含多个 BasicBlock

### 3.2 修改分类头

```python
model.fc = nn.Linear(model.fc.in_features, 10)
```

原始 ResNet18 的 `fc` 层输出 1000 类（ImageNet），替换为 10 类（CIFAR-10）。

### 3.3 参数量

```
Total params:     11,181,642  (11.18M)
Trainable params: 11,181,642  (11.18M)
```

全量参数均可训练。

---

## 4. 训练流程

### 4.1 整体流程

```
初始化
  ├── 加载数据
  ├── 构建模型 → 移到设备
  ├── 定义损失函数（CrossEntropyLoss）
  ├── 定义优化器（Adam, lr=0.001）
  └── 定义学习率调度器（CosineAnnealingLR）

循环训练 (epoch 1 ~ NUM_EPOCHS)
  ├── 记录 epoch 开始时间
  ├── train_one_epoch()
  │     ├── model.train()
  │     ├── 遍历 train_loader 每个 batch
  │     │     ├── 前向传播 → outputs
  │     │     ├── 计算 loss
  │     │     ├── 反向传播 → loss.backward()
  │     │     ├── 参数更新 → optimizer.step()
  │     │     ├── 清零梯度 → optimizer.zero_grad()
  │     │     └── 统计 loss 和正确数
  │     └── 返回平均 loss, 准确率
  ├── evaluate(test_loader)
  │     ├── model.eval()
  │     ├── torch.no_grad()
  │     ├── 遍历 test_loader 每个 batch
  │     │     ├── 前向传播
  │     │     └── 统计 loss 和正确数
  │     └── 返回平均 loss, 准确率
  ├── scheduler.step()  // 更新学习率
  ├── 计算 epoch 耗时
  ├── 记录到 records 列表
  └── 打印本轮结果

训练完成
  ├── 保存 CSV（每轮数据）
  ├── 保存 JSON（系统信息）
  ├── 打印总耗时
  └── 打印最佳准确率
```

### 4.2 损失函数

```python
criterion = nn.CrossEntropyLoss()
```

- 适用于多分类问题
- 内部包含 Softmax，无需在模型中额外添加

### 4.3 优化器

```python
optimizer = optim.Adam(model.parameters(), lr=0.001)
```

- Adam 自适应学习率优化器
- 初始学习率 0.001

### 4.4 学习率调度

```python
scheduler = CosineAnnealingLR(optimizer, T_max=NUM_EPOCHS)
```

- 余弦退火：学习率从初始值平滑下降至接近 0
- `T_max = 10`：周期与总 epoch 数相同
- 每轮结束后调用 `scheduler.step()`

### 4.5 训练/评估模式

| 模式 | 调用 | 作用 |
|------|------|------|
| 训练 | `model.train()` | 启用 BatchNorm 更新、Dropout 等 |
| 评估 | `model.eval()` | 固定 BatchNorm、关闭 Dropout |

评估时使用 `@torch.no_grad()` 或 `with torch.no_grad():`，禁用梯度计算，减少内存和加速。

### 4.6 统计指标

```
train_loss  = 所有 batch 的 loss 加权平均 / 总样本数
train_acc   = 预测正确的样本数 / 总样本数 × 100%
epoch_time  = epoch 结束时间 - epoch 开始时间
```

---

## 5. 输出数据

### 5.1 CSV 格式：`training_results.csv`

| 字段 | 说明 | 示例 |
|------|------|------|
| `epoch` | 轮次 | 1 |
| `train_loss` | 训练集平均损失 | 1.5535 |
| `train_acc` | 训练集准确率 | 0.4323 |
| `test_loss` | 测试集平均损失 | 1.2971 |
| `test_acc` | 测试集准确率 | 0.5465 |
| `epoch_time_s` | 本轮耗时（秒） | 69.03 |

### 5.2 JSON 格式：`training_results_system_info.json`

```json
{
  "total_time_s": 692.45,
  "total_time_min": 11.54,
  "best_test_acc": 0.8058,
  "avg_epoch_time_s": 69.24,
  "device": "cpu",
  "torch_version": "2.11.0+cpu",
  "epochs": 10,
  "batch_size": 128,
  "learning_rate": 0.001,
  "total_params": 11181642,
  "trainable_params": 11181642
}
```

不保存模型文件（`.pth`）。

---

## 6. 运行示例（10 epoch 结果）

```
Epoch  Train Loss  Train Acc  Test Loss   Test Acc        Time
------------------------------------------------------------
    1      1.5535    0.4323     1.2971    0.5465     69.03s
    2      1.1730    0.5819     1.0760    0.6306     69.34s
    3      0.9959    0.6454     0.8753    0.6948     68.97s
    4      0.8808    0.6919     0.8417    0.7061     69.29s
    5      0.7883    0.7229     0.7868    0.7311     69.78s
    6      0.7143    0.7503     0.7207    0.7523     69.99s
    7      0.6508    0.7712     0.6510    0.7735     69.04s
    8      0.5863    0.7945     0.6007    0.7904     69.24s
    9      0.5445    0.8086     0.5761    0.8006     68.88s
   10      0.5227    0.8158     0.5626    0.8058     68.88s

总耗时: 692.45s (11.54 min)
最佳测试准确率: 80.58%
平均每轮时间: 69.24s
```

### 训练趋势观察

- **训练 loss**：从 1.55 降至 0.52，持续下降
- **训练准确率**：从 43% 提升至 82%
- **测试准确率**：从 55% 提升至 81%，始终跟随训练
- **每轮耗时**：稳定在 69 秒左右（CPU）

---

## 7. 文件清单

| 文件 | 说明 |
|------|------|
| `test.py` | 训练脚本 |
| `training_results.csv` | 训练日志（每轮指标） |
| `training_results_system_info.json` | 系统配置与汇总信息 |
| `data/cifar-10-batches-py/` | CIFAR-10 数据集 |

---

## 8. 关键知识点

### 8.1 数据增强

- **RandomCrop**: 增加模型对位置的鲁棒性
- **RandomHorizontalFlip**: 增加模型对方向的鲁棒性
- **Normalize**: 加速收敛，提高训练稳定性

### 8.2 学习率调度

- **CosineAnnealing**: 比固定学习率效果更好
- 初期大学习率快速下降，后期小学习率精细调整

### 8.3 训练/评估模式

- `model.train()`: BatchNorm 使用当前 batch 统计量，Dropout 生效
- `model.eval()`: BatchNorm 使用全局统计量，Dropout 关闭

### 8.4 梯度计算

- 训练时需要梯度：`loss.backward()`
- 评估时禁用梯度：`torch.no_grad()` 减少内存使用