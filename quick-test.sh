#!/bin/bash

# AI Prompt Builder Pro - 快速测试脚本
# 用于验证关键功能是否正常工作

echo "🧪 AI Prompt Builder Pro - 快速功能测试"
echo "========================================="
echo ""

# 测试网站是否可访问
echo "1. 测试网站可访问性..."
if curl -s -o /dev/null -w "%{http_code}" https://www.aiprompts.ink | grep -q "200"; then
    echo "   ✅ 网站正常访问"
else
    echo "   ❌ 网站无法访问，请检查部署状态"
fi

# 测试v2 API是否正常
echo ""
echo "2. 测试v2 API端点..."
API_TEST=$(curl -s -X POST https://www.aiprompts.ink/api/generate-prompt-v2 \
  -H "Content-Type: application/json" \
  -d '{"industry":"lawyer","scenario":"test","goal":"test","requirements":"test"}' \
  | grep -o '"success"')

if [ "$API_TEST" ]; then
    echo "   ✅ v2 API正常响应"
else
    echo "   ⚠️  API可能需要配置OPENROUTER_API_KEY"
fi

# 提供测试链接
echo ""
echo "3. 手动测试链接："
echo "   🔗 主页: https://www.aiprompts.ink"
echo "   🔗 律师页面: https://www.aiprompts.ink/ai-prompts-for-lawyers"
echo "   🔗 教师页面: https://www.aiprompts.ink/ai-prompts-for-teachers"
echo ""
echo "4. 测试要点："
echo "   📍 检查右上角是否有语言切换器（🌍图标）"
echo "   📍 切换语言后刷新页面，语言应保持"
echo "   📍 生成提示词应该是用户可用的专业内容"
echo ""
echo "========================================="
echo "测试完成！如有问题请查看 TESTING_CHECKLIST.md"