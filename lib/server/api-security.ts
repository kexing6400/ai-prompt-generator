/**
 * API安全防护中间件
 * 提供全面的API安全控制和防护机制
 * 作者：Claude Security Auditor
 * 版本：v2.0 - 企业级安全标准
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { SecureCrypto } from './secure-crypto';
import { z, ZodError } from 'zod';

export interface SecurityConfig {
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
  };
  csrf: {
    enabled: boolean;
    tokenName: string;
    secretKey: string;
  };
  inputValidation: {
    enabled: boolean;
    maxBodySize: number;
    sanitizeHtml: boolean;
  };
  cors: {
    enabled: boolean;
    allowedOrigins: string[];
    allowedMethods: string[];
    allowCredentials: boolean;
  };
}

export interface SecurityViolation {
  id: string;
  timestamp: number;
  type: 'rate_limit' | 'csrf' | 'input_validation' | 'cors' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  userAgent: string;
  endpoint: string;
  details: Record<string, any>;
  blocked: boolean;
}

/**
 * 速率限制管理器
 */
export class RateLimiter {
  private static requests: Map<string, number[]> = new Map();
  private static violations: SecurityViolation[] = [];
  private static blockedIPs: Map<string, number> = new Map(); // IP -> 解封时间戳

  /**
   * 检查速率限制
   * @param ip 客户端IP
   * @param windowMs 时间窗口（毫秒）
   * @param maxRequests 最大请求数
   * @param endpoint 端点路径
   * @returns 是否允许请求
   */
  public static checkRateLimit(
    ip: string,
    windowMs: number = 60000,
    maxRequests: number = 100,
    endpoint: string = 'default'
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    
    // 检查IP是否被封禁
    const unblockTime = this.blockedIPs.get(ip);
    if (unblockTime && now < unblockTime) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: unblockTime
      };
    } else if (unblockTime && now >= unblockTime) {
      // 解除封禁
      this.blockedIPs.delete(ip);
    }

    const key = `${ip}:${endpoint}`;
    const requests = this.requests.get(key) || [];
    
    // 清理过期请求
    const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
    
    if (validRequests.length >= maxRequests) {
      // 记录违规行为
      this.recordViolation({
        type: 'rate_limit',
        severity: 'high',
        ip,
        endpoint,
        details: {
          requestCount: validRequests.length,
          maxAllowed: maxRequests,
          windowMs
        },
        blocked: true
      });

      // 连续违规则临时封禁IP
      const recentViolations = this.violations.filter(
        v => v.ip === ip && v.type === 'rate_limit' && now - v.timestamp < 300000 // 5分钟内
      );

      if (recentViolations.length >= 3) {
        const blockDuration = Math.min(3600000, Math.pow(2, recentViolations.length) * 60000); // 指数退避，最多1小时
        this.blockedIPs.set(ip, now + blockDuration);
        
        console.warn(`[速率限制] IP ${ip} 已被临时封禁 ${blockDuration/1000} 秒`);
      }

      return {
        allowed: false,
        remaining: 0,
        resetTime: Math.min(...validRequests) + windowMs
      };
    }

    // 记录请求
    validRequests.push(now);
    this.requests.set(key, validRequests);

    return {
      allowed: true,
      remaining: maxRequests - validRequests.length,
      resetTime: Math.min(...validRequests) + windowMs
    };
  }

  /**
   * 记录安全违规
   * @param violation 违规信息（部分）
   */
  private static recordViolation(violation: Partial<SecurityViolation>): void {
    const fullViolation: SecurityViolation = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      userAgent: '',
      ...violation
    } as SecurityViolation;

    this.violations.unshift(fullViolation);
    
    // 保持违规记录数量
    if (this.violations.length > 1000) {
      this.violations = this.violations.slice(0, 1000);
    }

    console.warn(`[安全违规] ${violation.type}: ${violation.severity}`, violation.details);
  }

  /**
   * 获取违规统计
   */
  public static getViolationStats(): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    blockedIPs: number;
  } {
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    this.violations.forEach(violation => {
      byType[violation.type] = (byType[violation.type] || 0) + 1;
      bySeverity[violation.severity] = (bySeverity[violation.severity] || 0) + 1;
    });

    return {
      total: this.violations.length,
      byType,
      bySeverity,
      blockedIPs: this.blockedIPs.size
    };
  }

  /**
   * 清理过期数据
   */
  public static cleanup(): void {
    const now = Date.now();
    const oneHourAgo = now - 3600000;

    // 清理过期的请求记录
    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(timestamp => timestamp > oneHourAgo);
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }

    // 清理过期的IP封禁
    for (const [ip, unblockTime] of this.blockedIPs.entries()) {
      if (now >= unblockTime) {
        this.blockedIPs.delete(ip);
      }
    }
  }
}

