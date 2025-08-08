#!/usr/bin/env node

/**
 * =============================================================================
 * AI Prompt Generator 安全审计脚本 v1.0
 * =============================================================================
 * 
 * 全面的安全审计工具，遵循OWASP Top 10安全最佳实践
 * 
 * 审计范围：
 * 1. API密钥安全性检查
 * 2. 环境变量泄露检测
 * 3. XSS/CSRF防护验证
 * 4. HTTPS和CSP配置检查
 * 5. 依赖项漏洞扫描
 * 6. 敏感信息泄露检查
 * 7. 输入验证和输出编码检查
 * 
 * 使用方法: node scripts/security-audit.js [--fix] [--report] [--verbose]
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const crypto = require('crypto');

// 颜色输出工具
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// 安全审计配置
const auditConfig = {
  // API密钥检查模式
  apiKeyPatterns: {
    openRouter: /OPENROUTER_API_KEY\s*=\s*['"]?([^'"\s]+)['"]?/g,
    openAI: /OPENAI_API_KEY\s*=\s*['"]?([^'"\s]+)['"]?/g,
    supabase: /SUPABASE.*KEY\s*=\s*['"]?([^'"\s]+)['"]?/g,
    nextAuth: /NEXTAUTH_SECRET\s*=\s*['"]?([^'"\s]+)['"]?/g,
    creem: /CREEM.*KEY\s*=\s*['"]?([^'"\s]+)['"]?/g
  },
  
  // 敏感文件模式
  sensitiveFiles: [
    '.env', '.env.local', '.env.production', '.env.development',
    'config.json', 'secrets.json', 'private.key', '*.pem'
  ],
  
  // 危险的代码模式
  dangerousPatterns: {
    sqlInjection: /('|\").*(\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bSELECT\b).*('|\")/gi,
    xssVulnerable: /innerHTML\s*=|dangerouslySetInnerHTML|eval\s*\(|Function\s*\(/gi,
    hardcodedSecrets: /password\s*=\s*['"][^'"]+['"]|secret\s*=\s*['"][^'"]+['"]|token\s*=\s*['"][^'"]+['"]/gi,
    unsafeRedirect: /window\.location\s*=|location\.href\s*=/gi
  },
  
  // 必需的安全头部
  requiredHeaders: [
    'Content-Security-Policy',
    'X-XSS-Protection',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Referrer-Policy'
  ],
  
  // CSP指令要求
  cspRequirements: {
    'default-src': ['self'],
    'script-src': ['self'],
    'style-src': ['self'],
    'img-src': ['self'],
    'connect-src': ['self'],
    'font-src': ['self'],
    'object-src': ['none'],
    'frame-ancestors': ['none']
  }
};

// 审计结果存储
const auditResults = {
  summary: {
    totalChecks: 0,
    passedChecks: 0,
    failedChecks: 0,
    warnings: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  },
  findings: []
};

/**
 * 记录审计发现
 */
function addFinding(type, severity, title, description, file = null, line = null, fix = null) {
  auditResults.summary.totalChecks++;
  
  const finding = {
    type,
    severity,
    title,
    description,
    file,
    line,
    fix,
    timestamp: new Date().toISOString()
  };
  
  auditResults.findings.push(finding);
  auditResults.summary[severity]++;
  
  if (severity === 'critical' || severity === 'high') {
    auditResults.summary.failedChecks++;
  } else {
    auditResults.summary.passedChecks++;
  }
}

/**
 * 输出格式化消息
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 1. API密钥安全性检查
 */
