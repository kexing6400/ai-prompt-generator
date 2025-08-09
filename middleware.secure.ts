import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { locales, defaultLocale, type Locale } from './lib/i18n'
import { getBestMatchingLocale, hasLocalePrefix, addLocalePrefix } from './lib/locale-utils'

// 🔐 安全配置
const isDev = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// 专业路径重定向映射（支持多语言）
const professionRedirects = {
  'lawyer': 'ai-prompts-for-lawyers',
  'teacher': 'ai-prompts-for-teachers',
  'accountant': 'ai-prompts-for-accountants', 
  'realtor': 'ai-prompts-for-realtors',
  'insurance': 'ai-prompts-for-insurance-advisors'
} as const

// 🔐 生成随机nonce (企业级实现)
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// 🔐 构建CSP策略
function buildCSPPolicy(nonce: string): string {
  const baseDirectives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://vercel.live`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "connect-src 'self' https://openrouter.ai https://api.openrouter.ai https://vitals.vercel-insights.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' data: blob:",
    "object-src 'none'",
    "frame-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "upgrade-insecure-requests"
  ];

  // 开发环境允许本地连接
  if (isDev) {
    baseDirectives.push(
      "connect-src 'self' https://openrouter.ai https://api.openrouter.ai ws://localhost:* http://localhost:* https://vitals.vercel-insights.com",
      "img-src 'self' data: blob: https: http:"
    );
  }

  // 生产环境添加报告URI
  if (isProduction) {
    baseDirectives.push("report-uri /api/security/csp-report");
  }

  return baseDirectives.join('; ');
}

// 🔐 设置安全头部
function setSecurityHeaders(response: NextResponse, nonce: string): NextResponse {
  const cspPolicy = buildCSPPolicy(nonce);
  
  // Content Security Policy
  response.headers.set('Content-Security-Policy', cspPolicy);
  
  // 🔐 OWASP推荐的安全头部
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // 🔐 HSTS (仅HTTPS环境)
  if (isProduction) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // 🔐 隐藏服务器信息
  response.headers.set('Server', '');
  response.headers.delete('x-powered-by');
  
  // 🔐 传递nonce给应用
  response.headers.set('x-csp-nonce', nonce);
  
  return response;
}

// 🔐 检测可疑请求
function detectSuspiciousRequest(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || '';
  const referer = request.headers.get('referer') || '';
  
  // 检测常见攻击模式
  const suspiciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /burpsuite/i,
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i
  ];
  
  const requestUrl = request.url;
  
  return suspiciousPatterns.some(pattern => 
    pattern.test(userAgent) || 
    pattern.test(referer) || 
    pattern.test(requestUrl)
  );
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // 🔐 安全检查：检测可疑请求
  if (detectSuspiciousRequest(request)) {
    console.warn('🚨 检测到可疑请求:', {
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      ip: request.ip || request.headers.get('x-forwarded-for'),
      timestamp: new Date().toISOString()
    });
    
    // 可选择阻止可疑请求
    // return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // 生成安全nonce
  const nonce = generateNonce();
  
  // 1. 处理根路径重定向到默认语言
  if (pathname === '/') {
    const bestLocale = getBestMatchingLocale(request)
    const response = NextResponse.redirect(new URL(`/${bestLocale}`, request.url))
    // 设置语言Cookie
    response.cookies.set('locale', bestLocale, {
      maxAge: 365 * 24 * 60 * 60, // 1年
      path: '/',
      secure: isProduction, // 🔐 生产环境使用secure cookie
      httpOnly: false, // 需要JS访问
      sameSite: 'lax' // 🔐 CSRF防护
    })
    return setSecurityHeaders(response, nonce);
  }
  
  // 2. 处理专业路径重定向
  const pathSegments = pathname.split('/').filter(Boolean)
  const firstSegment = pathSegments[0]
  
  if (firstSegment in professionRedirects) {
    const bestLocale = getBestMatchingLocale(request)
    const profession = professionRedirects[firstSegment as keyof typeof professionRedirects]
    const newUrl = `/${bestLocale}/${profession}`
    const response = NextResponse.redirect(new URL(newUrl, request.url), 301)
    response.cookies.set('locale', bestLocale, {
      maxAge: 365 * 24 * 60 * 60,
      path: '/',
      secure: isProduction,
      httpOnly: false,
      sameSite: 'lax'
    })
    return setSecurityHeaders(response, nonce);
  }
  
  // 3. 处理没有语言前缀的路径
  if (!hasLocalePrefix(pathname) && pathname !== '/' && !pathname.startsWith('/api/') && !pathname.startsWith('/_next/')) {
    const bestLocale = getBestMatchingLocale(request)
    const newUrl = addLocalePrefix(pathname, bestLocale)
    const response = NextResponse.redirect(new URL(newUrl, request.url))
    response.cookies.set('locale', bestLocale, {
      maxAge: 365 * 24 * 60 * 60,
      path: '/',
      secure: isProduction,
      httpOnly: false,
      sameSite: 'lax'
    })
    return setSecurityHeaders(response, nonce);
  }
  
  // 4. 正常处理请求
  let response = NextResponse.next()
  
  // 如果路径包含有效的语言前缀，更新Cookie
  if (hasLocalePrefix(pathname)) {
    const locale = pathname.split('/')[1] as Locale
    response.cookies.set('locale', locale, {
      maxAge: 365 * 24 * 60 * 60,
      path: '/',
      secure: isProduction,
      httpOnly: false,
      sameSite: 'lax'
    })
  }
  
  // 🔐 对所有非API请求应用安全头部
  if (!pathname.startsWith('/api/') && !pathname.startsWith('/_next/')) {
    response = setSecurityHeaders(response, nonce);
  }
  
  return response
}

export const config = {
  matcher: [
    // 🔐 优化的匹配器，确保安全覆盖
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ]
}