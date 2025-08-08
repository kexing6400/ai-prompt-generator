#!/bin/bash

# ===================================================================
# 🚀 AI Prompt Generator - 全方位部署验证脚本
# ===================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 配置
VERCEL_URL="https://ai-prompt-generator.vercel.app"
CUSTOM_DOMAIN="https://aiprompts.ink"
API_ENDPOINT="/api/generate-prompt"
GITHUB_REPO="https://github.com/kexing6400/ai-prompt-generator"

# 测试计数器
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试函数
run_test() {
    local test_name=$1
    local command=$2
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "   🧪 $test_name... "
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 通过${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ 失败${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# 标题
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}     🚀 AI PROMPT GENERATOR - 全方位部署验证${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📅 验证时间: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo -e "${BLUE}🎯 目标环境: Production${NC}"
echo ""

# ===================================================================
# 第一部分：本地环境验证
# ===================================================================

echo -e "${MAGENTA}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║  第一部分：本地环境验证                                           ║${NC}"
echo -e "${MAGENTA}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}1. 依赖和构建检查${NC}"
run_test "Node.js版本" "node -v | grep -E 'v(20|22)'"
run_test "npm版本" "npm -v"
run_test "package.json存在" "[ -f package.json ]"
run_test "node_modules存在" "[ -d node_modules ]"
run_test "本地构建成功" "npm run build"

echo ""
echo -e "${YELLOW}2. 环境变量配置${NC}"
run_test ".env.local存在" "[ -f .env.local ]"
run_test "API密钥已配置" "grep -q OPENROUTER_API_KEY .env.local"
run_test "API URL已配置" "grep -q OPENROUTER_BASE_URL .env.local"
run_test ".gitignore保护" "grep -q '.env.local' .gitignore"

echo ""
echo -e "${YELLOW}3. Git仓库状态${NC}"
run_test "Git仓库干净" "[ -z \"$(git status --porcelain)\" ]"
run_test "远程仓库同步" "git fetch && [ -z \"$(git log HEAD..origin/main --oneline)\" ]"

# ===================================================================
# 第二部分：Vercel部署验证
# ===================================================================

echo ""
echo -e "${MAGENTA}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║  第二部分：Vercel部署验证                                         ║${NC}"
echo -e "${MAGENTA}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}4. Vercel部署状态${NC}"
run_test "Vercel域名可访问" "curl -s -o /dev/null -w '%{http_code}' $VERCEL_URL | grep -E '200|301|302'"
run_test "HTTPS证书有效" "curl -s -I $VERCEL_URL | grep -q 'HTTP'"
run_test "响应时间<3秒" "curl -s -o /dev/null -w '%{time_total}' $VERCEL_URL | awk '{if($1<3.0) exit 0; else exit 1}'"

echo ""
echo -e "${YELLOW}5. 页面功能测试${NC}"
run_test "首页加载" "curl -s $VERCEL_URL | grep -q 'AI Prompt Builder Pro'"
run_test "律师页面" "curl -s $VERCEL_URL/ai-prompts-for-lawyers | grep -q '法律'"
run_test "会计师页面" "curl -s $VERCEL_URL/ai-prompts-for-accountants | grep -q '会计'"
run_test "教师页面" "curl -s $VERCEL_URL/ai-prompts-for-teachers | grep -q '教育'"
run_test "保险顾问页面" "curl -s $VERCEL_URL/ai-prompts-for-insurance-advisors | grep -q '保险'"
run_test "房产经纪页面" "curl -s $VERCEL_URL/ai-prompts-for-realtors | grep -q '房地产'"

echo ""
echo -e "${YELLOW}6. API端点测试${NC}"
run_test "API端点响应" "curl -s -X POST $VERCEL_URL$API_ENDPOINT -H 'Content-Type: application/json' -d '{\"industry\":\"teacher\",\"scenario\":\"test\",\"prompt\":\"test\",\"useAI\":false}' | grep -q 'success'"
run_test "API错误处理" "curl -s -X POST $VERCEL_URL$API_ENDPOINT -H 'Content-Type: application/json' -d '{}' -o /dev/null -w '%{http_code}' | grep -E '400|500'"

# ===================================================================
# 第三部分：安全性验证
# ===================================================================

echo ""
echo -e "${MAGENTA}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║  第三部分：安全性验证                                             ║${NC}"
echo -e "${MAGENTA}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}7. 安全头部检查${NC}"
HEADERS=$(curl -s -I $VERCEL_URL)
run_test "X-Frame-Options" "echo '$HEADERS' | grep -q 'X-Frame-Options'"
run_test "X-Content-Type-Options" "echo '$HEADERS' | grep -q 'X-Content-Type-Options'"
run_test "Strict-Transport-Security" "echo '$HEADERS' | grep -q 'Strict-Transport-Security'"

echo ""
echo -e "${YELLOW}8. 敏感信息泄露检查${NC}"
run_test "无API密钥泄露" "! curl -s $VERCEL_URL | grep -q 'sk-ant-oat'"
run_test "无调试信息" "! curl -s $VERCEL_URL | grep -q 'console.log'"
run_test "无错误堆栈" "! curl -s $VERCEL_URL | grep -q 'at Object'"

# ===================================================================
# 第四部分：性能基准测试
# ===================================================================

echo ""
echo -e "${MAGENTA}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║  第四部分：性能基准测试                                           ║${NC}"
echo -e "${MAGENTA}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}9. 页面加载性能${NC}"
for page in "" "/ai-prompts-for-lawyers" "/ai-prompts-for-accountants"; do
    PAGE_NAME=${page:-"首页"}
    TIME=$(curl -s -o /dev/null -w '%{time_total}' "$VERCEL_URL$page")
    if (( $(echo "$TIME < 2.0" | bc -l) )); then
        echo -e "   🧪 $PAGE_NAME加载时间... ${GREEN}✅ ${TIME}秒${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "   🧪 $PAGE_NAME加载时间... ${RED}❌ ${TIME}秒 (>2秒)${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
done

echo ""
echo -e "${YELLOW}10. API响应性能${NC}"
for i in {1..3}; do
    START=$(date +%s%N)
    curl -s -X POST "$VERCEL_URL$API_ENDPOINT" \
        -H "Content-Type: application/json" \
        -d '{"industry":"lawyer","scenario":"test","prompt":"test","useAI":false}' \
        > /dev/null 2>&1
    END=$(date +%s%N)
    DURATION=$((($END - $START) / 1000000))
    
    if [ $DURATION -lt 500 ]; then
        echo -e "   🧪 API请求#$i响应时间... ${GREEN}✅ ${DURATION}ms${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "   🧪 API请求#$i响应时间... ${RED}❌ ${DURATION}ms (>500ms)${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
done

# ===================================================================
# 第五部分：自定义域名验证（如果配置）
# ===================================================================

echo ""
echo -e "${MAGENTA}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║  第五部分：自定义域名验证                                         ║${NC}"
echo -e "${MAGENTA}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}11. 域名配置状态${NC}"
if curl -s -o /dev/null -w '%{http_code}' $CUSTOM_DOMAIN 2>/dev/null | grep -qE '200|301|302'; then
    echo -e "   🧪 自定义域名可访问... ${GREEN}✅ 通过${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    
    # DNS解析检查
    run_test "DNS A记录" "nslookup aiprompts.ink | grep -q 'Address'"
    run_test "HTTPS重定向" "curl -s -I http://aiprompts.ink | grep -q 'Location: https://'"
else
    echo -e "   🧪 自定义域名可访问... ${YELLOW}⏳ 尚未配置${NC}"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# ===================================================================
# 测试总结
# ===================================================================

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}                           📊 测试总结${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 计算通过率
PASS_RATE=$(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)

# 显示统计
echo -e "${BLUE}📈 测试统计：${NC}"
echo -e "   总测试数：$TOTAL_TESTS"
echo -e "   ${GREEN}通过：$PASSED_TESTS${NC}"
echo -e "   ${RED}失败：$FAILED_TESTS${NC}"
echo -e "   通过率：${PASS_RATE}%"
echo ""

# 风险评估
echo -e "${BLUE}🎯 风险评估：${NC}"
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "   ${GREEN}✅ 低风险 - 所有测试通过，系统运行正常${NC}"
elif [ $FAILED_TESTS -le 3 ]; then
    echo -e "   ${YELLOW}⚠️ 中风险 - 少量测试失败，需要关注${NC}"
else
    echo -e "   ${RED}🚨 高风险 - 多项测试失败，需要立即修复${NC}"
fi
echo ""

# 部署建议
echo -e "${BLUE}💡 部署建议：${NC}"
if [ $PASS_RATE == "100.00" ]; then
    echo -e "   ${GREEN}🎉 完美！系统已准备好投入生产使用。${NC}"
elif (( $(echo "$PASS_RATE >= 90" | bc -l) )); then
    echo -e "   ${GREEN}✅ 良好 - 系统基本就绪，建议修复失败项后部署。${NC}"
elif (( $(echo "$PASS_RATE >= 70" | bc -l) )); then
    echo -e "   ${YELLOW}⚠️ 需要改进 - 建议先解决关键问题再部署。${NC}"
else
    echo -e "   ${RED}❌ 不建议部署 - 存在严重问题，需要全面修复。${NC}"
fi

# 失败项详情
if [ $FAILED_TESTS -gt 0 ]; then
    echo ""
    echo -e "${RED}❌ 失败项需要关注：${NC}"
    echo "   请检查上述红色标记的测试项"
fi

# 下一步行动
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}                        📝 下一步行动${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo "1. ✅ 配置自定义域名 aiprompts.ink"
    echo "2. ✅ 设置监控和告警"
    echo "3. ✅ 准备营销和推广"
else
    echo "1. 🔧 修复失败的测试项"
    echo "2. 🔄 重新运行验证脚本"
    echo "3. 📊 查看详细日志排查问题"
fi

echo ""
echo -e "${BLUE}🔗 相关链接：${NC}"
echo "   • Vercel控制台: https://vercel.com/kexing6400/ai-prompt-generator"
echo "   • GitHub仓库: $GITHUB_REPO"
echo "   • 生产环境: $VERCEL_URL"
echo "   • 自定义域名: $CUSTOM_DOMAIN"

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}                    验证完成于 $(date '+%H:%M:%S')${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 返回状态码
if [ $FAILED_TESTS -eq 0 ]; then
    exit 0
else
    exit 1
fi