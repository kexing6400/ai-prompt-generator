/**
 * 企业级安全Headers配置
 * 实现OWASP推荐的安全头部和内容安全策略
 * 作者：Claude Security Auditor
 * 版本：v2.0 - 企业级安全标准
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export interface SecurityHeadersConfig {
  csp: {
    enabled: boolean;
    reportOnly: boolean;
    reportUri?: string;
    nonce?: boolean;
    customDirectives?: Record<string, string>;
  };
  hsts: {
    enabled: boolean;
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };
  xss: {
    enabled: boolean;
    mode: 'block' | 'filter';
  };
  frameOptions: {
    enabled: boolean;
    value: 'DENY' | 'SAMEORIGIN' | string;
  };
  contentType: {
    enabled: boolean;
    noSniff: boolean;
  };
  referrer: {
    enabled: boolean;
    policy: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 
            'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
  };
  permissions: {
    enabled: boolean;
    policies: Record<string, string>;
  };
  crossOrigin: {
    embedderPolicy: boolean;
    openerPolicy: boolean;
    resourcePolicy: boolean;
  };
}

export interface CSPDirective {
  'default-src'?: string[];
  'script-src'?: string[];
  'style-src'?: string[];
  'img-src'?: string[];
  'connect-src'?: string[];
  'font-src'?: string[];
  'media-src'?: string[];
  'object-src'?: string[];
  'frame-src'?: string[];
  'worker-src'?: string[];
  'child-src'?: string[];
  'form-action'?: string[];
  'frame-ancestors'?: string[];
  'base-uri'?: string[];
  'manifest-src'?: string[];
  'report-uri'?: string[];
  'report-to'?: string[];
  'require-trusted-types-for'?: string[];
  'trusted-types'?: string[];
  'upgrade-insecure-requests'?: boolean;
  'block-all-mixed-content'?: boolean;
}

/**
 * 安全Headers管理器
 */
export class SecurityHeaders {
  private static readonly DEFAULT_CONFIG: SecurityHeadersConfig = {
    csp: {
      enabled: true,
      reportOnly: false,
      reportUri: '/api/security/csp-report',
      nonce: true
    },
    hsts: {
      enabled: true,
      maxAge: 31536000, // 1年
      includeSubDomains: true,
      preload: true
    },
    xss: {
      enabled: true,
      mode: 'block'
    },
    frameOptions: {
      enabled: true,
      value: 'DENY'
    },
    contentType: {
      enabled: true,
      noSniff: true
    },
    referrer: {
      enabled: true,
      policy: 'strict-origin-when-cross-origin'
    },
    permissions: {
      enabled: true,
      policies: {
        camera: '()',
        microphone: '()',
        geolocation: '()',
        payment: '()',
        usb: '()',
        magnetometer: '()',
        gyroscope: '()',
        accelerometer: '()'
      }
    },
    crossOrigin: {
      embedderPolicy: true,
      openerPolicy: true,
      resourcePolicy: true
    }
  };

  /**
   * 生成CSP nonce
   * @returns Base64编码的nonce
   */
  public static generateNonce(): string {
    return crypto.randomBytes(16).toString('base64');
  }

  /**
   * 构建CSP策略字符串
   * @param directives CSP指令
   * @param nonce 可选的nonce值
   * @returns CSP策略字符串
   */
  public static buildCSPPolicy(directives: CSPDirective, nonce?: string): string {
    const policies: string[] = [];

    Object.entries(directives).forEach(([directive, value]) => {
      if (value === true) {
        policies.push(directive);
      } else if (Array.isArray(value) && value.length > 0) {
        let directiveValue = value.join(' ');
        
        // 如果有nonce且指令支持nonce，添加nonce
        if (nonce && (directive === 'script-src' || directive === 'style-src')) {
          directiveValue += ` 'nonce-${nonce}'`;
        }
        
        policies.push(`${directive} ${directiveValue}`);
      }
    });

    return policies.join('; ');
  }

  /**
   * 获取生产环境CSP指令
   * @param nonce 可选的nonce值
   * @returns 生产环境CSP指令
   */
  public static getProductionCSP(nonce?: string): CSPDirective {
    const baseCSP: CSPDirective = {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'strict-dynamic'",
        "https://vercel.live",
        "https://va.vercel-scripts.com"
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // 需要支持Tailwind CSS
        "https://fonts.googleapis.com"
      ],
      'font-src': [
        "'self'",
        "https://fonts.gstatic.com",
        "data:"
      ],
      'img-src': [
        "'self'",
        "data:",
        "blob:",
        "https:",
        "https://vercel.live"
      ],
      'connect-src': [
        "'self'",
        "https://openrouter.ai",
        "https://api.openrouter.ai",
        "https://vitals.vercel-insights.com",
        "https://vercel.live"
      ],
      'media-src': ["'self'", "data:", "blob:"],
      'object-src': ["'none'"],
      'frame-src': ["'self'"],
      'worker-src': ["'self'", "blob:"],
      'child-src': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      'manifest-src': ["'self'"],
      'upgrade-insecure-requests': true,
      'block-all-mixed-content': true
    };

