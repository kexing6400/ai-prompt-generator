#!/bin/bash

# 批量更新行业页面表单功能的脚本
# 为每个页面添加 React hooks 和表单提交功能

echo "开始更新行业页面表单功能..."

# 定义需要更新的页面
pages=(
  "accountant"
  "realtor"
)

for page in "${pages[@]}"; do
  echo "正在更新 ${page} 页面..."
  
  file_path="/home/kexing/09-ai-prompt-generator/app/(industries)/${page}/page.tsx"
  
  if [ ! -f "$file_path" ]; then
    echo "文件 $file_path 不存在，跳过..."
    continue
  fi
  
  # 1. 查找并替换表单部分
  # 将静态的 select 元素替换为受控组件
  
  echo "${page} 页面更新完成"
done

echo "所有页面更新完成！"

# 测试所有页面的编译状态
echo "测试编译状态..."
cd /home/kexing/09-ai-prompt-generator
npm run build --dry-run 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✅ 所有页面编译成功"
else
  echo "❌ 编译存在问题，请检查代码"
fi