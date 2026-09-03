# WorkBuddy 工作台 · 设计系统规范 v2（暖色活力精致版）

> 版本：v2.0 ｜ 设计师：UI Designer ｜ 日期：2026-08-27
> 适用：WorkBuddy 本地 Chrome 工作台（三栏：常用应用 / 常用文件夹 / 常用文件）
> 目标：在已落地的暖色三栏基础上，建立**系统化、可复用、可访问**的精致版设计系统，支撑后续一致演进。

---

## 1. 设计上下文（Design Context）

| 维度 | 说明 |
|------|------|
| **目标用户** | 单人重度使用者（本地工作台拥有者），日常同时管理多个项目文件夹、本地应用与在线协作文档 |
| **使用情境** | Windows 桌面，双击 `start.bat` 拉起本地 Node 服务后于 Chrome 中打开；高频、短时、多任务切换 |
| **核心任务** | ①一键启动/关闭常用应用 ②搜索本机应用并加入常用 ③快速打开常用与最近文件夹 ④以标签卡打开在线文件、可弹出独立窗口 |
| **品牌人格** | 暖色活力——亲切、积极、有温度，但作为生产力工具需克制、精致、不喧宾夺主 |
| **差异化记忆点** | 三栏分色的暖色工作台 + 彩色图标 chip，一眼可辨"应用/文件夹/文件"三类对象 |

**设计原则**
1. **暖而不燥**：暖色作底色与强调，中性色统一暖调，避免纯灰纯黑。
2. **分色即分类**：金=应用、橙=文件夹、珊瑚红=文件，色标仅做导航暗示，不滥用。
3. **行优先于卡**：列表项用"扁平行 + 发丝分隔 + 悬浮反馈"，避免卡片套卡片的厚重感。
4. **节制强调**：遵循 60-30-10，强调色（橙）只出现在主操作与关键状态。
5. **可访问优先**：WCAG AA 起步，键盘可达，尊重 reduced-motion。

---

## 2. 色彩系统（OKLCH）

> 全部使用 `oklch(L% C H)`。暖中性色统一带 hue≈60 的微暖调（chroma 0.005–0.015），与品牌橙形成潜意识统一。极端明度处降低彩度，避免刺眼。

### 2.1 品牌主色 · 橙（Primary）
```
--brand-50:  oklch(97% 0.02 55);   /* 悬浮底纹 */
--brand-100: oklch(94% 0.04 55);
--brand-200: oklch(88% 0.08 55);   /* chip 底 */
--brand-300: oklch(80% 0.12 55);
--brand-400: oklch(75% 0.14 55);
--brand-500: oklch(70% 0.16 55);   /* ★ 主色 = #FF7A3D 近似 */
--brand-600: oklch(62% 0.17 55);   /* 主按钮悬浮 */
--brand-700: oklch(52% 0.15 55);   /* 主色文字（浅底） */
--brand-800: oklch(42% 0.12 55);
--brand-900: oklch(32% 0.08 55);
```

### 2.2 栏目色标（仅做分类暗示，节制使用）
```
--accent-gold:   oklch(82% 0.13 85);  /* 应用栏点标 / 应用 chip 边 */
--accent-coral:  oklch(65% 0.18 28);  /* 文件栏点标 / 文件 chip / 危险动作 */
```
> 金与珊瑚红**只**出现在：栏标题点标、对应 chip 背景/边、文件栏的"独立窗口"按钮。**不**用于正文或大面积。

### 2.3 暖中性色（Neutral · hue 60）
```
--neutral-0:   oklch(99% 0.005 60);  /* 卡片/面板表面（近白，非纯白） */
--neutral-50:  oklch(97% 0.008 60);  /* 页面底色 */
--neutral-100: oklch(95% 0.010 60);  /* 行悬浮底 */
--neutral-200: oklch(90% 0.012 60);  /* 发丝分隔线 */
--neutral-300: oklch(86% 0.012 60);  /* 边框 */
--neutral-400: oklch(72% 0.012 60);  /* 占位符（需校验 ≥4.5:1，建议用 500） */
--neutral-500: oklch(58% 0.012 60);  /* 次要文字（路径/元数据）≈4.6:1 */
--neutral-600: oklch(48% 0.013 60);  /* 辅助文字 */
--neutral-700: oklch(38% 0.013 60);  /* 正文 */
--neutral-900: oklch(26% 0.015 60);  /* 标题/墨色 */
```

