# AI Prompt Generator 超详细部署指南

## 📋 部署前准备清单

### ✅ 已完成的准备工作
- [x] 项目代码已完成开发
- [x] GitHub仓库已创建并连接 (`https://github.com/kexing6400/ai-prompt-generator.git`)
- [x] 代码已推送到主分支 (`main`)
- [x] Vercel配置文件已优化 (`vercel.json`)
- [x] 域名已购买 (`aiprompts.ink`)

### 🔧 需要准备的账号
- [x] GitHub账号: `kexing6400`
- [x] Namecheap账号 (域名管理)
- [ ] Vercel账号 (需要注册)

---

## 第一步：Vercel账号注册和设置

### 1.1 注册Vercel账号

1. **打开Vercel官网**
   - 访问：`https://vercel.com`
   - 点击右上角 "Sign Up" 按钮

2. **使用GitHub登录**
   - 选择 "Continue with GitHub"
   - 输入GitHub账号密码 (kexing6400)
   - 点击 "Authorize Vercel"

3. **完成账号设置**
   - 输入团队名称: `kexing-dev` (可自定义)
   - 选择 "Personal" 计划 (免费)
   - 点击 "Continue"

### 1.2 验证账号创建成功
- 查看Vercel控制台: `https://vercel.com/dashboard`
- 确认能看到空白的项目列表

---

## 第二步：从GitHub导入项目到Vercel

### 2.1 导入GitHub仓库

1. **进入Vercel控制台**
   - 访问：`https://vercel.com/dashboard`
   - 点击 "Add New..." 按钮
   - 选择 "Project"

2. **选择GitHub仓库**
   - 在 "Import Git Repository" 区域
   - 找到 `kexing6400/ai-prompt-generator` 仓库
   - 点击仓库右侧的 "Import" 按钮

3. **配置项目设置**
   ```bash
   项目名称: ai-prompt-generator
   框架预设: Next.js
   根目录: ./
   构建命令: npm run build
   输出目录: .next
   安装命令: npm install
   开发命令: npm run dev
   ```

4. **环境变量配置**
   - 点击 "Environment Variables" 部分
   - 如果项目需要环境变量，添加以下变量：
   ```bash
   NODE_ENV=production
   ```

5. **部署项目**
   - 点击 "Deploy" 按钮
   - 等待构建完成 (通常需要2-3分钟)

### 2.2 验证部署成功

1. **检查构建日志**
   - 在部署过程中，点击 "View Function Logs"
   - 确认没有错误信息
   - 看到 "Build completed" 消息

2. **访问临时域名**
   - 部署完成后会获得一个临时域名，类似：
   - `https://ai-prompt-generator-xxx.vercel.app`
   - 点击访问，确认网站正常运行

3. **截图保存位置提示**
   ```
   📸 建议截图保存位置：
   - 部署成功页面: ~/Desktop/部署截图/vercel-部署成功.png
   - 网站运行截图: ~/Desktop/部署截图/网站-正常运行.png
   ```

---

## 第三步：Namecheap DNS配置详细步骤

### 3.1 登录Namecheap并找到DNS管理

1. **登录Namecheap**
   - 访问：`https://www.namecheap.com`
   - 点击右上角 "Sign In"
   - 输入您的Namecheap账号密码

2. **进入域名管理**
   - 登录后点击 "Domain List"
   - 找到域名 `aiprompts.ink`
   - 点击域名右侧的 "Manage" 按钮

3. **进入DNS设置**
   - 在域名管理页面，点击 "Advanced DNS" 选项卡
   - 您将看到当前的DNS记录列表

### 3.2 删除默认DNS记录

1. **删除现有A记录**
   - 找到类型为 "A Record" 的记录
   - 点击记录右侧的垃圾桶图标
   - 确认删除

2. **删除现有CNAME记录**
   - 找到类型为 "CNAME Record" 的记录 (通常是www)
   - 点击记录右侧的垃圾桶图标
   - 确认删除

### 3.3 添加Vercel DNS记录

1. **添加根域名A记录**
   - 点击 "Add New Record" 按钮
   - 配置如下：
   ```
   类型 (Type): A Record
   主机 (Host): @
   值 (Value): 76.76.19.19
   TTL: Automatic
   ```
   - 点击 ✓ 保存

