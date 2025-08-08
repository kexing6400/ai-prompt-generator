# Chrome扩展图标文件

## 设计概念
- **主题**: AI智能提示生成器
- **核心元素**: 提示符号">" + "AI"文字 + 智能火花
- **配色**: 紫蓝渐变 (#8B5CF6 → #3B82F6)
- **风格**: 现代、简洁、科技感

## 文件列表
```
/public/icons/
├── icon-base.svg    (128x128 主图标)
├── icon-48.svg      (48x48 中等图标)
├── icon-16.svg      (16x16 小图标)
└── README.md        (说明文档)
```

## 转换为PNG的步骤

### 方法1: 使用在线转换工具
1. 访问 https://cloudconvert.com/svg-to-png
2. 上传SVG文件
3. 设置目标尺寸：
   - icon-base.svg → 128x128 PNG
   - icon-48.svg → 48x48 PNG  
   - icon-16.svg → 16x16 PNG
4. 下载转换后的PNG文件

### 方法2: 使用命令行工具 (如果有ImageMagick)
```bash
# 转换128x128
convert icon-base.svg -resize 128x128 icon128.png

# 转换48x48
convert icon-48.svg -resize 48x48 icon48.png

# 转换16x16
convert icon-16.svg -resize 16x16 icon16.png
```

### 方法3: 使用浏览器转换
1. 在浏览器中打开SVG文件
2. 右键 → 检查元素 → 截图/导出
3. 或使用浏览器扩展如"SVG Export"

## 文件命名规范
转换完成后，将PNG文件重命名为：
- `icon16.png` (16x16)
- `icon48.png` (48x48) 
- `icon128.png` (128x128)

## 使用位置
1. **Chrome扩展清单**: 更新 `chrome-extension/manifest.json`
2. **Web应用**: 可用于favicon和PWA图标
3. **文档**: 项目logo和品牌标识

## 设计特点
- **可缩放**: SVG格式支持无损缩放
- **高对比度**: 白色图标在彩色背景上清晰可见
- **品牌一致**: 与项目整体设计风格保持一致
- **辨识度高**: 独特的AI+提示符组合，易于识别

## 质量检查
转换完成后请检查：
- [ ] 16x16图标在小尺寸下依然清晰
- [ ] 颜色渐变正确显示
- [ ] 边缘平滑无锯齿
- [ ] 背景透明(如需要)