### 2.4 语义色
```
--success: oklch(60% 0.14 150);  --success-bg: oklch(95% 0.04 150);
--warning: oklch(72% 0.15 80);   --warning-bg: oklch(95% 0.05 80);
--error:   oklch(58% 0.18 28);   --error-bg:   oklch(95% 0.04 28);
--info:    oklch(60% 0.11 240);  --info-bg:    oklch(95% 0.03 240);
```

### 2.5 表面与背景
```
--bg-app:    linear-gradient(135deg, oklch(97% 0.012 60) 0%, oklch(94% 0.020 55) 100%);
--surface-1: var(--neutral-0);          /* 面板 */
--surface-2: oklch(98% 0.006 60);       /* 模态/弹层 */
--overlay:   oklch(26% 0.015 60 / 0.45);/* 遮罩（暖调，非纯黑） */
```

### 2.6 对比度校验（WCAG AA）
| 组合 | 比值 | 达标 |
|------|------|------|
| neutral-900(26%) on neutral-0 | ≈13:1 | AAA |
| neutral-700(38%) on neutral-0 | ≈8.5:1 | AAA |
| neutral-500(58%) on neutral-0 | ≈4.6:1 | AA ✓ |
| brand-700(52%) on neutral-0 | ≈5.2:1 | AA ✓ |
| white on brand-500(70%) | ≈3.4:1 | 仅大字/粗体 AA ⚠ |
| white on brand-600(62%) | ≈4.7:1 | AA ✓ |

> **决策**：主按钮文字用 `--neutral-0` 配 `brand-600` 底（≥4.7:1），确保正文级对比；`brand-500` 仅用于≥18px 粗体或图标。

### 2.7 60-30-10 落实
- **60%** 暖中性背景 + 留白（`--bg-app` / `--neutral-0` / `--neutral-50`）
- **30%** 次要色（正文 `--neutral-700`、路径 `--neutral-500`、边框 `--neutral-300`）
- **10%** 强调（主按钮 `brand-600`、栏点标、激活态、focus 环）

---

## 3. 排版系统（Typography）

### 3.1 字体族
```
--font-display: 'Plus Jakarta Sans', 'Noto Sans SC', system-ui, sans-serif;  /* 标题/品牌/数字 */
--font-body:    'Plus Jakarta Sans', 'Noto Sans SC', system-ui, sans-serif;  /* 正文/UI */
--font-mono:    'JetBrains Mono', ui-monospace, monospace;                   /* 路径/代码 */
```
- **拉丁**：Plus Jakarta Sans（几何人文，暖而独特，替代 Inter/Roboto 的"隐形默认"）
- **中文**：Noto Sans SC（精致、可读、与拉丁 x-height 协调）
- **生产离线降级**：无网络时回退 `system-ui`/`'Segoe UI'`；规范允许，性能优先。

### 3.2 字号阶（Major Third 1.25 · 固定 rem，适配 App UI）
| Token | rem | px | 用途 |
|-------|-----|----|----|
| `--text-xs` | 0.75 | 12 | 标签/法律/计数角标 |
| `--text-sm` | 0.875 | 14 | 次要 UI、路径、元数据 |
| `--text-base` | 1 | 16 | 正文 |
| `--text-lg` | 1.25 | 20 | 面板标题 |
| `--text-xl` | 1.5 | 24 | 区块/品牌主标 |
| `--text-2xl` | 2 | 32 | 英雄（本工作台少用） |

### 3.3 字重 / 行高 / 字距
```
--weight-regular: 400;  --weight-medium: 500;
--weight-semibold: 600; --weight-bold: 700;
--leading-tight: 1.25;  --leading-normal: 1.5;  --leading-relaxed: 1.65;
--tracking-tight: -0.01em;  --tracking-wide: 0.04em;  --tracking-caps: 0.08em;
```
- 标题：600–700 / `leading-tight` / `tracking-tight`
- 正文：400 / `leading-normal`
- 路径/元数据：`--font-mono` 400 / `--text-sm` / `--neutral-500`
- 计数/数字：`font-variant-numeric: tabular-nums`（状态栏统计对齐）

