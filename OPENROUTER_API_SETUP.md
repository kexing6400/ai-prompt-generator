# 🔑 OpenRouter API密钥获取指南

## 紧急说明
当前使用的API密钥无效，需要获取新的有效密钥来启用真实AI功能。

## 获取步骤

### 1. 访问OpenRouter官网
- 打开 https://openrouter.ai
- 点击右上角"Sign In"或"Get Started"

### 2. 注册/登录账户
- 使用GitHub/Google账户登录（推荐）
- 或者注册新账户

### 3. 获取API密钥
- 登录后点击用户头像
- 选择"API Keys"或"Keys"
- 点击"Create new key"
- 输入密钥名称（如：AI Prompt Generator）
- 复制生成的API密钥（以sk-or-开头）

### 4. 配置环境变量
```bash
# 编辑 .env.local 文件
OPENROUTER_API_KEY=sk-or-你的实际密钥
```

## 重要提醒
⚠️ **API密钥安全**：
- 绝不要将API密钥提交到Git仓库
- 不要分享给他人
- 定期轮换密钥

⚠️ **计费说明**：
- OpenRouter按使用量计费
- 大多数模型成本很低（每1M tokens < $1）
- 建议设置使用限制

## 推荐模型（按性价比排序）
1. **meta-llama/llama-3-8b-instruct** - 免费，适合测试
2. **anthropic/claude-3-haiku** - $0.25/1M tokens，快速经济  
3. **openai/gpt-3.5-turbo** - $0.5/1M tokens，经典选择
4. **anthropic/claude-3-sonnet** - $3/1M tokens，高质量
5. **openai/gpt-4-turbo** - $10/1M tokens，最强大

## 测试API
获得密钥后，运行：
```bash
curl -X POST "https://openrouter.ai/api/v1/chat/completions" \
  -H "Authorization: Bearer sk-or-你的密钥" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "meta-llama/llama-3-8b-instruct",
    "messages": [{"role": "user", "content": "你好"}]
  }'
```

## 下一步
获得API密钥后：
1. 更新.env.local文件
2. 重启开发服务器
3. 测试新的AI对话功能