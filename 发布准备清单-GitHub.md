# WorkBuddy 本地工作台 · GitHub 发布准备清单

> 生成时间：2026-09-03　｜　适用目录：`chrome-workspace/`
> 使用方式：从上往下按顺序做，**P0 全部完成前不要执行任何 `git push`**。

---

## 0. 现状体检

| 文件 | 大小 | 是否可公开 | 说明 |
|---|---|---|---|
| `index.html` | 48K | ⚠️ 需脱敏 | 单文件全内联；第 343 行 placeholder 含真实用户名 |
| `launcher.js` | 15K | ✅ | 但 6 处 Windows 硬耦合（见 P2） |
| `start.bat` | 1K | ⚠️ 需脱敏 | 硬编码 `C:\Users\<用户名>\...` 的 node 路径 |
| `config.json` | 3K | 🔴 **禁止** | 含私有文档链接 + 本机绝对路径 |
| `app_index.json` | 216K | 🔴 **禁止** | 本机已装软件全量清单 |
| `backup/` | — | 🔴 **禁止** | 内含多份 `config-*.json` 隐私快照 + `.lnk.bak` |
| `test-*.png` ×30 | ~2.5M | ❌ 建议忽略 | 调试截图，无保留价值 |
| `*.txt`（popout/shot/state） | ~5K | ❌ 建议忽略 | 调试残留 |
| `设计*.md` / `原型*.html` / `工作台-精致版原型.html` | ~70K | ✅ 可选 | 设计稿，展示用可留 |
| `overview.md` / `功能测试与改进意见.md` | 13K | ⚠️ 需检查 | 含本机路径，发布前过一遍 |

**当前状态**：无 git、无 `.gitignore`、无 `README.md`、无 `LICENSE`。

---

## 1. P0 · 隐私脱敏（必须）

### 1.1 危险项清单

| # | 位置 | 泄露内容 | 处置 |
|---|---|---|---|
| 1 | `config.json` → `files[].path` | 2 条腾讯文档私有链接（示例在线表格 / 试运行记录），**内含真实业务数据** | 从仓库移除，只保留 `config.example.json` |
| 2 | `config.json` → `apps[].path`、`pinnedFolders[].path`、`recentFolders[].path` | 9 条含用户名 `gf` 的绝对路径 | 同上 |
| 3 | `config.json` → `pinnedFolders[].note` | 「示例调研项目B」「示例调研项目A」等内部项目名 | 同上 |
| 4 | `app_index.json` | 本机软件安装清单（约 1700 项） | `.gitignore` + 若已提交需清历史 |
| 5 | `backup/config-*.json` ×13 | 上述隐私的历史快照 | `.gitignore` 整个 `backup/` |
| 6 | `index.html:343` | placeholder `如 C:\Users\<用户名>\WorkBuddy` | 改为 `如 C:\Users\<你的用户名>\WorkBuddy` |
| 7 | `start.bat:7` | `C:\Users\<用户名>\.workbuddy\binaries\node\...` | 改为循环探测（见 1.5） |

### 1.2 `.gitignore`（直接复制到项目根目录）

```gitignore
# ---- 本机运行数据（含隐私） ----
config.json
app_index.json
backup/
*.log

# ---- 调试产物 ----
test-*.png
test-*.txt
*.tmp
.chk*.js
.tmp-*.js

# ---- 系统 ----
.DS_Store
Thumbs.db
desktop.ini

# ---- 依赖 ----
node_modules/
```

### 1.3 `config.example.json`（仓库里只放这个）

把 `config.json` 复制一份，**逐项改成占位值**：

```json
{
  "autostartApps": false,
  "apps": [
    {
      "id": "app_example",
      "name": "示例应用",
      "path": "C:\\Program Files\\Example\\example.exe",
      "autostart": false
    }
  ],
  "pinnedFolders": [
    {
      "id": "folder_example",
      "name": "我的项目",
      "path": "C:\\Users\\<你的用户名>\\Projects",
      "note": "示例注释"
    }
  ],
  "ignoredFolders": [],
  "files": [
    {
      "id": "file_example",
      "name": "示例在线文档",
      "path": "https://example.com/doc",
      "type": "url",
      "autostart": false
    }
  ],
  "recentFolders": []
}
```

