#!/bin/bash

echo "=== 🚀 Vercel 部署验证脚本 ==="
echo ""
echo "📋 开始验证部署状态..."
echo ""

# 1. 检查Git状态
echo "1️⃣ Git状态检查："
git_status=$(git status --porcelain)
if [ -z "$git_status" ]; then
    echo "   ✅ 工作区干净，所有更改已提交"
else
    echo "   ⚠️ 有未提交的更改："
    echo "$git_status" | head -5
fi

# 2. 检查最新提交
echo ""
echo "2️⃣ 最新提交记录："
git log --oneline -3 | sed 's/^/   /'

# 3. 检查关键配置文件
echo ""
echo "3️⃣ 配置文件检查："
files_to_check=(
    ".nvmrc"
    "tsconfig.json"
    "package.json"
    "next.config.js"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file 存在"
    else
        echo "   ❌ $file 缺失"
    fi
done

# 4. 检查vercel.json是否已删除
echo ""
echo "4️⃣ Vercel配置检查："
if [ ! -f "vercel.json" ]; then
    echo "   ✅ vercel.json 已正确删除（使用零配置）"
else
    echo "   ⚠️ vercel.json 仍然存在，可能导致问题"
fi

# 5. 检查Node版本配置
echo ""
echo "5️⃣ Node版本配置："
if [ -f ".nvmrc" ]; then
    node_version=$(cat .nvmrc)
    echo "   ✅ Node版本指定为: v$node_version"
else
    echo "   ⚠️ 未找到.nvmrc文件"
fi

# 6. 本地构建测试
echo ""
echo "6️⃣ 本地构建测试："
echo "   运行 npm run build..."
npm run build > /tmp/build.log 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ 本地构建成功"
else
    echo "   ❌ 本地构建失败，查看错误："
    tail -10 /tmp/build.log | sed 's/^/      /'
fi

# 7. 部署状态总结
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 部署准备状态总结："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

all_good=true

# 检查各项状态
if [ -z "$git_status" ]; then
    echo "✅ Git: 就绪"
else
    echo "⚠️ Git: 有未提交更改"
    all_good=false
fi

if [ ! -f "vercel.json" ]; then
    echo "✅ Vercel配置: 零配置模式"
else
    echo "⚠️ Vercel配置: 需要删除vercel.json"
    all_good=false
fi

if [ -f ".nvmrc" ]; then
    echo "✅ Node版本: 已指定"
else
    echo "⚠️ Node版本: 未指定"
    all_good=false
fi

echo ""
if [ "$all_good" = true ]; then
    echo "🎉 所有检查通过！项目已准备好部署到Vercel"
    echo ""
    echo "📌 下一步操作："
    echo "   1. 访问 Vercel 仪表板查看部署状态"
    echo "   2. 如果部署成功，配置自定义域名 aiprompts.ink"
    echo "   3. 在 Namecheap 配置 DNS 记录"
else
    echo "⚠️ 有些检查未通过，请先解决上述问题"
fi

echo ""
echo "🔗 Vercel项目链接："
echo "   https://vercel.com/kexing6400/ai-prompt-generator"
echo ""
echo "🌐 预期访问地址："
echo "   https://ai-prompt-generator-*.vercel.app"
echo "   https://aiprompts.ink (配置DNS后)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"