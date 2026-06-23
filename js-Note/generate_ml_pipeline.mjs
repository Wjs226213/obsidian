import fs from "fs";

// === 配色方案 ===
const COLORS = {
  input: "#66BB6A",
  main: "#2196F3",
  accent: "#FF7043",
  arrow: "#1976D2",
  white: "#FFFFFF",
  bg: "#FFFFFF",
  textDark: "#333333",
  textLight: "#757575",
  noteBg: "#F5F5F5",
  noteBorder: "#BDBDBD",
};

// === 节点数据 (用 SVG 图标替代 emoji) ===
const steps = [
  {
    title: "图像数据采集",
    subtitle: "Image Data Collection",
    details: ["原始人脸图像", "多角度/光照", "数据增强"],
    color: COLORS.input,
    stepNum: "01",
  },
  {
    title: "人脸检测",
    subtitle: "Face Detection",
    details: ["Haar / HOG 特征", "MTCNN / YOLO", "人脸区域裁剪"],
    color: COLORS.main,
    stepNum: "02",
  },
  {
    title: "数据归一化",
    subtitle: "Normalization",
    details: ["灰度转换", "尺寸统一", "像素值归一化"],
    color: COLORS.main,
    stepNum: "03",
  },
  {
    title: "特征提取",
    subtitle: "Feature Extraction",
    details: ["CNN 特征", "LBP / HOG", "降维 PCA"],
    color: COLORS.main,
    stepNum: "04",
  },
  {
    title: "多人脸分类器",
    subtitle: "Multi-Face Classifier",
    details: ["SVM / Softmax", "深度学习分类", "身份识别输出"],
    color: COLORS.accent,
    stepNum: "05",
  },
];

const arrowLabels = ["人脸区域", "裁剪对齐", "特征向量", "分类决策"];

// === SVG 尺寸 ===
const W = 1400;
const H = 420;
const boxW = 210;
const boxH = 250;
const gap = 60;
const arrowW = 70;
const startX = 50;
const boxY = 85;

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// === 生成 SVG ===
let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="shadow" x="-4%" y="-4%" width="112%" height="112%">
      <feDropShadow dx="2" dy="3" stdDeviation="4" flood-color="#00000018"/>
    </filter>
    <marker id="arrowhead" markerWidth="14" markerHeight="10" refX="14" refY="5" orient="auto">
      <polygon points="0 0, 14 5, 0 10" fill="${COLORS.arrow}"/>
    </marker>
  </defs>

  <!-- 背景 -->
  <rect width="${W}" height="${H}" fill="${COLORS.bg}"/>

  <!-- 标题 -->
  <text x="${W / 2}" y="32" text-anchor="middle" font-family="SimHei, Microsoft YaHei, sans-serif"
        font-size="24" font-weight="bold" fill="${COLORS.textDark}">机器学习多人脸识别流程</text>
  <text x="${W / 2}" y="55" text-anchor="middle" font-family="Arial, sans-serif"
        font-size="12" fill="${COLORS.textLight}" font-style="italic">Multi-Face Recognition Pipeline based on Machine Learning</text>
  <line x1="${W / 2 - 200}" y1="65" x2="${W / 2 + 200}" y2="65" stroke="${COLORS.main}" stroke-width="1.5" opacity="0.3"/>