2. **添加www子域名CNAME记录**
   - 再次点击 "Add New Record"
   - 配置如下：
   ```
   类型 (Type): CNAME Record
   主机 (Host): www
   值 (Value): cname.vercel-dns.com
   TTL: Automatic
   ```
   - 点击 ✓ 保存

3. **最终DNS记录检查**
   您的DNS记录应该包含：
   ```
   @ (根域名)     A Record     76.76.19.19
   www          CNAME Record  cname.vercel-dns.com
   ```

### 3.4 DNS传播等待

1. **保存设置**
   - 确认所有记录已保存
   - 查看页面顶部是否有成功提示

2. **等待DNS传播**
   - DNS传播通常需要15分钟到2小时
   - 全球传播可能需要24-48小时

3. **截图保存位置提示**
   ```
   📸 建议截图保存位置：
   - DNS记录配置: ~/Desktop/部署截图/namecheap-dns配置.png
   - DNS传播检查: ~/Desktop/部署截图/dns-传播状态.png
   ```

---

## 第四步：在Vercel中连接自定义域名

### 4.1 添加域名到Vercel项目

1. **进入项目设置**
   - 在Vercel控制台，点击您的项目名称
   - 点击顶部的 "Settings" 选项卡
   - 在左侧菜单选择 "Domains"

2. **添加自定义域名**
   - 在 "Add Domain" 输入框输入：`aiprompts.ink`
   - 点击 "Add" 按钮
   - Vercel会自动检测DNS配置

3. **添加www域名**
   - 再次在输入框输入：`www.aiprompts.ink`
   - 点击 "Add" 按钮
   - 设置重定向: `www.aiprompts.ink` → `aiprompts.ink`

### 4.2 SSL证书配置

1. **自动SSL配置**
   - Vercel会自动为域名申请Let's Encrypt SSL证书
   - 等待证书状态显示为 "Valid"
   - 这个过程通常需要5-10分钟

2. **验证HTTPS访问**
   - 证书配置完成后，访问：`https://aiprompts.ink`
   - 确认浏览器地址栏显示锁头图标
   - 确认网站正常加载

---

## 第五步：域名连接验证步骤

### 5.1 DNS传播检查

1. **使用在线工具检查DNS**
   - 访问：`https://www.whatsmydns.net`
   - 输入域名：`aiprompts.ink`
   - 选择记录类型：`A`
   - 点击 "Search"
   - 确认全球节点都返回 `76.76.19.19`

2. **使用命令行检查** (可选)
   ```bash
   # 检查A记录
   nslookup aiprompts.ink
   
   # 检查CNAME记录
   nslookup www.aiprompts.ink
   
   # 使用dig命令 (Linux/Mac)
   dig aiprompts.ink
   ```

### 5.2 网站访问测试

1. **测试多个URL**
   ```bash
   https://aiprompts.ink          # 主域名 HTTPS
   http://aiprompts.ink           # 主域名 HTTP (应自动跳转到HTTPS)
   https://www.aiprompts.ink      # www域名 (应重定向到主域名)
   ```

2. **功能完整性测试**
   - 测试网站主要功能是否正常
   - 检查所有页面链接
   - 验证API接口正常响应
   - 测试移动端兼容性

3. **性能测试**
   - 使用Google PageSpeed Insights：`https://pagespeed.web.dev`
   - 输入域名测试性能评分
   - 确保桌面端评分 > 90分，移动端评分 > 80分

---

## 第六步：生产环境优化配置

### 6.1 Vercel项目优化

1. **性能优化设置**
   - 在项目设置中，找到 "Functions"
   - 确认函数区域设置为亚洲节点：`hkg1, sin1`
   - 开启边缘函数缓存

2. **环境变量配置**
   ```bash
   NODE_ENV=production
   NEXT_PUBLIC_SITE_URL=https://aiprompts.ink
   ```

3. **分支保护设置**
   - 只允许 main 分支部署到生产环境
   - 开启预览部署功能

### 6.2 监控和分析

1. **Vercel Analytics**
   - 在项目设置中开启 Vercel Analytics
   - 添加 Google Analytics (如需要)

