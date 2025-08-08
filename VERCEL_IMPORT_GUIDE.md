# 🚀 Vercel 项目重新导入指南

## ⚠️ 重要：请严格按照以下步骤操作

### 第一步：删除旧项目
1. 访问 https://vercel.com/dashboard
2. 找到 `ai-prompt-generator` 项目
3. 点击项目进入设置
4. 滚动到最底部，点击 "Delete Project"
5. 输入项目名称确认删除

### 第二步：重新导入项目

1. **点击 "Add New..." → "Project"**

2. **选择 GitHub 仓库**
   - 选择 `kexing6400/ai-prompt-generator`
   - 点击 "Import"

3. **⚠️ 关键配置（非常重要！）**

   📌 **Configure Project** 页面设置：
   
   **Project Name:**
   ```
   ai-prompt-generator
   ```
   
   **Framework Preset:**
   ```
   Next.js（应该会自动检测）
   ```
   
   **Root Directory:**
   ```
   ./ （留空或者输入 ./）
   ```
   
   **Build and Output Settings:**
   - ✅ 点击 "Override" 开关
   
   **Build Command:**
   ```
   npm run build
   ```
   
   **Output Directory:**
   ```
   .next
   ```
   
   **Install Command:**
   ```
   npm install
   ```
   
   **Development Command:**
   ```
   npm run dev
   ```

4. **环境变量设置**
   
   点击 "Environment Variables" 添加以下变量：
   
   | Name | Value | Environment |
   |------|-------|-------------|
   | OPENROUTER_API_KEY | sk-ant-oat01-ee0f35df8f630aae92f9a6561dd9be32edfe84a1e5f0f6e4636923a0e7ad5aca | Production |
   | OPENROUTER_BASE_URL | https://openrouter.ai/api/v1 | Production |
   | NEXT_PUBLIC_APP_URL | https://aiprompts.ink | Production |
   | NODE_ENV | production | Production |

5. **Node.js Version**
   - 在 "Node.js Version" 下拉菜单中选择 **20.x**

6. **点击 "Deploy"**

### 第三步：部署后检查

1. **查看构建日志**
   - 点击 "Building" 查看实时日志
   - 确认没有 "Module not found" 错误

2. **如果部署成功**
   - 访问临时域名测试功能
   - 配置自定义域名 aiprompts.ink

3. **如果还是失败**
   - 截图错误信息
   - 我们将采用更激进的修复方案

## 🔍 检查点清单

部署前确认：
- [ ] Git仓库所有更改已提交
- [ ] 本地 `npm run build` 成功
- [ ] `.nvmrc` 文件存在（内容为 20）
- [ ] `vercel.json` 文件配置正确
- [ ] `tsconfig.json` 中 moduleResolution 为 "node"
- [ ] 所有导入路径使用双引号
- [ ] package-lock.json 已提交

导入时确认：
- [ ] Framework Preset 选择 Next.js
- [ ] Build Command 为 npm run build
- [ ] Output Directory 为 .next
- [ ] Node.js Version 选择 20.x
- [ ] 环境变量已添加

## 💡 特别注意

1. **不要修改默认设置**，除非上面明确指出
2. **确保选择 Node.js 20.x**，不要用默认的 18.x
3. **环境变量要设置为 Production**
4. **Root Directory 留空或输入 ./**

## 📞 如果遇到问题

1. 截图错误信息
2. 检查构建日志的前50行
3. 我们将根据具体错误调整策略

---
更新时间：2025-01-08
准备人：AI Prompt Builder Pro 技术团队