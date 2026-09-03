# Chrome 网页工作台 — 交付说明（更新于 2026-09-03）

## 当前状态
- **配置 `config.json` = 2026-08-22 00:29 快照**（8/22 8:55 之前、且最接近的一份）：apps 5 个（workbuddy / ima / Google Chrome / 办公系统 / 微信）、固定文件夹 2 个、常用文件 2 个、`autostartApps: true`、**无 `recentFolders` 字段**。
- **代码 `launcher.js` / `index.html` = 在本机可用代码基础上补齐了历史需求缺口的工作版**（见下文「历史需求落实情况」）。8/22 8:55 之前无任何代码快照，唯一代码备份是 8/24；本次在可用代码上修复了搜索/打开/缓存三处缺口。

## 项目位置
`<项目根目录>\`
双击 `start.bat` 启动；浏览器访问 `http://127.0.0.1:38760`。

**端口说明**：`launcher.js` 用 `findFreePort` 从 38760 起找空闲端口（被占用顺延 38761…）。前端 `index.html` 的 `BASE` 现在通过 `location.origin` 自适应后端端口，无需保证 38760 空闲。

## 历史需求落实情况（本次审计后修正）
| # | 需求 | 状态 | 说明 |
|---|------|------|------|
| A | 双击 start.bat 全开；按钮一键全开/全关 | ✅ 已满足 | `autostartApps` 自动拉起；页面有「全部启动 / 全部关闭」按钮 |
| B | 添加应用时「搜索本地应用」，按名搜索免手填路径 | ✅ **已修复** | 见下「本地应用搜索」 |
| C | 列表空白 + 搜索不对 | ✅ 已加固 | 加 `Cache-Control: no-store` 防旧缓存空白列表 |
| D | 点击常用文件夹报警声/打不开 | ✅ **已修复** | 见下「打开机制」 |
| E | 在线文件标签卡片 → 在浏览器新标签直接打开 | ✅ 已简化 | 原 `/popout.html` 已被移除；现在 ⧉ 按钮和「内容未显示？用浏览器打开 ↗」兜底提示都直接 `window.open(active.path)`，不再被站点的 frame-ancestors 阻挡 |
| F | 安装 codex++ | ⚠️ 非本项目功能 | 推荐市场无此技能；用户当时未提供来源，已搁置 |

## 本地应用搜索（需求 B，本次核心修复）
- 路由：`GET /api/search?q=<关键词>` 返回 `{apps:[{name,path}], building:bool}`。
- 索引构建（`buildAppIndex`，服务启动后台异步、缓存到 `app_index.json`，≤24h 复用）：
  - 扫描**开始菜单**（用户+公共+桌面）下所有 `.lnk`，以快捷方式**显示名（含中文）**为 name、解析出的真实 exe 路径（或 .lnk 自身路径，解析失败兜底）为 path；
  - 扫描常用 `Program Files` 目录下的 `.exe`。
- 前端：搜索框输入即调 `/api/search`，结果卡片带「打开 / 添加」按钮；「添加」直接把找到的应用加入列表并保存（免手填路径）；索引未建好时显示「正在建立应用索引…」。
- 实测：索引约 1700 项（含 148 个中文名）；搜 `微信`→微信、搜 `千问`→千问、搜 `chrome`→Chrome 系，均命中。

## 打开文件夹/应用机制（需求 D，本次核心修复）
- 路由 `GET /api/open?target=<路径>`（注意：GET query，非 POST）。
- 后端用 `Start-Process explorer.exe` 打开，**路径经环境变量传入**（不经 shell 解析），中文/空格/`&`/`()` 均安全、**无系统报警声**；`javascript:`/`vbscript:` 等危险 scheme 被 `sanitizeTarget` 拦截返回 `{"ok":false}`。
- 打开文件夹时后端自动记录到 `config.recentFolders`（页面「最近访问」区展示）。

## 文件清单
| 文件 | 说明 |
|------|------|
| `launcher.js` | Node 零依赖 http 服务（端口 38760 顺延）；路由 /api/config、/api/apps、/api/open、/api/stat、/api/recent-folders、/api/search、/api/index/build、/api/save-config、/api/launch-all、/api/close-all |
| `index.html` | 单文件页面（全内联 CSS/JS），三大区 + 标签卡片 + 链接型文件「用浏览器打开」直接开原链接 + 搜索「添加」 |
| `config.json` | 应用/固定文件夹/常用文件（**8/22 00:29 快照**），保存自动备份到 `backup/` |
| `start.bat` | 自动定位 node（托管版优先）双击启动 |
| `app_index.json` | 应用搜索索引缓存（启动后台构建） |
| `backup/` | 配置与代码历史快照（含恢复来源与回滚点） |

