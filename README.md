# 🚀 AI Prompt Builder Pro

专业垂直行业AI提示词生成器 - 为律师、房产经纪人、保险顾问、教师、会计师等专业人士量身打造。

![AI Prompt Builder Pro](./public/og-image.jpg)

## ✨ 项目特色

### 🎯 垂直行业专业化
- **律师**: 合同审查、案例分析、法律研究、文书起草
- **房产经纪人**: 市场分析、客户咨询、投资建议、房源描述
- **保险顾问**: 风险评估、产品推荐、理赔指导、客户教育
- **教师**: 教学设计、学生评估、课程规划、作业设计
- **会计师**: 财务分析、税务规划、审计支持、报表解读

### 🔧 技术栈亮点
- **Next.js 15** - 最新App Router + React 19
- **TypeScript** - 严格模式，100%类型安全
- **Tailwind CSS** - 现代化响应式设计
- **shadcn/ui** - 专业组件库
- **行业定制化** - 5大垂直行业深度定制

## 🚀 快速开始

### 环境要求
- Node.js 18.17+
- npm 9.0+

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/your-org/ai-prompt-builder-pro.git
   cd ai-prompt-builder-pro
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **环境配置**
   ```bash
   cp .env.local.example .env.local
   # 编辑 .env.local 填入必要的环境变量
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

5. **访问应用**
   打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 📁 项目结构

```
ai-prompt-builder-pro/
├── app/                          # Next.js 15 App Router
│   ├── (industries)/             # 行业路由组
│   │   ├── lawyer/              # 律师工作台
│   │   ├── realtor/             # 房产工作台
│   │   ├── insurance/           # 保险工作台
│   │   ├── teacher/             # 教师工作台
│   │   └── accountant/          # 会计工作台
│   ├── api/                     # API路由
│   ├── dashboard/               # 用户中心
│   ├── layout.tsx               # 根布局
│   ├── page.tsx                 # 主页
│   └── globals.css              # 全局样式
├── components/                   # 组件库
│   ├── ui/                      # shadcn/ui组件
│   ├── industry/                # 行业专用组件
│   └── layout/                  # 布局组件
├── lib/                         # 工具库
│   └── utils.ts                 # 通用工具函数
├── types/                       # TypeScript类型定义
│   └── index.ts                 # 核心类型
├── public/                      # 静态资源
├── tailwind.config.js           # Tailwind配置
├── tsconfig.json               # TypeScript配置
├── next.config.js              # Next.js配置
└── vercel.json                 # Vercel部署配置
```

## 🎨 设计系统

### 行业主题色彩
- **律师**: 深蓝色 (#1e3a8a) - 专业、权威
- **房产**: 绿色 (#059669) - 成长、稳定
- **保险**: 紫色 (#7c3aed) - 信任、保障
- **教师**: 橙色 (#ea580c) - 活力、启发
- **会计**: 红色 (#dc2626) - 准确、财务

### 组件规范
- 基于 shadcn/ui 的专业组件库
- 支持行业主题定制
- 响应式设计优先
- 无障碍访问支持

## 🛠️ 可用脚本

```bash
# 开发环境启动
npm run dev

# 生产环境构建
npm run build

# 生产环境启动
npm start

# 代码检查
npm run lint

# 类型检查
npm run type-check

# 运行测试
npm run test

# 监听模式测试
npm run test:watch
```

## 📊 性能优化

### Next.js 15 特性
- **React 19** 并发特性
- **PPR (Partial Prerendering)** 部分预渲染
- **优化字体加载** 自动字体优化
- **静态导出优化** 更快的构建

### SEO优化
- 结构化数据 (JSON-LD)
- Open Graph 标签
- 语义化HTML
- 自动sitemap生成
- 多语言支持准备

### 性能指标目标
- **LCP** < 2.5s
- **FID** < 100ms
- **CLS** < 0.1
- **TTI** < 3.0s

## 🌐 部署

### Vercel部署 (推荐)

1. **连接GitHub**
   ```bash
   # Push到GitHub仓库
   git push origin main
   ```

2. **导入到Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 导入GitHub仓库
   - 配置环境变量
   - 自动部署

3. **环境变量配置**
   在Vercel Dashboard中配置所需环境变量

### 其他部署方式
- **Netlify**: 支持
- **Railway**: 支持
- **Docker**: 配置文件已准备
- **传统服务器**: PM2部署

## 🔐 环境变量

详见 `.env.local.example` 文件，包含：

- 数据库连接 (Supabase)
- 认证配置 (NextAuth.js)
- AI API密钥 (OpenAI)
- 支付配置 (Creem.io)
- 邮件服务
- 分析和监控

## 🧪 测试

```bash
# 单元测试
npm run test

# E2E测试 (计划中)
npm run test:e2e

# 性能测试
npm run lighthouse
```

## 📈 监控和分析

- **性能监控**: Next.js Speed Insights
- **错误追踪**: Sentry
- **用户分析**: Google Analytics
- **实时监控**: Vercel Analytics

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [shadcn/ui](https://ui.shadcn.com/) - 组件库
- [Lucide React](https://lucide.dev/) - 图标库
- [Vercel](https://vercel.com/) - 部署平台

## 📞 联系我们

- **网站**: [ai-prompt-builder-pro.vercel.app](https://ai-prompt-builder-pro.vercel.app)
- **邮箱**: support@ai-prompt-builder-pro.com
- **文档**: [docs.ai-prompt-builder-pro.com](https://docs.ai-prompt-builder-pro.com)

---

<div align="center">
  <p><strong>AI Prompt Builder Pro</strong></p>
  <p>让专业工作更智能，让AI助手更懂你</p>
  <p>Built with ❤️ by AI Prompt Builder Pro Team</p>
</div>