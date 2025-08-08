#!/bin/bash

# 🔧 环境变量修复脚本
# 自动检测和修复环境变量配置问题

set -e

echo "🔍 开始环境变量诊断与修复..."

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "📁 项目目录: $PROJECT_ROOT"

# 检查 .env.local 文件
echo "🔍 检查环境变量文件..."

if [ -f ".env.local" ]; then
    echo "✅ .env.local 文件存在"
    
    # 检查API密钥
    if grep -q "OPENROUTER_API_KEY=" .env.local; then
        API_KEY=$(grep "OPENROUTER_API_KEY=" .env.local | cut -d'=' -f2-)
        if [ -n "$API_KEY" ] && [ "$API_KEY" != "your-api-key-here" ]; then
            echo "✅ OPENROUTER_API_KEY 配置正确"
            echo "🔑 API密钥前缀: ${API_KEY:0:10}..."
        else
            echo "❌ OPENROUTER_API_KEY 值无效"
            exit 1
        fi
    else
        echo "❌ OPENROUTER_API_KEY 未找到"
        exit 1
    fi
    
    # 检查BASE_URL
    if grep -q "OPENROUTER_BASE_URL=" .env.local; then
        BASE_URL=$(grep "OPENROUTER_BASE_URL=" .env.local | cut -d'=' -f2-)
        echo "✅ OPENROUTER_BASE_URL: $BASE_URL"
    else
        echo "⚠️  添加默认 OPENROUTER_BASE_URL..."
        echo "OPENROUTER_BASE_URL=https://openrouter.ai/api/v1" >> .env.local
    fi
    
else
    echo "❌ .env.local 文件不存在"
    
    if [ -f ".env.local.example" ]; then
        echo "📋 从示例文件创建 .env.local..."
        cp .env.local.example .env.local
        echo "✅ .env.local 已创建，请编辑其中的API密钥"
    else
        echo "📝 创建新的 .env.local 文件..."
        cat > .env.local << EOF
# OpenRouter API配置
OPENROUTER_API_KEY=sk-ant-oat01-ee0f35df8f630aae92f9a6561dd9be32edfe84a1e5f0f6e4636923a0e7ad5aca
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
        echo "✅ .env.local 已创建"
    fi
fi

# 检查 .gitignore
echo "🔒 检查 .gitignore 配置..."
if [ -f ".gitignore" ]; then
    if grep -q ".env.local" .gitignore; then
        echo "✅ .env.local 已在 .gitignore 中"
    else
        echo "📝 添加 .env.local 到 .gitignore..."
        echo ".env.local" >> .gitignore
        echo "✅ .gitignore 已更新"
    fi
else
    echo "⚠️  .gitignore 不存在，创建基本版本..."
    cat > .gitignore << EOF
.env.local
.env*.local
node_modules
.next
build
EOF
fi

# 验证环境变量加载
echo "🧪 测试环境变量加载..."

# 创建临时测试脚本
cat > /tmp/test-env.js << 'EOF'
require('dotenv').config({ path: './.env.local' });

console.log('Environment Test Results:');
console.log('- OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? 'SET (' + process.env.OPENROUTER_API_KEY.substring(0, 10) + '...)' : 'NOT SET');
console.log('- OPENROUTER_BASE_URL:', process.env.OPENROUTER_BASE_URL || 'NOT SET');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'NOT SET');

// 测试API连接
if (process.env.OPENROUTER_API_KEY) {
  console.log('✅ Environment variables loaded successfully');
  process.exit(0);
} else {
  console.log('❌ Failed to load API key');
  process.exit(1);
}
EOF

if command -v node >/dev/null 2>&1; then
    echo "🔄 执行环境测试..."
    if node /tmp/test-env.js; then
        echo "✅ 环境变量加载测试通过"
    else
        echo "❌ 环境变量加载失败"
        echo "💡 建议重启开发服务器: npm run dev"
    fi
else
    echo "⚠️  Node.js 未安装，跳过环境测试"
fi

# 清理临时文件
rm -f /tmp/test-env.js

# 权限检查
echo "🔐 检查文件权限..."
if [ -r ".env.local" ]; then
    echo "✅ .env.local 可读"
else
    echo "❌ .env.local 权限问题"
    chmod 600 .env.local
    echo "🔧 已修复文件权限"
fi

# 给出建议
echo ""
echo "🎯 修复完成！建议操作："
echo "1. 重启开发服务器：npm run dev"
echo "2. 运行完整测试：node scripts/test-api-complete.js"
echo "3. 检查浏览器控制台是否还有错误"

echo ""
echo "🔍 如果问题仍然存在，请检查："
echo "- Next.js 是否正确加载了 .env.local"
echo "- API密钥是否有效且未过期"
echo "- 网络连接是否正常"
echo "- OpenRouter 服务是否可访问"

echo "✅ 环境修复脚本执行完成"