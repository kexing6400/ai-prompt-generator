# 🛡️ AI Prompt Generator 安全审计工具使用指南

本指南详细说明如何使用comprehensive安全审计工具来保护您的AI Prompt Generator项目。

## 📦 工具概览

本项目包含三个主要的安全审计工具：

### 1. 🔍 主安全审计脚本 (`security-audit.js`)
- **功能**: 全面自动化安全扫描
- **检查项目**: API密钥、环境变量、XSS/CSRF防护、HTTPS配置、依赖漏洞、敏感信息泄露、输入验证
- **输出**: 详细的安全审计报告 (`SECURITY_AUDIT_REPORT.md`)

### 2. ✅ 安全检查清单 (`security-checklist.js`)
- **功能**: 交互式安全检查清单
- **特点**: 分类检查、进度跟踪、状态保存、详细指导
- **适用**: 手动安全审查和团队协作

### 3. 🔧 专业安全工具集 (`security-tools.js`)
- **功能**: 专门化安全工具集合
- **工具**: 依赖扫描、敏感信息检测、CSP验证、API安全、环境变量审计
- **特点**: 单独运行，深度分析

## 🚀 快速开始

### 基础安全审计
```bash
# 运行完整安全审计
node scripts/security-audit.js

# 生成详细报告
node scripts/security-audit.js --report

# verbose模式（详细输出）
node scripts/security-audit.js --verbose
```

### 交互式安全检查
```bash
# 启动交互式检查清单
node scripts/security-checklist.js

# 导出检查清单报告
node scripts/security-checklist.js --export

# 重置检查清单状态
node scripts/security-checklist.js --reset
```

### 专业工具使用
```bash
# 运行所有专业工具
node scripts/security-tools.js all

# 单独运行依赖扫描
node scripts/security-tools.js deps

# 敏感信息检测
node scripts/security-tools.js secrets

# CSP配置验证
node scripts/security-tools.js csp

# API安全检查
node scripts/security-tools.js api

# 环境变量审计
node scripts/security-tools.js env
```

## 📋 详细使用说明

### 安全审计脚本详解

#### 检查范围
1. **API密钥安全性**
   - OpenRouter API密钥格式验证
   - 硬编码密钥检测
   - 密钥强度评估

2. **环境变量安全**
   - 敏感数据客户端暴露检测
   - Git追踪状态检查
   - 环境隔离验证

3. **XSS/CSRF防护**
   - CSP配置完整性检查
   - 不安全指令检测
   - nonce机制验证

4. **HTTPS和传输安全**
   - HSTS头部配置
   - 混合内容检查
   - SSL/TLS配置验证

5. **依赖项安全**
   - npm audit漏洞扫描
   - 过时依赖检测
   - 未使用依赖识别

6. **敏感信息泄露**
   - 硬编码秘密检测
   - 调试信息识别
   - 错误信息分析

7. **输入验证和输出编码**
   - API端点输入验证
   - SQL注入风险评估
   - XSS防护措施检查

#### 输出报告结构
```
SECURITY_AUDIT_REPORT.md
├── 📊 执行摘要
├── 🚨 严重安全风险
├── 📋 详细审计结果 (按类型分组)
├── 🎯 修复优先级建议
├── 💡 安全最佳实践建议
└── 🏆 OWASP Top 10 合规性检查
```

### 安全检查清单使用

#### 检查分类
1. **API密钥与认证安全**
   - OpenRouter API密钥安全存储
   - API密钥权限最小化
   - API调用速率限制

2. **环境变量与配置安全**
   - 敏感数据环境隔离
   - 客户端环境变量检查
   - 环境变量文件保护

3. **前端XSS防护**
   - 内容安全策略(CSP)配置
   - 输入数据安全渲染
   - 第三方脚本安全性

4. **API端点安全**
   - 输入验证与净化
   - CSRF防护机制
   - 错误信息安全性

5. **HTTPS与传输安全**
   - 强制HTTPS重定向
   - HSTS头部配置
   - 混合内容检查

6. **依赖项安全**
   - 依赖漏洞扫描
   - 依赖包来源验证
   - 未使用依赖清理

7. **数据保护**
   - 敏感数据识别
   - 数据传输加密
   - 日志安全性

8. **部署与运维安全**
   - Vercel安全配置
   - CI/CD安全流程
   - 监控与告警

#### 优先级系统
- 🔴 **Critical**: 必须立即修复，存在严重安全风险
- 🟠 **High**: 短期内修复，存在明显安全隐患
- 🟡 **Medium**: 中期优化，提升安全防护等级
- 🟢 **Low**: 长期完善，优化安全体验

### 专业工具详解

#### 1. 依赖扫描器 (`deps`)
- 使用npm audit检查已知漏洞
- 识别过时的依赖包
- 检测未使用的依赖
- 提供修复建议

#### 2. 敏感信息检测器 (`secrets`)
- 检测硬编码的API密钥
- 识别密码和令牌
- 发现邮箱地址和URL
- 检查信用卡号等敏感数据