async function checkAPIKeySecurity() {
  log('\n🔐 检查API密钥安全性...', 'cyan');
  
  const envFiles = ['.env.local', '.env.production', '.env'];
  
  for (const envFile of envFiles) {
    const filePath = path.join(process.cwd(), envFile);
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 检查API密钥格式和强度
      for (const [keyType, pattern] of Object.entries(auditConfig.apiKeyPatterns)) {
        const matches = [...content.matchAll(pattern)];
        
        for (const match of matches) {
          const keyValue = match[1];
          
          if (!keyValue || keyValue.length < 20) {
            addFinding(
              'api_security',
              'high',
              `${keyType} API密钥过短`,
              `API密钥长度不足，存在安全风险`,
              envFile,
              null,
              '使用至少32位长度的强API密钥'
            );
          }
          
          // 检查是否为示例密钥
          if (keyValue.includes('your_') || keyValue.includes('example') || keyValue === 'test') {
            addFinding(
              'api_security',
              'critical',
              `${keyType} 使用示例API密钥`,
              `检测到示例或测试API密钥，必须替换为生产密钥`,
              envFile,
              null,
              '替换为真实的生产环境API密钥'
            );
          }
        }
      }
      
      // 检查OpenRouter API密钥特定要求
      if (content.includes('OPENROUTER_API_KEY')) {
        const openRouterMatch = content.match(/OPENROUTER_API_KEY\s*=\s*['"]?([^'"\s]+)['"]?/);
        if (openRouterMatch) {
          const key = openRouterMatch[1];
          if (!key.startsWith('sk-or-')) {
            addFinding(
              'api_security',
              'medium',
              'OpenRouter API密钥格式不正确',
              'OpenRouter API密钥应以"sk-or-"开头',
              envFile,
              null,
              '确认API密钥来自OpenRouter官网'
            );
          }
        }
      }
    }
  }
  
  // 检查API密钥是否在代码中硬编码
  const sourceFiles = getAllSourceFiles();
  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, 'utf8');
    
    // 查找可能的硬编码API密钥
    const hardcodedKeyPattern = /(sk-[a-zA-Z0-9]{20,}|[a-fA-F0-9]{32,})/g;
    const matches = [...content.matchAll(hardcodedKeyPattern)];
    
    if (matches.length > 0) {
      addFinding(
        'api_security',
        'critical',
        '发现硬编码API密钥',
        `代码中可能包含硬编码的API密钥，存在严重安全风险`,
        file,
        null,
        '将API密钥移至环境变量'
      );
    }
  }
}

/**
 * 2. 环境变量泄露检测
 */
async function checkEnvironmentVariableSecurity() {
  log('\n🌍 检查环境变量安全性...', 'cyan');
  
  const sourceFiles = getAllSourceFiles();
  const publicPrefix = 'NEXT_PUBLIC_';
  
  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // 检查是否意外暴露了非公开环境变量到客户端
      const envVarPattern = /process\.env\.([A-Z_]+)/g;
      const matches = [...line.matchAll(envVarPattern)];
      
      for (const match of matches) {
        const varName = match[1];
        
        // 检查敏感变量是否被意外暴露
        const sensitiveVars = [
          'API_KEY', 'SECRET', 'PASSWORD', 'TOKEN', 'PRIVATE',
          'DATABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'
        ];
        
        const isSensitive = sensitiveVars.some(sensitive => varName.includes(sensitive));
        const isPublic = varName.startsWith(publicPrefix);
        
        if (isSensitive && !isPublic && file.includes('/app/') && !file.includes('/api/')) {
          addFinding(
            'env_security',
            'high',
            '敏感环境变量可能暴露到客户端',
            `变量 ${varName} 在客户端组件中使用，可能暴露敏感信息`,
            file,
            index + 1,
            '使用API路由处理敏感数据，或添加NEXT_PUBLIC_前缀（仅适用于非敏感数据）'
          );
        }
      }
    });
  }
  
  // 检查.env文件是否被意外提交
  const envFiles = ['.env', '.env.local', '.env.production'];
  for (const envFile of envFiles) {
    if (fs.existsSync(path.join(process.cwd(), envFile))) {
      try {
        execSync(`git ls-files --error-unmatch ${envFile}`, { stdio: 'ignore' });
        addFinding(
          'env_security',
          'critical',
          '环境变量文件被提交到版本控制',
          `${envFile} 文件被提交到Git，可能泄露敏感信息`,
          envFile,
          null,
          `运行 'git rm --cached ${envFile}' 并添加到.gitignore`
        );
      } catch {
        // 文件不在Git中，这是好的
      }
    }
  }
}

/**
 * 3. XSS/CSRF防护验证
 */
