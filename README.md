# 本地工作台

一个跑在**你自己电脑上**的网页工作台。左侧固定你常用的应用、文件夹和文件，右侧平铺所有已打开的内容。
零依赖、单端口、只监听 `127.0.0.1`，不联网、不上传任何数据。
适合vibe coding时项目文件存在很深的路径，需要时找不到的情况。Claude Code， Codex，Workbuddy的重度使用者都需要。也可以做看板使用，设置常用文件，启动时在主工作区自动打开每日要看的指标文件即可。
Claude Code， Codex，Workbuddy做项目，做任务保存目录大都以日期时间作为目录名，过时就忘，工作台提供注释功能，根据注释名，一眼看到想看的文件夹，点击就能马上访问。

> **English:** A self-hosted, zero-dependency web workspace for your own machine. Pin your frequently used apps, folders and files on the left, tile your open content on the right. Single port, localhost only, no external services.

---

## 特性

**常用应用**
- 点击整行直接启动本地程序
- 「搜索本地应用」：按名字搜（支持中文），搜到即可一键加入列表，不用手填路径
- 每项独立开关「启动时自动打开」，外加总开关
- 「全部启动 / 全部关闭」；已运行的程序会被识别并跳过，不重复拉起

**常用文件夹**
- 固定 / 取消固定，可给每个文件夹写注释
- 「最近访问」自动记录，实时刷新
- 打开路径经环境变量传递，中文、空格、`&`、`()` 都安全，不会触发系统报警声

**常用文件**
- 本地文件（`file://`）和在线文档（`http(s)://`）都能放
- 右侧主工作区平铺展示，每个格子自带标题、来源徽标与关闭按钮
- 在线文档若被站点的 `frame-ancestors` 拦住，格子里会给出「用浏览器打开 ↗」兜底按钮
- 一键「清空工作区」

**界面**
- 侧边栏与主区之间可拖动分隔条（双击复位）
- 深浅色主题切换，偏好存 localStorage
- 浅色 / 深色两套配色，默认跟随 IDE 主题习惯

---

## 快速开始

### 环境要求

- **Node.js 18+**（仅用到内置模块，无需 `npm install`）

### Windows

双击 `start.bat`，或者：

```bat
cd <项目目录>
start.bat
```

### macOS / Linux

```bash
cd <项目目录>
chmod +x start.sh   # 仅首次
./start.sh
```

手动启动也是一行：

```bash
node launcher.js
```

服务启动后会自动用**系统默认浏览器**打开 `http://127.0.0.1:38760/`。
端口被占用时会自动顺延到 38761、38762…，前端通过 `location.origin` 自适应，无需手动改端口。

停止服务：在终端按 `Ctrl+C`。

---

## 平台支持

| 平台 | 状态 | 说明 |
|---|---|---|
| Windows 10/11 | ✅ 完整 | 应用索引扫描开始菜单 `.lnk` + `Program Files`；打开用 `explorer.exe`；关闭用 `taskkill` |
| macOS | ⚠️ 基础可用 | 应用索引扫描 `/Applications` 下的 `.app` 与常用 `bin` 目录；打开用 `open`，关闭用 `pkill` |
| Linux | ⚠️ 基础可用 | 应用索引解析 `.desktop` 文件与常用 `bin` 目录；打开用 `xdg-open`，关闭用 `pkill` |

macOS / Linux 上核心流程（固定、打开、平铺、配置持久化）都已跑通，但**没有做过完整回归测试**，欢迎提 issue。

---

## 配置

所有数据都存在项目根目录的 `config.json` 里。**这个文件不会进 Git**（见 `.gitignore`），首次运行时由 `config.example.json` 自动播种一份空配置。

