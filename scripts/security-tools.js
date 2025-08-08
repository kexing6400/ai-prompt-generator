#!/usr/bin/env node

/**
 * =============================================================================
 * AI Prompt Generator 安全工具集合 v1.0
 * =============================================================================
 * 
 * 集成多种安全工具的统一入口，提供便捷的安全检查和修复功能
 * 
 * 工具集包含：
 * - 依赖漏洞扫描
 * - 敏感信息检测  
 * - CSP配置验证
 * - API安全检查
 * - 环境变量审计
 * - 自动修复建议
 * 
 * 使用方法: node scripts/security-tools.js [tool] [options]
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

/**
 * 工具：依赖漏洞扫描器
 */
class DependencyScanner {
  constructor() {
    this.vulnerabilities = [];
    this.packageJson = this.loadPackageJson();
  }
  
  loadPackageJson() {
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    } catch (error) {
      console.log(`${colors.red}❌ 无法读取 package.json${colors.reset}`);
      return null;
    }
  }
  
  async scanVulnerabilities() {
    console.log(`${colors.cyan}🔍 扫描依赖漏洞...${colors.reset}`);
    
    try {
      // 使用 npm audit
      const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(auditResult);
      
      if (audit.vulnerabilities) {
        for (const [packageName, vuln] of Object.entries(audit.vulnerabilities)) {
          this.vulnerabilities.push({
            package: packageName,
            severity: vuln.severity,
            title: vuln.title,
            url: vuln.url,
            fixAvailable: vuln.fixAvailable
          });
        }
      }
      
      console.log(`${colors.green}✅ 发现 ${this.vulnerabilities.length} 个漏洞${colors.reset}`);
      return this.vulnerabilities;
      
    } catch (error) {
      console.log(`${colors.red}❌ 依赖扫描失败: ${error.message}${colors.reset}`);
      return [];
    }
  }
  
  async checkOutdatedPackages() {
    console.log(`${colors.cyan}🔍 检查过时依赖...${colors.reset}`);
    
    try {
      const outdatedResult = execSync('npm outdated --json || echo "{}"', { encoding: 'utf8' });
      const outdated = JSON.parse(outdatedResult);
      
      const outdatedPackages = [];
      for (const [packageName, info] of Object.entries(outdated)) {
        const currentMajor = parseInt(info.current.split('.')[0]);
        const latestMajor = parseInt(info.latest.split('.')[0]);
        const majorVersionsBehind = latestMajor - currentMajor;
        
        outdatedPackages.push({
          package: packageName,
          current: info.current,
          latest: info.latest,
          majorVersionsBehind,
          severity: majorVersionsBehind > 1 ? 'high' : majorVersionsBehind > 0 ? 'medium' : 'low'
        });
      }
      
      console.log(`${colors.yellow}⚠️  发现 ${outdatedPackages.length} 个过时依赖${colors.reset}`);
      return outdatedPackages;
      
    } catch (error) {
      console.log(`${colors.red}❌ 过时依赖检查失败: ${error.message}${colors.reset}`);
      return [];
    }
  }
  
  generateReport() {
    if (this.vulnerabilities.length === 0) {
      return `${colors.green}✅ 未发现依赖漏洞${colors.reset}`;
    }
    
    let report = `${colors.red}🚨 依赖漏洞报告:${colors.reset}\n`;
    
    const groupedVulns = this.vulnerabilities.reduce((groups, vuln) => {
      if (!groups[vuln.severity]) groups[vuln.severity] = [];
      groups[vuln.severity].push(vuln);
      return groups;
    }, {});
    
    for (const [severity, vulns] of Object.entries(groupedVulns)) {
      const severityColor = {
        critical: colors.red,
        high: colors.red,
        moderate: colors.yellow,
        low: colors.green
      }[severity] || colors.reset;
      
      report += `\\n${severityColor}${severity.toUpperCase()} (${vulns.length}):${colors.reset}\\n`;
      
      vulns.forEach(vuln => {
        report += `  • ${vuln.package}: ${vuln.title}\\n`;
        if (vuln.fixAvailable) {
          report += `    ${colors.green}修复: npm audit fix${colors.reset}\\n`;
        }
      });
    }
    
    return report;
  }
}