2. **错误监控**
   - 查看 Vercel 函数日志
   - 设置错误告警通知

---

## 第七步：常见问题解决方案

### 7.1 DNS相关问题

**问题1：域名无法访问**
```bash
解决方案：
1. 确认DNS记录配置正确
2. 等待DNS传播完成 (24-48小时)
3. 清除浏览器DNS缓存：chrome://net-internals/#dns
4. 使用不同网络测试访问
```

**问题2：SSL证书错误**
```bash
解决方案：
1. 确认域名已正确添加到Vercel
2. 等待SSL证书自动颁发 (10-30分钟)
3. 如果超时，删除域名重新添加
4. 联系Vercel支持团队
```

**问题3：www重定向不生效**
```bash
解决方案：
1. 确认CNAME记录指向 cname.vercel-dns.com
2. 在Vercel中正确设置重定向规则
3. 清除浏览器缓存测试
```

### 7.2 部署相关问题

**问题4：构建失败**
```bash
解决方案：
1. 检查构建日志中的错误信息
2. 确认 package.json 中依赖版本兼容
3. 本地运行 npm run build 测试
4. 检查TypeScript类型错误
5. 确认环境变量配置正确
```

**问题5：页面404错误**
```bash
解决方案：
1. 检查Next.js路由配置
2. 确认vercel.json重写规则正确
3. 验证文件路径大小写匹配
4. 检查动态路由参数
```

**问题6：API接口错误**
```bash
解决方案：
1. 检查API路由文件位置 (app/api/)
2. 确认函数超时设置 (maxDuration)
3. 查看函数执行日志
4. 验证环境变量在生产环境可用
```

### 7.3 性能优化问题

**问题7：网站加载慢**
```bash
解决方案：
1. 启用Vercel Edge Network
2. 优化图片资源 (Next.js Image组件)
3. 配置适当的缓存策略
4. 代码分割和懒加载
5. 移除未使用的依赖
```

---

## 第八步：部署完成检查清单

### 8.1 功能验证清单
- [ ] 主域名 `https://aiprompts.ink` 正常访问
- [ ] www域名正确重定向到主域名
- [ ] SSL证书状态为有效
- [ ] 所有页面路由正常工作
- [ ] API接口响应正常
- [ ] 移动端显示适配良好
- [ ] SEO meta标签正确显示

### 8.2 性能验证清单
- [ ] PageSpeed Insights 评分满足要求
- [ ] 首屏加载时间 < 3秒
- [ ] 所有图片已优化
- [ ] 静态资源启用CDN缓存
- [ ] gzip压缩启用

### 8.3 安全验证清单
- [ ] HTTPS强制跳转工作正常
- [ ] 安全响应头配置正确
- [ ] 无混合内容警告
- [ ] CSP策略配置适当

---

## 第九步：后续维护和更新

### 9.1 自动部署流程
每次代码推送到GitHub主分支时，Vercel会自动：
1. 检测代码变更
2. 执行构建过程
3. 运行测试 (如果配置)
4. 部署到生产环境
5. 发送部署通知

### 9.2 监控和维护
1. **定期检查**
   - 每周检查网站可用性
   - 监控Vercel使用额度
   - 查看错误日志

2. **更新策略**
   - 依赖包定期更新
   - 安全补丁及时应用
   - 功能迭代部署

---

## 🎉 部署成功！

您的AI Prompt Generator现在已经成功部署到：
- **主网站**: https://aiprompts.ink
- **管理后台**: https://vercel.com/kexing6400/ai-prompt-generator

### 重要文件位置
- 部署配置: `/home/kexing/09-ai-prompt-generator/vercel.json`
- 项目源码: `/home/kexing/09-ai-prompt-generator/`
- 本指南: `/home/kexing/09-ai-prompt-generator/部署指南_AI_Prompt_Generator.md`

### 支持联系
如遇到任何部署问题，可以：
1. 查看Vercel官方文档：https://vercel.com/docs
2. 检查项目构建日志
3. 参考本指南的常见问题解决方案

---

*本指南由AI Prompt Generator部署专家团队制作 - 版本1.0*