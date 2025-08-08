#!/bin/bash

# AI Prompt Generator 部署检查脚本
# 使用方法: ./scripts/deployment-check.sh

set -e

echo "🚀 AI Prompt Generator 部署状态检查"
echo "======================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目信息
PROJECT_NAME="ai-prompt-generator"
DOMAIN="aiprompts.ink"
GITHUB_REPO="https://github.com/kexing6400/ai-prompt-generator.git"

echo -e "${BLUE}项目信息:${NC}"
echo "  项目名称: $PROJECT_NAME"
echo "  目标域名: $DOMAIN"
echo "  GitHub仓库: $GITHUB_REPO"
echo ""

# 1. 检查本地Git状态
echo -e "${YELLOW}1. 检查本地Git状态...${NC}"
if git status --porcelain | grep -q .; then
    echo -e "${RED}❌ 有未提交的更改${NC}"
    git status --short
    echo "  建议: 先提交所有更改再部署"
else
    echo -e "${GREEN}✅ Git工作区干净${NC}"
fi

# 检查是否连接到GitHub
if git remote -v | grep -q "github.com"; then
    echo -e "${GREEN}✅ GitHub远程仓库已连接${NC}"
    git remote -v | head -2
else
    echo -e "${RED}❌ GitHub远程仓库未连接${NC}"
fi
echo ""

# 2. 检查项目构建
echo -e "${YELLOW}2. 检查项目构建...${NC}"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 项目构建成功${NC}"
else
    echo -e "${RED}❌ 项目构建失败${NC}"
    echo "  建议: 运行 npm run build 查看具体错误"
fi
echo ""

# 3. 检查关键配置文件
echo -e "${YELLOW}3. 检查配置文件...${NC}"

# package.json
if [ -f "package.json" ]; then
    echo -e "${GREEN}✅ package.json 存在${NC}"
    if grep -q '"next"' package.json; then
        NEXT_VERSION=$(node -p "require('./package.json').dependencies.next")
        echo "  Next.js版本: $NEXT_VERSION"
    fi
else
    echo -e "${RED}❌ package.json 不存在${NC}"
fi

# vercel.json
if [ -f "vercel.json" ]; then
    echo -e "${GREEN}✅ vercel.json 存在${NC}"
    if grep -q '"framework": "nextjs"' vercel.json; then
        echo "  框架配置: Next.js"
    fi
else
    echo -e "${YELLOW}⚠️  vercel.json 不存在 (可选)${NC}"
fi

# next.config.js
if [ -f "next.config.js" ] || [ -f "next.config.mjs" ]; then
    echo -e "${GREEN}✅ Next.js配置文件存在${NC}"
else
    echo -e "${YELLOW}⚠️  Next.js配置文件不存在 (可选)${NC}"
fi
echo ""

# 4. 检查DNS配置 (需要网络)
echo -e "${YELLOW}4. 检查DNS配置...${NC}"
if command -v nslookup > /dev/null 2>&1; then
    # 检查A记录
    A_RECORD=$(nslookup $DOMAIN 2>/dev/null | grep -A 1 "Name:" | tail -1 | awk '{print $2}' || echo "未解析")
    if [ "$A_RECORD" != "未解析" ] && [ "$A_RECORD" != "" ]; then
        echo -e "${GREEN}✅ 域名A记录已配置: $A_RECORD${NC}"
        
        # 检查是否指向Vercel
        if [ "$A_RECORD" = "76.76.19.19" ]; then
            echo -e "${GREEN}✅ A记录指向Vercel${NC}"
        else
            echo -e "${YELLOW}⚠️  A记录未指向Vercel (76.76.19.19)${NC}"
        fi
    else
        echo -e "${RED}❌ 域名A记录未配置或DNS未传播${NC}"
    fi
    
    # 检查CNAME记录
    CNAME_RECORD=$(nslookup www.$DOMAIN 2>/dev/null | grep -i "canonical name" | awk '{print $4}' || echo "未解析")
    if [ "$CNAME_RECORD" != "未解析" ] && [ "$CNAME_RECORD" != "" ]; then
        echo -e "${GREEN}✅ www子域名CNAME已配置: $CNAME_RECORD${NC}"
    else
        echo -e "${YELLOW}⚠️  www子域名CNAME未配置${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  nslookup命令不可用，跳过DNS检查${NC}"
fi
echo ""

# 5. 检查网站可访问性
echo -e "${YELLOW}5. 检查网站可访问性...${NC}"
if command -v curl > /dev/null 2>&1; then
    # 检查HTTPS访问
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN --max-time 10 || echo "000")
    if [ "$HTTP_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ HTTPS访问正常 (状态码: $HTTP_STATUS)${NC}"
    elif [ "$HTTP_STATUS" = "000" ]; then
        echo -e "${RED}❌ 网站无法访问 (连接超时或失败)${NC}"
    else
        echo -e "${YELLOW}⚠️  HTTPS访问异常 (状态码: $HTTP_STATUS)${NC}"
    fi
    
    # 检查HTTP重定向
    HTTP_REDIRECT=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN --max-time 10 || echo "000")
    if [ "$HTTP_REDIRECT" = "301" ] || [ "$HTTP_REDIRECT" = "302" ]; then
        echo -e "${GREEN}✅ HTTP自动重定向到HTTPS${NC}"
    else
        echo -e "${YELLOW}⚠️  HTTP重定向配置异常 (状态码: $HTTP_REDIRECT)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  curl命令不可用，跳过网站检查${NC}"
fi
echo ""

# 6. 生成部署建议
echo -e "${BLUE}🔧 部署建议:${NC}"
echo ""

if git status --porcelain | grep -q .; then
    echo "1. 提交并推送代码:"
    echo "   git add ."
    echo "   git commit -m \"准备部署到生产环境\""
    echo "   git push origin main"
    echo ""
fi

echo "2. Vercel部署步骤:"
echo "   a. 访问 https://vercel.com"
echo "   b. 使用GitHub账号登录"
echo "   c. 导入项目: kexing6400/ai-prompt-generator"
echo "   d. 配置域名: $DOMAIN"
echo ""

echo "3. DNS配置 (Namecheap):"
echo "   A记录:    @ → 76.76.19.19"
echo "   CNAME记录: www → cname.vercel-dns.com"
echo ""

echo "4. 验证部署:"
echo "   - 访问: https://$DOMAIN"
echo "   - 检查SSL证书"
echo "   - 测试网站功能"
echo ""

# 7. 输出总结
echo -e "${BLUE}📊 检查总结:${NC}"
echo "======================================"

# 计算检查项目状态
TOTAL_CHECKS=0
PASSED_CHECKS=0

# Git状态检查
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if ! git status --porcelain | grep -q .; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

# GitHub连接检查
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if git remote -v | grep -q "github.com"; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

# 构建检查
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if npm run build > /dev/null 2>&1; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

# 配置文件检查
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if [ -f "package.json" ]; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

echo "检查完成: $PASSED_CHECKS/$TOTAL_CHECKS 项通过"

if [ $PASSED_CHECKS -eq $TOTAL_CHECKS ]; then
    echo -e "${GREEN}🎉 项目已准备好部署！${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  请解决上述问题后再部署${NC}"
    exit 1
fi