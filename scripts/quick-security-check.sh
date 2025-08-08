#!/bin/bash

# =============================================================================
# AI Prompt Generator 快速安全检查脚本
# =============================================================================

set -e

echo "🛡️  开始快速安全检查..."
echo "======================================"

# 检查环境变量文件是否存在且未被Git追踪
echo "🔍 检查环境变量文件..."
if [ -f ".env.local" ]; then
    if git ls-files --error-unmatch .env.local 2>/dev/null; then
        echo "❌ 警告: .env.local 被Git追踪，请立即移除"
        exit 1
    else
        echo "✅ .env.local 文件安全"
    fi
fi

# 检查API密钥格式
echo "🔑 检查API密钥格式..."
if [ -f ".env.local" ]; then
    if grep -q "OPENROUTER_API_KEY=" .env.local; then
        if grep -q "OPENROUTER_API_KEY=sk-or-" .env.local; then
            echo "✅ OpenRouter API密钥格式正确"
        else
            echo "⚠️  警告: OpenRouter API密钥格式可能不正确"
        fi
    fi
fi

# 检查生产环境HTTPS配置
echo "🔒 检查HTTPS配置..."
if [ -f ".env.production" ]; then
    if grep -q "NEXT_PUBLIC_APP_URL=https://" .env.production; then
        echo "✅ 生产环境使用HTTPS"
    elif grep -q "NEXT_PUBLIC_APP_URL=http://" .env.production; then
        echo "❌ 错误: 生产环境仍使用HTTP"
        exit 1
    fi
fi

# 检查安全头部配置
echo "🛡️ 检查安全头部配置..."
if grep -q "headers()" next.config.js; then
    echo "✅ Next.js安全头部已配置"
else
    echo "⚠️  警告: 缺少Next.js安全头部配置"
fi

# 检查CSP配置
echo "🔐 检查CSP配置..."
if grep -q "Content-Security-Policy" middleware.ts; then
    echo "✅ CSP策略已配置"
else
    echo "❌ 错误: 缺少CSP配置"
    exit 1
fi

echo ""
echo "🎉 快速安全检查完成！"
echo "💡 建议定期运行完整安全审计: npm run security:audit"
