#!/bin/bash

#####################################################################
# AI Prompt Generator 国际化功能全面测试脚本
# 执行所有层次的国际化测试：单元测试、集成测试、E2E测试
#####################################################################

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 测试结果统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
TEST_RESULTS=()

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_section() {
    echo -e "\n${CYAN}=====================================${NC}"
    echo -e "${CYAN} $1${NC}"
    echo -e "${CYAN}=====================================${NC}\n"
}

# 记录测试结果
record_test_result() {
    local test_name="$1"
    local result="$2"
    local details="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ "$result" = "PASS" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        TEST_RESULTS+=("${GREEN}✅ $test_name${NC}")
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        TEST_RESULTS+=("${RED}❌ $test_name${NC}")
        if [ -n "$details" ]; then
            TEST_RESULTS+=("   ${RED}$details${NC}")
        fi
    fi
}

# 检查依赖
check_dependencies() {
    log_section "检查测试依赖"
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    log_info "Node.js 版本: $(node --version)"
    
    # 检查npm包
    if [ ! -d "node_modules" ]; then
        log_warning "node_modules 不存在，正在安装依赖..."
        npm install
    fi
    
    # 检查必要的测试依赖
    local missing_deps=()
    
    if ! npm list vitest &> /dev/null; then
        missing_deps+=("vitest")
    fi
    
    if ! npm list @playwright/test &> /dev/null; then
        log_error "@playwright/test 未安装"
        missing_deps+=("@playwright/test")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_warning "安装缺失的测试依赖: ${missing_deps[*]}"
        npm install --save-dev "${missing_deps[@]}"
    fi
    
    log_success "依赖检查完成"
}

# 安装Playwright浏览器
install_browsers() {
    log_section "安装Playwright浏览器"
    
    if command -v npx &> /dev/null; then
        npx playwright install
        if [ $? -eq 0 ]; then
            log_success "Playwright浏览器安装完成"
        else
            log_warning "Playwright浏览器安装失败，但继续测试"
        fi
    else
        log_warning "npx不可用，跳过Playwright浏览器安装"
    fi
}

# 运行单元测试
run_unit_tests() {
    log_section "运行国际化单元测试"
    
    # 安装vitest如果没有
    if ! command -v npx &> /dev/null || ! npm list vitest &> /dev/null; then
        log_warning "安装vitest进行单元测试..."
        npm install --save-dev vitest @vitejs/plugin-react jsdom
    fi
    
    # 运行单元测试
    log_info "执行单元测试..."
    if npx vitest run tests/unit/i18n-utils.test.ts 2>/dev/null; then
        log_success "单元测试通过"
        record_test_result "国际化单元测试" "PASS"
    else
        log_error "单元测试失败"
        record_test_result "国际化单元测试" "FAIL" "检查tests/unit/i18n-utils.test.ts"
    fi
}

# 运行API集成测试
run_api_tests() {
    log_section "运行国际化API测试"
    
    local test_url="${1:-http://localhost:3000}"
    
    log_info "测试环境: $test_url"
    
    # 检查测试脚本是否存在
    if [ ! -f "test-i18n-api.js" ]; then
        log_error "test-i18n-api.js 不存在"
        record_test_result "国际化API测试" "FAIL" "测试脚本文件缺失"
        return 1
    fi
    
    # 运行API测试
    log_info "执行API测试..."
    if node test-i18n-api.js "$test_url"; then
        log_success "API测试通过"
        record_test_result "国际化API测试" "PASS"
    else
        local exit_code=$?
        log_error "API测试失败 (退出码: $exit_code)"
        record_test_result "国际化API测试" "FAIL" "检查服务器状态和网络连接"
    fi
}

# 运行E2E测试
run_e2e_tests() {
    log_section "运行国际化E2E测试"
    
    # 检查Playwright配置
    if [ ! -f "playwright.config.ts" ]; then
        log_error "playwright.config.ts 不存在"
        record_test_result "国际化E2E测试" "FAIL" "Playwright配置缺失"
        return 1
    fi
    
    # 运行E2E测试
    log_info "执行E2E测试..."
    if npx playwright test tests/e2e/i18n-functionality.spec.ts --reporter=line; then
        log_success "E2E测试通过"
        record_test_result "国际化E2E测试" "PASS"
    else
        log_error "E2E测试失败"
        record_test_result "国际化E2E测试" "FAIL" "检查浏览器安装和测试环境"
        
        # 生成测试报告
        if npx playwright show-report &> /dev/null; then
            log_info "测试报告已生成，使用 'npx playwright show-report' 查看"
        fi
    fi
}