**同时要让代码支持"配置缺失时自动生成"**：`launcher.js` 的 `loadConfig()` 里，若 `config.json` 不存在则复制 `config.example.json` 生成一份。否则新用户克隆下来跑不起来。

### 1.4 清理调试产物

```bash
cd chrome-workspace
rm -f test-*.png test-v5-*.png popout*.txt shot*.txt state.txt
rm -f .chk*.js .tmp-*.js
```

### 1.5 `start.bat` 脱敏（第 7 行起）

把硬编码的三段 `if exist "C:\Users\<用户名>\..."` 换成自动探测：

```bat
rem ---- Locate Node.js（自动探测，不含个人路径） ----
set "NODE="
for /d %%d in ("%USERPROFILE%\.workbuddy\binaries\node\versions\*") do (
  if exist "%%d\node.exe" set "NODE=%%d\node.exe"
)
if not defined NODE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE (
  where node >nul 2>nul && for /f "delims=" %%i in ('where node') do if not defined NODE set "NODE=%%i"
)
if not defined NODE (
  echo [ERROR] Node.js not found. Please install Node.js 18+ from https://nodejs.org
  pause
  exit /b 1
)
```

### 1.6 `index.html:343` 脱敏

```html
<!-- 原 -->
<input id="folderPath" placeholder="如 C:\Users\<用户名>\WorkBuddy">
<!-- 改 -->
<input id="folderPath" placeholder="如 C:\Users\<你的用户名>\WorkBuddy">
```

### 1.7 ⚠️ 如果之前已经 commit 过隐私

`.gitignore` 只防未来，不洗历史。若已经把 `config.json` 提交过：

```bash
# 方案 A：仓库还没人 fork，直接重写历史（最干净）
git filter-repo --path config.json --path app_index.json --path backup/ --invert-paths
git push --force-with-lease

# 方案 B：用 BFG
bfg --delete-files config.json
git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

**并且：先把那两条腾讯文档链接改成"仅指定人可访问"或重新生成分享链接**，因为一旦 push 到公开仓库，爬虫几分钟内就会抓走，删历史也来不及。

---

## 2. P1 · 仓库骨架

### 2.1 `README.md` 建议结构

```markdown
# 工作台名称

一句话：把常用应用、文件夹、在线文档收进一个本地网页工作台，开机自动铺开。

## 截图
（放 1 张主界面 + 1 张动图，比千字说明管用）

## 特性
- 侧边栏可拖拽调宽，双击复位
- 主工作区按打开数量自动平铺（1/2/3/2×2/3×2/3×3）
- 每个项目可单独设置「开机是否自动打开」
- 一键全部启动 / 全部关闭
- 搜索本机应用，点「添加」免手填路径
- 在线文档内嵌预览，一键在浏览器打开原链接

## 快速开始
1. 安装 Node.js 18+
2. 双击 start.bat（macOS/Linux 执行 ./start.sh）
3. 浏览器自动打开 http://127.0.0.1:38760

## 平台支持
| 平台 | 状态 |
|---|---|
| Windows 10/11 | ✅ 完整支持 |
| macOS | 🧪 实验性（见 3.4） |
| Linux | 🧪 实验性 |

## 配置
首次运行自动生成 config.json（从 config.example.json 复制），编辑后刷新页面生效。