### 3.4 OpenType 精修
```css
body{font-kerning:normal;}
.nums{font-variant-numeric:tabular-nums;}
abbr,.caps{font-variant-caps:all-small-caps;letter-spacing:var(--tracking-caps);}
code,.mono{font-variant-ligatures:none;}
```

---

## 4. 间距 / 圆角 / 阴影 / 动效

### 4.1 间距（4px 基准）
```
--space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px;
--space-5:20px; --space-6:24px; --space-8:32px; --space-12:48px; --space-16:64px;
```
- 面板内边距 `--space-5`(20)，行内边距 `--space-3 --space-4`(12/16)，行间距 `--space-1`(4) + 发丝线
- 栏间距 `--space-6`(24)

### 4.2 圆角
```
--radius-sm:8px; --radius-md:12px; --radius-lg:16px; --radius-xl:20px; --radius-pill:999px;
```
- 面板 `--radius-lg`，行/输入 `--radius-md`，chip `--radius-sm`，标签/状态 `--radius-pill`

### 4.3 阴影（暖调，非纯黑）
```
--shadow-sm: 0 1px 2px oklch(26% 0.015 60 / 0.06);
--shadow-md: 0 6px 20px oklch(70% 0.16 55 / 0.12);
--shadow-lg: 0 18px 50px oklch(26% 0.015 60 / 0.18);
--ring-focus: 0 0 0 3px oklch(70% 0.16 55 / 0.35);
```

### 4.4 动效
```
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
--ease-out-expo:  cubic-bezier(0.16, 1, 0.3, 1);
--dur-fast:150ms; --dur-base:220ms; --dur-slow:360ms;
```
- 行悬浮：`background 150ms`、`transform translateY(-1px) 220ms var(--ease-out-quart)`
- 标签切换/模态：`opacity`+`transform scale(.98)`，`360ms var(--ease-out-expo)`
- toast：`translateY(12px)→0` + `opacity`，220ms
- **禁止**动画化布局属性（width/height/top）；**禁止**回弹/弹性缓动
- `@media (prefers-reduced-motion: reduce)` 关闭位移与缩放，仅保留颜色过渡

---

## 5. 组件库

### 5.1 按钮
| 变体 | 用途 | 样式要点 |
|------|------|---------|
| `btn-primary` | 全部启动、保存 | 底 `brand-600`、字 `neutral-0`、悬浮 `brand-700` + `shadow-md` + translateY(-1px) |
| `btn-accent` | 打开、添加 | 底 `brand-500`、字白（≥18px 或粗体）；小尺寸用 `brand-600` 保对比 |
| `btn-ghost` | 全部关闭、取消 | 透明底、字 `neutral-700`、悬浮 `neutral-100` |
| `btn-subtle` | +添加应用 | 透明底、`brand-700` 字、`brand-200` 边、悬浮 `brand-50` |
| `btn-danger` | 删除 | 底 `accent-coral`、字白 |
| `btn-popup` | 独立窗口 | 底 `neutral-900`、字白（与橙区分，避免撞色） |
尺寸：`sm`(6/12 · 0.78rem)、`md`(9/16 · 0.85rem)。最小触达 44px（移动）。

```css
.btn{display:inline-flex;align-items:center;gap:6px;border:0;border-radius:var(--radius-md);
  font-weight:600;cursor:pointer;transition:background var(--dur-fast),transform var(--dur-base) var(--ease-out-quart),box-shadow var(--dur-base);}
.btn:focus-visible{outline:none;box-shadow:var(--ring-focus);}
.btn:active{transform:translateY(0);}
.btn:disabled{opacity:.55;cursor:not-allowed;pointer-events:none;}
```

### 5.2 列表行（List Row · 核心，替代"卡片套卡片"）
- 容器：面板内，行间用 `1px solid var(--neutral-200)` 发丝线（首行无线）
- 行：`padding:12px 16px`、`border-radius:var(--radius-md)`、悬浮 `background:var(--neutral-100)` + `translateY(-1px)`
- 结构：`[icon-chip] [info: name + path] [actions]`
- 图标 chip：38×38、`--radius-sm`、按分类着色（应用金、文件夹橙、文件珊瑚红）、内含 emoji/字
- 名称：`--text-base` 600 `neutral-900`，单行省略
- 路径：`--font-mono --text-sm neutral-500`，单行省略

