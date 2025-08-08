# AskSmarter 图标说明

## 图标需求

Chrome扩展需要以下尺寸的图标：

- **icon16.png** - 16x16像素，用于扩展管理页面
- **icon32.png** - 32x32像素，用于Windows系统
- **icon48.png** - 48x48像素，用于扩展管理页面
- **icon128.png** - 128x128像素，用于Chrome Web Store

## 设计要求

### 主题元素
- **主色调**：渐变紫色 (#667eea 到 #764ba2)
- **核心图标**：✨ 星星/闪光效果
- **设计风格**：现代、简约、科技感

### 设计概念
1. **圆形背景**：紫色渐变圆形背景
2. **中心图标**：白色的✨符号或抽象的AI大脑图案
3. **光效**：subtle的发光效果体现"智能优化"概念

## 临时解决方案

在正式设计图标之前，您可以：

1. **使用在线工具创建**：
   - Canva.com
   - Figma.com
   - Adobe Express

2. **AI生成图标**：
   ```
   Prompt: "Create a Chrome extension icon with purple gradient background, 
   white sparkle symbol in center, modern design, tech style, 16x16 to 128x128 sizes"
   ```

3. **临时占位图标**：
   - 可以先使用纯色方块进行测试
   - 确保功能正常后再替换为正式图标

## 创建步骤

1. 创建128x128的主图标
2. 缩放至其他尺寸：48x48, 32x32, 16x16
3. 确保在小尺寸下图标仍清晰可见
4. 保存为PNG格式，背景透明

## 文件位置

将创建好的图标文件放置在：
```
assets/icons/
├── icon16.png
├── icon32.png
├── icon48.png
└── icon128.png
```

注意：在有正式图标之前，扩展仍可正常工作，只是会显示默认的Chrome扩展图标。