async function checkXSSCSRFProtection() {
  log('\n🛡️ 检查XSS/CSRF防护...', 'cyan');
  
  // 检查CSP配置
  const middlewareFile = path.join(process.cwd(), 'middleware.ts');
  const cspConfigFile = path.join(process.cwd(), 'lib/security/csp.ts');
  
  let hasCSP = false;
  let cspConfig = {};
  
  if (fs.existsSync(middlewareFile)) {
    const content = fs.readFileSync(middlewareFile, 'utf8');
    
    if (content.includes('Content-Security-Policy')) {
      hasCSP = true;
      
      // 提取CSP配置
      const cspMatch = content.match(/'Content-Security-Policy',\s*'([^']+)'/);
      if (cspMatch) {
        const cspHeader = cspMatch[1];
        
        // 验证关键CSP指令
        for (const [directive, requirements] of Object.entries(auditConfig.cspRequirements)) {
          if (!cspHeader.includes(directive)) {
            addFinding(
              'xss_protection',
              'medium',
              `CSP缺少${directive}指令`,
              `内容安全策略缺少关键安全指令`,
              'middleware.ts',
              null,
              `添加${directive}指令到CSP配置`
            );
          }
        }
        
        // 检查不安全的CSP配置
        if (cspHeader.includes("'unsafe-eval'")) {
          addFinding(
            'xss_protection',
            'high',
            'CSP包含unsafe-eval',
            '允许eval()执行，存在XSS风险',
            'middleware.ts',
            null,
            '移除unsafe-eval，使用更安全的替代方案'
          );
        }
        
        if (cspHeader.includes("'unsafe-inline'") && !cspHeader.includes('nonce-')) {
          addFinding(
            'xss_protection',
            'medium',
            'CSP包含unsafe-inline但没有nonce',
            '允许内联脚本但缺少nonce保护',
            'middleware.ts',
            null,
            '使用nonce或移除unsafe-inline'
          );
        }
      }
    } else {
      addFinding(
        'xss_protection',
        'high',
        '缺少Content-Security-Policy',
        '应用程序缺少CSP保护，容易受到XSS攻击',
        'middleware.ts',
        null,
        '实现完整的CSP策略'
      );
    }
  } else {
    addFinding(
      'xss_protection',
      'medium',
      '缺少安全中间件',
      '没有发现middleware.ts文件，可能缺少安全头部保护',
      null,
      null,
      '创建middleware.ts并实现安全头部'
    );
  }
  
  // 检查API路由的CSRF保护
  const apiDir = path.join(process.cwd(), 'app/api');
  if (fs.existsSync(apiDir)) {
    const apiFiles = getFilesRecursively(apiDir, '.ts');
    
    for (const file of apiFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // 检查POST/PUT/DELETE端点是否有CSRF保护
      if (content.match(/export\s+async\s+function\s+(POST|PUT|DELETE)/)) {
        if (!content.includes('csrf') && !content.includes('origin') && !content.includes('referer')) {
          addFinding(
            'csrf_protection',
            'medium',
            'API端点可能缺少CSRF保护',
            '状态修改端点应验证请求来源',
            file,
            null,
            '实现CSRF令牌或来源验证'
          );
        }
      }
    }
  }
}

/**
 * 4. HTTPS和安全头部配置检查
 */
async function checkHTTPSAndSecurityHeaders() {
  log('\n🔒 检查HTTPS和安全头部配置...', 'cyan');
  
  // 检查next.config.js中的安全配置
  const nextConfigFile = path.join(process.cwd(), 'next.config.js');
  if (fs.existsSync(nextConfigFile)) {
    const content = fs.readFileSync(nextConfigFile, 'utf8');
    
    if (!content.includes('headers')) {
      addFinding(
        'https_security',
        'medium',
        'Next.js配置缺少安全头部',
        'next.config.js中未配置安全头部',
        'next.config.js',
        null,
        '在next.config.js中添加安全头部配置'
      );
    }
    
    if (!content.includes('hsts') && !content.includes('Strict-Transport-Security')) {
      addFinding(
        'https_security',
        'medium',
        '缺少HSTS配置',
        '未配置HTTP严格传输安全',
        'next.config.js',
        null,
        '添加HSTS头部配置'
      );
    }
  }
  
  // 检查Vercel配置
  const vercelConfigFile = path.join(process.cwd(), 'vercel.json');
  if (fs.existsSync(vercelConfigFile)) {
    const content = fs.readFileSync(vercelConfigFile, 'utf8');
    const config = JSON.parse(content);
    
    if (config.headers) {
      const hasSecurityHeaders = auditConfig.requiredHeaders.some(header =>
        config.headers.some(h => h.headers && h.headers[header])
      );
      
      if (!hasSecurityHeaders) {
        addFinding(
          'https_security',
          'medium',
          'Vercel配置缺少安全头部',
          'vercel.json中未配置必需的安全头部',
          'vercel.json',
          null,
          '在vercel.json中添加安全头部配置'
        );
      }
    }
  }
  
  // 检查环境变量中的HTTPS配置
  const envFiles = ['.env.production', '.env.local'];
  for (const envFile of envFiles) {
    const filePath = path.join(process.cwd(), envFile);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (content.includes('http://') && content.includes('NEXT_PUBLIC_APP_URL')) {
        addFinding(
          'https_security',
          'medium',
          '应用URL使用HTTP协议',
          '生产环境应使用HTTPS协议',
          envFile,
          null,
          '将NEXT_PUBLIC_APP_URL改为https://'
        );
      }
    }
  }
}

