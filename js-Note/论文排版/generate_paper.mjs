import { Document, Packer, Paragraph, TextRun, Header, Footer,
  AlignmentType, HeadingLevel, PageNumber, PageBreak,
  TabStopType, TabStopPosition } from "docx";
import fs from "fs";

// === 常量定义 ===
// A4 纸张: 210mm x 297mm = 5953 x 8419 twips (1 twip = 1/20 pt)
// DXA: 1mm = 56.69 DXA, A4 = 11906 x 16838 DXA
const A4_WIDTH = 11906;
const A4_HEIGHT = 16838;
// 页边距 (标准毕业论文)
const MARGIN_TOP = 1440;    // 2.54cm ≈ 1440 DXA
const MARGIN_BOTTOM = 1440;
const MARGIN_LEFT = 1810;   // 3.17cm ≈ 1810 DXA
const MARGIN_RIGHT = 1810;
// 中文字符缩进 (2个字符 ≈ 480 DXA for 小四)
const INDENT_FIRST_LINE = 480;

// 字号映射 (docx size = half-points, 所以 24 = 12pt)
const FONT_SIZE_SAN_HAO = 32;   // 三号 = 16pt
const FONT_SIZE_SI_HAO = 28;    // 四号 = 14pt
const FONT_SIZE_XIAO_SI = 24;   // 小四 = 12pt
const FONT_SIZE_WU_HAO = 21;    // 五号 = 10.5pt

// 字体
const FONT_HEITI = "SimHei";    // 黑体
const FONT_SONGTI = "SimSun";   // 宋体

// 行距 (1.5倍行距)
const LINE_SPACING = 360;       // 1.5倍行距 (half-points)

// 日期
const TODAY = "2026年3月11日";

// === 文档内容定义 ===

// 封面信息
const coverInfo = {
  school: "安徽绿海商务职业学院",
  college: "信息工程学院",
  docType: "毕业设计说明书",
  title: "个人网站设计与开发",
  name: "叶圣荣",
  studentId: "202406113",
  major: "计算机网络技术",
  grade: "2023级",
  advisor: "何伟",
  date: TODAY,
};