/**
 * 工具：敏感信息检测器
 */
class SensitiveDataDetector {
  constructor() {
    this.patterns = {
      apiKeys: /['\"][a-zA-Z0-9]{32,}['\"]/g,
      passwords: /password\s*[=:]\s*['"][^'"]{8,}['"]/gi,
      emails: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      urls: /https?:\/\/[^\s'"<>]+/g,
      ipAddresses: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
      creditCards: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g
    };
    
    this.findings = [];
  }
  
  async scanFiles() {
    console.log(`${colors.cyan}🕵️  扫描敏感信息...${colors.reset}`);
    
    const sourceFiles = this.getAllSourceFiles();
    
    for (const file of sourceFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        this.scanFileContent(file, content);
      } catch (error) {
        console.log(`${colors.yellow}⚠️  无法读取文件 ${file}${colors.reset}`);
      }
    }
    
    console.log(`${colors.green}✅ 发现 ${this.findings.length} 个潜在敏感信息${colors.reset}`);
    return this.findings;
  }
  
  scanFileContent(filePath, content) {
    const lines = content.split('\\n');
    
    lines.forEach((line, index) => {
      for (const [patternName, pattern] of Object.entries(this.patterns)) {
        const matches = [...line.matchAll(pattern)];
        
        matches.forEach(match => {
          // 跳过明显的示例或注释
          if (this.isLikelyExample(match[0])) return;
          
          this.findings.push({
            file: filePath,
            line: index + 1,
            type: patternName,
            content: match[0],
            context: line.trim(),
            severity: this.getSeverity(patternName)
          });
        });
      }
    });
  }
  
  isLikelyExample(content) {
    const examplePatterns = [
      'example', 'test', 'demo', 'sample', 'placeholder',
      'your_', 'my_', 'xxx', '123', 'abc'
    ];
    
    return examplePatterns.some(pattern => 
      content.toLowerCase().includes(pattern)
    );
  }
  
  getSeverity(patternType) {
    const severityMap = {
      apiKeys: 'critical',
      passwords: 'critical',
      creditCards: 'critical',
      emails: 'medium',
      urls: 'low',
      ipAddresses: 'low'
    };
    
    return severityMap[patternType] || 'low';
  }
  
  getAllSourceFiles() {
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    const files = [];
    
    const directories = ['app', 'components', 'lib', 'pages'];
    for (const dir of directories) {
      const dirPath = path.join(process.cwd(), dir);
      if (fs.existsSync(dirPath)) {
        files.push(...this.getFilesRecursively(dirPath, extensions));
      }
    }
    
    return files;
  }
  
  getFilesRecursively(dir, extensions) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.getFilesRecursively(fullPath, extensions));
      } else if (extensions.some(ext => fullPath.endsWith(ext))) {
        files.push(fullPath);
      }
    }
    
    return files;
  }
  
  generateReport() {
    if (this.findings.length === 0) {
      return `${colors.green}✅ 未发现敏感信息泄露${colors.reset}`;
    }
    
    let report = `${colors.red}🚨 敏感信息检测报告:${colors.reset}\\n`;
    
    const groupedFindings = this.findings.reduce((groups, finding) => {
      if (!groups[finding.severity]) groups[finding.severity] = [];
      groups[finding.severity].push(finding);
      return groups;
    }, {});
    
    for (const [severity, findings] of Object.entries(groupedFindings)) {
      const severityColor = {
        critical: colors.red,
        high: colors.red,
        medium: colors.yellow,
        low: colors.green
      }[severity];
      
      report += `\\n${severityColor}${severity.toUpperCase()} (${findings.length}):${colors.reset}\\n`;
      
      findings.forEach(finding => {
        report += `  • ${finding.file}:${finding.line} - ${finding.type}\\n`;
        report += `    ${colors.cyan}内容: ${finding.content}${colors.reset}\\n`;
      });
    }
    
    return report;
  }
}

/**
 * 工具：CSP配置验证器
 */
