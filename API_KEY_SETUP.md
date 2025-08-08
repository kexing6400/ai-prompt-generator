# 🔑 API密钥配置指南

## 📋 需要配置的API密钥

### 1. OpenRouter API (必需)
- **用途**: AI模型调用，用于智能生成和优化提示词
- **密钥**: `sk-ant-oat01-ee0f35df8f630aae92f9a6561dd9be32edfe84a1e5f0f6e4636923a0e7ad5aca`
- **API地址**: `https://openrouter.ai/api/v1`
- **使用的模型**: `anthropic/claude-3-haiku` (经济实惠)

---

## 🔧 本地开发配置

### 创建 `.env.local` 文件
在项目根目录创建 `.env.local` 文件（已创建）：

```bash
# OpenRouter API配置
OPENROUTER_API_KEY=sk-ant-oat01-ee0f35df8f630aae92f9a6561dd9be32edfe84a1e5f0f6e4636923a0e7ad5aca
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 验证本地配置
```bash
# 启动开发服务器
npm run dev

# 测试API
curl -X POST http://localhost:3000/api/generate-prompt \
  -H "Content-Type: application/json" \
  -d '{"industry":"lawyer","scenario":"合同审查","prompt":"帮我审查这份销售合同"}'
```

---

## 🚀 Vercel部署配置

### 步骤1：进入项目设置
访问: https://vercel.com/kexing6400/ai-prompt-generator/settings/environment-variables

### 步骤2：添加环境变量

| 变量名 | 值 | 环境 |
|--------|---|------|
| `OPENROUTER_API_KEY` | `sk-ant-oat01-ee0f35df8f630aae92f9a6561dd9be32edfe84a1e5f0f6e4636923a0e7ad5aca` | Production |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://aiprompts.ink` | Production |
| `NODE_ENV` | `production` | Production |

### 步骤3：重新部署
添加环境变量后，需要重新部署：
1. 点击 "Redeploy" 按钮
2. 选择最新的提交
3. 等待部署完成

---

## 🛡️ 安全注意事项

### ⚠️ 重要警告
1. **永远不要**将 `.env.local` 文件提交到Git
2. **确保** `.gitignore` 包含 `.env.local`
3. **定期轮换**API密钥（建议每3个月）
4. **监控使用量**避免超额费用

### 已实施的安全措施
- ✅ `.env.local` 已加入 `.gitignore`
- ✅ 生产环境变量通过Vercel安全存储
- ✅ API密钥不会暴露在客户端代码中
- ✅ 实现了本地降级机制（API失败时）

---

## 💰 费用管理

### OpenRouter费用
- **模型**: Claude 3 Haiku
- **价格**: 约 $0.25 / 1M tokens (输入) + $1.25 / 1M tokens (输出)
- **预估成本**: 每1000次请求约 $0.5-1.0
- **查看用量**: https://openrouter.ai/usage

### 费用控制建议
1. 使用更便宜的模型（已配置Haiku）
2. 实现缓存机制减少重复请求
3. 设置每日/每月使用限制
4. 监控异常使用模式

---

## 🔄 API降级策略

项目已实现三层降级策略：

1. **首选**: OpenRouter API智能生成
2. **备选**: 本地模板增强（API失败时）
3. **兜底**: 返回基础提示词（所有方法失败）

```javascript
// 代码位置: app/api/generate-prompt/route.ts
// 第95-103行: 本地增强逻辑
// 第134-146行: API失败降级
// 第159-168行: 错误兜底处理
```

---

## 📊 API使用监控

### 查看日志
在Vercel控制台查看API调用日志：
https://vercel.com/kexing6400/ai-prompt-generator/functions

### 监控指标
- 请求次数
- 响应时间
- 错误率
- Token使用量

---

## 🆘 故障排除

### 问题1: API密钥无效
**解决方案**:
1. 检查密钥是否正确复制（无空格）
2. 确认密钥未过期
3. 验证环境变量已正确设置

### 问题2: 请求超时
**解决方案**:
1. 检查网络连接
2. 尝试使用备用API地址
3. 启用本地降级模式

### 问题3: 费用超支
**解决方案**:
1. 立即在OpenRouter设置使用限制
2. 切换到更便宜的模型
3. 实现请求限流

---

## 📝 检查清单

### 本地开发
- [x] `.env.local` 文件已创建
- [x] API密钥已配置
- [x] 本地测试通过
- [x] `.gitignore` 包含环境文件

### Vercel部署
- [x] 环境变量已添加
- [x] 生产URL已配置
- [ ] API功能已验证
- [ ] 监控已设置

### 安全性
- [x] 密钥未提交到Git
- [x] 使用服务器端API调用
- [x] 实现降级机制
- [ ] 设置使用限制

---

**更新时间**: 2025-01-08
**维护者**: AI Prompt Builder Pro 技术团队
**联系方式**: 通过GitHub Issues