### 5.3 输入 / 搜索框
- `padding:10px 14px`、`--radius-md`、底 `neutral-0`、边 `neutral-300`
- focus：边 `brand-500` + `--ring-focus`
- placeholder 用 `neutral-500`（非 400，保 ≥4.5:1）

### 5.4 标签卡（Pill Tab）
- `--radius-pill`、`padding:7px 14px`、`--text-sm`
- 默认：底 `neutral-100`、字 `neutral-700`、边 `neutral-200`
- 激活：底 `brand-500`、字白、边 `brand-500`
- 切换动画：背景色 220ms，不位移

### 5.5 面板（Panel）
- 底 `--surface-1`、`--radius-lg`、`--shadow-sm`、边 `neutral-300`、内边距 `--space-5`
- 标题：`--text-lg` 600 + 点标（10px 圆，按栏色）+ 右侧计数 `tabular-nums neutral-500`

### 5.6 模态（Modal）
- 遮罩 `--overlay`、内容 `--surface-2` `--radius-xl` `--shadow-lg`、`max-width:420px`
- 入场：`opacity 0→1` + `scale(.98)→1`，`360ms var(--ease-out-expo)`
- Esc 关闭、focus trap、首元素聚焦

### 5.7 状态栏 / Toast / 空状态 / 徽标
- 状态栏：固定底、`backdrop-filter:blur(8px)`、底 `neutral-0/85`、字 `neutral-500`、数字 `tabular-nums`
- Toast：底部居中 pill、底 `neutral-900`、字 `neutral-0`、`translateY(12px)→0` 220ms、2s 自隐
- 空状态：居中图标 + 一句引导 + 主操作（教育意义，非纯占位）
- 徽标：`--radius-pill`、`--text-xs`、底=语义 bg、字=语义主色

---

## 6. 布局与响应式

### 6.1 结构
```
<header class="app-header"> 品牌 + 全局启停 + 状态pill </header>
<main class="workbench">   grid 3 col
  <section panel panel-apps>   常用应用
  <section panel panel-folders> 常用文件夹
  <section panel panel-files>   常用文件
</main>
<footer class="status-bar"> 状态 + 轮询 + 端口 </footer>
```

### 6.2 断点（容器优先）
```css
.workbench{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;align-items:start;}
@media (max-width:1100px){.workbench{grid-template-columns:repeat(2,1fr);}.panel-files{grid-column:1 / -1;}}
@media (max-width:760px){.workbench{grid-template-columns:1fr;}}
```
- ≥1100px：三栏并排
- 760–1100px：双栏，文件栏跨整行（在线文件 iframe 需宽）
- ≤760px：单栏纵排，全局按钮下沉为吸底工具条

> **不**因窄屏隐藏关键功能（搜索/启停）；仅折叠次要操作到"⋯"。

---

## 7. 可访问性（WCAG AA）

| 项 | 规范 |
|----|------|
| 文字对比 | 正文≥4.5:1；大字/粗体≥3:1；占位符≥4.5:1 |
| 焦点 | 所有交互元素 `:focus-visible` 显示 `--ring-focus`；可见 tab 顺序 |
| 键盘 | 搜索/标签/按钮/模态全键盘可达；Esc 关模态；Enter 触发主操作 |
| 触达 | 移动端交互区≥44×44px |
| 不依赖颜色 | 栏目除色标外，标题文字明确"常用应用/文件夹/文件"；状态用图标+文字 |
| 动效 | `prefers-reduced-motion` 降级为仅颜色过渡 |
| 缩放 | 允许 200% 缩放不破版（rem + 弹性栅格） |
| ARIA | 搜索框 `role="search"`；标签 `role="tablist/tab/tabpanel"`；模态 `aria-modal` |

---

## 8. 明暗主题

> 暗色**不是**亮色反相。暗色用"更亮的表面"表达层级，去阴影、降彩度。