class CSPValidator {
  constructor() {
    this.middlewareFile = path.join(process.cwd(), 'middleware.ts');
    this.cspConfigFile = path.join(process.cwd(), 'lib/security/csp.ts');
    this.issues = [];
  }
  
  async validateCSP() {
    console.log(`${colors.cyan}🛡️  验证CSP配置...${colors.reset}`);
    
    if (fs.existsSync(this.middlewareFile)) {
      await this.validateMiddlewareCSP();
    } else {
      this.issues.push({
        type: 'missing_middleware',
        severity: 'high',
        message: '缺少 middleware.ts 文件',
        fix: '创建 middleware.ts 并配置安全头部'
      });
    }
    
    if (fs.existsSync(this.cspConfigFile)) {
      await this.validateCSPConfig();
    }
    
    console.log(`${colors.green}✅ CSP验证完成，发现 ${this.issues.length} 个问题${colors.reset}`);
    return this.issues;
  }
  
  async validateMiddlewareCSP() {
    const content = fs.readFileSync(this.middlewareFile, 'utf8');
    
    // 检查是否有CSP配置
    if (!content.includes('Content-Security-Policy')) {
      this.issues.push({
        type: 'missing_csp',
        severity: 'critical',
        message: 'middleware.ts 缺少 Content-Security-Policy 配置',
        fix: '添加 CSP 头部配置'
      });
      return;
    }
    
    // 提取CSP配置
    const cspMatch = content.match(/'Content-Security-Policy',\\s*'([^']+)'/);
    if (!cspMatch) {
      this.issues.push({
        type: 'invalid_csp_format',
        severity: 'high',
        message: 'CSP配置格式不正确',
        fix: '修正CSP头部配置格式'
      });
      return;
    }
    
    const cspHeader = cspMatch[1];
    this.validateCSPDirectives(cspHeader);
  }
  
  validateCSPDirectives(cspHeader) {
    const requiredDirectives = {
      'default-src': true,
      'script-src': true,
      'style-src': true,
      'img-src': true,
      'connect-src': true,
      'font-src': true,
      'object-src': true,
      'frame-ancestors': true
    };
    
    // 检查必需指令
    for (const directive of Object.keys(requiredDirectives)) {
      if (!cspHeader.includes(directive)) {
        this.issues.push({
          type: 'missing_directive',
          severity: 'medium',
          message: `CSP缺少 ${directive} 指令`,
          fix: `添加 ${directive} 指令到CSP配置`
        });
      }
    }
    
    // 检查不安全配置
    const unsafePatterns = [
      "'unsafe-eval'",
      "'unsafe-inline'",
      "'unsafe-hashes'"
    ];
    
    for (const pattern of unsafePatterns) {
      if (cspHeader.includes(pattern)) {
        let severity = 'medium';
        if (pattern === "'unsafe-eval'") severity = 'high';
        
        this.issues.push({
          type: 'unsafe_directive',
          severity,
          message: `CSP包含不安全指令: ${pattern}`,
          fix: pattern === "'unsafe-inline'" ? '使用 nonce 或 hash 替代' : '移除不安全指令'
        });
      }
    }
    
    // 检查通配符使用
    if (cspHeader.includes("*") && !cspHeader.includes("https:")) {
      this.issues.push({
        type: 'wildcard_usage',
        severity: 'medium',
        message: 'CSP使用了通配符 *',
        fix: '使用具体域名替代通配符'
      });
    }
    
    // 检查报告配置
    if (!cspHeader.includes('report-uri') && !cspHeader.includes('report-to')) {
      this.issues.push({
        type: 'missing_reporting',
        severity: 'low',
        message: 'CSP缺少违规报告配置',
        fix: '添加 report-uri 或 report-to 指令'
      });
    }
  }
  
  async validateCSPConfig() {
    const content = fs.readFileSync(this.cspConfigFile, 'utf8');
    
    // 检查nonce生成函数
    if (!content.includes('generateNonce')) {
      this.issues.push({
        type: 'missing_nonce_generator',
        severity: 'medium',
        message: 'CSP配置缺少 nonce 生成函数',
        fix: '实现安全的 nonce 生成机制'
      });
    }
    
    // 检查环境区分
    if (!content.includes('isDevelopment')) {
      this.issues.push({
        type: 'no_environment_distinction',
        severity: 'low',
        message: 'CSP配置未区分开发和生产环境',
        fix: '为不同环境设置不同的CSP策略'
      });
    }
  }
  
  generateReport() {
    if (this.issues.length === 0) {
      return `${colors.green}✅ CSP配置验证通过${colors.reset}`;
    }
    
    let report = `${colors.red}🚨 CSP配置问题:${colors.reset}\\n`;
    
    const groupedIssues = this.issues.reduce((groups, issue) => {
      if (!groups[issue.severity]) groups[issue.severity] = [];
      groups[issue.severity].push(issue);
      return groups;
    }, {});
    
    for (const [severity, issues] of Object.entries(groupedIssues)) {
      const severityColor = {
        critical: colors.red,
        high: colors.red,
        medium: colors.yellow,
        low: colors.green
      }[severity];
      
      report += `\\n${severityColor}${severity.toUpperCase()} (${issues.length}):${colors.reset}\\n`;
      
      issues.forEach(issue => {
        report += `  • ${issue.message}\\n`;
        report += `    ${colors.cyan}修复: ${issue.fix}${colors.reset}\\n`;
      });
    }
    
    return report;
  }
}

