#!/usr/bin/env node

/**
 * =============================================================================
 * AI Prompt Generator 安全修复助手 v1.0
 * =============================================================================
 * 
 * 自动修复常见安全问题的辅助工具
 * 
 * 功能特性：
 * - 自动修复HTTPS配置
 * - 更新安全头部配置
 * - 环境变量安全优化
 * - CSP配置增强
 * - 依赖清理建议
 * 
 * 使用方法: node scripts/security-fix-helper.js [--auto] [--backup]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 修复HTTPS配置
 */
function fixHTTPSConfiguration() {
  log('\n🔒 修复HTTPS配置...', 'cyan');
  
  const envFiles = ['.env.local', '.env.production'];
  let fixesApplied = 0;
  
  for (const envFile of envFiles) {
    const filePath = path.join(process.cwd(), envFile);
    
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      
      // 修复HTTP URL为HTTPS
      content = content.replace(/NEXT_PUBLIC_APP_URL=http:\/\//g, 'NEXT_PUBLIC_APP_URL=https://');
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        log(`  ✅ 已修复 ${envFile} 中的HTTP URL`, 'green');
        fixesApplied++;
      }
    }
  }
  
  if (fixesApplied === 0) {
    log('  ℹ️  未发现需要修复的HTTPS配置', 'blue');
  }
  
  return fixesApplied;
}

/**
 * 增强Next.js安全配置
 */
