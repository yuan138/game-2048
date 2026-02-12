#!/bin/bash
# 2048游戏启动脚本（云服务器版）

# 检查Node.js是否安装
if ! command -v node &> /dev/null
then
    echo "错误：未安装Node.js，请先安装Node.js 14+版本"
    exit 1
fi

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "安装依赖中..."
    npm install
fi

# 启动服务
echo "启动2048游戏服务..."
npm start