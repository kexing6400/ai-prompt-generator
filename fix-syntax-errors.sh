#!/bin/bash
# 修复语法错误脚本

echo "开始修复语法错误..."

# 处理scenarios文件
sed -i '/\/\/ const { data\.\.\. } = await client/,/;$/c\    \/\/ 数据库操作已禁用' /home/kexing/09-ai-prompt-generator/app/api/admin/test/scenarios/route.ts

# 处理health文件  
sed -i '/\/\/ const { data\.\.\. } = await client/,/;$/c\    \/\/ 数据库操作已禁用' /home/kexing/09-ai-prompt-generator/app/api/admin/test/health/route.ts

# 处理generate文件
sed -i '/\/\/ const { data\.\.\. } = await client/,/;$/c\    \/\/ 数据库操作已禁用' /home/kexing/09-ai-prompt-generator/app/api/admin/test/generate/route.ts

echo "语法错误修复完成"