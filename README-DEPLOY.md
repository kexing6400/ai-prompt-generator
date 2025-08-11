# 🚀 律师AI工作台 - 一键部署指南

## 方法1: 最简单 - 通过Vercel网页部署（推荐）

### 步骤1: 点击下方按钮一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kexing6400/ai-prompt-generator&env=OPENROUTER_API_KEY,NEXTAUTH_SECRET,ENCRYPTION_SECRET,NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY&envDescription=配置律师AI工作台所需的环境变量&envLink=https://github.com/kexing6400/ai-prompt-generator/blob/main/VERCEL_DEPLOYMENT_GUIDE.md&project-name=lawyer-ai-workstation&repository-name=lawyer-ai-workstation)

### 步骤2: 登录Vercel
- 如果没有账号，可以使用GitHub账号直接登录
- 网址：https://vercel.com

### 步骤3: 导入您的GitHub仓库
1. 登录后点击 **"Import Git Repository"**
2. 选择 **"Import Third-Party Git Repository"**
3. 输入仓库URL: `https://github.com/kexing6400/ai-prompt-generator`
4. 点击 **Continue**

### 步骤4: 配置环境变量
在部署页面，添加以下环境变量：

| 变量名 | 值 |
|--------|-----|
| OPENROUTER_API_KEY | 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 |
| OPENROUTER_BASE_URL | https://openrouter.ai/api/v1 |
| NEXTAUTH_URL | https://您的项目名.vercel.app |
| NEXTAUTH_SECRET | zKxPQ9mNvR8sT5wL2jF6hA3bC7eD1gY4 |
| ENCRYPTION_SECRET | xY9kL3mN7pQ2rS5tW8vZ1aB4cD6eF0gH |
| NEXT_PUBLIC_SUPABASE_URL | https://xyzcompany.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emNvbXBhbnkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYwMjYzMjY5MCwiZXhwIjoxOTE4MjA4NjkwfQ.36fUebxgx1mcBo4s19v0SzqmzunP--hm_hep0uLX0ew |
| SUPABASE_SERVICE_ROLE_KEY | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emNvbXBhbnkiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjAyNjMyNjkwLCJleHAiOjE5MTgyMDg2OTB9.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q |

### 步骤5: 点击Deploy
- 点击 **"Deploy"** 按钮
- 等待2-3分钟完成部署
- 部署成功后会显示您的网站链接！

---

## 方法2: 通过GitHub自动部署

### 步骤1: Fork仓库
1. 访问: https://github.com/kexing6400/ai-prompt-generator
2. 点击右上角 **"Fork"** 按钮

### 步骤2: 连接Vercel
1. 访问: https://vercel.com/new
2. 选择 **"Import from GitHub"**
3. 选择您刚刚Fork的仓库

### 步骤3: 配置并部署
- 按照上面的环境变量表格配置
- 点击Deploy

---

## ✅ 部署成功后

您的律师AI工作台将在以下地址可用：
- **生产地址**: https://lawyer-ai-workstation.vercel.app
- **预览地址**: https://lawyer-ai-workstation-[用户名].vercel.app

## 🎉 功能包括

- 🤖 **智能法律Prompt生成器**
- 📄 **合同审查与分析**
- 📊 **案件管理系统**
- 🔍 **法律研究助手**
- 🔐 **律师-客户特权保护**
- 🌐 **多语言支持（中英文）**

## ❓ 需要帮助？

如果遇到任何问题：
1. 查看部署日志
2. 确保所有环境变量都已正确配置
3. 访问项目Issues页面寻求帮助

---

**恭喜！** 您的专业律师AI工作台即将上线！🎊