/**
 * 5. 依赖项漏洞扫描
 */
async function checkDependencyVulnerabilities() {
  log('\n📦 扫描依赖项漏洞...', 'cyan');
  
  try {
    // 使用npm audit检查漏洞
    const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
    const audit = JSON.parse(auditResult);
    
    if (audit.vulnerabilities) {
      for (const [packageName, vuln] of Object.entries(audit.vulnerabilities)) {
        const severity = vuln.severity;
        
        addFinding(
          'dependency_vulnerability',
          severity,
          `依赖包漏洞: ${packageName}`,
          `${vuln.title || '存在已知安全漏洞'}`,
          'package.json',
          null,
          vuln.fixAvailable ? '运行 npm audit fix' : '手动更新依赖包'
        );
      }
    }
    
    // 检查过时的依赖
    const outdatedResult = execSync('npm outdated --json || echo "{}"', { encoding: 'utf8' });
    const outdated = JSON.parse(outdatedResult);
    
    for (const [packageName, info] of Object.entries(outdated)) {
      if (info.current !== info.latest) {
        const majorVersionBehind = parseInt(info.latest.split('.')[0]) - parseInt(info.current.split('.')[0]);
        
        if (majorVersionBehind > 0) {
          addFinding(
            'dependency_outdated',
            'medium',
            `依赖包严重过时: ${packageName}`,
            `当前版本 ${info.current}，最新版本 ${info.latest}`,
            'package.json',
            null,
            `更新到最新版本: npm update ${packageName}`
          );
        }
      }
    }
    
  } catch (error) {
    addFinding(
      'dependency_scan',
      'low',
      '依赖扫描失败',
      '无法完成自动依赖漏洞扫描',
      'package.json',
      null,
      '手动运行 npm audit 检查漏洞'
    );
  }
  
  // 检查是否有未使用的依赖
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const sourceFiles = getAllSourceFiles();
    const usedDependencies = new Set();
    
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const importMatches = [...content.matchAll(/from\s+['"]([^'"]+)['"]/g)];
      const requireMatches = [...content.matchAll(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g)];
      
      [...importMatches, ...requireMatches].forEach(match => {
        const moduleName = match[1];
        if (!moduleName.startsWith('.') && !moduleName.startsWith('/')) {
          const packageName = moduleName.startsWith('@') 
            ? moduleName.split('/').slice(0, 2).join('/')
            : moduleName.split('/')[0];
          usedDependencies.add(packageName);
        }
      });
    }
    
    for (const depName of Object.keys(allDeps)) {
      if (!usedDependencies.has(depName)) {
        addFinding(
          'dependency_unused',
          'low',
          `未使用的依赖: ${depName}`,
          '依赖包似乎未在代码中使用',
          'package.json',
          null,
          `确认后移除: npm uninstall ${depName}`
        );
      }
    }
  }
}

/**
 * 6. 敏感信息泄露检查
 */
