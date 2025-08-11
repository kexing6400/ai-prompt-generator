# 律师AI工作台 - Vercel部署指南

## 🚀 快速部署步骤

### 步骤1: 登录Vercel
```bash
vercel login
```
按提示选择登录方式（GitHub/Email）

### 步骤2: 部署项目
```bash
vercel
```
首次部署时的选项：
- Set up and deploy? **Y**
- Which scope? **选择您的账户**
- Link to existing project? **N**（首次部署选N）
- Project name? **lawyer-ai-workstation**
- In which directory is your code? **./**
- Want to override the settings? **N**

### 步骤3: 配置环境变量

部署完成后，访问 [Vercel Dashboard](https://vercel.com/dashboard)

1. 找到您的项目 `lawyer-ai-workstation`
2. 点击 **Settings** → **Environment Variables**
3. 添加以下环境变量：

```env
# OpenRouter API配置（必需）
OPENROUTER_API_KEY=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
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# NextAuth配置（必需）
NEXTAUTH_URL=https://您的域名.vercel.app
NEXTAUTH_SECRET=zKxPQ9mNvR8sT5wL2jF6hA3bC7eD1gY4

# 加密配置（必需）
ENCRYPTION_SECRET=xY9kL3mN7pQ2rS5tW8vZ1aB4cD6eF0gH

# Supabase配置（必需）
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emNvbXBhbnkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYwMjYzMjY5MCwiZXhwIjoxOTE4MjA4NjkwfQ.36fUebxgx1mcBo4s19v0SzqmzunP--hm_hep0uLX0ew
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emNvbXBhbnkiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjAyNjMyNjkwLCJleHAiOjE5MTgyMDg2OTB9.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q

# 应用配置
NEXT_PUBLIC_APP_NAME=律师AI工作台
NODE_ENV=production

# 功能开关
NEXT_PUBLIC_ENABLE_AUTH=false
NEXT_PUBLIC_ENABLE_ANALYTICS=false

# API限制
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000

# 日志级别
LOG_LEVEL=info
```

### 步骤4: 重新部署
配置环境变量后，重新部署以应用更改：
```bash
vercel --prod
```

## 🔗 访问您的应用

部署成功后，您可以通过以下方式访问：
- **预览URL**: https://lawyer-ai-workstation-xxx.vercel.app
- **生产URL**: https://lawyer-ai-workstation.vercel.app

## 📋 功能验证清单

部署后，请验证以下功能：

### 1. 基础功能
- [ ] 首页正常加载
- [ ] 所有页面路由正常
- [ ] 样式显示正确

### 2. AI功能
- [ ] 律师Prompt生成器工作正常
- [ ] 合同审查功能可用
- [ ] 案件管理系统运行
- [ ] 法律研究助手响应

### 3. API集成
- [ ] OpenRouter API连接成功
- [ ] 数据库连接正常
- [ ] 文档生成功能

### 4. 安全性
- [ ] 环境变量正确加载
- [ ] 无硬编码密钥暴露
- [ ] HTTPS正确配置

## 🛠️ 故障排除

### 问题1: 构建失败
如果构建失败，检查：
```bash
npm run build
```
本地是否成功

### 问题2: 环境变量未生效
1. 确保在Vercel Dashboard正确配置
2. 重新部署：`vercel --prod`

### 问题3: API调用失败
检查OpenRouter API密钥是否正确配置

## 📞 需要帮助？

如遇到问题，请：
1. 查看Vercel部署日志
2. 检查浏览器控制台错误
3. 确认所有环境变量已配置

## 🎉 部署成功后

恭喜！您的律师AI工作台已成功部署。现在您可以：
- 使用专业的法律AI助手
- 处理合同审查任务
- 管理案件信息
- 进行法律研究

---

**重要提示**: 
- 请妥善保管您的API密钥
- 定期更新依赖项以保持安全性
- 监控使用量避免超出API限额