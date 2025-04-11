#!/bin/bash

# 确保脚本在遇到错误时停止执行
set -e

echo "启动开发服务器..."

# 检查Python是否安装
if ! command -v python3 &> /dev/null; then
    echo "错误: 需要安装Python3"
    exit 1
fi

# 创建必要的目录（如果不存在）
mkdir -p public/images/{products,banners,icons}
mkdir -p public/fonts

# 启动Python HTTP服务器
echo "服务器启动在 http://localhost:8000"
python3 -m http.server 8000 --directory src 