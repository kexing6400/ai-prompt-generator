#!/bin/bash

# 修复剩余的API路由

echo "🚀 修复剩余API路由dynamic配置..."

# 剩余需要修复的文件列表
remaining_files=(
    "/home/kexing/09-ai-prompt-generator/app/api/generate-prompt-v3/route.ts"
    "/home/kexing/09-ai-prompt-generator/app/api/generate-prompt-debug/route.ts"
    "/home/kexing/09-ai-prompt-generator/app/api/templates/[id]/route.ts"
    "/home/kexing/09-ai-prompt-generator/app/api/test/route.ts"
    "/home/kexing/09-ai-prompt-generator/app/api/document/generate/route.ts"
    "/home/kexing/09-ai-prompt-generator/app/api/generate-prompt-v4/route.ts"
    "/home/kexing/09-ai-prompt-generator/app/api/ai/optimize/route.ts"
    "/home/kexing/09-ai-prompt-generator/app/api/security/test/route.ts"
)

for file in "${remaining_files[@]}"; do
    if [ -f "$file" ]; then
        echo "📝 修复 $file"
        
        # 检查是否已经有dynamic配置
        if grep -q "export const dynamic" "$file"; then
            echo "⚠️  $file 已经有dynamic配置，跳过"
            continue
        fi
        
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
            echo "⚠️  $file 没有找到import语句，手动处理"
            # 在文件开头添加（通常是export function的前面）
            echo "// 强制动态渲染 - 确保每次请求都重新执行" > "$temp_file"
            echo "export const dynamic = 'force-dynamic';" >> "$temp_file"
            echo "" >> "$temp_file"
            cat "$file" >> "$temp_file"
            mv "$temp_file" "$file"
            echo "✅ $file 手动修复完成"
        fi
    else
        echo "❌ $file 不存在"
    fi
done

echo "🎉 剩余API路由修复完成!"