#!/bin/bash

echo "=========================================="
echo "   2048 游戏 - 一键部署脚本"
echo "=========================================="

# 检查是否安装了Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    echo "   下载地址: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"

# 安装依赖
echo ""
echo "📦 安装依赖..."
npm install

# 检查是否已经安装了playwright
if [ ! -d "node_modules/playwright" ]; then
    echo "🎭 安装 Playwright..."
    npm install playwright
    npx playwright install chromium
fi

# 测试应用
echo ""
echo "🧪 测试应用..."
timeout 10 node server.js &
SERVER_PID=$!
sleep 3

# 发送测试请求
if curl -s http://localhost:3000/login.html > /dev/null; then
    echo "✅ 应用启动成功!"
    echo "   访问地址: http://localhost:3000/login.html"
else
    echo "❌ 应用启动失败"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# 停止测试服务器
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

echo ""
echo "=========================================="
echo "   🎉 部署准备完成！"
echo "=========================================="
echo ""
echo "启动生产服务器:"
echo "  npm start"
echo ""
echo "或使用 Docker:"
echo "  docker-compose up -d"
echo ""
echo "访问地址: http://localhost:3000"
echo ""