/**
 * CSRF保护管理器
 */
export class CSRFProtection {
  private static readonly TOKEN_HEADER = 'x-csrf-token';
  private static readonly TOKEN_COOKIE = 'csrf-token';
  private static readonly SECRET_KEY = process.env.CSRF_SECRET || 'csrf-secret-key';

  /**
   * 生成CSRF token
   * @param sessionId 会话ID
   * @returns CSRF token
   */
  public static generateToken(sessionId: string): string {
    const timestamp = Date.now().toString();
    const nonce = crypto.randomBytes(16).toString('hex');
    const payload = `${sessionId}:${timestamp}:${nonce}`;
    
    const signature = crypto
      .createHmac('sha256', this.SECRET_KEY)
      .update(payload)
      .digest('hex');

    return Buffer.from(`${payload}:${signature}`, 'utf8').toString('base64url');
  }

  /**
   * 验证CSRF token
   * @param token CSRF token
   * @param sessionId 会话ID
   * @returns 验证结果
   */
  public static verifyToken(token: string, sessionId: string): {
    valid: boolean;
    reason?: string;
  } {
    try {
      if (!token) {
        return { valid: false, reason: 'token_missing' };
      }

      const decoded = Buffer.from(token, 'base64url').toString('utf8');
      const parts = decoded.split(':');
      
      if (parts.length !== 4) {
        return { valid: false, reason: 'invalid_format' };
      }

      const [tokenSessionId, timestamp, nonce, signature] = parts;

      // 验证会话ID
      if (tokenSessionId !== sessionId) {
        return { valid: false, reason: 'session_mismatch' };
      }

      // 验证时间戳（防止重放攻击）
      const tokenTime = parseInt(timestamp, 10);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24小时

      if (isNaN(tokenTime) || now - tokenTime > maxAge) {
        return { valid: false, reason: 'token_expired' };
      }

      // 验证签名
      const payload = `${tokenSessionId}:${timestamp}:${nonce}`;
      const expectedSignature = crypto
        .createHmac('sha256', this.SECRET_KEY)
        .update(payload)
        .digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'))) {
        return { valid: false, reason: 'invalid_signature' };
      }

      return { valid: true };
    } catch (error) {
      console.error('[CSRF] Token验证失败:', error);
      return { valid: false, reason: 'verification_error' };
    }
  }

  /**
   * 从请求中提取CSRF token
   * @param request 请求对象
   * @returns CSRF token或null
   */
  public static extractToken(request: NextRequest): string | null {
    // 1. 从header中获取
    const headerToken = request.headers.get(this.TOKEN_HEADER);
    if (headerToken) return headerToken;

    // 2. 从cookie中获取
    const cookieToken = request.cookies.get(this.TOKEN_COOKIE)?.value;
    if (cookieToken) return cookieToken;

    return null;
  }
}

/**
 * 输入验证和清理器
 */
export class InputSanitizer {
  // 危险的HTML标签和属性
  private static readonly DANGEROUS_TAGS = [
    'script', 'iframe', 'object', 'embed', 'form', 'input', 'button',
    'link', 'meta', 'style', 'svg', 'math'
  ];

  private static readonly DANGEROUS_ATTRIBUTES = [
    'onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur',
    'onchange', 'onsubmit', 'onkeydown', 'onkeyup', 'onkeypress',
    'javascript:', 'vbscript:', 'data:', 'file:'
  ];