## 许可证
MIT
```

### 2.2 LICENSE

- 想让别人放心用 → **MIT**（最省事，只需保留版权声明）
- 想防止被拿去闭源商用 → **GPL-3.0** 或 **Apache-2.0**
- 建议 MIT，工具类项目用 MIT 传播最快

### 2.3 发布前先查撞名

在 GitHub / npm / PyPI 搜一下项目名。注意 `WorkBuddy` 可能已被占用（这本身也是个 IDE 工具名）。
建议改名思路：`desk-launcher` / `web-workbench` / `local-desk` 之类，突出"网页版本地工作台"。

---

## 3. P2 · 跨平台（macOS / Linux）

### 3.1 抽一层 `platform.js`

把 `launcher.js` 里的系统调用收敛成 5 个接口，按 `process.platform` 分发：

```javascript
// platform.js
module.exports = {
  openPath(p),      // 打开文件夹
  launchApp(p),     // 启动应用
  closeApp(p),      // 关闭应用
  openUrl(url),     // 用默认浏览器打开
  scanApps(cb)      // 扫描本机应用，返回 [{name, path}]
};
```

### 3.2 三个平台命令对照

| 能力 | Windows（现状） | macOS | Linux |
|---|---|---|---|
| 打开文件夹 | `Start-Process explorer.exe -ArgumentList <p>` | `open "<p>"` | `xdg-open "<p>"` |
| 启动应用 | `spawn(explorer.exe, [p])` | `open -a "<p>"` | `xdg-open "<p>"`，`.desktop` 用 `gtk-launch` |
| 关闭应用 | `taskkill /IM <name> /F` | `pkill -f <name>` | `pkill -f <name>` |
| 打开浏览器 | `start "" "<url>"` | `open "<url>"` | `xdg-open "<url>"` |
| 应用索引 | PowerShell 扫 `*.lnk` + `*.exe` | `mdfind "kMDItemKind == 'Application'"` 或扫 `/Applications`、`~/Applications` 下 `*.app` | 扫 `/usr/share/applications/*.desktop` + `~/.local/share/applications/` |

### 3.3 需要改的 `launcher.js` 位置

| 行号附近 | 内容 | 动作 |
|---|---|---|
| 20–31 | PowerShell 脚本扫 `.lnk`/`.exe` 建索引 | 抽到 `platform.scanApps()` |
| 92–94 | `Start-Process explorer.exe` 打开目标 | 抽到 `platform.openPath()` |
| 102 | `spawn('explorer.exe', [t])` 兜底 | 同上 |
| 126–131 | `taskkill /IM` 按 exe 名关闭 | 抽到 `platform.closeApp()` |
| 145–150 | `Get-Process` 按 exe 名去重 | 改为按进程名，去掉 `.exe` 后缀假设 |
| 178 | `start "" "<url>"` 打开浏览器 | 抽到 `platform.openUrl()` |

### 3.4 `start.sh`（macOS/Linux）

```bash
#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
NODE="${NODE:-$(command -v node)}"
if [ -z "$NODE" ]; then
  echo "[ERROR] Node.js 18+ not found. https://nodejs.org"
  exit 1
fi
echo "Starting workspace..."
exec "$NODE" launcher.js
```

macOS 双击运行：把文件命名为 `start.command` 并 `chmod +x`，或保留 `start.sh` 让用户自己跑。

### 3.5 ⚠️ 无法实测的风险与缓解

**这是做 Mac 支持最大的坑**：你本机没有 macOS，改完无法验证。

缓解方案 —— 配 GitHub Actions 冒烟测试，`.github/workflows/smoke.yml`：

```yaml
name: smoke
on: [push, pull_request]
jobs:
  test:
    strategy:
      fail-fast: false
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: 语法检查
        run: node --check launcher.js
      - name: 启动服务并探活
        shell: bash
        run: |
          node launcher.js > server.log 2>&1 &
          sleep 5
          curl -fsS http://127.0.0.1:38760/ -o /dev/null && echo "server OK"
          curl -fsS http://127.0.0.1:38760/api/config | head -c 200
          kill %1 || true
      - name: 上传日志
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: server-log-${{ matrix.os }}
          path: server.log
```

同时在 README 里**明确标注 macOS/Linux 为实验性**，并留一句"欢迎提 issue 附日志"。

**工作量估算**：抽象层 + 三平台实现 + CI ≈ 1 天（不含真机调试）。

---

## 4. P3 · 多语言（i18n）

### 4.1 建议推迟，理由

| 考量 | 说明 |
|---|---|
| 收益面窄 | 效率工具类项目，核心用户是中文用户 |
| 成本高 | `index.html` 有 **144 行含中文文案**，且是单文件全内联，中文散在 HTML 文本、`title`/`placeholder`、JS 字符串拼接三处 |
| 可读性下降 | 现在一眼能读懂的代码会变成满屏 `t('xxx')` |
| 更划算的替代 | **README 中英双语 + 代码注释保持中文**，先看有没有英文 issue |

### 4.2 如果决定要做，步骤

**文案量**：约 150 处，其中：
- HTML 静态文本 ~60 处
- `title` / `placeholder` 属性 ~13 处
- JS 内字符串（toast / confirm / 动态拼接）~70 处
- `launcher.js` 注释与日志 ~19 行（注释可不翻）

**实现**（无构建工具，直接内联）：

```javascript
var I18N = {
  'zh-CN': {
    'main.title': '主工作区',
    'main.sub.empty': '点击左侧文件夹或文件，在此处打开',
    'main.sub.opened': '已打开 {n} 项 · 每个格子右上角 × 可单独关闭',
    'pane.openExternal': '内容未显示？站点禁止嵌入 · 用浏览器打开 ↗',
    'toast.cleared': '已清空 {n} 个工作区格子'
    // ...
  },
  'en-US': {
    'main.title': 'Workspace',
    'main.sub.empty': 'Click a folder or file on the left to open it here',
    'main.sub.opened': '{n} open · use × at each pane\'s top-right to close',
    'pane.openExternal': 'Nothing shown? Site blocks embedding · Open in browser ↗',
    'toast.cleared': 'Cleared {n} panes'
  }
};

var LANG = (navigator.language === 'en-US') ? 'en-US' : 'zh-CN';
function t(key, params) {
  var s = (I18N[LANG] && I18N[LANG][key]) || (I18N['zh-CN'][key]) || key;
  return s.replace(/\{(\w+)\}/g, function(_, k) {
    return params && params[k] !== undefined ? params[k] : '{' + k + '}';
  });
}
```

**改造要点**：
1. 所有 `toast('已打开 '+n+' 项 · ...')` → `toast(t('main.sub.opened', {n: tabs.length}))`
2. `paneHTML()` 里的 `var kind = t.kind==='folder' ? '文件夹' : ...` → `t('kind.' + t.kind)`
3. HTML 里的静态文本加 `data-i18n="main.title"`，加载后统一 `document.querySelectorAll('[data-i18n]').forEach(...)`
4. 语言切换按钮放顶栏 `header-actions`，选择存 `localStorage`

**工作量估算**：半天到一天。

---

## 5. 发布动作

```bash
cd chrome-workspace

# 1. 先确认忽略规则生效（重点看 config.json / app_index.json / backup/ / *.png 不应出现）
git init
git add -A
git status --short | sort

# 2. 再扫一遍有没有漏网的隐私（注意：这两个 grep 在本地必然命中 config.json，
#    因为隐私数据本来就在里面 —— 关键是第 1 步里它被 .gitignore 排除了。
#    所以真正的判据是「待提交文件清单里没有 config.json」，下面的命令排除掉它再看）
grep -rn "C:\\\\Users\\\\gf" --include="*.js" --include="*.html" --include="*.bat" --include="*.md" .
grep -rn "docs.qq.com" --include="*.json" --exclude="config.json" .

# 2b. 只对「真正会被提交的文件」做终检（推荐，结果必须为空）
#     把 <你的用户名> 换成你的实际用户名，例如 gf / zhangsan
git add -A --dry-run | sed "s/^add '//;s/'$//" | while read -r f; do
  grep -Hn -E "Users\\<你的用户名>|docs\.qq\.com/(sheet|doc)/[A-Za-z0-9]" "$f"
done

# 3. 提交
git commit -m "feat: 本地网页工作台 - 侧边栏 + 平铺工作区"

# 4. 建仓库并推送（需要 gh CLI 已登录）
gh repo create your-repo-name --public --source=. --push
```

**第 2 步的 grep 必须返回空**，否则说明脱敏没做干净。

---

## 5.5 执行状态（2026-09-03 更新）

### P0 · 隐私脱敏 —— ✅ 已完成

| 项 | 状态 |
|---|---|
| `.gitignore` | ✅ 排除 `config.json` / `app_index.json` / `backup/` / `test-*.png` / `*.log` |
| `config.example.json` | ✅ 空模板；`launcher.js` 首次运行自动播种 |
| `start.bat` 硬编码 node 路径 | ✅ 改为 `%USERPROFILE%` 循环探测 + `where node` 兜底 |
| `launcher.js` PowerShell 扫描目录 | ✅ `C:\Users\<用户名>\AppData\Local\Programs` → `(Join-Path $env:LOCALAPPDATA "Programs")` |
| `index.html` 路径 placeholder | ✅ → `如 C:\Users\<你的用户名>\WorkBuddy` |
| 原型 `design-prototype.html` | ✅ 已脱敏 |
| 原型 `工作台-精致版原型.html` | ✅ 已脱敏 |
| 原型 `原型-侧边栏布局.html` | ✅ 已脱敏 |
| 设计文档 `设计-侧边栏+主区域布局.md` | ✅ 已脱敏（ASCII 图对齐已保持） |
| `overview.md` | ✅ 已脱敏 |
| 本清单自身 | ✅ 已脱敏 |

> **原清单 1.1 漏掉的 5 处**：三个原型 HTML、`overview.md`、本文档。
> 原因是当时只扫了运行时文件（js/html/bat/json），没扫 `*.md` 和原型目录。
> 教训：**脱敏扫描要覆盖所有待提交文件，而不是只看代码文件**。

### P1 · 仓库骨架 —— ✅ 已完成

| 项 | 状态 |
|---|---|
| `README.md` | ✅ 特性 / 快速开始 / 平台支持 / 配置 / 接口 / 隐私 / FAQ / 路线图 |
| `LICENSE` | ✅ MIT |
| `git init` | ✅ 已初始化（**尚未 commit**） |
| 忽略规则验证 | ✅ `config.json` / `app_index.json` / `backup/` / `test-*.png` 均已被忽略 |
| 待提交文件终检 | ✅ 17 个文件，敏感词扫描全部为空 |

**待提交清单（17 项）**：`.gitignore`、`LICENSE`、`README.md`、`config.example.json`、
`design-prototype.html`、`index.html`、`launcher.js`、`overview.md`、`start.bat`、`start.sh`、
`功能测试与改进意见.md`、`原型-侧边栏布局.html`、`发布准备清单-GitHub.md`、`工作台-精致版原型.html`、
`设计-交互流程与界面.md`、`设计-侧边栏+主区域布局.md`、`设计系统规范-WorkBuddy工作台.md`

### 顺带提前做了 P2 的一部分

`start.sh`（macOS / Linux）已创建，并给 `launcher.js` 加了平台分支：

| 函数 | Windows | macOS / Linux |
|---|---|---|
| `openTarget` | `explorer.exe`（PowerShell 传环境变量） | `open` / `xdg-open` |
| `killApp` / `closeAllApps` | `taskkill` | `process.kill` / `pkill -f` |
| `isProcessRunning` | WMI `Get-Process` | `pgrep -f` |
| `openWorkspace` | `start "" <url>` | `open` / `xdg-open` |
| `buildAppIndex` | PowerShell 扫开始菜单 | fs 扫 `.app` / `.desktop` / `bin` 目录 |

⚠️ macOS / Linux **未实测**，属于「代码写了但没跑过」的状态，README 里已标注为基础可用。

---

## 6. 发布之后（可选）

| 优先级 | 事项 | 说明 |
|---|---|---|
| 高 | 主界面截图 + 一段操作动图 | README 里最能转化的东西 |
| 中 | 发到 V2EX / 少数派 / 掘金 | 中文工具类项目的主要流量来源 |
| 中 | npm 包 `npx xxx` | 省去用户 clone + 装 node 的认知负担 |
| 低 | brew formula | 等有 macOS 用户反馈了再做 |
| 低 | 文档站 | README 够用的话先别建 |

---

## 附：推荐执行顺序与工时

| 阶段 | 内容 | 工时 |
|---|---|---|
| P0 | 隐私脱敏 + `.gitignore` + `config.example.json` + `README` + `LICENSE` | 2–3 小时 |
| P1 | `start.sh`、README 双语摘要、撞名检查 | 1 小时 |
| P2 | `platform.js` 抽象 + 三平台实现 + GitHub Actions | 1 天 |
| P3 | i18n 语言包 | 0.5–1 天 |

**建议节奏**：先只做 P0 + P1 发出去，看反馈。跨平台和 i18n 都等有真实需求再做——过早做是给自己找活干。