/**
 * 工具：API安全检查器
 */
class APISecurityChecker {
  constructor() {
    this.apiDir = path.join(process.cwd(), 'app/api');
    this.issues = [];
  }
  
  async checkAPISecurity() {
    console.log(`${colors.cyan}🔌 检查API安全性...${colors.reset}`);
    
    if (!fs.existsSync(this.apiDir)) {
      console.log(`${colors.yellow}⚠️  API目录不存在${colors.reset}`);
      return [];
    }
    
    const apiFiles = this.getApiFiles(this.apiDir);
    
    for (const file of apiFiles) {
      await this.analyzeApiFile(file);
    }
    
    console.log(`${colors.green}✅ API安全检查完成，发现 ${this.issues.length} 个问题${colors.reset}`);
    return this.issues;
  }
  
  getApiFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.getApiFiles(fullPath));
      } else if (fullPath.endsWith('route.ts') || fullPath.endsWith('route.js')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }
  
  async analyzeApiFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    // 检查HTTP方法
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    const exportedMethods = methods.filter(method => 
      content.includes(`export async function ${method}`)
    );
    
    for (const method of exportedMethods) {
      this.checkMethodSecurity(content, relativePath, method);
    }
  }
  
  checkMethodSecurity(content, filePath, method) {
    const methodContent = this.extractMethodContent(content, method);
    
    // 检查输入验证
    if (methodContent.includes('request.json()') || methodContent.includes('searchParams.get')) {
      if (!this.hasInputValidation(methodContent)) {
        this.issues.push({
          type: 'missing_input_validation',
          severity: 'high',
          file: filePath,
          method,
          message: `${method} 端点缺少输入验证`,
          fix: '使用 Zod 或其他库验证用户输入'
        });
      }
    }
    
    // 检查CORS配置
    if (method !== 'GET' && !methodContent.includes('origin') && !methodContent.includes('cors')) {
      this.issues.push({
        type: 'missing_cors_check',
        severity: 'medium',
        file: filePath,
        method,
        message: `${method} 端点可能缺少CORS保护`,
        fix: '实现请求来源验证'
      });
    }
    
    // 检查错误处理
    if (!methodContent.includes('try') || !methodContent.includes('catch')) {
      this.issues.push({
        type: 'missing_error_handling',
        severity: 'medium',
        file: filePath,
        method,
        message: `${method} 端点缺少错误处理`,
        fix: '实现完整的错误处理机制'
      });
    }
    
    // 检查敏感信息泄露
    if (methodContent.includes('console.log') || methodContent.includes('console.error')) {
      this.issues.push({
        type: 'debug_info_leak',
        severity: 'low',
        file: filePath,
        method,
        message: `${method} 端点包含调试信息`,
        fix: '移除生产环境中的调试代码'
      });
    }
    
    // 检查SQL注入风险
    if (methodContent.includes('SELECT') || methodContent.includes('INSERT')) {
      if (!methodContent.includes('prisma') && !methodContent.includes('prepare')) {
        this.issues.push({
          type: 'sql_injection_risk',
          severity: 'critical',
          file: filePath,
          method,
          message: `${method} 端点可能存在SQL注入风险`,
          fix: '使用参数化查询或ORM'
        });
      }
    }
    
    // 检查认证/授权
    if (method !== 'GET' && !methodContent.includes('auth') && !methodContent.includes('token')) {
      this.issues.push({
        type: 'missing_authentication',
        severity: 'high',
        file: filePath,
        method,
        message: `${method} 端点可能缺少认证检查`,
        fix: '实现用户认证和授权机制'
      });
    }
  }
  
  extractMethodContent(content, method) {
    const methodRegex = new RegExp(
      `export\\s+async\\s+function\\s+${method}[\\s\\S]*?(?=export\\s+async\\s+function|$)`,
      'i'
    );
    const match = content.match(methodRegex);
    return match ? match[0] : '';
  }
  
  hasInputValidation(methodContent) {
    const validationPatterns = [
      'zod', 'parse(', 'validate', 'sanitize', 'schema',
      '.min(', '.max(', '.email(', '.string()', '.number()'
    ];
    
    return validationPatterns.some(pattern => 
      methodContent.includes(pattern)
    );
  }
  
  generateReport() {
    if (this.issues.length === 0) {
      return `${colors.green}✅ API安全检查通过${colors.reset}`;
    }
    
    let report = `${colors.red}🚨 API安全问题:${colors.reset}\\n`;
    
    const groupedIssues = this.issues.reduce((groups, issue) => {
      if (!groups[issue.severity]) groups[issue.severity] = [];
      groups[issue.severity].push(issue);
      return groups;
    }, {});
    
    for (const [severity, issues] of Object.entries(groupedIssues)) {
      const severityColor = {
        critical: colors.red,
        high: colors.red,
        medium: colors.yellow,
        low: colors.green
      }[severity];
      
      report += `\\n${severityColor}${severity.toUpperCase()} (${issues.length}):${colors.reset}\\n`;
      
      issues.forEach(issue => {
        report += `  • ${issue.file} [${issue.method}]: ${issue.message}\\n`;
        report += `    ${colors.cyan}修复: ${issue.fix}${colors.reset}\\n`;
      });
    }
    
    return report;
  }
}