// 正文内容
const sections = {
  designThought: {
    title: "一、设计思路",
    subsections: [
      {
        title: "1. 个人网站设计的意义",
        content: "随着互联网的发展，个人网站已成为展示自我、分享知识、建立网络形象的重要平台。它不仅是个人简历的延伸，更是一个集博客、作品集、社交链接于一体的综合窗口。通过亲手设计开发个人网站，能够深入理解前端技术、用户体验设计以及网站部署流程，为未来从事Web开发工作打下坚实基础。本次毕业设计旨在构建一个功能完善、界面美观、响应式的个人网站，涵盖个人简介、技能展示、项目作品、博客文章和留言互动等模块，充分体现个人特色与技术实力。",
      },
      {
        title: "2. 开发工具",
        content: [
          "（1）Visual Studio Code：轻量级但功能强大的源代码编辑器，支持丰富的插件和调试功能，是当前前端开发的主流工具。",
          "（2）Adobe Photoshop 2020：用于处理网站所需的图片素材，如个人头像、作品截图等，确保视觉效果。",
          "（3）JavaScript (ES6)：实现网页的动态交互，如菜单切换、作品动态渲染、留言板本地存储等功能。",
        ],
      },
      {
        title: "3. 运行环境",
        content: [
          "（1）浏览器：支持所有现代浏览器，包括Chrome、Firefox、Edge、Safari等，确保跨平台兼容性。",
          "（2）软件环境：无需额外安装服务器，纯静态HTML/CSS/JS，可直接运行于浏览器或通过GitHub Pages部署。",
        ],
      },
    ],
  },
  designProcess: {
    title: "二、设计过程",
    subsections: [
      {
        title: "1. 设计主题",
        content: `本次设计的主题是\u201C个人网站设计与开发\u201D，以展示个人形象和技术能力为核心。网站采用响应式布局，适配手机、平板和电脑，包含首页、关于我、作品集、博客、留言板五大板块。`,
      },
      {
        title: "2. 网站的设计思想",
        content: "网站以简洁、现代为设计风格，使用Flexbox和Grid布局实现灵活的卡片式界面。通过JavaScript动态加载数据（作品、博客），减少页面冗余。留言板利用localStorage存储，无需后端即可实现数据持久化。同时加入暗色主题切换功能，提升用户体验。",
      },
    ],
  },
  designResult: {
    title: "三、设计成果简介",
    subsections: [
      {
        title: "1. 网站首页（图3-1）",
        content: "首页包含个人形象区（头像、姓名、简介）、技能标签、最新作品预览和最新博客摘要。用户可快速了解网站主人，并通过导航进入其他页面。",
        hasImage: true,
      },
      {
        title: "2. 关于明暗页面（图3-2）",
        content: "日间夜晚页面切换，使用时页面根据时间调可手动调整，更具亲和力。",
        hasImage: true,
      },
      {
        title: "3. 作品集页面（图3-3）",
        content: `采用卡片网格布局，展示多个项目作品。每个卡片包含项目名称、描述和模拟的\u201C查看详情\u201D链接。鼠标悬停有轻微上浮效果，增强交互感。`,
        hasImage: true,
      },
      {
        title: "4. 博客页面（图3-4）",
        content: "以列表形式展示博客文章，每篇显示标题、发布日期和摘要。实现前端分页功能，每页显示2篇文章，用户可点击上一页/下一页浏览更多。",
        hasImage: true,
      },
      {
        title: "5. 留言板页面（图3-5）",
        content: "访客可填写昵称和留言内容，提交后留言即时显示在下方的留言列表中。所有留言保存在浏览器的localStorage中，刷新页面后依然保留。每条留言附带删除按钮，方便管理。页面顶部显示留言总数。",
        hasImage: true,
      },
      {
        title: "6. 成果展示及代码",
        content: "（此处展示网站核心代码片段及运行效果截图）",
        hasImage: true,
      },
    ],
  },
  acknowledgement: {
    title: "四、致谢",
    content: "在此衷心感谢指导老师何伟老师的悉心指导和宝贵建议，感谢学校提供的学习环境，也感谢同学们在毕业设计期间给予的帮助。由于时间有限，网站仍存在一些不足，例如留言板功能较为基础、博客未实现详情页等，这些将在未来版本中不断完善。感谢所有给予支持和鼓励的人！",
  },
  references: {
    title: "五、主要参考文献",
    items: [
      "[1] 阮一峰. ES6标准入门（第3版）. 电子工业出版社. 2017",
      "[2] 廖雪峰. JavaScript全栈教程. 人民邮电出版社. 2020",
      "[3] MDN Web Docs. CSS Flexible Box Layout. 2022",
      "[4] 张鑫旭. CSS世界. 人民邮电出版社. 2017",
      "[5] GitHub Pages官方文档. https://pages.github.com/",
    ],
  },
};

// === 辅助函数 ===

/** 创建页脚（页码） */
function createPageFooter() {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "第 ", font: FONT_SONGTI, size: FONT_SIZE_WU_HAO }),
          new TextRun({ children: [PageNumber.CURRENT], font: FONT_SONGTI, size: FONT_SIZE_WU_HAO }),
          new TextRun({ text: " 页", font: FONT_SONGTI, size: FONT_SIZE_WU_HAO }),
        ],
      }),
    ],
  });
}

/** 创建空白段落 */
function blankParagraph(lines = 1) {
  return Array.from({ length: lines }, () =>
    new Paragraph({ spacing: { line: LINE_SPACING }, children: [] })
  );
}

/** 创建封面段落 */
function coverLine(text, font, size, bold = false, spacingBefore = 0) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: spacingBefore, line: LINE_SPACING },
    children: [new TextRun({ text, font, size, bold })],
  });
}

/** 创建一级标题段落 */
function heading1(text) {
  return new Paragraph({
    spacing: { before: 360, after: 240, line: LINE_SPACING },
    children: [new TextRun({ text, font: FONT_HEITI, size: FONT_SIZE_SI_HAO, bold: true })],
  });
}

/** 创建二级标题段落 */
function heading2(text) {
  return new Paragraph({
    spacing: { before: 240, after: 120, line: LINE_SPACING },
    children: [new TextRun({ text, font: FONT_HEITI, size: FONT_SIZE_XIAO_SI, bold: true })],
  });
}

