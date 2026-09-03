var fs = require('fs');
var path = require('path');
var http = require('http');
var cp = require('child_process');
var url = require('url');
var BD = __dirname; // 以 launcher.js 所在目录为基准，随项目目录迁移
var CF = BD + '/config.json';
var CF_EXAMPLE = BD + '/config.example.json';
var AF = BD + '/app_index.json';
var BF = BD + '/backup';
var PORT = 38760;
var IS_WIN = process.platform === 'win32';
var IS_MAC = process.platform === 'darwin';
var server = null;
var launchedPids = new Map();
var appIndex = null;
var appIndexBuilding = false;
var INDEX_MAX_AGE = 24 * 60 * 60 * 1000; // 1 天

console.log('launcher loaded');

// ---------------------------------------------------------------
// PowerShell 脚本：扫描开始菜单 .lnk（解析真实 exe 路径）+ 常用 Program 目录 exe，
// 输出 JSON 数组 [{name, path}]。通过环境变量传递参数，避免 shell 解析中文/空格/&。
// ---------------------------------------------------------------
var PS_APPINDEX = [
  '$ErrorActionPreference="SilentlyContinue"',
  '$dirs=@([Environment]::GetFolderPath("Programs"),[Environment]::GetFolderPath("CommonPrograms"),[Environment]::GetFolderPath("Desktop"),[Environment]::GetFolderPath("CommonDesktopDirectory"))',
  '$progDirs=@("C:\\Program Files","C:\\Program Files (x86)",(Join-Path $env:LOCALAPPDATA "Programs"))',
  '$ws=$null; try{ $ws=New-Object -ComObject WScript.Shell }catch{}',
  '$map=@{}',
  'function AddApp($n,$p){ if($p -and -not $map.ContainsKey($p)){ $map[$p]=$n } }',
  'foreach($d in $dirs){ if(Test-Path $d){ Get-ChildItem $d -Filter *.lnk -Recurse -Depth 4 -ErrorAction SilentlyContinue | ForEach-Object { $p=$_.FullName; if($ws){ try{ $sc=$ws.CreateShortcut($p); if($sc.TargetPath){ $p=$sc.TargetPath } }catch{} } AddApp $_.BaseName $p } } }',
  'foreach($d in $progDirs){ if(Test-Path $d){ Get-ChildItem $d -Filter *.exe -Recurse -Depth 3 -ErrorAction SilentlyContinue | ForEach-Object { AddApp $_.BaseName $_.FullName } } }',
  '$arr=@()',
  '$map.GetEnumerator() | ForEach-Object { $arr+=@{name=$_.Value; path=$_.Key} }',
  '[Console]::OutputEncoding=[System.Text.Encoding]::UTF8',
  '$arr | ConvertTo-Json -Compress'
].join('\n');

function generateId() {
  return 'idmt' + Math.random().toString(36).substr(2, 9);
}

/* 空配置模板：config.example.json 缺失时的兜底 */
function defaultConfig() {
  return {
    autostartApps: false,
    apps: [],
    pinnedFolders: [],
    ignoredFolders: [],
    files: [],
    recentFolders: []
  };
}

function loadConfig() {
  // 首次运行：config.json 不存在 → 从 config.example.json 播种（没有则用空模板）
  if (!fs.existsSync(CF)) {
    var seed = defaultConfig();
    try {
      if (fs.existsSync(CF_EXAMPLE)) {
        seed = JSON.parse(fs.readFileSync(CF_EXAMPLE, 'utf8'));
        console.log('config.json not found — seeded from config.example.json');
      } else {
        console.log('config.json not found — created from built-in template');
      }
    } catch (e0) {
      console.warn('config.example.json unreadable, falling back to empty template:', e0.message);
      seed = defaultConfig();
    }
    try {
      fs.writeFileSync(CF, JSON.stringify(seed, null, 2));
      console.log('Created config.json');
    } catch (e1) {
      console.error('Failed to create config.json:', e1.message);
    }
    return seed;
  }
  try {
    return JSON.parse(fs.readFileSync(CF, 'utf8'));
  } catch (e) {
    // 配置存在但损坏：不覆盖，回退空配置以免整个服务起不来
    console.error('config.json is corrupted, using empty config:', e.message);
    return defaultConfig();
  }
}

