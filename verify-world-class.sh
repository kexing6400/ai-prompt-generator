#!/bin/bash

# 世界级页面验证脚本
# 验证所有修复是否成功部署

echo "🌍 开始验证世界级页面升级..."
echo "================================"

URL="https://www.aiprompts.ink"

# 1. 检查网站可访问性
echo "1. 检查网站可访问性..."
if curl -s -o /dev/null -w "%{http_code}" "$URL" | grep -q "200"; then
    echo "✅ 网站可访问"
else
    echo "❌ 网站无法访问"
    exit 1
fi

# 2. 检查关键按钮文本
echo "2. 验证按钮修复..."
page_content=$(curl -s "$URL")

if echo "$page_content" | grep -q "立即开始使用"; then
    echo "✅ '立即开始使用'按钮存在"
else
    echo "❌ '立即开始使用'按钮缺失"
fi

if echo "$page_content" | grep -q "查看演示视频"; then
    echo "❌ '查看演示视频'按钮仍然存在（应该被删除）"
else
    echo "✅ '查看演示视频'按钮已成功删除"
fi

if echo "$page_content" | grep -q "联系专业顾问"; then
    echo "✅ '联系专业顾问'按钮存在"
else
    echo "❌ '联系专业顾问'按钮缺失"
fi

# 3. 检查SEO优化
echo "3. 验证SEO优化..."
if echo "$page_content" | grep -q "application/ld+json"; then
    echo "✅ JSON-LD结构化数据已添加"
else
    echo "⚠️ JSON-LD结构化数据未找到"
fi

# 4. 检查sitemap
echo "4. 验证Sitemap..."
if curl -s -o /dev/null -w "%{http_code}" "$URL/sitemap.xml" | grep -q "200"; then
    echo "✅ Sitemap可访问"
else
    echo "⚠️ Sitemap不可访问"
fi

# 5. 检查robots.txt
echo "5. 验证robots.txt..."
if curl -s -o /dev/null -w "%{http_code}" "$URL/robots.txt" | grep -q "200"; then
    echo "✅ robots.txt可访问"
else
    echo "❌ robots.txt不可访问"
fi

# 6. 检查行业页面
echo "6. 验证行业页面..."
industries=("ai-prompts-for-lawyers" "ai-prompts-for-teachers" "ai-prompts-for-accountants" "ai-prompts-for-realtors" "ai-prompts-for-insurance-advisors")

for industry in "${industries[@]}"; do
    if curl -s -o /dev/null -w "%{http_code}" "$URL/$industry" | grep -q "200"; then
        echo "✅ /$industry 页面正常"
    else
        echo "❌ /$industry 页面错误"
    fi
done

# 7. 性能测试提示
echo ""
echo "7. 性能测试建议："
echo "请访问以下工具进行性能测试："
echo "• PageSpeed Insights: https://pagespeed.web.dev/analysis?url=$URL"
echo "• GTmetrix: https://gtmetrix.com/"
echo "• WebPageTest: https://www.webpagetest.org/"

echo ""
echo "================================"
echo "🎉 世界级页面验证完成！"
echo ""
echo "📱 请手动测试："
echo "1. 点击'立即开始使用'按钮 - 应该平滑滚动到行业选择"
echo "2. 点击'联系专业顾问'按钮 - 应该打开邮件客户端"
echo "3. 测试所有行业卡片的点击交互"
echo "4. 在移动设备上测试响应式布局"
echo ""
echo "🔗 立即访问: $URL"