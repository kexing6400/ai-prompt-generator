import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ReactNode } from 'react'

// 支持的语言列表
export const locales = ['en', 'cn'] as const
export type Locale = typeof locales[number]

// 验证locale参数
function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}

// 生成静态参数
export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

// 元数据
export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const isZh = locale === 'cn'
  
  return {
    title: isZh 
      ? 'AI Prompt Builder Pro - 专业垂直行业AI提示词生成器' 
      : 'AI Prompt Builder Pro - Professional AI Prompt Generator',
    description: isZh
      ? '为律师、房产经纪人、保险顾问、教师、会计师等专业人士量身打造的智能AI提示词生成工具'
      : 'Professional AI prompt generator tailored for lawyers, realtors, insurance advisors, teachers, and accountants',
  }
}

interface LocaleLayoutProps {
  children: ReactNode
  params: { locale: string }
}

export default function LocaleLayout({
  children,
  params: { locale }
}: LocaleLayoutProps) {
  // 验证locale
  if (!isValidLocale(locale)) {
    notFound()
  }

  return (
    <>
      {children}
    </>
  )
}