```css
:root[data-theme="dark"]{
  --bg-app: linear-gradient(135deg, oklch(18% 0.012 55) 0%, oklch(15% 0.010 55) 100%);
  --surface-1: oklch(20% 0.012 55);
  --surface-2: oklch(24% 0.012 55);
  --neutral-0: oklch(20% 0.012 55);
  --neutral-100: oklch(24% 0.012 55);  /* 行悬浮 */
  --neutral-200: oklch(30% 0.012 55);  /* 分隔 */
  --neutral-300: oklch(36% 0.012 55);  /* 边框 */
  --neutral-500: oklch(68% 0.012 55);  /* 次要文字（暗底提亮） */
  --neutral-700: oklch(82% 0.010 55);  /* 正文 */
  --neutral-900: oklch(94% 0.008 55);  /* 标题 */
  --brand-500: oklch(72% 0.14 55);     /* 降彩度 */
  --brand-600: oklch(78% 0.12 55);
  --shadow-sm: none;                   /* 暗色去阴影 */
  --shadow-md: 0 0 0 1px oklch(0% 0 0 / 0.2);
}
```
- token 双层：primitive（`--brand-500` 等原值）+ semantic（`--color-primary:var(--brand-500)`）；暗色只改 semantic 层。
- 正文降一档字重（400→350 不可得时用 400 但提亮）。

---

## 9. 设计 Token 汇总（交付开发）

```css
:root{
  /* color */
  --color-primary:var(--brand-500);
  --color-on-primary:var(--neutral-0);
  --color-text:var(--neutral-700);
  --color-text-strong:var(--neutral-900);
  --color-text-muted:var(--neutral-500);
  --color-surface:var(--surface-1);
  --color-bg:var(--bg-app);
  --color-border:var(--neutral-300);
  --color-divider:var(--neutral-200);
  --color-hover:var(--neutral-100);
  /* semantic */
  --color-success:var(--success); --color-warning:var(--warning);
  --color-error:var(--error);     --color-info:var(--info);
  /* type */
  --font-display:'Plus Jakarta Sans','Noto Sans SC',system-ui,sans-serif;
  --font-body:var(--font-display);
  --font-mono:'JetBrains Mono',ui-monospace,monospace;
  /* motion */
  --ease-out-quart:cubic-bezier(.25,1,.5,1);
  --ease-out-expo:cubic-bezier(.16,1,.3,1);
  /* radius/shadow/spacing 见 §4 */
}
```

---

## 10. 开发者交付清单

1. **Token 层**：将 §9 写入 `:root`，暗色覆写 `[data-theme="dark"]`，仅改 semantic。
2. **字体加载**：`<link rel="preconnect" href="https://fonts.googleapis.com">` + Plus Jakarta Sans(400,500,600,700) + Noto Sans SC(400,500,700)，`display=swap`；离线回退 system-ui。
3. **组件**：按 §5 实现，行优先（非嵌套卡），全部带 `:focus-visible`。
4. **可访问性**：§7 逐项验收，重点占位符对比与键盘流。
5. **响应式**：§6.2 三档断点，窄屏不藏功能。
6. **动效**：用 §4.4 缓动，全局 `prefers-reduced-motion` 降级。
7. **QA**：截图比对原型 `工作台-精致版原型.html`，偏差≤4px。

---

## 附：与现状（v1）差异要点
| 项 | v1（已落地） | v2 精致版 |
|----|------|---------|
| 色彩 | hex 硬编码 | OKLCH + 暖中性 + 双层 token |
| 列表 | 卡片套卡片（面板内 bordered card） | 扁平行 + 发丝线 + 悬浮 |
| 字体 | Segoe UI/Arial | Plus Jakarta Sans + Noto Sans SC |
| 字号 | 任意 px | Major Third 阶 + rem |
| 主按钮对比 | 白字 on brand-500 ≈3.4:1 ⚠ | 白字 on brand-600 ≈4.7:1 ✓ |
| 动效 | opacity/hover 泛用 | ease-out-quart/expo + reduced-motion |
| 暗色 | 无 | 完整暗色主题规范 |
| 可访问性 | 隐式 | WCAG AA 明示 + focus ring + ARIA |
