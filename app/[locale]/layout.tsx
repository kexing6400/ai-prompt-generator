import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import '../globals.css'
import { OrganizationJsonLd, WebApplicationJsonLd, FAQJsonLd } from '../../components/seo/JsonLd'
import { LanguageSwitcher } from '../../components/ui/language-switcher'
import Link from 'next/link'
import { getDictionary, locales, type Locale } from '../../lib/i18n'
import { getAlternateUrls } from '../../lib/locale-utils'
import { notFound } from 'next/navigation'

// 使用最新的Next.js 15字体优化
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

// Next.js 15: viewport需要单独export
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

// 生成静态参数
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

// 生成动态元数据
export async function generateMetadata({
  params,
}: {
  params: { locale: Locale }
}): Promise<Metadata> {
  const dict = await getDictionary(params.locale)
  const baseUrl = 'https://aiprompts.ink'
  const isDefaultLocale = params.locale === 'cn'
  const currentUrl = isDefaultLocale ? baseUrl : `${baseUrl}/${params.locale}`
  
  // 获取备用语言URLs
  const alternateUrls = getAlternateUrls('/', params.locale, baseUrl)
  
  return {
    metadataBase: new URL(baseUrl),
    title: {
      template: `%s | ${dict.common.title}`,
      default: dict.common.title
    },
    description: dict.common.description,
    keywords: [
      'ai prompts', 'chatgpt templates', 'professional ai tools', 
      'lawyer ai', 'teacher ai', 'accountant ai', 'realtor ai', 'insurance ai',
      'claude prompts', 'ai for professionals', 'business ai templates',
      'industry specific ai', 'ai productivity tools'
    ],
    authors: [{ name: 'AI Prompt Builder Pro Team' }],
    creator: 'AI Prompt Builder Pro',
    publisher: 'AI Prompt Builder Pro',
    
    // Open Graph meta tags
    openGraph: {
      type: 'website',
      locale: params.locale === 'cn' ? 'zh_CN' : 'en_US',
      url: currentUrl,
      siteName: dict.common.title,
      title: dict.common.title,
      description: dict.common.description,
      images: [
        {
          url: '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: dict.common.title,
        },
      ],
    },
    
    // Twitter Card meta tags  
    twitter: {
      card: 'summary_large_image',
      title: dict.common.title,
      description: dict.common.description,
      images: ['/twitter-image.jpg'],
    },
    
    // 图标配置
    icons: {
      icon: [
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      ],
      apple: '/apple-touch-icon.png',
      shortcut: '/favicon.ico',
    },
    
    // manifest文件
    manifest: '/site.webmanifest',
    
    // 搜索引擎优化
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    
    // 其他meta标签
    category: 'technology',
    alternates: {
      canonical: currentUrl,
      languages: {
        'zh-CN': `${baseUrl}/cn`,
        'en-US': `${baseUrl}/en`,
        ...alternateUrls,
      },
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: Locale }
}) {
  // 验证locale是否有效
  if (!locales.includes(params.locale)) {
    notFound()
  }
  
  const dict = await getDictionary(params.locale)
  const langCode = params.locale === 'cn' ? 'zh-CN' : 'en-US'
  
  return (
    <html lang={langCode} className={`${inter.variable}`} suppressHydrationWarning>
      <head>
        {/* 预加载关键资源 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS预解析 */}
        <link rel="dns-prefetch" href="//vercel.com" />
        <link rel="dns-prefetch" href="//openrouter.ai" />
        
        {/* 预加载关键路径 */}
        <link rel="prefetch" href={`/${params.locale}/ai-prompts-for-lawyers`} />
        <link rel="prefetch" href={`/${params.locale}/ai-prompts-for-teachers`} />
        
        {/* 结构化数据 - 世界级SEO */}
        <OrganizationJsonLd />
        <WebApplicationJsonLd />
        <FAQJsonLd />
      </head>
      
      <body className={`${inter.className} min-h-screen bg-background antialiased selection:bg-primary/10`}>
        {/* 全局Header导航栏 - 所有页面共享 */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-14 items-center px-4 sm:px-6 lg:px-8">
            <div className="mr-4 flex flex-1">
              <Link href={`/${params.locale}`} className="mr-6 flex items-center space-x-2">
                <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI Prompt Pro
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher currentLocale={params.locale} />
            </div>
          </div>
        </header>
        
        {/* 页面加载进度条 - 可以后续添加 */}
        <div id="progress-bar"></div>
        
        {/* 主要内容区域 */}
        <main className="relative flex min-h-screen flex-col">
          {children}
        </main>
        
        {/* 全局通知系统容器 - 可以后续添加 */}
        <div id="notifications-root"></div>
      </body>
    </html>
  )
}