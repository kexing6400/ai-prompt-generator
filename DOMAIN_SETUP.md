# 🌐 aiprompts.ink 域名配置指南

## 第一步：Vercel端配置

1. 访问 [Vercel项目设置](https://vercel.com/kexing6400s-projects/ai-prompt-generator/settings/domains)
2. 点击 "Add Domain"
3. 输入 `aiprompts.ink` 和 `www.aiprompts.ink`
4. 选择推荐的配置方式

## 第二步：Namecheap DNS配置

登录Namecheap，进入域名管理，配置以下DNS记录：

### 主域名配置 (aiprompts.ink)
- **Type**: A
- **Host**: @
- **Value**: 76.76.21.21
- **TTL**: Automatic

### www子域名配置
- **Type**: CNAME
- **Host**: www
- **Value**: cname.vercel-dns.com
- **TTL**: Automatic

### 备用A记录（如需要）
如果Vercel提供了特定的IP，使用那个IP替代上面的76.76.21.21

## 第三步：验证配置

1. DNS传播时间：5分钟到48小时不等（通常15分钟内生效）
2. 验证工具：
   - https://dnschecker.org/#A/aiprompts.ink
   - https://www.whatsmydns.net/#A/aiprompts.ink

## 第四步：SSL证书

Vercel会自动为您的域名配置SSL证书，无需额外操作。

## 第五步：测试访问

配置完成后，测试以下URL：
- https://aiprompts.ink
- https://www.aiprompts.ink
- 确保都能正常访问并重定向到HTTPS

## 常见问题

### 域名未生效？
- 检查DNS记录是否正确
- 等待DNS传播（最长48小时）
- 清除浏览器缓存

### SSL证书错误？
- Vercel需要几分钟来配置SSL
- 确保域名验证已通过
- 检查Vercel项目设置中的域名状态

### 重定向问题？
- Vercel自动处理www到主域名的重定向
- 自动处理HTTP到HTTPS的重定向

## 联系支持

- Vercel支持：https://vercel.com/support
- Namecheap支持：https://www.namecheap.com/support/

---
更新时间：2025-01-08