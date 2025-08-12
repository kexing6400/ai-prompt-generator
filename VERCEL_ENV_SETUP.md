# 🔧 Vercel环境变量配置指南

## 🚨 重要提示
**构建问题已修复！** 现在需要在Vercel Dashboard中配置环境变量才能正常运行。

## 📋 必需的环境变量列表

### 🔑 核心API配置
```env
# OpenRouter API（主要AI服务）- 必需
OPENROUTER_API_KEY=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
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# NextAuth认证密钥 - 必需
NEXTAUTH_SECRET=zKxPQ9mNvR8sT5wL2jF6hA3bC7eD1gY4
NEXTAUTH_URL=https://ai-prompt-generator-git-main-kexing6400s-projects.vercel.app.vercel.app

# 数据加密密钥 - 必需（至少32字符）
ENCRYPTION_SECRET=xY9kL3mN7pQ2rS5tW8vZ1aB4cD6eF0gH
```

### 🗄️ 数据库配置
```env
# Supabase数据库配置
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emNvbXBhbnkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYwMjYzMjY5MCwiZXhwIjoxOTE4MjA4NjkwfQ.36fUebxgx1mcBo4s19v0SzqmzunP--hm_hep0uLX0ew
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emNvbXBhbnkiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjAyNjMyNjkwLCJleHAiOjE5MTgyMDg2OTB9.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q
```

### ⚙️ 应用配置
```env
# 应用基础配置
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

## 🚀 在Vercel中配置环境变量

### 方法1: 通过Vercel Dashboard
1. **访问项目设置**
   - 登录 [Vercel Dashboard](https://vercel.com/dashboard)
   - 找到您的项目 `ai-prompt-generator`
   - 点击项目名称进入项目页面

2. **添加环境变量**
   - 点击 **Settings** 标签
   - 在左侧菜单选择 **Environment Variables**
   - 点击 **Add Environment Variable**

3. **逐个添加变量**
   - **Name**: `OPENROUTER_API_KEY`
   - **Value**: `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`
   - **Environment**: 选择 `Production`, `Preview`, `Development` (全选)
   - 点击 **Save**

4. **重复添加所有变量**（参考上面的列表）

### 方法2: 通过Vercel CLI
```bash
# 如果已安装Vercel CLI
vercel env add OPENROUTER_API_KEY
# 输入值: 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

vercel env add NEXTAUTH_SECRET
# 输入值: zKxPQ9mNvR8sT5wL2jF6hA3bC7eD1gY4

# ... 依此类推添加所有环境变量
```

## 🔄 重新部署
配置完环境变量后：

1. **触发重新部署**
   - 在Vercel Dashboard中点击 **Deployments** 标签
   - 点击最新部署旁的 **⋯** 菜单
   - 选择 **Redeploy**

2. **或者推送代码触发部署**
   ```bash
   git commit --allow-empty -m "触发重新部署"
   git push origin main
   ```

## ✅ 验证部署成功

部署完成后，访问您的应用：
- **生产URL**: https://ai-prompt-generator.vercel.app
- **预览URL**: https://ai-prompt-generator-[random].vercel.app

### 检查项目：
1. ✅ 首页正常加载
2. ✅ 律师AI工具正常工作
3. ✅ API调用成功
4. ✅ 无控制台错误

## 🛠️ 故障排除

### 问题1: 仍然出现环境变量错误
**解决方案**：
- 确保在Vercel Dashboard中正确设置了所有环境变量
- 变量名要完全匹配（区分大小写）
- 重新部署项目

### 问题2: API调用失败
**解决方案**：
- 检查OpenRouter API密钥是否正确
- 确认API密钥仍然有效
- 查看Vercel函数日志

### 问题3: 数据库连接问题
**解决方案**：
- 验证Supabase URL和密钥
- 确保数据库项目处于活跃状态

## 📞 需要帮助？

如果遇到问题：
1. 查看Vercel部署日志
2. 检查浏览器控制台错误
3. 确认所有环境变量都已正确配置

---

**部署状态**: 🟢 准备就绪 - 代码已修复，等待环境变量配置