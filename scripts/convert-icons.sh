#!/bin/bash

# Chrome扩展图标转换脚本
# 将SVG图标转换为PNG格式

echo "🎨 开始转换Chrome扩展图标..."

# 设置目录路径
ICONS_DIR="/home/kexing/09-ai-prompt-generator/chrome-extension/assets/icons"
PUBLIC_ICONS_DIR="/home/kexing/09-ai-prompt-generator/public/icons"

# 检查是否安装了ImageMagick
if command -v convert >/dev/null 2>&1; then
    echo "✅ 发现ImageMagick，使用本地转换..."
    
    # 转换Chrome扩展图标
    cd "$ICONS_DIR"
    
    # 16x16
    if [ -f "icon16.svg" ]; then
        convert icon16.svg -resize 16x16 icon16.png
        echo "✅ 创建 icon16.png"
    fi
    
    # 48x48
    if [ -f "icon48.svg" ]; then
        convert icon48.svg -resize 48x48 icon48.png
        echo "✅ 创建 icon48.png"
    fi
    
    # 128x128
    if [ -f "icon128.svg" ]; then
        convert icon128.svg -resize 128x128 icon128.png
        echo "✅ 创建 icon128.png"
    fi
    
    # 也转换public目录的图标
    cd "$PUBLIC_ICONS_DIR"
    if [ -f "icon-base.svg" ]; then
        convert icon-base.svg -resize 128x128 icon128.png
        convert icon-48.svg -resize 48x48 icon48.png
        convert icon-16.svg -resize 16x16 icon16.png
        echo "✅ 转换public目录图标完成"
    fi
    
elif command -v inkscape >/dev/null 2>&1; then
    echo "✅ 发现Inkscape，使用Inkscape转换..."
    
    cd "$ICONS_DIR"
    
    # 使用Inkscape转换
    if [ -f "icon16.svg" ]; then
        inkscape --export-png=icon16.png --export-width=16 --export-height=16 icon16.svg
        echo "✅ 创建 icon16.png"
    fi
    
    if [ -f "icon48.svg" ]; then
        inkscape --export-png=icon48.png --export-width=48 --export-height=48 icon48.svg
        echo "✅ 创建 icon48.png"
    fi
    
    if [ -f "icon128.svg" ]; then
        inkscape --export-png=icon128.png --export-width=128 --export-height=128 icon128.svg
        echo "✅ 创建 icon128.png"
    fi
    
else
    echo "❌ 未找到ImageMagick或Inkscape"
    echo "请安装以下工具之一："
    echo "  Ubuntu/Debian: sudo apt install imagemagick"
    echo "  macOS: brew install imagemagick"
    echo "  或者使用在线转换工具："
    echo "  - https://cloudconvert.com/svg-to-png"
    echo "  - https://convertio.co/svg-png/"
    echo ""
    echo "📋 需要转换的文件："
    echo "  $ICONS_DIR/icon16.svg → icon16.png (16x16)"
    echo "  $ICONS_DIR/icon48.svg → icon48.png (48x48)" 
    echo "  $ICONS_DIR/icon128.svg → icon128.png (128x128)"
    exit 1
fi

echo ""
echo "🎉 图标转换完成！"
echo "📁 文件位置: $ICONS_DIR"
echo ""
echo "📋 下一步操作："
echo "1. 检查生成的PNG图标质量"
echo "2. 确保manifest.json中正确引用了图标文件"
echo "3. 测试Chrome扩展加载"