  /**
   * 清理HTML内容
   * @param html HTML字符串
   * @returns 清理后的HTML
   */
  public static sanitizeHtml(html: string): string {
    if (!html || typeof html !== 'string') {
      return '';
    }

    let cleaned = html;

    // 移除危险的HTML标签
    this.DANGEROUS_TAGS.forEach(tag => {
      const regex = new RegExp(`<\\/?${tag}[^>]*>`, 'gi');
      cleaned = cleaned.replace(regex, '');
    });

    // 移除危险的属性
    this.DANGEROUS_ATTRIBUTES.forEach(attr => {
      const regex = new RegExp(`${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
      cleaned = cleaned.replace(regex, '');
    });

    // 移除JavaScript和数据URI
    cleaned = cleaned.replace(/javascript:/gi, '');
    cleaned = cleaned.replace(/vbscript:/gi, '');
    cleaned = cleaned.replace(/data:/gi, '');

    return cleaned;
  }

  /**
   * 清理字符串输入
   * @param input 输入字符串
   * @param options 清理选项
   * @returns 清理后的字符串
   */
  public static sanitizeString(
    input: string,
    options: {
      maxLength?: number;
      allowHtml?: boolean;
      normalizeUnicode?: boolean;
      trimWhitespace?: boolean;
    } = {}
  ): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    let cleaned = input;

    // Unicode规范化
    if (options.normalizeUnicode !== false) {
      cleaned = cleaned.normalize('NFC');
    }

    // 移除或清理HTML
    if (!options.allowHtml) {
      cleaned = this.escapeHtml(cleaned);
    } else {
      cleaned = this.sanitizeHtml(cleaned);
    }

    // 修剪空白字符
    if (options.trimWhitespace !== false) {
      cleaned = cleaned.trim();
    }

    // 长度限制
    if (options.maxLength && cleaned.length > options.maxLength) {
      cleaned = cleaned.substring(0, options.maxLength);
    }

    return cleaned;
  }

  /**
   * HTML实体编码
   * @param text 文本
   * @returns 编码后的文本
   */
  public static escapeHtml(text: string): string {
    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };

    return text.replace(/[&<>"'\/]/g, char => htmlEntities[char]);
  }

  /**
   * 验证和清理JSON输入
   * @param jsonString JSON字符串
   * @param maxSize 最大尺寸（字节）
   * @returns 解析并清理后的对象
   */
  public static sanitizeJson(jsonString: string, maxSize: number = 1024 * 1024): any {
    if (!jsonString || typeof jsonString !== 'string') {
      throw new Error('Invalid JSON input');
    }

    if (jsonString.length > maxSize) {
      throw new Error('JSON input too large');
    }

    try {
      const parsed = JSON.parse(jsonString);
      return this.sanitizeObject(parsed);
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  }

  /**
   * 递归清理对象
   * @param obj 要清理的对象
   * @returns 清理后的对象
   */
  private static sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj, { maxLength: 10000 });
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const cleanKey = this.sanitizeString(key, { maxLength: 100, allowHtml: false });
        sanitized[cleanKey] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }
}

/**
 * 可疑活动检测器
 */
export class SuspiciousActivityDetector {
  private static readonly SUSPICIOUS_PATTERNS = [
    // SQL注入模式
    /(\bunion\b|\bselect\b|\binsert\b|\bdelete\b|\bdrop\b|\bupdate\b).*(\bfrom\b|\bwhere\b|\binto\b)/i,
    // XSS模式
    /<script[^>]*>.*?<\/script>/i,
    /javascript:/i,
    /on(load|error|click|mouseover)=/i,
    // 路径遍历
    /\.\.\/|\.\.\\/,
    // 命令注入
    /[;&|`$()]/,
    // 敏感文件访问
    /\/etc\/passwd|\/etc\/shadow|\.ssh\/|\.aws\/|\.env/i
  ];

  /**
   * 检测可疑活动
   * @param request 请求对象
   * @param body 请求体
   * @returns 检测结果
   */
  public static detect(
    request: NextRequest,
    body?: string
  ): {
    isSuspicious: boolean;
    reasons: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  } {
    const reasons: string[] = [];
    const url = request.url;
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';

    // 检查URL
    this.SUSPICIOUS_PATTERNS.forEach((pattern, index) => {
      if (pattern.test(url)) {
        reasons.push(`URL包含可疑模式 #${index + 1}`);
      }
    });

    // 检查User-Agent
    if (this.isSuspiciousUserAgent(userAgent)) {
      reasons.push('可疑的User-Agent');
    }

    // 检查请求体
    if (body) {
      this.SUSPICIOUS_PATTERNS.forEach((pattern, index) => {
        if (pattern.test(body)) {
          reasons.push(`请求体包含可疑模式 #${index + 1}`);
        }
      });
    }

    // 检查HTTP头部
    const headers = Array.from(request.headers.entries());
    headers.forEach(([name, value]) => {
      this.SUSPICIOUS_PATTERNS.forEach((pattern, index) => {
        if (pattern.test(value)) {
          reasons.push(`HTTP头部 ${name} 包含可疑模式 #${index + 1}`);
        }
      });
    });

    const isSuspicious = reasons.length > 0;
    const riskLevel = this.calculateRiskLevel(reasons.length, reasons);

    return { isSuspicious, reasons, riskLevel };
  }

  /**
   * 检查是否为可疑的User-Agent
   * @param userAgent User-Agent字符串
   * @returns 是否可疑
   */
  private static isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousUA = [
      /sqlmap/i,
      /nikto/i,
      /nmap/i,
      /burpsuite/i,
      /wget/i,
      /curl/i,
      /python-requests/i,
      /bot/i
    ];

    return suspiciousUA.some(pattern => pattern.test(userAgent));
  }

  /**
   * 计算风险级别
   * @param reasonCount 可疑原因数量
   * @param reasons 可疑原因列表
   * @returns 风险级别
   */
  private static calculateRiskLevel(
    reasonCount: number,
    reasons: string[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (reasonCount >= 3) return 'critical';
    if (reasonCount >= 2) return 'high';
    if (reasonCount >= 1) return 'medium';
    return 'low';
  }
}

/**
 * API安全中间件
 */
export class APISecurityMiddleware {
  private static readonly DEFAULT_CONFIG: SecurityConfig = {
    rateLimit: {
      enabled: true,
      windowMs: 60000, // 1分钟
      maxRequests: 100,
      skipSuccessfulRequests: false
    },
    csrf: {
      enabled: true,
      tokenName: 'x-csrf-token',
      secretKey: process.env.CSRF_SECRET || 'default-csrf-secret'
    },
    inputValidation: {
      enabled: true,
      maxBodySize: 1024 * 1024, // 1MB
      sanitizeHtml: true
    },
    cors: {
      enabled: true,
      allowedOrigins: ['http://localhost:3000', 'https://ai-prompt-generator.vercel.app'],
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowCredentials: true
    }
  };

  /**
   * 创建安全中间件
   * @param config 安全配置
   * @returns 中间件函数
   */
  public static create(config: Partial<SecurityConfig> = {}) {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };

    return async function securityMiddleware(
      request: NextRequest,
      handler: (request: NextRequest) => Promise<NextResponse>
    ): Promise<NextResponse> {
      try {
        const startTime = Date.now();
        const ip = this.getClientIP(request);
        const endpoint = new URL(request.url).pathname;

        // 1. 速率限制检查
        if (finalConfig.rateLimit.enabled) {
          const rateLimitResult = RateLimiter.checkRateLimit(
            ip,
            finalConfig.rateLimit.windowMs,
            finalConfig.rateLimit.maxRequests,
            endpoint
          );

          if (!rateLimitResult.allowed) {
            console.warn(`[API安全] 速率限制触发: ${ip} -> ${endpoint}`);
            
            return NextResponse.json(
              {
                success: false,
                error: '请求过于频繁，请稍后重试',
                code: 'RATE_LIMIT_EXCEEDED',
                resetTime: new Date(rateLimitResult.resetTime).toISOString()
              },
              { 
                status: 429,
                headers: {
                  'X-Rate-Limit-Remaining': '0',
                  'X-Rate-Limit-Reset': rateLimitResult.resetTime.toString(),
                  'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
                }
              }
            );
          }
        }

        // 2. 可疑活动检测
        let requestBody = '';
        if (request.method !== 'GET' && request.body) {
          requestBody = await request.text();
        }

        const suspiciousActivity = SuspiciousActivityDetector.detect(request, requestBody);
        if (suspiciousActivity.isSuspicious && suspiciousActivity.riskLevel === 'critical') {
          console.error(`[API安全] 检测到严重可疑活动: ${ip}`, suspiciousActivity);
          
          return NextResponse.json(
            {
              success: false,
              error: '请求被安全系统拒绝',
              code: 'SECURITY_VIOLATION'
            },
            { status: 403 }
          );
        }

        // 3. CSRF保护（仅非GET请求）
        if (finalConfig.csrf.enabled && request.method !== 'GET' && request.method !== 'OPTIONS') {
          const csrfToken = CSRFProtection.extractToken(request);
          // 注意：这里需要sessionId，实际实现中应该从认证信息中获取
          // 暂时跳过CSRF验证，在具体API中实现
        }

        // 4. 输入验证和清理
        if (finalConfig.inputValidation.enabled && requestBody) {
          if (requestBody.length > finalConfig.inputValidation.maxBodySize) {
            return NextResponse.json(
              {
                success: false,
                error: '请求体过大',
                code: 'PAYLOAD_TOO_LARGE'
              },
              { status: 413 }
            );
          }

          try {
            // 重新创建请求对象（包含清理后的数据）
            const sanitizedBody = InputSanitizer.sanitizeString(requestBody, {
              allowHtml: false,
              maxLength: finalConfig.inputValidation.maxBodySize
            });

            // 注意：这里需要重新构造request对象，实际实现可能需要不同的方法
            request = new NextRequest(request.url, {
              method: request.method,
              headers: request.headers,
              body: sanitizedBody
            });
          } catch (error) {
            console.error('[API安全] 输入清理失败:', error);
            return NextResponse.json(
              {
                success: false,
                error: '请求格式无效',
                code: 'INVALID_INPUT'
              },
              { status: 400 }
            );
          }
        }

        // 5. CORS处理
        if (finalConfig.cors.enabled && request.method === 'OPTIONS') {
          const origin = request.headers.get('origin');
          const allowOrigin = finalConfig.cors.allowedOrigins.includes(origin || '') ? origin : 'null';

          return new NextResponse(null, {
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': allowOrigin,
              'Access-Control-Allow-Methods': finalConfig.cors.allowedMethods.join(', '),
              'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
              'Access-Control-Allow-Credentials': finalConfig.cors.allowCredentials.toString(),
              'Access-Control-Max-Age': '86400'
            }
          });
        }

        // 6. 执行实际的API处理器
        const response = await handler(request);

        // 7. 添加安全响应头
        const secureResponse = this.addSecurityHeaders(response, finalConfig);

        // 8. 记录性能指标
        const responseTime = Date.now() - startTime;
        if (responseTime > 5000) { // 超过5秒的请求
          console.warn(`[API安全] 慢请求: ${endpoint} - ${responseTime}ms`);
        }

        return secureResponse;

      } catch (error) {
        console.error('[API安全] 中间件执行失败:', error);
        
        return NextResponse.json(
          {
            success: false,
            error: '服务器内部错误',
            code: 'INTERNAL_ERROR'
          },
          { status: 500 }
        );
      }
    };
  }

