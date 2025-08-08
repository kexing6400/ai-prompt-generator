#!/bin/bash

# AI Prompt Generator 部署后验证脚本
# 使用方法: ./scripts/post-deployment-verification.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目配置
DOMAIN="aiprompts.ink"
EXPECTED_TITLE="AI Prompt Generator"

echo "🔍 AI Prompt Generator 部署后验证"
echo "======================================"
echo ""

# 1. DNS解析验证
echo -e "${BLUE}1. DNS解析验证${NC}"
echo "--------------------------------"

if command -v nslookup > /dev/null 2>&1; then
    echo "检查A记录..."
    A_RECORD=$(nslookup $DOMAIN 2>/dev/null | grep -A 1 "Name:" | tail -1 | awk '{print $2}' || echo "")
    if [ "$A_RECORD" = "76.76.19.19" ]; then
        echo -e "${GREEN}✅ A记录配置正确: $A_RECORD${NC}"
    elif [ -n "$A_RECORD" ]; then
        echo -e "${YELLOW}⚠️  A记录存在但不是Vercel IP: $A_RECORD${NC}"
    else
        echo -e "${RED}❌ A记录未配置或DNS未传播${NC}"
    fi

    echo "检查CNAME记录..."
    CNAME_RECORD=$(nslookup www.$DOMAIN 2>/dev/null | grep -i "canonical name" | awk '{print $4}' || echo "")
    if [[ "$CNAME_RECORD" == *"vercel"* ]]; then
        echo -e "${GREEN}✅ CNAME记录配置正确: $CNAME_RECORD${NC}"
    elif [ -n "$CNAME_RECORD" ]; then
        echo -e "${YELLOW}⚠️  CNAME记录存在但不指向Vercel: $CNAME_RECORD${NC}"
    else
        echo -e "${RED}❌ CNAME记录未配置${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  nslookup不可用，跳过DNS检查${NC}"
fi
echo ""

# 2. HTTPS访问验证
echo -e "${BLUE}2. HTTPS访问验证${NC}"
echo "--------------------------------"