/**
 * 工具：环境变量审计器
 */
class EnvironmentAuditor {
  constructor() {
    this.issues = [];
    this.envFiles = ['.env', '.env.local', '.env.production', '.env.development'];
  }
  
  async auditEnvironmentVariables() {
    console.log(`${colors.cyan}🌍 审计环境变量...${colors.reset}`);
    
    // 检查环境变量文件
    for (const envFile of this.envFiles) {
      const filePath = path.join(process.cwd(), envFile);
      if (fs.existsSync(filePath)) {
        await this.auditEnvFile(filePath, envFile);
      }
    }
    
    // 检查源代码中的环境变量使用
    await this.auditEnvUsage();
    
    // 检查Git追踪状态
    await this.checkGitTracking();
    
    console.log(`${colors.green}✅ 环境变量审计完成，发现 ${this.issues.length} 个问题${colors.reset}`);
    return this.issues;
  }
  
  async auditEnvFile(filePath, fileName) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\\n');
    
    lines.forEach((line, index) => {
      if (!line.trim() || line.startsWith('#')) return;
      
      const [key, value] = line.split('=', 2);
      if (!key || !value) return;
      
      // 检查空值
      if (!value.trim() || value.trim() === '""' || value.trim() === "''") {
        this.issues.push({
          type: 'empty_env_value',
          severity: 'medium',
          file: fileName,
          line: index + 1,
          message: `环境变量 ${key} 为空`,
          fix: '设置适当的环境变量值'
        });
      }
      
      // 检查示例值
      const examplePatterns = ['your_', 'example', 'test_', 'demo_', 'xxx', '123456'];
      if (examplePatterns.some(pattern => value.toLowerCase().includes(pattern))) {
        this.issues.push({
          type: 'example_env_value',
          severity: 'high',
          file: fileName,
          line: index + 1,
          message: `环境变量 ${key} 使用示例值`,
          fix: '替换为真实的生产值'
        });
      }
      
      // 检查敏感变量强度
      const sensitiveKeys = ['API_KEY', 'SECRET', 'PASSWORD', 'TOKEN'];
      if (sensitiveKeys.some(sk => key.includes(sk))) {
        if (value.length < 16) {
          this.issues.push({
            type: 'weak_secret_value',
            severity: 'high',
            file: fileName,
            line: index + 1,
            message: `敏感环境变量 ${key} 值过短`,
            fix: '使用更强的密钥值（至少16位）'
          });
        }
      }
      
      // 检查公开变量前缀
      const isPublic = key.startsWith('NEXT_PUBLIC_');
      const isSensitive = sensitiveKeys.some(sk => key.includes(sk));
      
      if (isSensitive && isPublic) {
        this.issues.push({
          type: 'exposed_sensitive_var',
          severity: 'critical',
          file: fileName,
          line: index + 1,
          message: `敏感变量 ${key} 使用了公开前缀`,
          fix: '移除 NEXT_PUBLIC_ 前缀或重新评估变量敏感性'
        });
      }
    });
  }
  
  async auditEnvUsage() {
    const sourceFiles = this.getAllSourceFiles();
    
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\\n');
      
      lines.forEach((line, index) => {
        // 查找环境变量使用
        const envMatches = [...line.matchAll(/process\\.env\\.([A-Z_]+)/g)];
        
        envMatches.forEach(match => {
          const varName = match[1];
          const isPublic = varName.startsWith('NEXT_PUBLIC_');
          const isClientFile = file.includes('/app/') && !file.includes('/api/');
          
          // 检查客户端组件中使用非公开环境变量
          if (isClientFile && !isPublic) {
            const sensitivePatterns = ['API_KEY', 'SECRET', 'PASSWORD', 'TOKEN', 'DATABASE'];
            const isSensitive = sensitivePatterns.some(pattern => varName.includes(pattern));
            
            if (isSensitive) {
              this.issues.push({
                type: 'client_sensitive_env',
                severity: 'critical',
                file: path.relative(process.cwd(), file),
                line: index + 1,
                message: `客户端组件使用敏感环境变量 ${varName}`,
                fix: '将敏感逻辑移至API路由，或确认变量是否应该公开'
              });
            }
          }
        });
      });
    }
  }
  
  async checkGitTracking() {
    for (const envFile of this.envFiles) {
      if (fs.existsSync(path.join(process.cwd(), envFile))) {
        try {
          execSync(`git ls-files --error-unmatch ${envFile}`, { stdio: 'ignore' });
          this.issues.push({
            type: 'env_file_tracked',
            severity: 'critical',
            file: envFile,
            message: `环境变量文件 ${envFile} 被Git追踪`,
            fix: `运行 'git rm --cached ${envFile}' 并添加到 .gitignore`
          });
        } catch {
          // 文件不在Git中，这是正确的
        }
      }
    }
  }
  
  getAllSourceFiles() {
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    const files = [];
    
    const directories = ['app', 'components', 'lib', 'pages'];
    for (const dir of directories) {
      const dirPath = path.join(process.cwd(), dir);
      if (fs.existsSync(dirPath)) {
        files.push(...this.getFilesRecursively(dirPath, extensions));
      }
    }
    
    return files;
  }
  
  getFilesRecursively(dir, extensions) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.getFilesRecursively(fullPath, extensions));
      } else if (extensions.some(ext => fullPath.endsWith(ext))) {
        files.push(fullPath);
      }
    }
    
    return files;
  }
  
  generateReport() {
    if (this.issues.length === 0) {
      return `${colors.green}✅ 环境变量审计通过${colors.reset}`;
    }
    
    let report = `${colors.red}🚨 环境变量问题:${colors.reset}\\n`;
    
    const groupedIssues = this.issues.reduce((groups, issue) => {
      if (!groups[issue.severity]) groups[issue.severity] = [];
      groups[issue.severity].push(issue);
      return groups;
    }, {});
    
    for (const [severity, issues] of Object.entries(groupedIssues)) {
      const severityColor = {
        critical: colors.red,
        high: colors.red,
        medium: colors.yellow,
        low: colors.green
      }[severity];
      
      report += `\\n${severityColor}${severity.toUpperCase()} (${issues.length}):${colors.reset}\\n`;
      
      issues.forEach(issue => {
        const location = issue.line ? `${issue.file}:${issue.line}` : issue.file;
        report += `  • ${location}: ${issue.message}\\n`;
        report += `    ${colors.cyan}修复: ${issue.fix}${colors.reset}\\n`;
      });
    }
    
    return report;
  }
}

