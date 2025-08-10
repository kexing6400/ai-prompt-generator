#!/bin/bash

# 批量添加dynamic配置到所有API路由

echo "🚀 开始批量修复API路由dynamic配置..."

# 需要修复的文件列表
files=(
    "/home/kexing/09-ai-prompt-generator/app/api/admin/auth/verify/route.ts"
    "/home/kexing/09-ai-prompt-generator/app/api/admin/config/route.ts"
    "/home/kexing/09-ai-prompt-generator/app/api/admin/models/route.ts"
    "/home/kexing/09-ai-prompt-generator/app/api/admin/templates/route.ts"
    "/home/kexing/09-ai-prompt-generator/app/api/admin/test/config/route.ts"
    "/home/kexing/09-ai-prompt-generator/app/api/admin/test/generate/route.ts"
    "/home/kexing/09-ai-prompt-generator/app/api/admin/test/health/route.ts"
    "/home/kexing/09-ai-prompt-generator/app/api/admin/test/scenarios/route.ts"
    "/home/kexing/09-ai-prompt-generator/app/api/generate-prompt-v2/route.ts"
    "/home/kexing/09-ai-prompt-generator/app/api/security/csp-report/route.ts"
)

# 为每个文件添加dynamic配置
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "📝 修复 $file"
        
        # 创建临时文件
        temp_file=$(mktemp)
        
        # 获取第一个import之后的位置
        first_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
        
        if [ -n "$first_import_line" ]; then
            # 在所有import后面添加dynamic配置
            head -n "$first_import_line" "$file" > "$temp_file"
            echo "" >> "$temp_file"
            echo "// 强制动态渲染 - 确保每次请求都重新执行" >> "$temp_file"
            echo "export const dynamic = 'force-dynamic';" >> "$temp_file"
            echo "" >> "$temp_file"
            tail -n +$((first_import_line + 1)) "$file" >> "$temp_file"
            
            # 替换原文件
            mv "$temp_file" "$file"
            echo "✅ $file 修复完成"
        else
            echo "⚠️  $file 没有找到import语句，跳过"
            rm "$temp_file"
        fi
    else
        echo "❌ $file 不存在"
    fi
done

echo "🎉 所有API路由dynamic配置修复完成!"