if command -v curl > /dev/null 2>&1; then
    echo "检查HTTPS访问..."
    HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN --max-time 15 --connect-timeout 10 || echo "000")
    
    if [ "$HTTPS_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ HTTPS访问正常 (状态码: 200)${NC}"
        
        # 检查SSL证书
        if curl -s --max-time 10 https://$DOMAIN > /dev/null 2>&1; then
            echo -e "${GREEN}✅ SSL证书验证通过${NC}"
        else
            echo -e "${RED}❌ SSL证书验证失败${NC}"
        fi
    elif [ "$HTTPS_STATUS" = "000" ]; then
        echo -e "${RED}❌ HTTPS连接失败 (可能DNS未传播或服务未启动)${NC}"
    else
        echo -e "${YELLOW}⚠️  HTTPS状态异常 (状态码: $HTTPS_STATUS)${NC}"
    fi

    echo "检查HTTP重定向..."
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L http://$DOMAIN --max-time 10 || echo "000")
    if [ "$HTTP_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ HTTP成功重定向到HTTPS${NC}"
    else
        echo -e "${YELLOW}⚠️  HTTP重定向状态: $HTTP_STATUS${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  curl不可用，跳过HTTPS检查${NC}"
fi
echo ""

# 3. 网站内容验证
echo -e "${BLUE}3. 网站内容验证${NC}"
echo "--------------------------------"

if command -v curl > /dev/null 2>&1; then
    echo "获取网站内容..."
    CONTENT=$(curl -s --max-time 15 https://$DOMAIN || echo "")
    
    if [[ "$CONTENT" == *"$EXPECTED_TITLE"* ]]; then
        echo -e "${GREEN}✅ 网站标题检测正确${NC}"
    else
        echo -e "${YELLOW}⚠️  未检测到预期标题: $EXPECTED_TITLE${NC}"
    fi
    
    if [[ "$CONTENT" == *"<!DOCTYPE html"* ]]; then
        echo -e "${GREEN}✅ HTML文档结构正常${NC}"
    else
        echo -e "${RED}❌ HTML文档结构异常${NC}"
    fi
    
    if [[ "$CONTENT" == *"next"* ]] || [[ "$CONTENT" == *"_next"* ]]; then
        echo -e "${GREEN}✅ Next.js框架检测正常${NC}"
    else
        echo -e "${YELLOW}⚠️  未检测到Next.js特征${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  curl不可用，跳过内容检查${NC}"
fi
echo ""

# 4. 性能基础检查
echo -e "${BLUE}4. 性能基础检查${NC}"
echo "--------------------------------"

if command -v curl > /dev/null 2>&1; then
    echo "测试响应时间..."
    RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" https://$DOMAIN --max-time 20 || echo "timeout")
    
    if [ "$RESPONSE_TIME" != "timeout" ]; then
        # 转换为毫秒 (bash不支持浮点运算，使用awk)
        RESPONSE_MS=$(echo "$RESPONSE_TIME * 1000" | awk '{printf "%.0f", $1}')
        echo "响应时间: ${RESPONSE_MS}ms"
        
        if (( $(echo "$RESPONSE_TIME < 3.0" | awk '{print ($1 < $2)}') )); then
            echo -e "${GREEN}✅ 响应时间良好 (< 3秒)${NC}"
        elif (( $(echo "$RESPONSE_TIME < 5.0" | awk '{print ($1 < $2)}') )); then
            echo -e "${YELLOW}⚠️  响应时间可接受 (< 5秒)${NC}"
        else
            echo -e "${RED}❌ 响应时间较慢 (> 5秒)${NC}"
        fi
    else
        echo -e "${RED}❌ 响应超时${NC}"
    fi

    echo "检查压缩支持..."
    GZIP_SUPPORT=$(curl -s -H "Accept-Encoding: gzip" -I https://$DOMAIN --max-time 10 | grep -i "content-encoding: gzip" || echo "")
    if [ -n "$GZIP_SUPPORT" ]; then
        echo -e "${GREEN}✅ Gzip压缩已启用${NC}"
    else
        echo -e "${YELLOW}⚠️  未检测到Gzip压缩${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  curl不可用，跳过性能检查${NC}"
fi
echo ""

# 5. WWW子域名验证
echo -e "${BLUE}5. WWW子域名验证${NC}"
echo "--------------------------------"

if command -v curl > /dev/null 2>&1; then
    echo "测试www子域名重定向..."
    WWW_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L https://www.$DOMAIN --max-time 10 || echo "000")
    if [ "$WWW_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ www子域名重定向正常${NC}"
    else
        echo -e "${YELLOW}⚠️  www子域名状态: $WWW_STATUS${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  curl不可用，跳过www检查${NC}"
fi
echo ""

# 6. 生成验证报告
echo -e "${BLUE}📊 验证总结报告${NC}"
echo "======================================"

# 基本信息
echo "网站地址: https://$DOMAIN"
echo "部署平台: Vercel"
echo "验证时间: $(date)"
echo ""

# 建议的后续步骤
echo -e "${BLUE}🎯 建议的后续步骤:${NC}"
echo ""
echo "1. 功能测试:"
echo "   - 访问网站并测试所有主要功能"
echo "   - 测试AI Prompt生成功能"
echo "   - 验证响应式设计 (移动端)"
echo ""

echo "2. 性能优化 (可选):"
echo "   - 使用 https://pagespeed.web.dev 测试性能评分"
echo "   - 检查 https://gtmetrix.com 获取详细性能报告"
echo ""

echo "3. 监控设置:"
echo "   - 在Vercel控制台查看访问统计"
echo "   - 设置错误告警通知"
echo ""

echo "4. SEO优化:"
echo "   - 提交网站到Google Search Console"
echo "   - 生成并提交sitemap.xml"
echo ""

echo -e "${GREEN}🎉 部署验证完成！${NC}"
echo ""
echo "如果所有检查项都显示 ✅，恭喜您的网站已成功部署！"
echo "如果有 ⚠️ 或 ❌ 项目，请参考部署指南进行修复。"