async function checkSensitiveInformationLeaks() {
  log('\n🕵️ 检查敏感信息泄露...', 'cyan');
  
  const sourceFiles = getAllSourceFiles();
  
  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // 检查各种敏感信息模式
      for (const [patternName, pattern] of Object.entries(auditConfig.dangerousPatterns)) {
        const matches = [...line.matchAll(pattern)];
        
        if (matches.length > 0) {
          let severity = 'medium';
          let description = '检测到潜在的安全风险代码';
          let fix = '审查并修复安全问题';
          
          switch (patternName) {
            case 'sqlInjection':
              severity = 'high';
              description = '可能存在SQL注入风险';
              fix = '使用参数化查询或ORM';
              break;
            case 'xssVulnerable':
              severity = 'high';
              description = '可能存在XSS攻击风险';
              fix = '使用安全的DOM操作方法，避免innerHTML';
              break;
            case 'hardcodedSecrets':
              severity = 'critical';
              description = '检测到硬编码的密码或密钥';
              fix = '将敏感信息移至环境变量';
              break;
            case 'unsafeRedirect':
              severity = 'medium';
              description = '可能存在开放重定向漏洞';
              fix = '验证重定向URL的安全性';
              break;
          }
          
          addFinding(
            'sensitive_data',
            severity,
            `${patternName}: 敏感代码模式`,
            description,
            file,
            index + 1,
            fix
          );
        }
      }
      
      // 检查调试信息泄露
      if (line.includes('console.log') && !file.includes('test') && !file.includes('debug')) {
        addFinding(
          'information_leak',
          'low',
          '调试信息可能泄露',
          'console.log可能泄露敏感信息到浏览器控制台',
          file,
          index + 1,
          '移除生产环境中的console.log'
        );
      }
      
      // 检查错误信息泄露
      if (line.includes('error.message') || line.includes('error.stack')) {
        addFinding(
          'information_leak',
          'medium',
          '错误信息可能泄露',
          '详细错误信息可能泄露系统架构信息',
          file,
          index + 1,
          '在生产环境中使用通用错误信息'
        );
      }
    });
  }
  
  // 检查Git历史中的敏感信息
  try {
    const gitLogResult = execSync('git log --oneline -n 100 | grep -i "password\\|secret\\|key"', { encoding: 'utf8' });
    if (gitLogResult.trim()) {
      addFinding(
        'git_security',
        'medium',
        'Git提交历史可能包含敏感信息',
        'Git提交信息中可能泄露了敏感关键词',
        null,
        null,
        '审查Git历史，考虑重写包含敏感信息的提交'
      );
    }
  } catch {
    // Git命令失败，可能不在Git仓库中
  }
}

/**
 * 7. 输入验证和输出编码检查
 */
async function checkInputValidationAndOutputEncoding() {
  log('\n✅ 检查输入验证和输出编码...', 'cyan');
  
  // 检查API路由的输入验证
  const apiDir = path.join(process.cwd(), 'app/api');
  if (fs.existsSync(apiDir)) {
    const apiFiles = getFilesRecursively(apiDir, '.ts');
    
    for (const file of apiFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // 检查是否使用了输入验证
      const hasZodValidation = content.includes('zod') || content.includes('.parse(');
      const hasManualValidation = content.includes('validate') || content.includes('sanitize');
      
      if (content.includes('request.json()') || content.includes('searchParams.get')) {
        if (!hasZodValidation && !hasManualValidation) {
          addFinding(
            'input_validation',
            'high',
            'API端点缺少输入验证',
            'API接受用户输入但未进行验证',
            file,
            null,
            '使用Zod或其他验证库验证用户输入'
          );
        }
      }
      
      // 检查SQL注入防护
      if (content.includes('SELECT') || content.includes('INSERT') || content.includes('UPDATE')) {
        if (!content.includes('prisma') && !content.includes('$') && !content.includes('prepare')) {
          addFinding(
            'sql_injection',
            'critical',
            '可能存在SQL注入风险',
            'SQL查询可能使用字符串拼接',
            file,
            null,
            '使用参数化查询或ORM（如Prisma）'
          );
        }
      }
      
      // 检查输出编码
      if (content.includes('JSON.stringify') && !content.includes('replacer')) {
        addFinding(
          'output_encoding',
          'low',
          'JSON输出可能存在信息泄露',
          'JSON序列化可能暴露不必要的数据',
          file,
          null,
          '使用replacer函数过滤敏感字段'
        );
      }
    }
  }
  
  // 检查前端组件的输入处理
  const componentDir = path.join(process.cwd(), 'components');
  if (fs.existsSync(componentDir)) {
    const componentFiles = getFilesRecursively(componentDir, '.tsx');
    
    for (const file of componentFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // 检查表单验证
      if (content.includes('<form') || content.includes('useForm')) {
        if (!content.includes('zod') && !content.includes('yup') && !content.includes('validate')) {
          addFinding(
            'form_validation',
            'medium',
            '表单缺少客户端验证',
            '表单组件可能缺少输入验证',
            file,
            null,
            '实现客户端表单验证（结合服务端验证）'
          );
        }
      }
      
      // 检查XSS防护
      if (content.includes('dangerouslySetInnerHTML')) {
        addFinding(
          'xss_risk',
          'high',
          '使用了潜在危险的HTML渲染',
          'dangerouslySetInnerHTML可能导致XSS攻击',
          file,
          null,
          '确保HTML内容已正确消毒，或使用安全的替代方案'
        );
      }
    }
  }
}

