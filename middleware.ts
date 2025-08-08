import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// URL重定向映射
const redirects = {
  '/lawyer': '/ai-prompts-for-lawyers',
  '/teacher': '/ai-prompts-for-teachers',
  '/accountant': '/ai-prompts-for-accountants', 
  '/realtor': '/ai-prompts-for-realtors',
  '/insurance': '/ai-prompts-for-insurance-advisors'
} as const

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // 创建响应
  let response: NextResponse
  
  // 检查是否需要重定向
  if (pathname in redirects) {
    const newUrl = redirects[pathname as keyof typeof redirects]
    response = NextResponse.redirect(new URL(newUrl, request.url), 301)
  } else {
    response = NextResponse.next()
  }
  
  // 只对HTML页面应用CSP，不对API路由
  if (!pathname.startsWith('/api/') && !pathname.startsWith('/_next/')) {
    const isDev = process.env.NODE_ENV === 'development'
    
    // 生产级CSP策略
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://vercel.live",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      `img-src 'self' data: blob: https: ${isDev ? 'http:' : ''}`,
      `connect-src 'self' https://openrouter.ai https://api.openrouter.ai ${isDev ? 'ws://localhost:* http://localhost:*' : ''} https://vitals.vercel-insights.com`,
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
    // 重定向路由
    '/lawyer',
    '/teacher',
    '/accountant',
    '/realtor', 
    '/insurance',
    // 应用安全头部到页面 (排除API和静态资源)
    '/((?!api|_next/static|_next/image|favicon.ico|icons/).*)'
  ]
}