function saveConfig(cfg) {
  try {
    if (!fs.existsSync(BF)) fs.mkdirSync(BF, { recursive: true });
    var ts = new Date().toISOString().replace(/[:.]/g, '-');
    fs.writeFileSync(BF + '/config-' + ts + '.json', JSON.stringify(cfg, null, 2));
    fs.writeFileSync(CF, JSON.stringify(cfg, null, 2));
  } catch (e) {
    console.error('saveConfig error', e);
  }
}

function saveAppIndex(idx) {
  try {
    fs.writeFileSync(AF, JSON.stringify(idx, null, 2));
    appIndex = idx;
  } catch (e) {
    console.error('saveAppIndex error', e);
  }
}

function loadAppIndex() {
  try {
    var d = JSON.parse(fs.readFileSync(AF, 'utf8'));
    appIndex = d;
    return d;
  } catch (e) {
    return null;
  }
}

function sanitizeTarget(t) {
  if (!t) return null;
  var s = String(t).toLowerCase().trim();
  if (s.indexOf('javascript:') >= 0 || s.indexOf('vbscript:') >= 0) return null;
  return t;
}

// 用环境变量传路径，彻底绕开 shell 解析 -> 中文/空格/&/() 都安全，无系统报警声
function openTarget(target) {
  var t = sanitizeTarget(target);
  if (!t) return false;
  if (!IS_WIN) {
    // macOS: open ；Linux: xdg-open —— 均交给系统默认处理程序
    try {
      var p0 = cp.spawn(IS_MAC ? 'open' : 'xdg-open', [t], { detached: true, stdio: 'ignore' });
      p0.unref();
      return true;
    } catch (e0) {
      console.error('openTarget failed:', e0.message);
      return false;
    }
  }
  try {
    var script = 'Start-Process -FilePath explorer.exe -ArgumentList $env:OPEN_TARGET';
    var encoded = Buffer.from(script, 'utf16le').toString('base64');
    cp.execSync('powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ' + encoded, {
      timeout: 8000,
      stdio: 'ignore',
      env: Object.assign({}, process.env, { OPEN_TARGET: t })
    });
    return true;
  } catch (e) {
    try {
      var p = cp.spawn('explorer.exe', [t], { windowsHide: true, detached: true, stdio: 'ignore' });
      p.unref();
      return true;
    } catch (e2) {
      return false;
    }
  }
}

function launchApp(app) {
  var ok = openTarget(app.path);
  if (ok) launchedPids.set(app.id, Date.now());
  return ok;
}

function killApp(appId) {
  var pid = launchedPids.get(appId);
  if (pid) {
    if (IS_WIN) {
      try { cp.spawnSync('taskkill', ['-F', '-PID', String(pid)], { windowsHide: true }); } catch (e) {}
    } else {
      try { process.kill(Number(pid), 'SIGTERM'); } catch (e) {}
    }
    launchedPids.delete(appId);
  }
}

function closeAllApps() {
  var cfg = loadConfig();
  var killed = new Set();
  (cfg.apps || []).forEach(function(a) {
    var p = String(a.path || '').trim();
    if (!p) return;
    if (IS_WIN) {
      if (!/\.exe$/i.test(p)) return; // 仅对 .exe 目标做进程关闭（文件夹/URL 无进程可关）
      var name = p.replace(/^.*[\\\/]/, '');
      if (killed.has(name.toLowerCase())) return;
      killed.add(name.toLowerCase());
      try { cp.spawnSync('taskkill', ['/IM', name, '/F', '/T'], { windowsHide: true }); } catch (e) {}
    } else {
      // macOS / Linux：按完整路径 pkill -f（数组传参，不经 shell，无注入风险）
      if (killed.has(p)) return;
      killed.add(p);
      try { cp.spawnSync('pkill', ['-f', p], { stdio: 'ignore' }); } catch (e) {}
    }
  });
  launchedPids.clear();
}

