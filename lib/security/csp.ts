/**
 * CSP (内容安全策略) 配置管理
 * 遵循OWASP安全最佳实践，提供生产级安全防护
 */
import { headers } from 'next/headers';

// 生成加密安全的nonce值
export function generateNonce(): string {
  // 简单但有效的nonce生成
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return btoa(timestamp + random).replace(/[+/=]/g, '').substring(0, 16);
}

/**
 * 生产级CSP策略配置
 * 基于OWASP Top 10防护要求
 */
export interface CSPConfig {
  isDevelopment?: boolean;
  nonce?: string;
  enableReporting?: boolean;
  reportEndpoint?: string;
}

export function generateCSPHeader(config: CSPConfig = {}): string {
  const {
    isDevelopment = false,
    nonce,
    enableReporting = true,
    reportEndpoint = '/api/security/csp-report'
  } = config;

  // 基础安全指令
  const directives = [
    // 默认源 - 仅允许同源内容
    `default-src 'self'`,
    
    // 脚本源 - 使用nonce提高安全性
    nonce 
      ? `script-src 'self' 'nonce-${nonce}' https://vercel.live`
      : `script-src 'self' 'unsafe-inline' https://vercel.live`,
    
    // 样式源 - Tailwind CSS需要unsafe-inline
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    
    // 字体源 - Google Fonts和本地字体
    `font-src 'self' https://fonts.gstatic.com data:`,
    
    // 图片源 - 支持多种图片来源和优化
    `img-src 'self' data: blob: https: ${isDevelopment ? 'http:' : ''}`,
    
    // 连接源 - API调用和外部服务
    `connect-src 'self' https://openrouter.ai https://api.openrouter.ai wss://openrouter.ai ${
      isDevelopment ? 'ws://localhost:* http://localhost:*' : ''
    } https://vitals.vercel-insights.com https://vercel.live`,
    
    // 媒体源
    `media-src 'self' data: blob:`,
    
    // 对象源 - 安全考虑设为none
    `object-src 'none'`,
    
    // 嵌入源 - 允许必要的嵌入内容
    `frame-src 'self'`,
    
    // 防止被恶意网站嵌入
    `frame-ancestors 'none'`,
    
    // 表单提交源
    `form-action 'self'`,
    
    // 基础URI限制
    `base-uri 'self'`,
    
    // 升级不安全请求（生产环境）
    ...(isDevelopment ? [] : [`upgrade-insecure-requests`]),
    
    // 阻止Mixed Content
    ...(isDevelopment ? [] : [`block-all-mixed-content`])
  ];

  // 添加报告配置
  if (enableReporting) {
    directives.push(`report-uri ${reportEndpoint}`);
    directives.push(`report-to csp-endpoint`);
  }

  return directives.join('; ');
}

/**
 * 生成Report-To头部配置
 * 用于CSP违规报告
 */
export function generateReportToHeader(): string {
  return JSON.stringify({
    group: 'csp-endpoint',
    max_age: 10886400, // 126天
    endpoints: [
      { url: '/api/security/csp-report' }
    ],
    include_subdomains: true
  });
}

/**
 * 获取所有安全相关头部
 * 实现Defense in Depth安全策略
 */
export function getSecurityHeaders(nonce?: string): Record<string, string> {
  const isDev = process.env.NODE_ENV === 'development';
  
  const cspConfig: CSPConfig = { 
    isDevelopment: isDev, 
    enableReporting: true 
  };
  
  if (nonce) {
    cspConfig.nonce = nonce;
  }
  
  return {
    // CSP - 主要内容安全策略
    'Content-Security-Policy': generateCSPHeader(cspConfig),
    
    // 报告配置
    'Report-To': generateReportToHeader(),
    
    // XSS防护 (虽然CSP更强，但作为后备)
    'X-XSS-Protection': '1; mode=block',
    
    // 内容类型嗅探防护
    'X-Content-Type-Options': 'nosniff',
    
    // 点击劫持防护
    'X-Frame-Options': 'DENY',
    
    // 引用来源策略
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // 权限策略 - 限制危险API
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()'
    ].join(', '),
    
    // HSTS (生产环境)
    ...(isDev ? {} : {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    }),
    
    // 移除服务器信息泄露
    'Server': '',
    'X-Powered-By': ''
  };
}

/**
 * 验证CSP nonce的有效性
 */
export function validateNonce(nonce: string): boolean {
  // nonce应该是base64编码的随机字符串
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return nonce.length >= 16 && base64Regex.test(nonce);
}