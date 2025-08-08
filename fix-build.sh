#!/bin/bash

echo "=== 🔧 终极构建修复脚本 ==="
echo ""

# 1. 清理缓存
echo "1️⃣ 清理缓存..."
rm -rf .next
rm -rf node_modules
rm -rf package-lock.json
echo "   ✅ 缓存已清理"

# 2. 重新安装依赖
echo ""
echo "2️⃣ 重新安装依赖..."
npm install
echo "   ✅ 依赖安装完成"

# 3. 验证文件结构
echo ""
echo "3️⃣ 验证文件结构..."
if [ -d "components/ui" ] && [ -d "lib/hooks" ]; then
    echo "   ✅ 文件结构正确"
else
    echo "   ❌ 文件结构有问题!"
    exit 1
fi

# 4. 本地构建测试
echo ""
echo "4️⃣ 本地构建测试..."
npm run build
if [ $? -eq 0 ]; then
    echo "   ✅ 本地构建成功"
else
    echo "   ❌ 本地构建失败"
    exit 1
fi

# 5. 提交更改
echo ""
echo "5️⃣ 提交更改..."
git add package-lock.json
git commit -m "fix: rebuild package-lock.json with Node v20 compatibility"
git push origin main

echo ""
echo "=== ✅ 修复完成 ==="
echo ""
echo "建议操作："
echo "1. 等待Vercel部署完成"
echo "2. 如果还是失败，在Vercel上删除项目并重新导入"
echo "3. 重新导入时确保："
echo "   - 选择正确的框架预设 (Next.js)"
echo "   - 不要修改构建命令"
echo "   - 不要修改输出目录"