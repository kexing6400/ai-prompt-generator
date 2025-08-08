import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { locales, defaultLocale, type Locale } from './lib/i18n'
import { getBestMatchingLocale, hasLocalePrefix, addLocalePrefix } from './lib/locale-utils'

// 专业路径重定向映射（支持多语言）
const professionRedirects = {
  'lawyer': 'ai-prompts-for-lawyers',
  'teacher': 'ai-prompts-for-teachers',
  'accountant': 'ai-prompts-for-accountants', 
  'realtor': 'ai-prompts-for-realtors',
  'insurance': 'ai-prompts-for-insurance-advisors'
} as const

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // 1. 处理根路径重定向到默认语言
  if (pathname === '/') {
    const bestLocale = getBestMatchingLocale(request)
    const response = NextResponse.redirect(new URL(`/${bestLocale}`, request.url))
    // 设置语言Cookie
    response.cookies.set('locale', bestLocale, {
      maxAge: 365 * 24 * 60 * 60, // 1年
      path: '/'
    })
    return response
  }
  
  // 2. 处理专业路径重定向（/lawyer -> /cn/ai-prompts-for-lawyers）
  const pathSegments = pathname.split('/').filter(Boolean)
  const firstSegment = pathSegments[0]
  
  // 检查是否是专业简写路径
  if (firstSegment in professionRedirects) {
    const bestLocale = getBestMatchingLocale(request)
    const profession = professionRedirects[firstSegment as keyof typeof professionRedirects]
    const newUrl = `/${bestLocale}/${profession}`
    const response = NextResponse.redirect(new URL(newUrl, request.url), 301)
    response.cookies.set('locale', bestLocale, {
      maxAge: 365 * 24 * 60 * 60,
      path: '/'
    })
    return response
  }
  
  // 3. 处理没有语言前缀的路径（如 /some-page -> /cn/some-page）
  if (!hasLocalePrefix(pathname) && pathname !== '/' && !pathname.startsWith('/api/') && !pathname.startsWith('/_next/')) {
    const bestLocale = getBestMatchingLocale(request)
    const newUrl = addLocalePrefix(pathname, bestLocale)
    const response = NextResponse.redirect(new URL(newUrl, request.url))
    response.cookies.set('locale', bestLocale, {
      maxAge: 365 * 24 * 60 * 60,
      path: '/'
    })
    return response
  }
  
  // 4. 正常处理请求
  let response = NextResponse.next()
  
  // 如果路径包含有效的语言前缀，更新Cookie
  if (hasLocalePrefix(pathname)) {
    const locale = pathname.split('/')[1] as Locale
    response.cookies.set('locale', locale, {
      maxAge: 365 * 24 * 60 * 60,
      path: '/'
    })
  }
  
  // 只对HTML页面应用CSP，不对API路由
  if (!pathname.startsWith('/api/') && !pathname.startsWith('/_next/')) {
    // 生产级CSP策略（移除了对process.env的依赖）
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://vercel.live",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https: http:",
      "connect-src 'self' https://openrouter.ai https://api.openrouter.ai ws://localhost:* http://localhost:* https://vitals.vercel-insights.com",
      "media-src 'self' data: blob:",
      "object-src 'none'",
      "frame-src 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "report-uri /api/security/csp-report"
    ].join('; ')
    
    // 应用安全头部
    response.headers.set('Content-Security-Policy', cspDirectives)
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  }
  
  return response
}

export const config = {
matcher: [
// 匹配所有路径，排除API、静态资源、图标等
'/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|icons/|apple-touch-icon.png|android-chrome-.*\.png).*)',
]
}