# CNRPark 停车场数据集

CNRPark+EXT 是一个用于停车场视觉占用检测的数据集，包含约 150,000 张标注图像（patches），用于训练 CNN 分类器判断停车位是否被占用。

> 来源: http://cnrpark.it/

---

## 数据集概述

| 属性        | 说明                                                  |
| --------- | --------------------------------------------------- |
| **用途**    | 停车位占用检测（二分类：空闲/占用）                                  |
| **总图像数**  | ~150,000 张                                          |
| **停车位数量** | 164 个                                               |
| **图像尺寸**  | 150x150 像素                                          |
| **标注格式**  | `free`（空闲）/ `busy`（占用）                              |
| **许可证**   | Open Data Commons Open Database License (ODbL) v1.0 |

---

## 数据集组成

CNRPark+EXT 由两个子集组成：

### 1. CNRPark（基础子集）

| 属性 | 说明 |
|------|------|
| **摄像头数量** | 2 个（A、B） |
| **采集时间** | 2015年7月（2天） |
| **天气** | 晴天 |
| **帧数** | 242 |
| **图像数量** | 12,584 张 |

### 2. CNR-EXT（扩展子集）

| 属性 | 说明 |
|------|------|
| **摄像头数量** | 9 个 |
| **采集时间** | 2015年11月 - 2016年2月（23天） |
| **天气条件** | 晴天、多云、雨天 |
| **帧数** | 4,081 |
| **图像数量** | 144,965 张 |

---

## 数据集特点

### 挑战性场景

1. **不同光照条件**: 包含各种光照变化（白天、阴天、雨天）
2. **部分遮挡**: 树木、路灯、其他车辆造成的遮挡
3. **阴影**: 车辆部分或全部被阴影覆盖
4. **不同视角**: 9个摄像头从不同角度拍摄
5. **跨季节**: 涵盖夏季到冬季的数据

### 应用场景

- 智能停车系统
- 城市交通管理
- 边缘计算设备部署
- 实时视觉检测

---

## 文件组织结构

### CNRPark 子集

```
CAMERA/
├── A/
│   ├── busy/
│   │   └── YYYYMMDD_HHMM_SLOT_ID.jpg
│   └── free/
│       └── YYYYMMDD_HHMM_SLOT_ID.jpg
└── B/
    ├── busy/
    └── free/
```

**示例**: `A/busy/20150703_1425_32.jpg`

### CNR-EXT 子集

```
PATCHES/
├── SUNNY/
│   └── YYYY-MM-DD/
│       └── cameraCAM_ID/
│           └── W_ID_CAPTURE_DATE_CAPTURE_TIME_C0CAM_ID_SLOT_ID.jpg
├── OVERCAST/
└── RAINY/
```

**示例**: `PATCHES/SUNNY/2015-11-22/camera6/S_2015-11-22_09.47_C06_205.jpg`

### LABELS 文件格式

每行格式: `<IMAGE_PATH> <LABEL>`

- `0` = free（空闲）
- `1` = busy（占用）

---

## 数据下载

| 文件 | 大小 | 说明 |
|------|------|------|
| [CNRPark+EXT.csv](https://github.com/fabiocarrara/deep-parking/releases/download/archive/CNRPark+EXT.csv) | 18.1 MB | 元数据 CSV 文件 |
| [CNRPark-Patches-150x150.zip](https://github.com/fabiocarrara/deep-parking/releases/download/archive/CNRPark-Patches-150x150.zip) | 36.6 MB | CNRPark 子集图像 |
| [CNR-EXT-Patches-150x150.zip](https://github.com/fabiocarrara/deep-parking/releases/download/archive/CNR-EXT-Patches-150x150.zip) | 449.5 MB | CNR-EXT 子集图像 |
| [CNR-EXT_FULL_IMAGE_1000x750.tar](https://github.com/fabiocarrara/deep-parking/releases/download/archive/CNR-EXT_FULL_IMAGE_1000x750.tar) | 1.1 GB | 完整帧图像（1000x750） |
| [splits.zip](https://github.com/fabiocarrara/deep-parking/releases/download/archive/splits.zip) | 27.2 MB | 实验数据划分 |

---

## 预训练模型

| 模型 | 大小 | 说明 |
|------|------|------|
| [mAlexNet 模型](https://github.com/fabiocarrara/deep-parking/releases/download/archive/CNRPark+EXT_Trained_Models_mAlexNet.zip) | 1.7 MB | 轻量级架构，适合边缘设备 |
| [AlexNet 模型](https://github.com/fabiocarrara/deep-parking/releases/download/archive/CNRPark+EXT_Trained_Models_AlexNet.zip) | 1.7 GB | 标准架构，精度更高 |

---

## 论文引用

### 论文 1: Deep learning for decentralized parking lot occupancy detection

```bibtex
@article{amato2017deep,
  title={Deep learning for decentralized parking lot occupancy detection},
  author={Amato, Giuseppe and Carrara, Fabio and Falchi, Fabrizio and Gennaro, Claudio and Meghini, Carlo and Vairo, Claudio},
  journal={Expert Systems with Applications},
  volume={72},
  pages={327--334},
  year={2017},
  publisher={Pergamon}
}
```

**核心贡献**:
- 提出基于 CNN 的去中心化停车占用检测方案
- 设计了轻量级 mAlexNet 架构，适合智能摄像头部署
- 在 CNRPark+EXT 和 PKLot 数据集上验证

---

### 论文 2: Car parking occupancy detection using smart camera networks and deep learning

```bibtex
@inproceedings{amato2016car,
  title={Car parking occupancy detection using smart camera networks and deep learning},
  author={Amato, Giuseppe and Carrara, Fabio and Falchi, Fabrizio and Gennaro, Claudio and Vairo, Claudio},
  booktitle={Computers and Communication (ISCC), 2016 IEEE Symposium on},
  pages={1212--1217},
  year={2016},
  organization={IEEE}
}
```

**核心贡献**:
- 实时车位占用检测系统
- 在资源受限的智能摄像头上运行 CNN
- 对光照变化、阴影、部分遮挡具有鲁棒性

---

## 相关资源

- **代码仓库**: https://github.com/fabiocarrara/deep-parking
- **Roboflow 版本**: https://universe.roboflow.com/carpark-sw6jq/cnrpark-ext-cnziv

---

## 实际应用

该数据集已在意大利比萨的 CNR 研究区部署为实际智能城市应用：

1. **边缘计算**: CNN 分类器直接运行在智能摄像头上
2. **实时检测**: 摄像头独立做出预测，无需中心服务器
3. **隐私保护**: 完整帧图像已降采样至 1000x750

---

## 与其他数据集对比

| 数据集 | 图像数 | 摄像头 | 天气变化 | 遮挡 |
|--------|--------|--------|----------|------|
| **CNRPark+EXT** | ~150,000 | 9 | ✓ | ✓ |
| PKLot | ~1.2M | 5 | ✓ | ✗ |
| CNRPark | 12,584 | 2 | ✗ | ✗ |

---

## 使用建议

1. **入门**: 先使用 CNRPark 子集（较小，12K 图像）
2. **进阶**: 使用完整的 CNRPark+EXT 数据集
3. **部署**: 使用 mAlexNet 架构，适合边缘设备
4. **对比**: 可与 PKLot 数据集进行对比实验