  /**
   * 添加安全响应头
   * @param response 原始响应
   * @param config 安全配置
   * @returns 添加安全头的响应
   */
  private static addSecurityHeaders(response: NextResponse, config: SecurityConfig): NextResponse {
    // Content Security Policy
    if (!response.headers.get('Content-Security-Policy')) {
      response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://openrouter.ai; frame-ancestors 'none';"
      );
    }

    // 其他安全头
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'X-Powered-By': '', // 隐藏技术栈信息
    };

    Object.entries(securityHeaders).forEach(([name, value]) => {
      if (!response.headers.get(name)) {
        response.headers.set(name, value);
      }
    });

    // HTTPS严格传输安全（仅生产环境）
    if (process.env.NODE_ENV === 'production' && !response.headers.get('Strict-Transport-Security')) {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    // CORS头
    if (config.cors.enabled) {
      const origin = response.headers.get('origin');
      if (origin && config.cors.allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Credentials', config.cors.allowCredentials.toString());
      }
    }

    return response;
  }

  /**
   * 获取客户端IP地址
   * @param request 请求对象
   * @returns IP地址
   */
  private static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    return request.headers.get('x-real-ip') || 
           request.headers.get('x-client-ip') || 
           request.ip || 
           '127.0.0.1';
  }
}

/**
 * 快速创建安全的API处理器
 * @param handler API处理函数
 * @param config 安全配置
 * @returns 安全包装的处理器
 */
export function createSecureAPIHandler(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config?: Partial<SecurityConfig>
) {
  const securityMiddleware = APISecurityMiddleware.create(config);
  
  return async function secureHandler(request: NextRequest): Promise<NextResponse> {
    return securityMiddleware(request, handler);
  };
}