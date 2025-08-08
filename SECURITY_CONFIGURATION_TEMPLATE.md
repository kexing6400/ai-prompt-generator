# 🛡️ AI Prompt Generator 安全配置模板

## 生产环境配置清单

### 1. Vercel环境变量配置
在Vercel Dashboard中配置以下环境变量:
- OPENROUTER_API_KEY=sk-or-your_production_api_key
- NEXT_PUBLIC_APP_URL=https://your-domain.com
- NEXT_PUBLIC_APP_NAME="AI Prompt Builder Pro"

### 2. 安全头部验证
访问以下URL验证安全头部配置：
- https://securityheaders.com/
- https://observatory.mozilla.org/

### 3. CSP测试
测试CSP配置命令:
curl -I https://your-domain.com | grep -i "content-security-policy"

### 4. SSL/TLS测试
- https://www.ssllabs.com/ssltest/

### 5. 定期安全检查
每周运行安全审计: npm run security:audit
每月运行完整工具集: npm run security:tools

## API密钥管理

### OpenRouter API密钥
1. 登录 https://openrouter.ai/
2. 生成新的API密钥
3. 设置适当的权限级别
4. 配置使用限制

### 密钥轮换计划
- 开发环境：每月轮换
- 生产环境：每季度轮换
- 应急情况：立即轮换

## 监控和告警

### CSP违规监控
配置CSP报告端点：`/api/security/csp-report`

### 访问日志分析
定期检查异常访问模式

### 安全事件响应
1. 检测到安全威胁时立即暂停服务
2. 分析威胁范围和影响
3. 应用必要的修复措施
4. 恢复服务并持续监控

---
*最后更新: 2025-08-08T13:01:24.164Z*