function enhanceNextjsSecurityConfig() {
  log('\n🛡️ 增强Next.js安全配置...', 'cyan');
  
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  
  if (!fs.existsSync(nextConfigPath)) {
    log('  ❌ next.config.js 文件不存在', 'red');
    return 0;
  }
  
  let content = fs.readFileSync(nextConfigPath, 'utf8');
  const originalContent = content;
  
  // 检查是否已有安全头部配置
  if (!content.includes('headers()')) {
    const securityHeaders = `
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          }
        ]
      }
    ];
  },`;
    
    // 在module.exports之前插入headers配置
    content = content.replace(
      /module\.exports\s*=\s*{/,
      `module.exports = {${securityHeaders}`
    );
    
    fs.writeFileSync(nextConfigPath, content);
    log('  ✅ 已添加安全头部配置到 next.config.js', 'green');
    return 1;
  } else {
    log('  ℹ️  next.config.js 已包含头部配置', 'blue');
    return 0;
  }
}

/**
 * 优化环境变量示例文件
 */
function optimizeEnvironmentExamples() {
  log('\n🌍 优化环境变量示例...', 'cyan');
  
  const examplePath = path.join(process.cwd(), '.env.local.example');
  
  if (!fs.existsSync(examplePath)) {
    log('  ❌ .env.local.example 文件不存在', 'red');
    return 0;
  }
  
  let content = fs.readFileSync(examplePath, 'utf8');
  const originalContent = content;
  
  // 添加安全注释
  if (!content.includes('# 安全注意事项')) {
    const securityNote = `# =============================================================================
# 安全注意事项 - 请仔细阅读
# =============================================================================
# 
# ⚠️  重要提醒：
# 1. 绝不要在代码中硬编码API密钥
# 2. 生产环境与开发环境使用不同的密钥
# 3. 定期轮换API密钥
# 4. 敏感变量绝不使用 NEXT_PUBLIC_ 前缀
# 5. 确保 .env* 文件在 .gitignore 中
# 
# 🔐 OpenRouter API密钥要求：
# - 必须以 "sk-or-" 开头
# - 长度至少32位
# - 仅启用必要的API权限
#
# =============================================================================

`;
    content = securityNote + content;
  }
  
  // 更新OpenRouter密钥示例格式
  content = content.replace(
    /OPENROUTER_API_KEY=".*"/,
    'OPENROUTER_API_KEY="sk-or-your_openrouter_api_key_here"'
  );
  
  if (content !== originalContent) {
    fs.writeFileSync(examplePath, content);
    log('  ✅ 已优化环境变量示例文件', 'green');
    return 1;
  } else {
    log('  ℹ️  环境变量示例文件已是最新版本', 'blue');
    return 0;
  }
}

/**
 * 生成安全配置模板
 */
function generateSecurityConfigTemplate() {
  log('\n📋 生成安全配置模板...', 'cyan');
  
  const templatePath = path.join(process.cwd(), 'SECURITY_CONFIGURATION_TEMPLATE.md');
  
  const template = `# 🛡️ AI Prompt Generator 安全配置模板

## 生产环境配置清单

### 1. Vercel环境变量配置
在Vercel Dashboard中配置以下环境变量:
- OPENROUTER_API_KEY=sk-or-your_production_api_key
- NEXT_PUBLIC_APP_URL=https://your-domain.com
- NEXT_PUBLIC_APP_NAME="AI Prompt Generator"

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
配置CSP报告端点：\`/api/security/csp-report\`

### 访问日志分析
定期检查异常访问模式

### 安全事件响应
1. 检测到安全威胁时立即暂停服务
2. 分析威胁范围和影响
3. 应用必要的修复措施
4. 恢复服务并持续监控

---
*最后更新: ${new Date().toISOString()}*
`;

  fs.writeFileSync(templatePath, template);
  log(`  ✅ 已生成安全配置模板: ${templatePath}`, 'green');
  
  return 1;
}

/**
 * 创建gitignore安全规则
 */
function ensureGitignoreSecurity() {
  log('\n🔒 确保 .gitignore 安全规则...', 'cyan');
  
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  
  if (!fs.existsSync(gitignorePath)) {
    log('  ❌ .gitignore 文件不存在', 'red');
    return 0;
  }
  
  let content = fs.readFileSync(gitignorePath, 'utf8');
  const originalContent = content;
  
  const securityRules = [
    '',
    '# 安全敏感文件',
    '.env*',
    '!.env.example',
    '!.env.local.example',
    'config.json',
    'secrets.json',
    '*.key',
    '*.pem',
    '*.crt',
    '.security-*',
    'SECURITY_AUDIT_REPORT.md',
    'SECURITY_CHECKLIST_REPORT.md'
  ];
  
  let rulesAdded = 0;
  
  for (const rule of securityRules) {
    if (!content.includes(rule)) {
      content += '\n' + rule;
      rulesAdded++;
    }
  }
  
  if (rulesAdded > 0) {
    fs.writeFileSync(gitignorePath, content);
    log(`  ✅ 已添加 ${rulesAdded} 条安全规则到 .gitignore`, 'green');
    return rulesAdded;
  } else {
    log('  ℹ️  .gitignore 已包含必要的安全规则', 'blue');
    return 0;
  }
}

/**
 * 生成安全检查脚本
 */
function generateSecurityCheckScript() {
  log('\n🔍 生成快速安全检查脚本...', 'cyan');
  
  const scriptPath = path.join(process.cwd(), 'scripts/quick-security-check.sh');
  
  const script = `#!/bin/bash

# =============================================================================
# AI Prompt Generator 快速安全检查脚本
# =============================================================================

set -e

echo "🛡️  开始快速安全检查..."
echo "======================================"

# 检查环境变量文件是否存在且未被Git追踪
echo "🔍 检查环境变量文件..."
if [ -f ".env.local" ]; then
    if git ls-files --error-unmatch .env.local 2>/dev/null; then
        echo "❌ 警告: .env.local 被Git追踪，请立即移除"
        exit 1
    else
        echo "✅ .env.local 文件安全"
    fi
fi

# 检查API密钥格式
echo "🔑 检查API密钥格式..."
if [ -f ".env.local" ]; then
    if grep -q "OPENROUTER_API_KEY=" .env.local; then
        if grep -q "OPENROUTER_API_KEY=sk-or-" .env.local; then
            echo "✅ OpenRouter API密钥格式正确"
        else
            echo "⚠️  警告: OpenRouter API密钥格式可能不正确"
        fi
    fi
fi

# 检查生产环境HTTPS配置
echo "🔒 检查HTTPS配置..."
if [ -f ".env.production" ]; then
    if grep -q "NEXT_PUBLIC_APP_URL=https://" .env.production; then
        echo "✅ 生产环境使用HTTPS"
    elif grep -q "NEXT_PUBLIC_APP_URL=http://" .env.production; then
        echo "❌ 错误: 生产环境仍使用HTTP"
        exit 1
    fi
fi

# 检查安全头部配置
echo "🛡️ 检查安全头部配置..."
if grep -q "headers()" next.config.js; then
    echo "✅ Next.js安全头部已配置"
else
    echo "⚠️  警告: 缺少Next.js安全头部配置"
fi

# 检查CSP配置
echo "🔐 检查CSP配置..."
if grep -q "Content-Security-Policy" middleware.ts; then
    echo "✅ CSP策略已配置"
else
    echo "❌ 错误: 缺少CSP配置"
    exit 1
fi

echo ""
echo "🎉 快速安全检查完成！"
echo "💡 建议定期运行完整安全审计: npm run security:audit"
`;

  fs.writeFileSync(scriptPath, script);
  execSync(`chmod +x ${scriptPath}`);
  
  log(`  ✅ 已生成快速安全检查脚本: ${scriptPath}`, 'green');
  
  return 1;
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const autoFix = args.includes('--auto');
  const createBackup = args.includes('--backup');
  
  console.clear();
  log('🛡️  AI Prompt Generator 安全修复助手 v1.0', 'bold');
  log('=' .repeat(60), 'cyan');
  
  if (createBackup) {
    log('📋 创建配置文件备份...', 'cyan');
    const backupDir = path.join(process.cwd(), '.backup-security');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    const filesToBackup = ['next.config.js', '.env.local', '.env.production', '.gitignore'];
    for (const file of filesToBackup) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        const backupPath = path.join(backupDir, `${file}.backup`);
        fs.copyFileSync(filePath, backupPath);
        log(`  ✅ 已备份 ${file}`, 'green');
      }
    }
  }
  
  let totalFixes = 0;
  
  try {
    // 执行修复操作
    totalFixes += fixHTTPSConfiguration();
    totalFixes += enhanceNextjsSecurityConfig();
    totalFixes += optimizeEnvironmentExamples();
    totalFixes += generateSecurityConfigTemplate();
    totalFixes += ensureGitignoreSecurity();
    totalFixes += generateSecurityCheckScript();
    
    log('\n' + '='.repeat(60), 'cyan');
    log('🏁 安全修复完成', 'bold');
    log(`✅ 总共应用了 ${totalFixes} 项修复`, 'green');
    
    if (totalFixes > 0) {
      log('\n💡 建议操作:', 'cyan');
      log('1. 运行安全审计验证修复效果: npm run security:audit', 'blue');
      log('2. 测试应用功能确保无破坏性变更', 'blue');
      log('3. 提交变更到版本控制', 'blue');
      log('4. 在生产环境应用相应配置', 'blue');
    }
    
    log('\n🚀 快速验证命令:', 'cyan');
    log('bash scripts/quick-security-check.sh', 'yellow');
    
  } catch (error) {
    log(`\\n❌ 修复过程中发生错误: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 运行主程序
if (require.main === module) {
  main();
}

module.exports = {
  fixHTTPSConfiguration,
  enhanceNextjsSecurityConfig,
  optimizeEnvironmentExamples,
  generateSecurityConfigTemplate,
  ensureGitignoreSecurity,
  generateSecurityCheckScript
};