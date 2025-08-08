# AskSmarter - AI Prompt Enhancer

## 项目简介

AskSmarter是一个智能的Chrome扩展程序，专门为提升AI对话质量而设计。它能够自动优化用户在ChatGPT、Claude、Gemini等AI平台上的prompt，让您的问题更加专业、精准，从而获得更好的AI回答。

## 核心功能

### 🎯 一键智能优化
- 在支持的AI平台页面显示悬浮按钮
- 一键获取并优化用户输入的prompt
- 实时将优化后的内容替换回输入框

### 🏢 垂直行业支持
- **律师**：自动添加法律依据要求、风险提示、专业术语
- **产品经理**：强调用户导向、数据驱动、多维度分析
- **医生**：包含临床考虑、安全提醒、科学性要求
- **通用模式**：适用于所有场景的基础优化

### 🌐 多平台兼容
- ChatGPT (chat.openai.com)
- Claude (claude.ai)
- Gemini (gemini.google.com)
- Perplexity (perplexity.ai)

### 📊 使用统计
- 记录优化次数和使用频率
- 分平台统计使用情况
- 提供个性化使用数据

## 安装方法

### 开发者模式安装
1. 打开Chrome浏览器
2. 进入扩展管理页面 (chrome://extensions/)
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择本项目文件夹

### Chrome Web Store（计划中）
暂未上架，敬请期待

## 使用方法

### 基础使用
1. 访问任意支持的AI平台
2. 在输入框中输入您的问题
3. 点击页面右侧的"✨优化"悬浮按钮
4. 等待处理完成，优化后的prompt将自动替换原内容

### 个性化设置
1. 点击Chrome工具栏的AskSmarter图标
2. 选择您的行业（律师/产品经理/医生/通用）
3. 调整功能开关
4. 保存设置

## 技术特色

### 🚀 先进技术栈
- **Manifest V3**：使用最新的Chrome扩展标准
- **原生JavaScript**：无依赖，轻量高效
- **模块化设计**：便于维护和功能扩展

### 🎨 优秀设计
- **极简UI**：不干扰用户正常使用
- **流畅动画**：涟漪效果、加载动画
- **响应式设计**：适配不同屏幕尺寸

### 🔒 安全可靠
- **本地处理**：所有优化算法本地执行
- **隐私保护**：不收集用户输入内容
- **权限最小化**：仅请求必要权限

## 文件结构

```
chrome-extension/
├── manifest.json          # 扩展配置文件
├── background.js          # 后台服务脚本
├── content/
│   └── content.js         # 内容脚本（核心功能）
├── popup/
│   ├── popup.html         # 设置界面
│   ├── popup.css          # 界面样式
│   └── popup.js           # 界面逻辑
├── assets/
│   ├── styles.css         # 全局样式
│   └── icons/             # 扩展图标
├── templates/
│   ├── general.js         # 通用模板
│   ├── lawyer.js          # 律师模板
│   ├── pm.js              # 产品经理模板
│   └── doctor.js          # 医生模板
└── README.md              # 本文档
```

## 核心算法

### 优化策略
1. **角色设定**：根据行业添加专业角色前缀
2. **结构化要求**：确保输出格式清晰有条理
3. **专业术语**：添加行业特定的关键词和要求
4. **质量保证**：强调准确性、专业性、实用性

### 平台适配
- 智能识别不同AI平台的输入框
- 多重选择器策略提高兼容性
- 事件模拟确保平台能检测到内容变化

## 开发计划

### 短期目标 (v1.x)
- [ ] 支持更多AI平台（Bard、Copilot等）
- [ ] 增加更多垂直行业模板
- [ ] 优化算法精度
- [ ] 添加快捷键支持

### 中期目标 (v2.x)
- [ ] 接入OpenRouter API实现真正的AI优化
- [ ] 支持自定义模板和规则
- [ ] 添加协作功能
- [ ] 多语言支持

### 长期目标 (v3.x)
- [ ] 构建prompt优化平台
- [ ] AI训练数据收集（匿名）
- [ ] 企业版功能
- [ ] 移动端支持

## 开发环境

### 技术要求
- Chrome 88+ （支持Manifest V3）
- 现代JavaScript ES6+支持

### 开发工具
- VS Code + Chrome DevTools
- Chrome Extension开发工具

### 调试方法
1. 在chrome://extensions/中重新加载扩展
2. 右键扩展图标选择"审查弹出内容"
3. 在AI平台页面按F12查看控制台

## 贡献指南

欢迎提交Issue和Pull Request！

### Issue提交
- 使用问题/功能请求模板
- 提供详细的复现步骤
- 包含Chrome版本和操作系统信息

### 代码贡献
- Fork本仓库
- 创建feature分支
- 提交详细的commit信息（中文）
- 发起Pull Request

## 许可证

MIT License - 详见LICENSE文件

## 联系方式

- 项目地址：[GitHub Repository]
- 问题反馈：[GitHub Issues]
- 邮件联系：[your-email@domain.com]

---

**注意**：本扩展仅用于优化prompt质量，不会收集或存储用户的对话内容。所有处理均在本地完成，确保您的隐私安全。