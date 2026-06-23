import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import numpy as np

# === 中文字体支持 ===
plt.rcParams.update({
    'font.sans-serif': ['SimHei', 'Microsoft YaHei', 'SimSun', 'Arial Unicode MS'],
    'axes.unicode_minus': False,
    'figure.dpi': 300,
    'savefig.dpi': 300,
})

# === 配色方案 ===
COLOR_BG = '#FFFFFF'
COLOR_BOX = '#2196F3'       # 主蓝色
COLOR_BOX_DARK = '#1565C0'  # 深蓝
COLOR_BOX_LIGHT = '#BBDEFB' # 浅蓝
COLOR_ARROW = '#1976D2'     # 箭头蓝
COLOR_TEXT = '#FFFFFF'       # 白色文字
COLOR_LABEL = '#333333'      # 说明文字
COLOR_ACCENT = '#FF7043'     # 强调色（输出）
COLOR_INPUT = '#66BB6A'      # 输入色

# === 流程节点定义 ===
steps = [
    {
        'title': '图像数据\n采集',
        'subtitle': 'Image Data\nCollection',
        'details': ['原始人脸图像', '多角度/光照', '数据增强'],
        'color': COLOR_INPUT,
        'icon': '📷',
    },
    {
        'title': '人脸检测',
        'subtitle': 'Face Detection',
        'details': ['Haar/HOG特征', 'MTCNN / YOLO', '人脸区域裁剪'],
        'color': COLOR_BOX,
        'icon': '🔍',
    },
    {
        'title': '数据归一化',
        'subtitle': 'Normalization',
        'details': ['灰度转换', '尺寸统一', '像素值归一化'],
        'color': COLOR_BOX,
        'icon': '📐',
    },
    {
        'title': '特征提取',
        'subtitle': 'Feature Extraction',
        'details': ['CNN特征', 'LBP / HOG', '降维PCA'],
        'color': COLOR_BOX,
        'icon': '🧬',
    },
    {
        'title': '多人脸\n分类器',
        'subtitle': 'Multi-Face\nClassifier',
        'details': ['SVM / Softmax', '深度学习分类', '身份识别输出'],
        'color': COLOR_ACCENT,
        'icon': '👤',
    },
]

# === 画布设置 ===
fig, ax = plt.subplots(1, 1, figsize=(14, 4.5))
ax.set_xlim(-0.5, 14.5)
ax.set_ylim(-1.5, 4.5)
ax.set_aspect('equal')
ax.axis('off')
fig.patch.set_facecolor(COLOR_BG)

# === 标题 ===
ax.text(7, 4.1, '机器学习多人脸识别流程', fontsize=16, fontweight='bold',
        ha='center', va='center', color='#212121',
        fontfamily='SimHei')
ax.text(7, 3.55, 'Multi-Face Recognition Pipeline based on Machine Learning',
        fontsize=9, ha='center', va='center', color='#757575', style='italic')

# === 绘制流程节点 ===
box_width = 2.2
box_height = 2.8
start_x = 0.8
gap = 0.7
arrow_len = 0.8

node_positions = []

for i, step in enumerate(steps):
    x = start_x + i * (box_width + gap + arrow_len)
    y = 1.0
    node_positions.append((x, y))

    # 外框阴影
    shadow = FancyBboxPatch(
        (x + 0.06, y - box_height/2 - 0.06),
        box_width, box_height,
        boxstyle="round,pad=0.15",
        facecolor='#E0E0E0', edgecolor='none', alpha=0.5,
        zorder=1
    )
    ax.add_patch(shadow)

    # 主框
    main_box = FancyBboxPatch(
        (x, y - box_height/2),
        box_width, box_height,
        boxstyle="round,pad=0.15",
        facecolor=step['color'], edgecolor='none', alpha=0.92,
        zorder=2
    )
    ax.add_patch(main_box)

    # 顶部图标 + 标题
    ax.text(x + box_width/2, y + box_height/2 - 0.35, step['icon'],
            fontsize=16, ha='center', va='center', zorder=3)
    ax.text(x + box_width/2, y + box_height/2 - 0.75, step['title'],
            fontsize=11, fontweight='bold', ha='center', va='center',
            color=COLOR_TEXT, zorder=3, linespacing=1.3)
    ax.text(x + box_width/2, y + box_height/2 - 1.25, step['subtitle'],
            fontsize=7, ha='center', va='center',
            color='#E3F2FD', zorder=3, style='italic')

    # 分隔线
    sep_y = y + box_height/2 - 1.55
    ax.plot([x + 0.25, x + box_width - 0.25], [sep_y, sep_y],
            color='#FFFFFF', alpha=0.3, linewidth=0.8, zorder=3)

    # 详细信息
    for j, detail in enumerate(step['details']):
        ax.text(x + box_width/2, sep_y - 0.35 - j * 0.38,
                f'• {detail}', fontsize=7.5, ha='center', va='center',
                color=COLOR_TEXT, alpha=0.9, zorder=3)

# === 绘制箭头 ===
for i in range(len(steps) - 1):
    x_start = node_positions[i][0] + box_width + 0.05
    x_end = node_positions[i + 1][0] - 0.05
    y_arrow = 1.0

    # 箭头主体
    arrow = FancyArrowPatch(
        (x_start, y_arrow), (x_end, y_arrow),
        arrowstyle='->,head_width=0.25,head_length=0.15',
        color=COLOR_ARROW, linewidth=2.0,
        connectionstyle='arc3,rad=0',
        zorder=4
    )
    ax.add_patch(arrow)

    # 箭头上的标签
    mid_x = (x_start + x_end) / 2
    arrow_labels = ['检测', '裁剪对齐', '特征向量', '分类决策']
    ax.text(mid_x, y_arrow + 0.32, arrow_labels[i],
            fontsize=7, ha='center', va='center',
            color=COLOR_ARROW, fontweight='bold',
            bbox=dict(boxstyle='round,pad=0.2', facecolor='white',
                     edgecolor=COLOR_ARROW, alpha=0.85, linewidth=0.5),
            zorder=5)

# === 底部注释框 ===
note_y = -0.7
note_box = FancyBboxPatch(
    (0.8, note_y - 0.35), 12.6, 0.7,
    boxstyle="round,pad=0.1",
    facecolor='#F5F5F5', edgecolor='#BDBDBD', linewidth=0.5,
    zorder=1
)
ax.add_patch(note_box)
ax.text(7.1, note_y,
        '关键技术：Haar特征 + MTCNN人脸检测  →  直方图均衡化归一化  →  CNN/PCA特征提取  →  SVM/Softmax多分类',
        fontsize=8, ha='center', va='center', color='#616161', zorder=2)

# === 保存 ===
output_dir = 'D:/GIthub_list/Note/js-Note/'
fig.savefig(output_dir + 'ml_pipeline_flowchart.png', format='png',
            dpi=300, bbox_inches='tight', pad_inches=0.08, facecolor=COLOR_BG)
fig.savefig(output_dir + 'ml_pipeline_flowchart.pdf', format='pdf',
            bbox_inches='tight', pad_inches=0.08, facecolor=COLOR_BG)

print('✅ 图片已生成:')
print(f'   ml_pipeline_flowchart.png (300dpi)')
print(f'   ml_pipeline_flowchart.pdf')

plt.close()
