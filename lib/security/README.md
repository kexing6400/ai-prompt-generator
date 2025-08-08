# 🛡️ 安全架构文档

## 概述

本项目实施了企业级的Web安全防护策略，基于OWASP Top 10防护要求，提供多层安全防护。

## 🔒 安全特性

### 1. 内容安全策略 (CSP)
- **严格的指令控制**: 限制资源加载来源，防止XSS攻击
- **Nonce机制**: 替代`unsafe-inline`，提供更安全的内联脚本执行
- **违规报告**: 实时监控CSP违规，及时发现安全威胁
- **API白名单**: 明确允许的外部API连接（OpenRouter等）

### 2. 安全头部配置
```http
Content-Security-Policy: 严格的CSP策略
X-Frame-Options: DENY  
X-XSS-Protection: 1; mode=block
X-Content-Type-Options: nosniff
Strict-Transport-Security: HTTPS强制
Referrer-Policy: 隐私保护
Permissions-Policy: 危险API限制
```

### 3. 脚本安全机制
- **SafeScript组件**: 安全的内联脚本执行
- **SafeJSONLD组件**: 安全的结构化数据
- **Nonce验证**: 确保只有授权脚本可执行

## 📁 文件结构

```
lib/security/
├── csp.ts              # CSP策略配置和管理
└── README.md           # 本文档

components/security/
└── SafeScript.tsx      # 安全脚本组件

app/api/security/
├── csp-report/         # CSP违规报告端点
└── test/              # 安全配置测试端点
```

## 🚀 使用方法

### 1. CSP策略更新
如需修改CSP策略，编辑 `lib/security/csp.ts`:

```typescript
// 添加新的外部域名
connect-src 'self' https://new-api.example.com
```

### 2. 安全脚本使用
使用SafeScript组件替代传统的script标签：

```tsx
import { SafeScript, SafeJSONLD } from '@/components/security/SafeScript';

// JavaScript脚本
<SafeScript id="my-script">
  {`console.log('安全脚本执行');`}
</SafeScript>

// JSON-LD结构化数据
<SafeJSONLD 
  data={{ '@type': 'WebSite', name: 'My Site' }}
/>
```

### 3. 安全测试
在开发环境下访问测试端点：
```
GET /api/security/test
```

### 4. CSP违规监控
查看违规报告：
```
GET /api/security/csp-report
```

## ⚠️ 重要注意事项

### 开发环境 vs 生产环境
- **开发环境**: 允许localhost连接和HTTP协议
- **生产环境**: 强制HTTPS，严格的安全策略

### API集成安全
确保所有外部API调用都在CSP的`connect-src`中声明：

```typescript
// ✅ 正确 - 在CSP中声明
connect-src 'self' https://openrouter.ai

// ❌ 错误 - 未声明的域名会被阻止
fetch('https://unknown-api.com/data')
```

### 脚本安全最佳实践
1. **优先使用nonce**: 避免`unsafe-inline`
2. **最小权限原则**: 只添加必需的CSP指令
3. **定期审查**: 监控CSP违规报告
4. **分层防护**: CSP + XSS防护 + 输入验证

## 🔍 故障排除

### 常见问题

**Q: 脚本被CSP阻止怎么办？**
A: 使用SafeScript组件或在CSP中添加nonce

**Q: 外部API调用失败？**
A: 检查connect-src指令是否包含目标域名

**Q: 字体或样式加载失败？**
A: 确认font-src和style-src指令配置正确

### 调试步骤
1. 检查浏览器控制台的CSP错误
2. 访问 `/api/security/test` 查看配置状态
3. 查看 `/api/security/csp-report` 的违规报告
4. 使用浏览器开发工具的Network面板检查请求

## 🛠️ 维护指南

### 定期安全检查
- [ ] 每月检查CSP违规报告
- [ ] 季度更新安全头部配置
- [ ] 年度安全审计和渗透测试

### 升级注意事项
- 新增外部服务时，及时更新CSP策略
- Next.js升级后，测试安全配置兼容性
- 第三方依赖更新后，检查安全影响

## 📚 参考资源

- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [Mozilla CSP文档](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Next.js安全最佳实践](https://nextjs.org/docs/advanced-features/security-headers)

---

**安全是一个持续的过程，不是一次性的任务。定期审查和更新安全配置，确保应用始终受到最佳保护。**