/**
 * 主工具管理器
 */
class SecurityToolsManager {
  constructor() {
    this.tools = {
      'deps': new DependencyScanner(),
      'secrets': new SensitiveDataDetector(),
      'csp': new CSPValidator(),
      'api': new APISecurityChecker(),
      'env': new EnvironmentAuditor()
    };
  }
  
  async runTool(toolName) {
    const tool = this.tools[toolName];
    if (!tool) {
      console.log(`${colors.red}❌ 未知工具: ${toolName}${colors.reset}`);
      console.log(`${colors.cyan}可用工具: ${Object.keys(this.tools).join(', ')}${colors.reset}`);
      return;
    }
    
    console.log(`${colors.bold}🔧 运行安全工具: ${toolName}${colors.reset}`);
    console.log(`${'='.repeat(60)}`);
    
    try {
      let results;
      switch (toolName) {
        case 'deps':
          results = await tool.scanVulnerabilities();
          const outdated = await tool.checkOutdatedPackages();
          break;
        case 'secrets':
          results = await tool.scanFiles();
          break;
        case 'csp':
          results = await tool.validateCSP();
          break;
        case 'api':
          results = await tool.checkAPISecurity();
          break;
        case 'env':
          results = await tool.auditEnvironmentVariables();
          break;
      }
      
      console.log('\\n' + tool.generateReport());
      
    } catch (error) {
      console.log(`${colors.red}❌ 工具运行失败: ${error.message}${colors.reset}`);
    }
  }
  