/**
 * 获取所有源文件
 */
function getAllSourceFiles() {
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  const files = [];
  
  const directories = ['app', 'components', 'lib', 'pages'];
  for (const dir of directories) {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      files.push(...getFilesRecursively(dirPath, extensions));
    }
  }
  
  return files;
}

/**
 * 递归获取指定扩展名的文件
 */
function getFilesRecursively(dir, extensions) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getFilesRecursively(fullPath, extensions));
    } else if (typeof extensions === 'string') {
      if (fullPath.endsWith(extensions)) {
        files.push(fullPath);
      }
    } else if (extensions.some(ext => fullPath.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * 生成安全审计报告
 */
function generateSecurityReport() {
  const reportPath = path.join(process.cwd(), 'SECURITY_AUDIT_REPORT.md');
  const timestamp = new Date().toISOString();
  
  let report = `# 🛡️ AI Prompt Generator 安全审计报告\n\n`;
  report += `**审计时间**: ${timestamp}\n`;
  report += `**审计版本**: v1.0\n`;
  report += `**审计范围**: 全栈应用安全检查\n\n`;
  
  // 执行摘要
  report += `## 📊 执行摘要\n\n`;
  report += `| 指标 | 数量 |\n`;
  report += `|------|------|\n`;
  report += `| 总检查项 | ${auditResults.summary.totalChecks} |\n`;
  report += `| 通过检查 | ${auditResults.summary.passedChecks} |\n`;
  report += `| 失败检查 | ${auditResults.summary.failedChecks} |\n`;
  report += `| 严重风险 | ${auditResults.summary.critical} |\n`;
  report += `| 高风险 | ${auditResults.summary.high} |\n`;
  report += `| 中风险 | ${auditResults.summary.medium} |\n`;
  report += `| 低风险 | ${auditResults.summary.low} |\n\n`;
  
  // 风险评级
  const totalRisk = auditResults.summary.critical * 4 + auditResults.summary.high * 3 + 
                   auditResults.summary.medium * 2 + auditResults.summary.low * 1;
  let riskLevel = '🟢 低风险';
  if (totalRisk > 20) riskLevel = '🔴 高风险';
  else if (totalRisk > 10) riskLevel = '🟡 中风险';
  
  report += `**整体风险评级**: ${riskLevel}\n\n`;
  
  // 关键发现
  const criticalFindings = auditResults.findings.filter(f => f.severity === 'critical');
  if (criticalFindings.length > 0) {
    report += `## 🚨 严重安全风险\n\n`;
    criticalFindings.forEach((finding, index) => {
      report += `### ${index + 1}. ${finding.title}\n\n`;
      report += `**类型**: ${finding.type}\n`;
      report += `**描述**: ${finding.description}\n`;
      if (finding.file) report += `**文件**: ${finding.file}\n`;
      if (finding.line) report += `**行号**: ${finding.line}\n`;
      report += `**修复建议**: ${finding.fix || '需要人工审查'}\n\n`;
    });
  }
  
  // 详细发现按类型分组
  report += `## 📋 详细审计结果\n\n`;
  const groupedFindings = auditResults.findings.reduce((groups, finding) => {
    if (!groups[finding.type]) groups[finding.type] = [];
    groups[finding.type].push(finding);
    return groups;
  }, {});
  
  const typeNames = {
    'api_security': 'API密钥安全',
    'env_security': '环境变量安全',
    'xss_protection': 'XSS防护',
    'csrf_protection': 'CSRF防护',
    'https_security': 'HTTPS安全',
    'dependency_vulnerability': '依赖漏洞',
    'dependency_outdated': '依赖过时',
    'dependency_unused': '未使用依赖',
    'sensitive_data': '敏感数据',
    'information_leak': '信息泄露',
    'git_security': 'Git安全',
    'input_validation': '输入验证',
    'sql_injection': 'SQL注入',
    'output_encoding': '输出编码',
    'form_validation': '表单验证',
    'xss_risk': 'XSS风险'
  };
  
  for (const [type, findings] of Object.entries(groupedFindings)) {
    if (findings.length === 0) continue;
    
    report += `### ${typeNames[type] || type}\n\n`;
    
    findings.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
    
    findings.forEach((finding, index) => {
      const severityEmoji = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢'
      };
      
      report += `${index + 1}. ${severityEmoji[finding.severity]} **${finding.title}**\n`;
      report += `   - ${finding.description}\n`;
      if (finding.file) report += `   - 文件: \`${finding.file}\`${finding.line ? `:${finding.line}` : ''}\n`;
      report += `   - 修复: ${finding.fix || '需要人工审查'}\n\n`;
    });
  }
  
  // 修复优先级建议
  report += `## 🎯 修复优先级建议\n\n`;
  report += `### 1. 立即修复（严重风险）\n`;
  if (criticalFindings.length > 0) {
    criticalFindings.forEach((finding, index) => {
      report += `- [ ] ${finding.title}\n`;
    });
  } else {
    report += `- ✅ 没有发现严重风险\n`;
  }
  
  const highFindings = auditResults.findings.filter(f => f.severity === 'high');
  report += `\n### 2. 短期修复（高风险）\n`;
  if (highFindings.length > 0) {
    highFindings.forEach((finding, index) => {
      report += `- [ ] ${finding.title}\n`;
    });
  } else {
    report += `- ✅ 没有发现高风险问题\n`;
  }
  
  const mediumFindings = auditResults.findings.filter(f => f.severity === 'medium');
  report += `\n### 3. 中期优化（中风险）\n`;
  if (mediumFindings.length > 0) {
    mediumFindings.slice(0, 5).forEach((finding, index) => {
      report += `- [ ] ${finding.title}\n`;
    });
    if (mediumFindings.length > 5) {
      report += `- ... 以及其他 ${mediumFindings.length - 5} 个中风险项目\n`;
    }
  } else {
    report += `- ✅ 没有发现中风险问题\n`;
  }
  
  // 安全最佳实践建议
  report += `\n## 💡 安全最佳实践建议\n\n`;
  report += `### 开发实践\n`;
  report += `- 实施代码审查流程，特别关注安全相关代码\n`;
  report += `- 定期更新依赖包，订阅安全通知\n`;
  report += `- 使用静态分析工具集成到CI/CD流程\n`;
  report += `- 实施安全编码培训\n\n`;
  
  report += `### 部署安全\n`;
  report += `- 启用Vercel的安全头部配置\n`;
  report += `- 配置环境变量加密\n`;
  report += `- 实施日志监控和异常告警\n`;
  report += `- 定期进行渗透测试\n\n`;
  
  report += `### 监控与响应\n`;
  report += `- 配置CSP报告监控\n`;
  report += `- 实施API调用限流\n`;
  report += `- 设置异常行为检测\n`;
  report += `- 建立安全事件响应流程\n\n`;
  
  // OWASP Top 10 映射
  report += `## 🏆 OWASP Top 10 合规性检查\n\n`;
  const owaspMapping = {
    'A01:2021 – Broken Access Control': auditResults.findings.filter(f => f.type.includes('auth') || f.type.includes('access')).length === 0 ? '✅' : '⚠️',
    'A02:2021 – Cryptographic Failures': auditResults.findings.filter(f => f.type.includes('api_security') || f.type.includes('sensitive_data')).length === 0 ? '✅' : '⚠️',
    'A03:2021 – Injection': auditResults.findings.filter(f => f.type.includes('sql_injection') || f.type.includes('input_validation')).length === 0 ? '✅' : '⚠️',
    'A04:2021 – Insecure Design': '⚠️ 需要架构审查',
    'A05:2021 – Security Misconfiguration': auditResults.findings.filter(f => f.type.includes('csp') || f.type.includes('https')).length === 0 ? '✅' : '⚠️',
    'A06:2021 – Vulnerable Components': auditResults.findings.filter(f => f.type.includes('dependency')).length === 0 ? '✅' : '⚠️',
    'A07:2021 – Identification and Authentication Failures': '⚠️ 待实施认证系统',
    'A08:2021 – Software and Data Integrity Failures': '⚠️ 需要实施完整性检查',
    'A09:2021 – Security Logging & Monitoring Failures': '⚠️ 需要完善日志系统',
    'A10:2021 – Server-Side Request Forgery (SSRF)': auditResults.findings.filter(f => f.type.includes('ssrf')).length === 0 ? '✅' : '⚠️'
  };
  
  for (const [category, status] of Object.entries(owaspMapping)) {
    report += `- ${status} ${category}\n`;
  }
  
  report += `\n## 📞 技术支持\n\n`;
  report += `如需协助解决安全问题，请联系开发团队。\n\n`;
  report += `---\n`;
  report += `*本报告由 AI Prompt Generator 安全审计工具自动生成*\n`;
  report += `*审计工具版本: v1.0*\n`;
  
  fs.writeFileSync(reportPath, report, 'utf8');
  return reportPath;
}

/**
 * 主执行函数
 */
async function main() {
  const args = process.argv.slice(2);
  const options = {
    fix: args.includes('--fix'),
    verbose: args.includes('--verbose'),
    report: args.includes('--report')
  };
  
  console.clear();
  log('🛡️  AI Prompt Generator 安全审计工具 v1.0', 'bold');
  log('=' .repeat(60), 'cyan');
  log('开始全面安全审计...', 'green');
  
  const startTime = Date.now();
  
  try {
    // 执行所有安全检查
    await checkAPIKeySecurity();
    await checkEnvironmentVariableSecurity();
    await checkXSSCSRFProtection();
    await checkHTTPSAndSecurityHeaders();
    await checkDependencyVulnerabilities();
    await checkSensitiveInformationLeaks();
    await checkInputValidationAndOutputEncoding();
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // 生成报告
    log('\n📋 生成安全审计报告...', 'cyan');
    const reportPath = generateSecurityReport();
    
    // 输出摘要
    log('\n' + '='.repeat(60), 'cyan');
    log('🏁 安全审计完成', 'bold');
    log(`⏱️  耗时: ${duration}秒`, 'blue');
    log(`📊 总检查项: ${auditResults.summary.totalChecks}`, 'blue');
    log(`✅ 通过: ${auditResults.summary.passedChecks}`, 'green');
    log(`❌ 失败: ${auditResults.summary.failedChecks}`, 'red');
    log(`🔴 严重: ${auditResults.summary.critical}`, 'red');
    log(`🟠 高风险: ${auditResults.summary.high}`, 'yellow');
    log(`🟡 中风险: ${auditResults.summary.medium}`, 'yellow');
    log(`🟢 低风险: ${auditResults.summary.low}`, 'green');
    log(`📄 详细报告: ${reportPath}`, 'cyan');
    
    // 给出建议
    if (auditResults.summary.critical > 0) {
      log('\n🚨 发现严重安全风险，建议立即修复！', 'red');
      process.exit(1);
    } else if (auditResults.summary.high > 0) {
      log('\n⚠️  发现高风险问题，建议尽快修复', 'yellow');
      process.exit(1);
    } else if (auditResults.summary.medium > 0) {
      log('\n✅ 安全状况良好，有一些改进空间', 'green');
    } else {
      log('\n🎉 恭喜！未发现严重安全问题', 'green');
    }
    
  } catch (error) {
    log(`\n❌ 安全审计过程中发生错误: ${error.message}`, 'red');
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

// 运行主程序
if (require.main === module) {
  main();
}

module.exports = {
  main,
  checkAPIKeySecurity,
  checkEnvironmentVariableSecurity,
  checkXSSCSRFProtection,
  checkHTTPSAndSecurityHeaders,
  checkDependencyVulnerabilities,
  checkSensitiveInformationLeaks,
  checkInputValidationAndOutputEncoding
};