    // 添加报告端点
    baseCSP['report-uri'] = ['/api/security/csp-report'];
    
    return baseCSP;
  }

  /**
   * 获取开发环境CSP指令
   * @param nonce 可选的nonce值
   * @returns 开发环境CSP指令
   */
  public static getDevelopmentCSP(nonce?: string): CSPDirective {
    const devCSP: CSPDirective = {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-eval'", // Next.js开发模式需要
        "'unsafe-inline'", // 开发模式的热重载
        "http://localhost:*",
        "https://vercel.live"
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com"
      ],
      'font-src': [
        "'self'",
        "https://fonts.gstatic.com",
        "data:"
      ],
      'img-src': [
        "'self'",
        "data:",
        "blob:",
        "http:",
        "https:"
      ],
      'connect-src': [
        "'self'",
        "ws://localhost:*",
        "http://localhost:*",
        "https://openrouter.ai",
        "https://api.openrouter.ai",
        "https://vitals.vercel-insights.com",
        "https://vercel.live"
      ],
      'media-src': ["'self'", "data:", "blob:"],
      'object-src': ["'none'"],
      'frame-src': ["'self'"],
      'worker-src': ["'self'", "blob:"],
      'child-src': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      'manifest-src': ["'self'"]
    };

    return devCSP;
  }

  /**
   * 应用安全头部到响应
   * @param response 响应对象
   * @param config 安全配置
   * @param nonce 可选的nonce值
   * @returns 带有安全头部的响应
   */
  public static applySecurityHeaders(
    response: NextResponse,
    config: Partial<SecurityHeadersConfig> = {},
    nonce?: string
  ): NextResponse {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const isProduction = process.env.NODE_ENV === 'production';

    // 1. Content Security Policy
    if (finalConfig.csp.enabled) {
      const cspDirectives = isProduction 
        ? this.getProductionCSP(nonce)
        : this.getDevelopmentCSP(nonce);

      // 合并自定义指令
      if (finalConfig.csp.customDirectives) {
        Object.entries(finalConfig.csp.customDirectives).forEach(([key, value]) => {
          (cspDirectives as any)[key] = value.split(' ');
        });
      }

      const cspPolicy = this.buildCSPPolicy(cspDirectives, nonce);
      const headerName = finalConfig.csp.reportOnly 
        ? 'Content-Security-Policy-Report-Only'
        : 'Content-Security-Policy';
      
      response.headers.set(headerName, cspPolicy);
    }

    // 2. HTTP Strict Transport Security
    if (finalConfig.hsts.enabled && isProduction) {
      const hstsValue = [
        `max-age=${finalConfig.hsts.maxAge}`,
        finalConfig.hsts.includeSubDomains ? 'includeSubDomains' : '',
        finalConfig.hsts.preload ? 'preload' : ''
      ].filter(Boolean).join('; ');
      
      response.headers.set('Strict-Transport-Security', hstsValue);
    }

    // 3. X-XSS-Protection
    if (finalConfig.xss.enabled) {
      const xssValue = finalConfig.xss.mode === 'block' ? '1; mode=block' : '1';
      response.headers.set('X-XSS-Protection', xssValue);
    }

    // 4. X-Frame-Options
    if (finalConfig.frameOptions.enabled) {
      response.headers.set('X-Frame-Options', finalConfig.frameOptions.value);
    }

    // 5. X-Content-Type-Options
    if (finalConfig.contentType.enabled && finalConfig.contentType.noSniff) {
      response.headers.set('X-Content-Type-Options', 'nosniff');
    }

    // 6. Referrer Policy
    if (finalConfig.referrer.enabled) {
      response.headers.set('Referrer-Policy', finalConfig.referrer.policy);
    }

    // 7. Permissions Policy
    if (finalConfig.permissions.enabled) {
      const permissionsPolicy = Object.entries(finalConfig.permissions.policies)
        .map(([feature, allowlist]) => `${feature}=${allowlist}`)
        .join(', ');
      
      response.headers.set('Permissions-Policy', permissionsPolicy);
    }

    // 8. Cross-Origin Policies
    if (finalConfig.crossOrigin.embedderPolicy) {
      response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    }
    
    if (finalConfig.crossOrigin.openerPolicy) {
      response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    }
    
    if (finalConfig.crossOrigin.resourcePolicy) {
      response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
    }

    // 9. 隐藏服务器信息
    response.headers.set('Server', '');
    response.headers.delete('X-Powered-By');

    // 10. 安全相关的缓存控制
    if (this.isSensitiveEndpoint(response)) {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
    }

    // 11. 添加自定义安全标识
    response.headers.set('X-Security-Framework', 'AI-Prompt-Generator-Security-v2.0');

    return response;
  }

  /**
   * 检查是否为敏感端点
   * @param response 响应对象
   * @returns 是否为敏感端点
   */
  private static isSensitiveEndpoint(response: NextResponse): boolean {
    const url = response.headers.get('x-pathname') || '';
    const sensitivePatterns = [
      '/api/admin/',
      '/api/auth/',
      '/api/security/',
      '/admin',
      '/login'
    ];

    return sensitivePatterns.some(pattern => url.includes(pattern));
  }

  /**
   * 验证CSP违规报告
   * @param report CSP违规报告
   * @returns 验证结果
   */
  public static validateCSPReport(report: any): {
    isValid: boolean;
    violations: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  } {
    const violations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    if (!report || typeof report !== 'object') {
      return { isValid: false, violations: ['Invalid report format'], riskLevel: 'low' };
    }

    const cspReport = report['csp-report'] || report;

    // 检查必需字段
    const requiredFields = ['document-uri', 'violated-directive'];
    requiredFields.forEach(field => {
      if (!cspReport[field]) {
        violations.push(`Missing required field: ${field}`);
      }
    });

    // 分析违规类型和风险等级
    if (cspReport['violated-directive']) {
      const directive = cspReport['violated-directive'];
      const blockedUri = cspReport['blocked-uri'] || '';

      // 脚本注入检测
      if (directive.includes('script-src')) {
        if (blockedUri.includes('javascript:') || 
            blockedUri.includes('data:') || 
            blockedUri.includes('eval')) {
          riskLevel = 'critical';
          violations.push('Potential XSS attack detected');
        } else {
          riskLevel = 'medium';
          violations.push('Script loading violation');
        }
      }

      // 样式注入检测
      if (directive.includes('style-src')) {
        if (blockedUri.includes('javascript:') || 
            cspReport['source-file']?.includes('<script')) {
          riskLevel = 'high';
          violations.push('Potential style-based XSS');
        } else {
          riskLevel = 'low';
          violations.push('Style loading violation');
        }
      }

      // Frame嵌入检测
      if (directive.includes('frame-') || directive.includes('child-src')) {
        riskLevel = 'medium';
        violations.push('Frame embedding violation');
      }

      // 数据泄露检测
      if (directive.includes('connect-src')) {
        if (blockedUri && !this.isAllowedDomain(blockedUri)) {
          riskLevel = 'high';
          violations.push('Potential data exfiltration attempt');
        }
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
      riskLevel
    };
  }

  /**
   * 检查是否为允许的域名
   * @param uri URI字符串
   * @returns 是否为允许的域名
   */
  private static isAllowedDomain(uri: string): boolean {
    const allowedDomains = [
      'openrouter.ai',
      'api.openrouter.ai',
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'vercel.live',
      'vitals.vercel-insights.com'
    ];

    try {
      const url = new URL(uri);
      return allowedDomains.some(domain => 
        url.hostname === domain || url.hostname.endsWith(`.${domain}`)
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * 生成安全配置建议
   * @param currentConfig 当前配置
   * @returns 配置建议
   */
  public static generateSecurityRecommendations(
    currentConfig?: Partial<SecurityHeadersConfig>
  ): Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    recommendation: string;
  }> {
    const recommendations = [];
    const config = { ...this.DEFAULT_CONFIG, ...currentConfig };
    const isProduction = process.env.NODE_ENV === 'production';

    // CSP配置检查
    if (!config.csp.enabled) {
      recommendations.push({
        type: 'error' as const,
        message: 'Content Security Policy未启用',
        recommendation: '启用CSP以防止XSS攻击和数据注入'
      });
    }

    if (config.csp.reportOnly && isProduction) {
      recommendations.push({
        type: 'warning' as const,
        message: '生产环境中CSP处于仅报告模式',
        recommendation: '在生产环境中启用强制模式以实际阻止违规'
      });
    }

    // HSTS配置检查
    if (!config.hsts.enabled && isProduction) {
      recommendations.push({
        type: 'error' as const,
        message: 'HSTS未在生产环境中启用',
        recommendation: '启用HSTS以强制HTTPS连接'
      });
    }

    if (config.hsts.maxAge < 31536000) { // 1年
      recommendations.push({
        type: 'warning' as const,
        message: 'HSTS最大年龄设置过短',
        recommendation: '建议设置为至少1年(31536000秒)'
      });
    }

    // Frame Options检查
    if (config.frameOptions.value !== 'DENY' && config.frameOptions.value !== 'SAMEORIGIN') {
      recommendations.push({
        type: 'warning' as const,
        message: 'X-Frame-Options配置可能不够严格',
        recommendation: '建议使用DENY或SAMEORIGIN以防止点击劫持'
      });
    }

    // Permissions Policy检查
    if (!config.permissions.enabled) {
      recommendations.push({
        type: 'info' as const,
        message: 'Permissions Policy未启用',
        recommendation: '启用权限策略以限制浏览器功能访问'
      });
    }

    // Cross-Origin策略检查
    if (!config.crossOrigin.embedderPolicy && isProduction) {
      recommendations.push({
        type: 'info' as const,
        message: 'Cross-Origin-Embedder-Policy未启用',
        recommendation: '考虑启用COEP以增强跨源安全性'
      });
    }

    return recommendations;
  }

  /**
   * 获取安全头部测试用例
   * @returns 测试用例列表
   */
  public static getSecurityTestCases(): Array<{
    name: string;
    description: string;
    test: (headers: Headers) => { passed: boolean; message: string };
  }> {
    return [
      {
        name: 'CSP Header存在性测试',
        description: '检查是否设置了Content Security Policy',
        test: (headers: Headers) => {
          const csp = headers.get('Content-Security-Policy') || 
                     headers.get('Content-Security-Policy-Report-Only');
          return {
            passed: !!csp,
            message: csp ? 'CSP已正确设置' : 'CSP头部缺失'
          };
        }
      },
      {
        name: 'HSTS测试',
        description: '检查HTTPS严格传输安全',
        test: (headers: Headers) => {
          const hsts = headers.get('Strict-Transport-Security');
          const hasMaxAge = hsts?.includes('max-age=');
          return {
            passed: !!hasMaxAge,
            message: hasMaxAge ? 'HSTS已正确配置' : 'HSTS配置缺失或无效'
          };
        }
      },
      {
        name: 'X-Frame-Options测试',
        description: '检查点击劫持防护',
        test: (headers: Headers) => {
          const frameOptions = headers.get('X-Frame-Options');
          const validValues = ['DENY', 'SAMEORIGIN'];
          return {
            passed: !!frameOptions && validValues.includes(frameOptions),
            message: frameOptions ? 'Frame保护已设置' : 'Frame保护缺失'
          };
        }
      },
      {
        name: 'X-Content-Type-Options测试',
        description: '检查MIME类型嗅探保护',
        test: (headers: Headers) => {
          const contentType = headers.get('X-Content-Type-Options');
          return {
            passed: contentType === 'nosniff',
            message: contentType ? 'MIME嗅探保护已启用' : 'MIME嗅探保护缺失'
          };
        }
      },
      {
        name: '服务器信息隐藏测试',
        description: '检查是否隐藏了服务器技术栈信息',
        test: (headers: Headers) => {
          const server = headers.get('Server');
          const poweredBy = headers.get('X-Powered-By');
          return {
            passed: !server && !poweredBy,
            message: (!server && !poweredBy) ? '服务器信息已隐藏' : '服务器信息可能泄露'
          };
        }
      }
    ];
  }

  /**
   * 运行安全头部测试套件
   * @param headers 要测试的头部
   * @returns 测试结果
   */
  public static runSecurityTests(headers: Headers): {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    results: Array<{
      name: string;
      passed: boolean;
      message: string;
    }>;
    score: number; // 0-100
  } {
    const testCases = this.getSecurityTestCases();
    const results = testCases.map(testCase => {
      const result = testCase.test(headers);
      return {
        name: testCase.name,
        passed: result.passed,
        message: result.message
      };
    });

    const passedTests = results.filter(r => r.passed).length;
    const failedTests = results.filter(r => !r.passed).length;
    const score = Math.round((passedTests / testCases.length) * 100);

    return {
      totalTests: testCases.length,
      passedTests,
      failedTests,
      results,
      score
    };
  }
}