# 运行现有API功能测试以确保兼容性
run_compatibility_tests() {
    log_section "运行兼容性测试"
    
    local test_url="${1:-http://localhost:3000}"
    
    if [ -f "test-api.js" ]; then
        log_info "运行原有API功能测试..."
        if node test-api.js "$test_url"; then
            log_success "API兼容性测试通过"
            record_test_result "API兼容性测试" "PASS"
        else
            log_warning "API兼容性测试失败"
            record_test_result "API兼容性测试" "FAIL" "可能影响现有功能"
        fi
    else
        log_warning "test-api.js 不存在，跳过兼容性测试"
    fi
}

# 生成测试报告
generate_report() {
    log_section "测试结果总结"
    
    local success_rate=0
    if [ $TOTAL_TESTS -gt 0 ]; then
        success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    fi
    
    echo -e "${PURPLE}国际化功能测试报告${NC}"
    echo -e "${PURPLE}======================${NC}"
    echo -e "总测试数: $TOTAL_TESTS"
    echo -e "${GREEN}通过: $PASSED_TESTS${NC}"
    echo -e "${RED}失败: $FAILED_TESTS${NC}"
    echo -e "成功率: ${success_rate}%"
    echo
    
    echo -e "${PURPLE}详细结果:${NC}"
    for result in "${TEST_RESULTS[@]}"; do
        echo -e "$result"
    done
    echo
    
    # 生成建议
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}🎉 所有国际化测试通过！系统已完全支持多语言功能。${NC}"
    elif [ $success_rate -ge 75 ]; then
        echo -e "${YELLOW}⚠️ 大部分测试通过，建议修复失败的测试项目。${NC}"
    else
        echo -e "${RED}❌ 存在严重问题，国际化功能需要立即修复。${NC}"
    fi
    
    # 保存报告到文件
    local report_file="i18n-test-report-$(date +%Y%m%d-%H%M%S).md"
    {
        echo "# AI Prompt Generator 国际化功能测试报告"
        echo
        echo "**测试时间:** $(date)"
        echo "**总测试数:** $TOTAL_TESTS"
        echo "**通过:** $PASSED_TESTS"
        echo "**失败:** $FAILED_TESTS"
        echo "**成功率:** ${success_rate}%"
        echo
        echo "## 详细结果"
        echo
        for result in "${TEST_RESULTS[@]}"; do
            echo "$result" | sed 's/\x1b\[[0-9;]*m//g'  # 移除颜色代码
        done
        echo
        echo "## 建议"
        echo
        if [ $FAILED_TESTS -eq 0 ]; then
            echo "✅ 所有国际化测试通过！系统已完全支持多语言功能。"
        elif [ $success_rate -ge 75 ]; then
            echo "⚠️ 大部分测试通过，建议修复失败的测试项目。"
        else
            echo "❌ 存在严重问题，国际化功能需要立即修复。"
        fi
    } > "$report_file"
    
    log_info "测试报告已保存到: $report_file"
}

# 主函数
main() {
    local test_url="$1"
    local skip_setup="$2"
    
    echo -e "${CYAN}"
    echo "======================================================"
    echo " AI Prompt Generator 国际化功能全面测试"
    echo "======================================================"
    echo -e "${NC}"
    
    # 获取测试环境
    if [ -z "$test_url" ]; then
        echo -e "${YELLOW}请选择测试环境:${NC}"
        echo "1. 本地开发环境 (http://localhost:3000)"
        echo "2. 生产环境 (https://ai-prompt-generator.vercel.app)"
        echo "3. 自定义URL"
        echo
        read -p "请选择 [1-3]: " choice
        
        case $choice in
            1)
                test_url="http://localhost:3000"
                log_info "将测试本地开发环境"
                echo -e "${YELLOW}请确保本地开发服务器正在运行 (npm run dev)${NC}"
                sleep 2
                ;;
            2)
                test_url="https://ai-prompt-generator.vercel.app"
                log_info "将测试生产环境"
                ;;
            3)
                read -p "请输入自定义URL: " test_url
                ;;
            *)
                test_url="http://localhost:3000"
                log_warning "使用默认本地环境"
                ;;
        esac
    fi
    
    log_info "测试目标: $test_url"
    echo
    
    # 环境检查和设置
    if [ "$skip_setup" != "--skip-setup" ]; then
        check_dependencies
        install_browsers
    fi
    
    # 执行测试套件
    run_unit_tests
    run_api_tests "$test_url"
    run_e2e_tests
    run_compatibility_tests "$test_url"
    
    # 生成报告
    generate_report
    
    # 返回适当的退出码
    if [ $FAILED_TESTS -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
}

# 解析命令行参数
case "${1:-}" in
    --help|-h)
        echo "用法: $0 [测试URL] [选项]"
        echo
        echo "选项:"
        echo "  --skip-setup    跳过依赖检查和浏览器安装"
        echo "  --help, -h      显示此帮助信息"
        echo
        echo "示例:"
        echo "  $0                                    # 交互式选择测试环境"
        echo "  $0 http://localhost:3000             # 测试本地环境"
        echo "  $0 https://your-domain.com --skip-setup  # 测试生产环境，跳过设置"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac