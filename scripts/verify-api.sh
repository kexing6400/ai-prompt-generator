#!/bin/bash

echo "=== 🔑 API配置验证脚本 ==="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 检查本地环境文件
echo "1️⃣ 检查本地环境配置..."
if [ -f ".env.local" ]; then
    echo -e "   ${GREEN}✅ .env.local 文件存在${NC}"
    
    # 检查必需的环境变量
    if grep -q "OPENROUTER_API_KEY=" .env.local; then
        echo -e "   ${GREEN}✅ OPENROUTER_API_KEY 已配置${NC}"
    else
        echo -e "   ${RED}❌ OPENROUTER_API_KEY 未配置${NC}"
    fi
    
    if grep -q "OPENROUTER_BASE_URL=" .env.local; then
        echo -e "   ${GREEN}✅ OPENROUTER_BASE_URL 已配置${NC}"
    else
        echo -e "   ${YELLOW}⚠️ OPENROUTER_BASE_URL 未配置（将使用默认值）${NC}"
    fi
else
    echo -e "   ${RED}❌ .env.local 文件不存在${NC}"
    echo "   请创建 .env.local 文件并添加以下内容："
    echo ""
    echo "   OPENROUTER_API_KEY=your-api-key-here"
    echo "   OPENROUTER_BASE_URL=https://openrouter.ai/api/v1"
    echo "   NEXT_PUBLIC_APP_URL=http://localhost:3000"
fi

# 2. 检查.gitignore
echo ""
echo "2️⃣ 检查安全配置..."
if grep -q ".env.local" .gitignore; then
    echo -e "   ${GREEN}✅ .env.local 已在 .gitignore 中${NC}"
else
    echo -e "   ${RED}❌ .env.local 未在 .gitignore 中！${NC}"
    echo "   ⚠️ 警告：这可能导致API密钥泄露！"
fi

# 3. 检查API路由文件
echo ""
echo "3️⃣ 检查API路由..."
if [ -f "app/api/generate-prompt/route.ts" ]; then
    echo -e "   ${GREEN}✅ API路由文件存在${NC}"
    
    # 检查是否使用环境变量
    if grep -q "process.env.OPENROUTER_API_KEY" app/api/generate-prompt/route.ts; then
        echo -e "   ${GREEN}✅ 正确使用环境变量${NC}"
    else
        echo -e "   ${RED}❌ 未使用环境变量${NC}"
    fi
    
    # 检查降级机制
    if grep -q "local-fallback" app/api/generate-prompt/route.ts; then
        echo -e "   ${GREEN}✅ 已实现降级机制${NC}"
    else
        echo -e "   ${YELLOW}⚠️ 未实现降级机制${NC}"
    fi
else
    echo -e "   ${RED}❌ API路由文件不存在${NC}"
fi

# 4. 测试本地API（如果服务器正在运行）
echo ""
echo "4️⃣ 测试API端点..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ 开发服务器正在运行${NC}"
    
    # 测试API
    response=$(curl -s -X POST http://localhost:3000/api/generate-prompt \
        -H "Content-Type: application/json" \
        -d '{"industry":"teacher","scenario":"课程设计","prompt":"设计一节数学课","useAI":false}' 2>/dev/null)
    
    if echo "$response" | grep -q "success"; then
        echo -e "   ${GREEN}✅ API端点响应正常${NC}"
    else
        echo -e "   ${RED}❌ API端点响应异常${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠️ 开发服务器未运行${NC}"
    echo "   运行 'npm run dev' 启动服务器后再测试"
fi

# 5. Vercel配置提醒
echo ""
echo "5️⃣ Vercel部署配置提醒..."
echo -e "   ${YELLOW}📌 请确保在Vercel中配置以下环境变量：${NC}"
echo ""
echo "   OPENROUTER_API_KEY = sk-ant-oat01-..."
echo "   OPENROUTER_BASE_URL = https://openrouter.ai/api/v1"
echo "   NEXT_PUBLIC_APP_URL = https://aiprompts.ink"
echo "   NODE_ENV = production"
echo ""
echo "   配置地址: https://vercel.com/kexing6400/ai-prompt-generator/settings/environment-variables"

# 总结
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 配置总结"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 统计状态
if [ -f ".env.local" ] && grep -q "OPENROUTER_API_KEY=" .env.local && grep -q ".env.local" .gitignore; then
    echo -e "${GREEN}✅ 本地配置: 完成${NC}"
else
    echo -e "${RED}❌ 本地配置: 需要修复${NC}"
fi

echo -e "${YELLOW}⏳ Vercel配置: 需要手动验证${NC}"

echo ""
echo "💡 提示: 运行 'npm run dev' 启动本地服务器进行测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"