// 判断某 exe 路径对应的进程是否已在运行（用于「全部启动」去重，避免重复拉起已在运行的程序）。
// 用 WMI ExecutablePath 精确比对；通过 EncodedCommand 传参，绕开 shell 对路径中的空格/中文/反斜杠的解析。
function isProcessRunning(exePath) {
  if (!exePath) return false;
  var s = String(exePath).trim();
  if (!s) return false;
  if (!IS_WIN) {
    // pgrep -f 精确匹配完整路径（数组传参，不经 shell）
    try {
      var r = cp.spawnSync('pgrep', ['-f', s], { encoding: 'utf8' });
      return r.status === 0 && String(r.stdout || '').trim().length > 0;
    } catch (e) {
      return false;
    }
  }
  if (!/\.exe$/i.test(s)) return false; // 仅对 .exe 目标做进程级去重（文件夹/URL 无法可靠判断）
  var name = s.replace(/^.*[\\\/]/, '').replace(/\.exe$/i, ''); // 取 exe 文件名（去扩展名），Get-Process 按名匹配（大小写不敏感）
  var ps = "$n='" + name + "'; $p=Get-Process -Name $n -ErrorAction SilentlyContinue; if($p){[string]$p[0].Id}else{''}";
  try {
    var encoded = Buffer.from(ps, 'utf16le').toString('base64');
    var out = cp.execSync('powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ' + encoded, {
      timeout: 5000, stdio: ['ignore', 'pipe', 'ignore']
    }).toString().trim();
    return /^\d+$/.test(out);
  } catch (e) {
    return false;
  }
}

function openAllApps(cfg, onlyIds) {
  cfg = cfg || loadConfig();
  var r = [];
  (cfg.apps || []).forEach(function(a) {
    if (onlyIds && onlyIds.length && onlyIds.indexOf(a.id) < 0) return; // 仅启动指定 id（启动开关过滤）
    if (isProcessRunning(a.path)) {
      r.push({ id: a.id, name: a.name, ok: true, skipped: true, reason: 'already_running' });
    } else {
      r.push({ id: a.id, name: a.name, ok: launchApp(a) });
    }
  });
  return r;
}

// 启动成功后自动打开工作台：一律使用系统默认浏览器（不再强制 Chrome）
function openWorkspace(port) {
  setTimeout(function() {
    var url = 'http://127.0.0.1:' + port + '/';
    if (!IS_WIN) {
      // macOS: open ；Linux: xdg-open
      cp.execFile(IS_MAC ? 'open' : 'xdg-open', [url], function(err) {
        if (err) console.error('Failed to open workspace:', err.message);
        else console.log('Opened workspace with default browser: ' + url);
      });
      return;
    }
    // 不指定浏览器可执行文件，交给 ShellExecute 用 http 协议的默认处理程序（即默认浏览器）
    var cmd = 'start "" "' + url + '"';
    cp.exec(cmd, { windowsHide: true }, function(err) {
      if (err) console.error('Failed to open workspace', err);
      else console.log('Opened workspace with default browser: ' + url);
    });
  }, 800);
}

function serveStatic(res, filePath, contentType) {
  try {
    var ext = path.extname(filePath).toLowerCase();
    var types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
    var ct = contentType || types[ext] || 'application/octet-stream';
    var data = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': ct,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(data);
  } catch (e) {
    res.writeHead(404, { 'Cache-Control': 'no-store' });
    res.end('Not found');
  }
}

function getRecentFolders() {
  var cfg = loadConfig();
  return { folders: (cfg.recentFolders || []).slice(0, 10) };
}