## 已验证项（2026-08-26 实测）
- `/api/config` 返回 8/22 00:29 数据（apps 5 / pinned 2）✓
- 搜索 `微信`/`千问`/`chrome` 均命中正确应用与路径 ✓
- 打开中文文件夹「项目A」「项目B」→ `{"ok":true}`，资源管理器弹出、**无报警声** ✓
- `javascript:` 危险 scheme → `{"ok":false}` 被拦截 ✓
- `/popout.html` 路由已移除（链接型文件直接用原链接开新标签） ✓
- 首页 `Cache-Control: no-store` 已生效 ✓

## 本次新增（2026-09-03）
| # | 需求 | 实现 | 验证 |
|---|------|------|------|
| G | 链接型常用文件不再被 `popout.html` 包裹，直接访问原链接 | `popoutPane()` 改为 `window.open(active.path,'_blank','noopener')`；后端 `/popout.html` 路由移除；url pane 增加「内容未显示？用浏览器打开 ↗」兜底按钮 | agent-browser eval 拦截 window.open：返回原 `https://docs.qq.com/sheet/<你的表格ID>` ✓ |
| H | 工作台启动不再强制 Chrome，改用系统默认浏览器 | 删除 `findChrome()`；`openWorkspace()` 直接 `start "" "<url>"`（ShellExecute 走 http 默认处理程序） | 启动日志：`Opened workspace with default browser: http://127.0.0.1:38760/` ✓ |
| I | 侧边栏主区域之间可拖动分隔条 | CSS 变量 `--sidebar-width` + mousedown/mousemove/mouseup + localStorage + 双击复位 | 历史实现，本轮已稳定 |
| J | 常用文件/启动程序可单独选择是否「启动时自动打开」 | 每项 `autostart` 字段 + ⚡ 切换按钮 + 总开关 + 后端 `/api/launch-all?ids=` 按 ID 过滤 | 历史实现，本轮已稳定 |
| K | 主工作区去掉冗余标签栏（平铺模式下标题/在线/× 都已在 pane 头重复） | 删 `.tabbar` DOM + `.tab*` `.badge-*` CSS + `renderTabs()`；main-head 改为 flex 布局，加「清空工作区」按钮与 `renderMainHead()` | agent-browser eval：`tabbarExists:false`/`tabNodes:0`；清空按钮切换正确 ✓ |

## 回滚与历史快照（`backup/`）
- `config-2026-08-21T16-29-22-410Z.json` —— 当前使用的 8/22 00:29 配置（目标）
- `config-wrong-4apps-*.json` —— 恢复前误存为 4 app 的错误配置（如需参照）
- `launcher-2026-08-24T23-42-03.js` / `index-2026-08-24T23-42-03.html` —— 8/24 代码备份（本轮在此基础上修复）
- `config-pre-855restore-*.json` / `config-pre-restore-*.json` —— 更早回滚点

---

## GitHub 发布准备（2026-09-03）

完整方案见 `发布准备清单-GitHub.md`。当前进度：

### P0 · 隐私脱敏 ✅ 已完成
- `.gitignore` 排除 `config.json` / `app_index.json` / `backup/` / `test-*.png` / `*.log`
- 新增 `config.example.json`，`launcher.js` 首次运行自动播种 `config.json`
- `start.bat` 不再硬编码 node 路径（改为 `%USERPROFILE%` 探测 + `where node` 兜底）
- `launcher.js` 的 PowerShell 扫描目录改用 `$env:LOCALAPPDATA`
- `index.html` placeholder 改为 `C:\Users\<你的用户名>\WorkBuddy`
- **补漏**：三个原型 HTML、`overview.md`、发布清单本文档中的真实路径与私有腾讯文档链接全部替换
  （原方案只扫了 js/html/bat/json，漏了 `*.md` 与原型目录）

### P1 · 仓库骨架 ✅ 已完成
- 新增 `README.md`（特性 / 快速开始 / 平台支持 / 配置说明 / 接口表 / 隐私 / FAQ / 路线图）
- 新增 `LICENSE`（MIT）
- `git init` 已初始化，**尚未 commit**
- 待提交 17 个文件，敏感词终检全部为空；`config.json` 等隐私文件确认已被忽略

### 顺带做了 P2 的一部分
- 新增 `start.sh`（macOS / Linux）
- `launcher.js` 增加平台分支：打开用 `open` / `xdg-open`，关闭用 `pkill` / `process.kill`，
  进程检测用 `pgrep -f`，应用索引用 fs 扫 `.app` / `.desktop` / `bin` 目录
- ⚠️ macOS / Linux 未实测，仅 Windows 路径验证通过（索引重建 1739 应用、各接口返回正常）

### 下一步
确认待提交清单无误后执行 `git add -A && git commit`，再 `gh repo create` 推送。
**推送前务必再看一眼 `git status --short`，确认 `config.json` 不在列表里。**