`;

// === 绘制节点 ===
steps.forEach((step, i) => {
  const x = startX + i * (boxW + gap + arrowW);
  const y = boxY;

  // 阴影层
  svg += `  <rect x="${x + 3}" y="${y + 3}" width="${boxW}" height="${boxH}" rx="12" ry="12"
        fill="#000000" opacity="0.08" filter="url(#shadow)"/>\n`;

  // 主框
  svg += `  <rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" rx="12" ry="12"
        fill="${step.color}" opacity="0.95"/>\n`;

  // 顶部圆角条（装饰）
  svg += `  <rect x="${x}" y="${y}" width="${boxW}" height="6" rx="3" ry="3" fill="white" opacity="0.25"/>\n`;

  // 步骤编号圆形
  svg += `  <circle cx="${x + boxW / 2}" cy="${y + 40}" r="20" fill="white" opacity="0.2"/>\n`;
  svg += `  <text x="${x + boxW / 2}" y="${y + 47}" text-anchor="middle"
        font-family="SimHei, Microsoft YaHei, sans-serif" font-size="20" font-weight="bold" fill="${COLORS.white}">${step.stepNum}</text>\n`;

  // 标题
  svg += `  <text x="${x + boxW / 2}" y="${y + 82}" text-anchor="middle"
        font-family="SimHei, Microsoft YaHei, sans-serif" font-size="16" font-weight="bold" fill="${COLORS.white}">${escapeXml(step.title)}</text>\n`;

  // 英文副标题
  svg += `  <text x="${x + boxW / 2}" y="${y + 102}" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="10" fill="#E3F2FD" font-style="italic">${escapeXml(step.subtitle)}</text>\n`;

  // 分隔线
  svg += `  <line x1="${x + 25}" y1="${y + 118}" x2="${x + boxW - 25}" y2="${y + 118}"
        stroke="white" stroke-opacity="0.25" stroke-width="1"/>\n`;

  // 详细信息
  step.details.forEach((detail, di) => {
    svg += `  <text x="${x + boxW / 2}" y="${y + 142 + di * 26}" text-anchor="middle"
        font-family="SimSun, SimHei, Microsoft YaHei, sans-serif" font-size="12" fill="white" opacity="0.92">- ${escapeXml(detail)}</text>\n`;
  });
});

// === 绘制箭头 ===
for (let i = 0; i < steps.length - 1; i++) {
  const x1 = startX + i * (boxW + gap + arrowW) + boxW + 5;
  const x2 = startX + (i + 1) * (boxW + gap + arrowW) - 5;
  const y = boxY + boxH / 2;
  const midX = (x1 + x2) / 2;

  // 箭头线
  svg += `  <line x1="${x1}" y1="${y}" x2="${x2 - 12}" y2="${y}"
        stroke="${COLORS.arrow}" stroke-width="2.5" marker-end="url(#arrowhead)"/>\n`;

  // 箭头标签
  const labelW = arrowLabels[i].length * 14 + 20;
  svg += `  <rect x="${midX - labelW / 2}" y="${y - 26}" width="${labelW}" height="22" rx="6" ry="6"
        fill="white" stroke="${COLORS.arrow}" stroke-width="0.8"/>\n`;
  svg += `  <text x="${midX}" y="${y - 11}" text-anchor="middle" font-family="SimHei, Microsoft YaHei, sans-serif"
        font-size="11" font-weight="bold" fill="${COLORS.arrow}">${escapeXml(arrowLabels[i])}</text>\n`;
}

// === 底部注释 ===
svg += `  <rect x="${startX}" y="${boxY + boxH + 20}" width="${W - startX * 2}" height="36" rx="8" ry="8"
        fill="${COLORS.noteBg}" stroke="${COLORS.noteBorder}" stroke-width="0.5"/>\n`;
svg += `  <text x="${W / 2}" y="${boxY + boxH + 43}" text-anchor="middle"
        font-family="SimSun, SimHei, Microsoft YaHei, sans-serif" font-size="11" fill="${COLORS.textLight}">关键技术：Haar + MTCNN 人脸检测 → 直方图均衡化归一化 → CNN / PCA 特征提取 → SVM / Softmax 多分类</text>\n`;

svg += `</svg>`;

// === 保存 SVG ===
const svgPath = "ml_pipeline_flowchart.svg";
fs.writeFileSync(svgPath, svg, "utf-8");
console.log(`✅ SVG 已生成: ${svgPath}`);

// === 用 sharp 转 PNG ===
try {
  const sharp = (await import("sharp")).default;
  const pngBuffer = await sharp(Buffer.from(svg)).png({ quality: 100 }).toBuffer();
  fs.writeFileSync("ml_pipeline_flowchart.png", pngBuffer);
  console.log(`✅ PNG 已生成: ml_pipeline_flowchart.png (${(pngBuffer.length / 1024).toFixed(1)} KB)`);
} catch {
  const { execSync } = await import("child_process");
  execSync("npm install sharp", { stdio: "inherit" });
  const sharp = (await import("sharp")).default;
  const pngBuffer = await sharp(Buffer.from(svg)).png({ quality: 100 }).toBuffer();
  fs.writeFileSync("ml_pipeline_flowchart.png", pngBuffer);
  console.log(`✅ PNG 已生成: ml_pipeline_flowchart.png (${(pngBuffer.length / 1024).toFixed(1)} KB)`);
}
