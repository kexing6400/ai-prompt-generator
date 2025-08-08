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
  
  // 检查是否需要重定向
  if (pathname in redirects) {
    const newUrl = redirects[pathname as keyof typeof redirects]
    return NextResponse.redirect(new URL(newUrl, request.url), 301)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/lawyer',
    '/teacher',
    '/accountant',
    '/realtor', 
    '/insurance'
  ]
}