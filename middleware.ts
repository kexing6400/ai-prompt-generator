import { NextRequest, NextResponse } from 'next/server'

// 支持的语言
const locales = ['en', 'cn']
const defaultLocale = 'cn' // 默认中文

// 获取用户首选语言
function getLocale(request: NextRequest): string {
  // 1. 检查cookie中的语言偏好
  const cookieLocale = request.cookies.get('locale')?.value
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale
  }

  // 2. 检查Accept-Language header
  const acceptLanguage = request.headers.get('Accept-Language') || ''
  const detectedLocale = acceptLanguage.toLowerCase().includes('zh') ? 'cn' : 'en'
  
  return detectedLocale
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // 忽略以下路径
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  )

  // 跳过API路由、静态文件等
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('/favicon') ||
    pathname.includes('.') // 静态文件
  ) {
    return NextResponse.next()
  }

  // 如果路径缺少locale，重定向到带locale的路径
  if (pathnameIsMissingLocale) {
    const locale = getLocale(request)
    const newUrl = new URL(`/${locale}${pathname}`, request.url)
    
    // 保留查询参数
    newUrl.search = request.nextUrl.search
    
    const response = NextResponse.redirect(newUrl)
    // 设置cookie保存用户选择
    response.cookies.set('locale', locale, {
      maxAge: 60 * 60 * 24 * 365, // 1年
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    })
    
    return response
  }

  // 验证locale是否有效
  const pathnameLocale = pathname.split('/')[1]
  if (!locales.includes(pathnameLocale)) {
    const newUrl = new URL(`/${defaultLocale}${pathname}`, request.url)
    return NextResponse.redirect(newUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // 匹配所有路径除了api和静态文件
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}