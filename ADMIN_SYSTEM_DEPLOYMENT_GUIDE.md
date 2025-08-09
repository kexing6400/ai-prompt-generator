# AI Prompt Generator 管理后台部署指南

## 📋 系统概述

本管理后台系统为AI Prompt Generator项目提供完整的配置管理功能，支持：

- 🔐 密码保护的管理界面
- ⚙️ 动态API配置（OpenRouter密钥、模型参数等）
- 🎯 提示词模版管理
- 🔄 配置热更新（无需重启）
- 📊 系统监控和日志审计
- 🛡️ 企业级安全防护

## 🏗️ 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   管理界面      │────│   认证中间件    │────│   配置API      │
│   /admin        │    │   JWT + CSRF    │    │   CRUD操作      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   配置缓存      │    │   加密服务      │    │   Supabase DB   │
│   热更新机制    │    │   敏感数据保护  │    │   持久化存储    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 快速部署步骤

### 1. Supabase数据库设置

#### 1.1 创建Supabase项目
1. 访问 [Supabase.com](https://supabase.com)
2. 创建新项目
3. 获取项目URL和API密钥

#### 1.2 执行数据库初始化
```bash
# 在Supabase SQL编辑器中执行
cat database/schema.sql | pbcopy  # 复制SQL内容
# 粘贴到Supabase SQL编辑器并执行
```

### 2. 环境变量配置

#### 2.1 复制环境变量模板
```bash
cp .env.example .env.local
```

#### 2.2 填入必需配置
```bash
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 生成安全密钥
JWT_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 16)
```

### 3. 本地开发测试

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问管理后台
open http://localhost:3000/admin
```

### 4. Vercel生产部署

#### 4.1 环境变量设置
在Vercel项目设置中添加：

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-64-char-jwt-secret
ENCRYPTION_KEY=your-32-char-encryption-key
```

#### 4.2 部署命令
```bash
# 构建并部署
vercel --prod
```

### 5. 首次登录初始化

1. 访问 `https://your-domain.com/admin`
2. 首次访问会提示设置管理员密码
3. 设置强密码（包含大小写字母、数字、特殊字符，至少8位）
4. 登录后配置API密钥等关键参数

## ⚙️ 配置管理说明

### API配置
- `openrouter_api_key`: OpenRouter API密钥
- `openrouter_base_url`: API基础URL
- `api_timeout`: 请求超时时间
- `default_model`: 默认使用的AI模型

### 安全配置
- `admin_password_hash`: 管理员密码（自动加密）
- `jwt_secret`: JWT签名密钥（自动生成）
- `session_duration`: 会话持续时间

### 缓存配置
- `cache_ttl`: 缓存过期时间
- `cache_max_size`: 缓存最大条目数

## 🛡️ 安全特性

### 认证安全
- JWT token认证，HttpOnly Cookie存储
- CSRF保护，防止跨站请求伪造
- 登录速率限制（15分钟内最多5次尝试）
- 会话超时自动登出

### 数据安全
- 敏感配置AES-256加密存储
- 密码使用PBKDF2哈希
- SQL注入防护
- XSS攻击防护

### 操作安全
- 所有配置变更记录审计日志
- IP地址记录和验证
- 配置验证和测试机制

## 🔧 高级配置

### 自定义域名访问限制
```javascript
// middleware.ts 中添加
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const adminDomain = 'admin.yourdomain.com';
    if (request.headers.get('host') !== adminDomain) {
      return new Response('Forbidden', { status: 403 });
    }
  }
}
```

### IP白名单限制
```sql
-- 在Supabase中创建IP白名单表
CREATE TABLE admin_ip_whitelist (
  ip INET PRIMARY KEY,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO admin_ip_whitelist VALUES 
('192.168.1.0/24', '内网地址段'),
('your.office.ip', '办公室IP');
```

## 📊 监控和维护

### 系统健康检查
```bash
# 检查API状态
curl https://your-domain.com/api/generate-prompt-v4

# 检查管理后台状态
curl https://your-domain.com/api/admin/config
```

### 配置备份
```sql
-- 导出配置备份
SELECT * FROM admin_config;
SELECT * FROM ai_models WHERE enabled = true;
SELECT * FROM prompt_templates WHERE active = true;
```

### 审计日志查询
```sql
-- 查看最近的配置变更
SELECT * FROM config_audit 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

## 🐛 常见问题解决

### 问题1: 无法连接Supabase
```bash
# 检查环境变量
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# 测试数据库连接
psql -h db.your-project.supabase.co -U postgres
```

### 问题2: 配置加密失败
```bash
# 检查加密密钥
echo $ENCRYPTION_KEY  # 应该是32字符的十六进制字符串

# 重新生成密钥
export ENCRYPTION_KEY=$(openssl rand -hex 16)
```

### 问题3: JWT验证失败
```bash
# 检查JWT密钥
echo $JWT_SECRET  # 应该是64字符的随机字符串

# 重新生成密钥（会使所有现有会话失效）
export JWT_SECRET=$(openssl rand -hex 32)
```

## 🔄 系统升级

### 数据库升级
```sql
-- 添加新配置字段示例
ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS 
config_group VARCHAR(50) DEFAULT 'default';

-- 创建索引优化
CREATE INDEX IF NOT EXISTS idx_admin_config_group 
ON admin_config(config_group);
```

### 应用升级
```bash
# 拉取最新代码
git pull origin main

# 更新依赖
npm update

# 重新部署
vercel --prod
```

## 📞 技术支持

如遇到部署或使用问题：

1. 检查浏览器控制台错误信息
2. 查看Vercel部署日志
3. 验证Supabase数据库连接
4. 确认环境变量配置正确

---

## ✅ 部署检查清单

- [ ] Supabase项目已创建
- [ ] 数据库表已初始化
- [ ] 环境变量已配置
- [ ] 本地测试通过
- [ ] Vercel部署成功
- [ ] 管理员密码已设置
- [ ] API配置已完成
- [ ] 配置测试通过
- [ ] 系统监控正常

完成以上步骤后，您的AI Prompt Generator管理后台就可以正常使用了！