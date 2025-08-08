#!/bin/bash

echo "===== Vercel构建脚本开始 ====="

# 清理之前的构建缓存
echo "清理构建缓存..."
rm -rf .next
rm -rf node_modules/.cache

# 安装依赖
echo "安装依赖..."
npm ci || npm install

# 运行prebuild脚本
echo "运行prebuild检查..."
node ensure-files.js || true

# 构建项目
echo "开始构建..."
npm run build

# 检查构建结果
if [ $? -eq 0 ]; then
  echo "===== 构建成功！ ====="
else
  echo "===== 构建失败，尝试备用方案 ====="
  # 备用构建方案
  CI='' npm run build
fi