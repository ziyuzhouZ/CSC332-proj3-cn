#!/bin/bash

echo "====== 启动简易登录注册系统 ======"
echo "正在检查系统环境..."

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "错误: 未找到 npm，请先安装 npm"
    exit 1
fi

echo "Node.js 版本: $(node -v)"
echo "npm 版本: $(npm -v)"

# 确保脚本有执行权限
chmod +x start.sh

echo "正在安装依赖..."
npm install

# 检查依赖是否安装成功
if [ $? -ne 0 ]; then
    echo "错误: 依赖安装失败"
    exit 1
fi

echo "正在启动服务器..."
node server.js

# 如果服务器启动失败
if [ $? -ne 0 ]; then
    echo "错误: 服务器启动失败"
    exit 1
fi 