// 后台异步构建应用索引（不阻塞服务），结果缓存到内存 + app_index.json
function buildAppIndexUnix() {
  // 纯 fs 扫描：macOS 扫 /Applications 下的 .app，两者都扫常用 bin 目录
  var map = {};
  var home = process.env.HOME || '';
  var appDirs = IS_MAC
    ? ['/Applications', '/System/Applications', '/Applications/Utilities', path.join(home, 'Applications')]
    : ['/usr/share/applications', path.join(home, '.local/share/applications')];
  appDirs.forEach(function(d) {
    try {
      fs.readdirSync(d).forEach(function(n) {
        if (IS_MAC) {
          if (/\.app$/i.test(n)) map[path.join(d, n)] = n.replace(/\.app$/i, '');
        } else if (/\.desktop$/i.test(n)) {
          // 解析 .desktop 的 Name= 与 Exec=
          try {
            var txt = fs.readFileSync(path.join(d, n), 'utf8');
            var nm = (txt.match(/^Name=(.*)$/m) || [])[1];
            var ex = (txt.match(/^Exec=(.*)$/m) || [])[1];
            if (nm && ex) map[String(ex).replace(/\s*%[A-Za-z]\s*/g, '').trim()] = String(nm).trim();
          } catch (e) {}
        }
      });
    } catch (e) {}
  });
  ['/usr/local/bin', '/usr/bin', '/opt/homebrew/bin', path.join(home, '.local/bin')].forEach(function(d) {
    try {
      fs.readdirSync(d).forEach(function(n) {
        var fp = path.join(d, n);
        try { if (!map[fp] && fs.statSync(fp).isFile()) map[fp] = n; } catch (e) {}
      });
    } catch (e) {}
  });
  return Object.keys(map).map(function(p) { return { name: map[p], path: p }; });
}

function buildAppIndex() {
  if (appIndexBuilding) return;
  appIndexBuilding = true;
  if (!IS_WIN) {
    try {
      var arr0 = buildAppIndexUnix();
      saveAppIndex({ apps: arr0, builtAt: Date.now() });
      console.log('app index built: ' + arr0.length + ' apps');
    } catch (e) {
      console.error('app index build error:', e.message);
    }
    appIndexBuilding = false;
    return;
  }
  var encoded = Buffer.from(PS_APPINDEX, 'utf16le').toString('base64');
  var ps = cp.spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded], { windowsHide: true, env: process.env });
  var out = '';
  ps.stdout.on('data', function(d) { out += d.toString('utf8'); });
  var killed = false;
  var timer = setTimeout(function() {
    killed = true;
    try { ps.kill(); } catch (e) {}
    console.log('app index build timed out (>120s)');
  }, 120000);
  ps.on('close', function() {
    clearTimeout(timer);
    appIndexBuilding = false;
    if (killed) return;
    try {
      var arr = JSON.parse(out);
      if (Array.isArray(arr)) {
        saveAppIndex({ apps: arr, builtAt: Date.now() });
        console.log('app index built: ' + arr.length + ' apps');
      }
    } catch (e) {
      console.error('app index parse error', e.message);
    }
  });
}

// 启动时确保索引存在且较新；否则后台重建
function ensureAppIndex() {
  var idx = loadAppIndex();
  if (idx && Array.isArray(idx.apps) && idx.apps.length > 0) {
    var age = Date.now() - (idx.builtAt || 0);
    if (age < INDEX_MAX_AGE) { appIndex = idx; return; }
  }
  buildAppIndex();
}

function searchApps(q) {
  var idx = appIndex || loadAppIndex() || { apps: [] };
  var apps = idx.apps || [];
  if (!q) return { apps: apps.slice(0, 30), building: appIndexBuilding };
  var lower = String(q).toLowerCase();
  var matched = apps.filter(function(a) {
    return (a.name && a.name.toLowerCase().indexOf(lower) >= 0) ||
           (a.path && a.path.toLowerCase().indexOf(lower) >= 0);
  }).slice(0, 30);
  return { apps: matched, building: appIndexBuilding };
}

