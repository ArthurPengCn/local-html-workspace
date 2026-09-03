#!/usr/bin/env bash
# WorkBuddy 本地工作台 —— macOS / Linux 启动脚本
# 用法：./start.sh   （首次运行请先 chmod +x start.sh）
cd "$(dirname "$0")" || exit 1

# ---- 定位 Node.js：优先 PATH，其次常见安装位置 ----
find_node() {
  if command -v node >/dev/null 2>&1; then
    command -v node
    return 0
  fi
  local p
  for p in /usr/local/bin/node \
           /opt/homebrew/bin/node \
           "$HOME"/.nvm/versions/node/*/bin/node \
           "$HOME"/.volta/bin/node; do
    if [ -x "$p" ]; then
      echo "$p"
      return 0
    fi
  done
  return 1
}

NODE="$(find_node)"
if [ -z "$NODE" ]; then
  echo "[ERROR] 未找到 Node.js（需要 18+）。"
  echo "        安装方式：https://nodejs.org/  或  nvm install 20  或  brew install node"
  exit 1
fi

VER="$("$NODE" --version 2>/dev/null)"
MAJOR="$(printf '%s' "$VER" | sed 's/^v//' | cut -d. -f1)"
case "$MAJOR" in
  ''|*[!0-9]*) ;;   # 版本号解析异常时跳过检查
  *)
    if [ "$MAJOR" -lt 18 ]; then
      echo "[ERROR] Node.js 版本过低（$VER），需要 18+。"
      exit 1
    fi
    ;;
esac

echo "Starting workspace..."
echo "Node: $NODE $VER"
echo "按 Ctrl+C 停止服务"
exec "$NODE" launcher.js