/** 创建正文段落（首行缩进2字符） */
function bodyParagraph(text) {
  return new Paragraph({
    spacing: { line: LINE_SPACING },
    indent: { firstLine: INDENT_FIRST_LINE },
    children: [new TextRun({ text, font: FONT_SONGTI, size: FONT_SIZE_XIAO_SI })],
  });
}

/** 创建无缩进的正文段落 */
function bodyParagraphNoIndent(text) {
  return new Paragraph({
    spacing: { line: LINE_SPACING },
    children: [new TextRun({ text, font: FONT_SONGTI, size: FONT_SIZE_XIAO_SI })],
  });
}

/** 创建图片占位段落 */
function imagePlaceholder() {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 120, line: LINE_SPACING },
    children: [new TextRun({
      text: "[图片]",
      font: FONT_SONGTI,
      size: FONT_SIZE_XIAO_SI,
      italics: true,
      color: "888888",
    })],
  });
}

/** 创建参考文献段落 */
function referenceItem(text) {
  return new Paragraph({
    spacing: { line: LINE_SPACING },
    children: [new TextRun({ text, font: FONT_SONGTI, size: FONT_SIZE_XIAO_SI })],
  });
}

// === 构建文档 ===

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: FONT_SONGTI, size: FONT_SIZE_XIAO_SI },
      },
    },
  },
  sections: [
    // ===== 封面 =====
    {
      properties: {
        page: {
          size: { width: A4_WIDTH, height: A4_HEIGHT },
          margin: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_LEFT, right: MARGIN_RIGHT },
        },
      },
      children: [
        ...blankParagraph(3),
        coverLine(coverInfo.school, FONT_HEITI, FONT_SIZE_SAN_HAO, true, 0),
        coverLine(coverInfo.college, FONT_SONGTI, FONT_SIZE_SI_HAO, false, 120),
        ...blankParagraph(2),
        coverLine(coverInfo.docType, FONT_HEITI, FONT_SIZE_SAN_HAO, true, 240),
        ...blankParagraph(4),
        // 封面信息（使用制表符对齐）
        new Paragraph({
          spacing: { before: 240, line: LINE_SPACING },
          indent: { left: 2400 },
          children: [
            new TextRun({ text: "题    目：", font: FONT_SONGTI, size: FONT_SIZE_XIAO_SI, bold: true }),
            new TextRun({ text: coverInfo.title, font: FONT_SONGTI, size: FONT_SIZE_XIAO_SI }),
          ],
        }),
        ...blankParagraph(2),
        new Paragraph({
          spacing: { line: LINE_SPACING },
          indent: { left: 2400 },
          children: [
            new TextRun({ text: "姓    名：", font: FONT_SONGTI, size: FONT_SIZE_XIAO_SI, bold: true }),
            new TextRun({ text: coverInfo.name, font: FONT_SONGTI, size: FONT_SIZE_XIAO_SI }),
          ],
        }),
        ...blankParagraph(2),
        new Paragraph({
          spacing: { line: LINE_SPACING },
          indent: { left: 2400 },
          children: [
            new TextRun({ text: "学    号：", font: FONT_SONGTI, size: FONT_SIZE_XIAO_SI, bold: true }),
            new TextRun({ text: coverInfo.studentId, font: FONT_SONGTI, size: FONT_SIZE_XIAO_SI }),
          ],
        }),
        ...blankParagraph(2),
        new Paragraph({
          spacing: { line: LINE_SPACING },
          indent: { left: 2400 },
          children: [
            new TextRun({ text: "专    业：", font: FONT_SONGTI, size: FONT_SIZE_XIAO_SI, bold: true }),
            new TextRun({ text: coverInfo.major, font: FONT_SONGTI, size: FONT_SIZE_XIAO_SI }),
          ],
        }),
        ...blankParagraph(2),
        new Paragraph({
          spacing: { line: LINE_SPACING },
          indent: { left: 2400 },
          children: [
            new TextRun({ text: "年    级：", font: FONT_SONGTI, size: FONT_SIZE_XIAO_SI, bold: true }),
            new TextRun({ text: coverInfo.grade, font: FONT_SONGTI, size: FONT_SIZE_XIAO_SI }),
          ],
        }),
        ...blankParagraph(2),
        new Paragraph({
          spacing: { line: LINE_SPACING },
          indent: { left: 2400 },
          children: [
            new TextRun({ text: "指导教师：", font: FONT_SONGTI, size: FONT_SIZE_XIAO_SI, bold: true }),
            new TextRun({ text: coverInfo.advisor, font: FONT_SONGTI, size: FONT_SIZE_XIAO_SI }),
          ],
        }),
        ...blankParagraph(6),
        coverLine(coverInfo.date, FONT_SONGTI, FONT_SIZE_XIAO_SI, false, 0),
      ],
    },

    // ===== 目录页 =====
    {
      properties: {
        page: {
          size: { width: A4_WIDTH, height: A4_HEIGHT },
          margin: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_LEFT, right: MARGIN_RIGHT },
        },
      },
      headers: { default: new Header({ children: [] }) },
      footers: { default: createPageFooter() },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 360, line: LINE_SPACING },
          children: [new TextRun({ text: "目  录", font: FONT_HEITI, size: FONT_SIZE_SAN_HAO, bold: true })],
        }),
        // 目录条目
        ...[
          ["一、设计思路", "2"],
          ["    1. 个人网站设计的意义", "2"],
          ["    2. 开发工具", "2"],
          ["    3. 运行环境", "2"],
          ["二、设计过程", "3"],
          ["    1. 设计主题", "3"],
          ["    2. 网站的设计思想", "3"],
          ["三、设计成果简介", "3"],
          ["    1. 网站首页", "3"],
          ["    2. 关于明暗页面", "4"],
          ["    3. 作品集页面", "4"],
          ["    4. 博客页面", "5"],
          ["    5. 留言板页面", "5"],
          ["    6. 成果展示及代码", "6"],
          ["四、致谢", "6"],
          ["五、主要参考文献", "6"],
        ].map(([label, page]) =>
          new Paragraph({
            spacing: { line: LINE_SPACING },
            tabStops: [{ type: TabStopType.RIGHT, position: A4_WIDTH - MARGIN_LEFT - MARGIN_RIGHT }],
            children: [
              new TextRun({ text: label, font: FONT_SONGTI, size: FONT_SIZE_XIAO_SI }),
              new TextRun({ text: `\t${page}`, font: FONT_SONGTI, size: FONT_SIZE_XIAO_SI }),
            ],
          })
        ),
      ],
    },

    // ===== 正文 =====
    {
      properties: {
        page: {
          size: { width: A4_WIDTH, height: A4_HEIGHT },
          margin: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_LEFT, right: MARGIN_RIGHT },
        },
      },
      headers: { default: new Header({ children: [] }) },
      footers: { default: createPageFooter() },
      children: [
        // 一、设计思路
        heading1(sections.designThought.title),
        ...sections.designThought.subsections.flatMap(sub => [
          heading2(sub.title),
          ...(Array.isArray(sub.content)
            ? sub.content.map(c => bodyParagraph(c))
            : [bodyParagraph(sub.content)]
          ),
        ]),

        // 二、设计过程
        heading1(sections.designProcess.title),
        ...sections.designProcess.subsections.flatMap(sub => [
          heading2(sub.title),
          ...(Array.isArray(sub.content)
            ? sub.content.map(c => bodyParagraph(c))
            : [bodyParagraph(sub.content)]
          ),
        ]),

        // 三、设计成果简介
        heading1(sections.designResult.title),
        ...sections.designResult.subsections.flatMap(sub => [
          heading2(sub.title),
          bodyParagraph(sub.content),
          ...(sub.hasImage ? [imagePlaceholder()] : []),
        ]),

        // 四、致谢
        heading1(sections.acknowledgement.title),
        bodyParagraph(sections.acknowledgement.content),

        // 五、主要参考文献
        heading1(sections.references.title),
        ...sections.references.items.map(item => referenceItem(item)),
      ],
    },
  ],
});

// === 生成文件 ===
const outputPath = "论文排版/毕业设计叶圣荣_排版优化.docx";
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outputPath, buffer);
console.log(`✅ 文档已生成: ${outputPath}`);
console.log(`   文件大小: ${(buffer.length / 1024).toFixed(1)} KB`);