```jsonc
{
  "autostartApps": false,        // 总开关：服务启动时是否自动拉起所有应用
  "apps": [                      // 常用应用
    {
      "id": "idmtxxxxxxxx",      // 自动生成
      "name": "微信",
      "path": "C:\\Program Files (x86)\\Tencent\\WeChat\\WeChat.exe",
      "autostart": false         // 单项开关
    }
  ],
  "pinnedFolders": [             // 固定文件夹
    { "id": "idmtxxxxxxxx", "name": "报告", "path": "D:\\work\\report", "note": "季度汇总" }
  ],
  "ignoredFolders": [],          // 「最近访问」中隐藏的文件夹
  "files": [                     // 常用文件
    { "id": "idmtxxxxxxxx", "name": "周报", "path": "D:\\work\\周报.docx", "type": "local", "autostart": false },
    { "id": "idmtxxxxxxxx", "name": "在线表格", "path": "https://example.com/sheet/xxx", "type": "url" }
  ],
  "recentFolders": []            // 最近访问（自动维护，最多 10 条）
}
```

`type` 会自动判断：路径以 `http(s)://` 开头即为 `url`，否则为 `local`。

---

## 目录结构

```
chrome-workspace/
├── index.html          # 单文件前端（CSS/JS 全内联）
├── launcher.js         # Node 零依赖 HTTP 服务
├── start.bat           # Windows 启动脚本（自动探测 Node）
├── start.sh            # macOS / Linux 启动脚本
├── config.example.json # 配置模板（仓库内版本，无真实数据）
├── config.json         # 你的实际配置 —— 不进 Git
├── app_index.json      # 应用搜索索引缓存 —— 不进 Git
├── backup/             # 配置自动备份 —— 不进 Git
└── *.md / *原型*.html   # 设计文档与界面原型
```

### 后端接口

| 方法 | 路由 | 用途 |
|---|---|---|
| GET | `/api/config` | 读取配置 |
| POST | `/api/save-config` | 保存配置（自动备份到 `backup/`） |
| GET | `/api/open?target=<路径>` | 打开应用 / 文件夹（`javascript:` 等危险 scheme 会被拦截） |
| GET | `/api/apps` | 应用列表 |
| GET | `/api/stat` | 服务状态 |
| GET | `/api/recent-folders` | 最近访问文件夹 |
| GET | `/api/search?q=<关键词>` | 搜索本地应用 |
| GET | `/api/index/build` | 重建应用索引 |
| GET | `/api/launch-all?ids=a,b` | 批量启动（不传 ids 则全部） |
| GET | `/api/close-all` | 批量关闭 |

---

## 隐私

这个项目会接触你本机的路径、应用清单和在线文档链接，所以发布前做了脱敏处理：

- `config.json`、`app_index.json`、`backup/` 均在 `.gitignore` 中，**不会被提交**
- 仓库内所有示例数据都已替换为占位符（`<用户名>`、`<你的表格ID>`、`示例项目A` 等）
- 服务只监听 `127.0.0.1`，不做任何外网请求

**首次提交前建议再跑一遍自检：**

```bash
grep -rn "docs.qq.com" --include="*.json" .     # 应无输出（config.json 已被忽略）
grep -rn "Users\\\\" --include="*.html" --include="*.md" .  # 应只剩 <用户名> 占位符
git status --short                              # 确认 config.json / backup/ 未出现在列表中
```

---

## 常见问题

**Q：双击 `start.bat` 一闪而过？**
A：命令行里运行一次看报错。最常见是没装 Node.js 或版本低于 18。

**Q：搜索不到我装的应用？**
A：索引在服务启动时后台构建，大目录需要几十秒。索引未就绪时搜索框会提示「正在建立应用索引…」。也可以手动重建：访问 `http://127.0.0.1:38760/api/index/build`。

**Q：在线文档格子里一片空白？**
A：很多在线文档站点设置了 `X-Frame-Options` / `frame-ancestors`，不允许被嵌入。格子里的「用浏览器打开 ↗」按钮会用新标签打开原链接。

**Q：能改端口吗？**
A：改 `launcher.js` 顶部的 `var PORT = 38760;`。前端不需要改。

---

## 路线图

- [ ] **跨平台完善**：macOS / Linux 完整回归测试，`~/.config` 配置目录
- [ ] **多语言**：界面文案抽离为 i18n 字典（中 / 英）
- [ ] 子工作区分组、更多主题

---

## 许可

[MIT](./LICENSE) — 随便用，改坏了不负责。