function startServer(port) {
  var srv = http.createServer(function(req, res) {
    var parsed = url.parse(req.url, true);
    var u = parsed.pathname;
    var qs = parsed.query;

    // CORS：允许 file:// 直接打开的页面也能调用 API（修复「网络错误」）
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.writeHead(204, { 'Cache-Control': 'no-store' });
      res.end();
      return;
    }

    if (u === '/api/config') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(loadConfig()));
    } else if (u === '/api/apps') {
      var cfg = loadConfig();
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ apps: cfg.apps || [], pinnedFolders: cfg.pinnedFolders || [], files: cfg.files || [] }));
    } else if (u === '/api/open') {
      var target = sanitizeTarget(qs.target);
      var ok = target ? openTarget(target) : false;
      if (ok && target) {
        var c = loadConfig();
        c.recentFolders = c.recentFolders || [];
        if (!c.recentFolders.some(function(f) { return f.path === target; })) {
          c.recentFolders.unshift({ name: path.basename(target), path: target });
          if (c.recentFolders.length > 20) c.recentFolders.pop();
          saveConfig(c);
        }
      }
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ ok: ok, target: target }));
    } else if (u === '/api/stat') {
      var cfg2 = loadConfig();
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({
        apps: (cfg2.apps || []).map(function(a) { return { id: a.id, name: a.name, running: launchedPids.has(a.id) }; }),
        recentFolders: getRecentFolders(),
        ports: { http: port }
      }));
    } else if (u === '/api/recent-folders') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(getRecentFolders()));
    } else if (u === '/api/search') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(searchApps(qs.q)));
    } else if (u === '/api/index/build') {
      buildAppIndex();
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ building: true }));
    } else if (u === '/api/save-config') {
      var body = '';
      req.on('data', function(ch) { body += ch; });
      req.on('end', function() {
        try {
          saveConfig(JSON.parse(body));
          res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
          res.end(JSON.stringify({ ok: true }));
        } catch (e) {
          res.writeHead(400, { 'Cache-Control': 'no-store' });
          res.end(JSON.stringify({ ok: false, error: e.message }));
        }
      });
    } else if (u === '/api/launch-all') {
      var onlyIds = qs.ids ? String(qs.ids).split(',').filter(Boolean) : null;
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ results: openAllApps(loadConfig(), onlyIds) }));
    } else if (u === '/api/close-all') {
      closeAllApps();
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ ok: true }));
    } else if (u === '/index.html' || u === '/') {
      serveStatic(res, BD + '/index.html');
    } else {
      res.writeHead(404, { 'Cache-Control': 'no-store' });
      res.end('Not found');
    }
  });

  srv.on('error', function(e) {
    if (e.code === 'EADDRINUSE') {
      console.log('Port ' + port + ' in use, trying ' + (port + 1));
      srv.close();
      startServer(port + 1);
    } else {
      console.error('Server error:', e);
    }
  });

  srv.listen(port, '127.0.0.1', function() {
    var actualPort = srv.address().port;
    console.log('Workspace server running at http://127.0.0.1:' + actualPort);
    server = srv;
    openWorkspace(actualPort);
  });
}

function findFreePort(startPort, cb) {
  var srv = http.createServer();
  srv.listen(startPort, '127.0.0.1', function() {
    var p = srv.address().port;
    srv.close(function() { cb(p); });
  });
  srv.on('error', function() { findFreePort(startPort + 1, cb); });
}

function start() {
  var cfg = loadConfig();
  if (cfg.autostartApps) {
    // 仅启动勾选了「启动时打开」的应用（autostart 标志）
    var autoIds = (cfg.apps || []).filter(function(a) { return a.autostart; }).map(function(a) { return a.id; });
    if (autoIds.length) {
      setTimeout(function() { openAllApps(cfg, autoIds); }, 2000);
    }
  }
  ensureAppIndex(); // 后台异步构建搜索索引，不阻塞
  findFreePort(PORT, function(p) {
    PORT = p;
    startServer(PORT);
  });
}

start();