#### 3. CSP验证器 (`csp`)
- 验证CSP指令完整性
- 检测不安全的配置
- 验证nonce机制
- 检查报告配置

#### 4. API安全检查器 (`api`)
- 输入验证检查
- CORS配置验证
- 错误处理分析
- SQL注入风险评估
- 认证机制检查

#### 5. 环境变量审计器 (`env`)
- 环境变量文件安全检查
- 客户端暴露风险检测
- Git追踪状态验证
- 敏感变量强度评估

## 🎯 最佳实践建议

### 开发阶段
1. **每日运行**: 在提交代码前运行基础安全审计
2. **功能开发**: 新增API端点后立即运行API安全检查
3. **依赖更新**: 更新依赖包后运行依赖扫描
4. **环境配置**: 修改环境变量后运行环境审计

### 部署阶段
1. **部署前**: 运行完整安全审计，确保无严重问题
2. **生产环境**: 定期运行所有工具，生成合规报告
3. **监控**: 配置CSP违规报告监控
4. **更新**: 建立定期安全更新流程

### 团队协作
1. **检查清单**: 使用交互式检查清单进行团队审查
2. **状态共享**: 导出检查清单报告分享给团队
3. **知识传递**: 定期组织安全培训
4. **流程规范**: 建立安全审查流程文档

## ⚠️ 重要安全注意事项

### API密钥管理
- ✅ 使用环境变量存储所有API密钥
- ✅ 定期轮换API密钥
- ✅ 为不同环境使用不同的密钥
- ❌ 绝不在代码中硬编码密钥

### OpenRouter专用安全
- 密钥格式：必须以 `sk-or-` 开头
- 权限控制：仅启用必要的API权限
- 调用限制：实施适当的速率限制
- 监控：记录所有API调用用于审计

### 环境变量安全
- 生产环境变量与开发环境完全隔离
- 敏感变量绝不使用 `NEXT_PUBLIC_` 前缀
- 确保 `.env*` 文件在 `.gitignore` 中
- 定期审查环境变量使用情况

### Vercel部署安全
- 使用Vercel环境变量功能加密存储敏感数据
- 配置正确的域名和CORS策略
- 启用访问日志和监控
- 定期审查部署配置

## 🚨 紧急响应流程

### 发现严重漏洞时
1. **立即停止**: 暂停相关功能或服务
2. **隔离影响**: 限制可能受影响的范围
3. **修复漏洞**: 按照工具建议进行修复
4. **验证修复**: 重新运行安全审计确认修复
5. **更新文档**: 记录漏洞和修复过程

### API密钥泄露时
1. **立即撤销**: 在OpenRouter控制台撤销泄露的密钥
2. **生成新密钥**: 创建新的API密钥
3. **更新配置**: 在所有环境中更新新密钥
4. **审查日志**: 检查是否有异常API调用
5. **加强防护**: 实施额外的监控措施

## 📊 合规性和认证

### OWASP Top 10 2021 覆盖
- ✅ A01: Broken Access Control
- ✅ A02: Cryptographic Failures  
- ✅ A03: Injection
- ⚠️ A04: Insecure Design (需要架构审查)
- ✅ A05: Security Misconfiguration
- ✅ A06: Vulnerable and Outdated Components
- ⚠️ A07: Identification and Authentication Failures
- ⚠️ A08: Software and Data Integrity Failures
- ⚠️ A09: Security Logging and Monitoring Failures
- ✅ A10: Server-Side Request Forgery (SSRF)

### 数据保护合规
- 欧盟GDPR: 数据处理透明度和用户权利
- 加州CCPA: 消费者隐私权保护
- 行业标准: PCI DSS、ISO 27001等

## 🔧 故障排除

### 常见问题解决

#### 1. npm audit 失败
```bash
# 清理缓存并重新安装
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### 2. 环境变量检测误报
- 检查 `.env.example` 文件中的示例值
- 确认变量名称不包含敏感关键词
- 使用注释标记合法的示例值

#### 3. CSP配置过于严格
- 逐步放宽CSP策略进行测试
- 使用浏览器开发者工具查看违规报告
- 参考项目实际需求调整配置

#### 4. API安全检查误报
- 确认API端点是否确实需要认证
- 检查输入验证库是否被正确识别
- 添加适当的注释标记特殊情况

## 📞 获取帮助

### 工具帮助
```bash
node scripts/security-audit.js --help
node scripts/security-checklist.js --help
node scripts/security-tools.js --help
```

### 社区资源
- [OWASP官网](https://owasp.org/)
- [Next.js安全指南](https://nextjs.org/docs/advanced-features/security-headers)
- [Vercel安全最佳实践](https://vercel.com/docs/security)
- [OpenRouter安全文档](https://openrouter.ai/docs/security)

### 专业支持
如需专业安全咨询服务，请联系：
- 安全审计服务提供商
- 云安全专家团队
- 开源安全社区

---

*本指南随工具更新持续维护，最后更新: 2025-08-08*