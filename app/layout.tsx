import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// 使用最新的Next.js 15字体优化
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

// Next.js 15: viewport和themeColor需要单独export
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL('https://aiprompts.ink'),
  title: {
    template: '%s | AI Prompt Builder Pro',
    default: 'AI Prompt Builder Pro - Professional AI Templates for Every Industry'
  },
  description: 'Professional AI prompts and ChatGPT templates for lawyers, teachers, accountants, realtors, insurance advisors. Save 70% time with expert-crafted prompts.',
  keywords: [
    'ai prompts', 'chatgpt templates', 'professional ai tools', 'lawyer ai', 'teacher ai', 
    'accountant ai', 'realtor ai', 'insurance ai', 'claude prompts', 'ai for professionals',
    'business ai templates', 'industry specific ai', 'ai productivity tools'
  ],
  authors: [{ name: 'AI Prompt Builder Pro Team' }],
  creator: 'AI Prompt Builder Pro',
  publisher: 'AI Prompt Builder Pro',
  
  // Open Graph meta tags
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://aiprompts.ink',
    siteName: 'AI Prompt Builder Pro',
    title: 'Professional AI Prompts & ChatGPT Templates for Every Industry',
    description: 'Save 70% time with professional AI prompts for lawyers, teachers, accountants, realtors, insurance advisors. Expert-crafted templates for ChatGPT, Claude & more.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'AI Prompt Builder Pro - Professional Templates',
      },
    ],
  },
  
  // Twitter Card meta tags
  twitter: {
    card: 'summary_large_image',
    title: 'Professional AI Prompts & ChatGPT Templates for Every Industry',
    description: 'Save 70% time with expert-crafted AI prompts for professionals. Trusted by 2,500+ users worldwide.',
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
    canonical: 'https://aiprompts.ink',
    languages: {
      'en-US': 'https://aiprompts.ink',
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-US" className={`${inter.variable}`} suppressHydrationWarning>
      <head>
        {/* 预加载关键资源 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS预解析 */}
        <link rel="dns-prefetch" href="//vercel.com" />
        
        {/* 安全策略现在通过middleware统一管理 */}
      </head>
      
      <body className={`${inter.className} min-h-screen bg-background antialiased selection:bg-primary/10`}>
        {/* 页面加载进度条 - 可以后续添加 */}
        <div id="progress-bar"></div>
        
        {/* 主要内容区域 */}
        <main className="relative flex min-h-screen flex-col">
          {children}
        </main>
        
        {/* 全局通知系统容器 - 可以后续添加 */}
        <div id="notifications-root"></div>
        
{/* 性能监控脚本暂时移除，避免CSP冲突 */}
      </body>
    </html>
  )
}