  async runAllTools() {
    console.log(`${colors.bold}🔧 运行所有安全工具${colors.reset}`);
    console.log(`${'='.repeat(60)}`);
    
    for (const toolName of Object.keys(this.tools)) {
      await this.runTool(toolName);
      console.log('\\n' + '─'.repeat(60) + '\\n');
    }
    
    console.log(`${colors.green}✅ 所有安全工具运行完成${colors.reset}`);
  }
  
  showHelp() {
    console.log(`${colors.bold}🛡️  安全工具集合使用帮助${colors.reset}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`${colors.cyan}使用方法:${colors.reset}`);
    console.log(`  node scripts/security-tools.js [tool] [options]\\n`);
    
    console.log(`${colors.cyan}可用工具:${colors.reset}`);
    console.log(`  ${colors.yellow}deps${colors.reset}    - 依赖漏洞扫描`);
    console.log(`  ${colors.yellow}secrets${colors.reset} - 敏感信息检测`);
    console.log(`  ${colors.yellow}csp${colors.reset}     - CSP配置验证`);
    console.log(`  ${colors.yellow}api${colors.reset}     - API安全检查`);
    console.log(`  ${colors.yellow}env${colors.reset}     - 环境变量审计`);
    console.log(`  ${colors.yellow}all${colors.reset}     - 运行所有工具\\n`);
    
    console.log(`${colors.cyan}示例:${colors.reset}`);
    console.log(`  node scripts/security-tools.js deps`);
    console.log(`  node scripts/security-tools.js secrets`);
    console.log(`  node scripts/security-tools.js all`);
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const manager = new SecurityToolsManager();
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    manager.showHelp();
    return;
  }
  
  const tool = args[0];
  
  if (tool === 'all') {
    await manager.runAllTools();
  } else {
    await manager.runTool(tool);
  }
}

// 运行程序
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  SecurityToolsManager,
  DependencyScanner,
  SensitiveDataDetector,
  CSPValidator,
  APISecurityChecker,
  EnvironmentAuditor
};