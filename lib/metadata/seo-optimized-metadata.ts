import { Metadata } from 'next'

// SEO优化的行业页面metadata配置 - 针对英文搜索意图
// 注意：metadataBase在根layout.tsx中设置，这里使用相对路径
export const seoOptimizedMetadata = {
  'ai-prompts-for-lawyers': {
    title: 'Best AI Prompts for Lawyers | ChatGPT Legal Templates',
    description: 'Save 70% of your time with professional AI prompts for lawyers. Contract review, case analysis, legal research templates for ChatGPT, Claude & more. Used by 2,300+ attorneys.',
    keywords: [
      'ai prompts for lawyers', 'chatgpt for lawyers', 'legal ai templates', 'lawyer ai tools',
      'contract review ai', 'legal research ai', 'claude for lawyers', 'legal document ai',
      'lawyer chatgpt prompts', 'ai legal assistant', 'legal writing ai', 'law firm ai'
    ],
    openGraph: {
      title: 'Best AI Prompts for Lawyers | Save 4 Hours Weekly',
      description: 'Professional AI prompts for contract review, legal research, and document drafting. Trusted by 2,300+ attorneys worldwide.',
      url: '/ai-prompts-for-lawyers', // 相对路径，会自动结合metadataBase
      images: ['/og-lawyers.jpg'],
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'AI Prompts for Lawyers: Save 70% Time with Legal Templates',
      description: 'Professional ChatGPT & Claude prompts for contract review, legal research, document drafting. Used by 2,300+ attorneys.',
      images: ['/twitter-lawyers.jpg'],
    },
    alternates: {
      canonical: '/ai-prompts-for-lawyers',
    },
  } as Metadata,

  'ai-prompts-for-teachers': {
    title: 'AI Prompts for Teachers | Educational ChatGPT Guide',
    description: 'Transform your teaching with AI prompts for lesson planning, student assessment, curriculum design. Save 4 hours weekly. Perfect for K-12 and higher education.',
    keywords: [
      'ai prompts for teachers', 'chatgpt for teachers', 'education ai templates', 'teacher ai tools',
      'lesson planning ai', 'student assessment ai', 'educational ai prompts', 'teaching with ai',
      'curriculum design ai', 'classroom ai assistant', 'teacher chatgpt prompts', 'education ai'
    ],
    openGraph: {
      title: 'AI Prompts for Teachers | Educational Templates & Guide',
      description: 'Professional AI prompts for lesson planning, assessments, and curriculum design. Transform your teaching efficiency.',
      url: '/ai-prompts-for-teachers',
      images: ['/og-teachers.jpg'],
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'AI Prompts for Teachers: Educational ChatGPT Templates',
      description: 'Transform teaching with AI prompts for lesson planning, assessments, and curriculum design. Save 4+ hours weekly.',
      images: ['/twitter-teachers.jpg'],
    },
    alternates: {
      canonical: '/ai-prompts-for-teachers',
    },
  } as Metadata,

  'ai-prompts-for-accountants': {
    title: 'Professional AI Prompts for Accountants | Finance Templates',
    description: 'Streamline accounting with AI prompts for financial analysis, tax planning, audit support. Save 5+ hours weekly. Perfect for CPAs and finance professionals.',
    keywords: [
      'ai prompts for accountants', 'chatgpt for accountants', 'accounting ai templates', 'cpa ai tools',
      'financial analysis ai', 'tax planning ai', 'audit ai prompts', 'bookkeeping ai',
      'accounting chatgpt prompts', 'finance ai assistant', 'tax preparation ai', 'audit ai'
    ],
    openGraph: {
      title: 'AI Prompts for Accountants | Professional Finance Templates',
      description: 'Expert AI prompts for financial analysis, tax planning, and audit support. Trusted by CPAs and finance professionals.',
      url: '/ai-prompts-for-accountants',
      images: ['/og-accountants.jpg'],
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'AI Prompts for Accountants: Finance & Tax Templates',
      description: 'Professional ChatGPT prompts for financial analysis, tax planning, and audit support. Save 5+ hours weekly.',
      images: ['/twitter-accountants.jpg'],
    },
    alternates: {
      canonical: '/ai-prompts-for-accountants',
    },
  } as Metadata,

  'ai-prompts-for-realtors': {
    title: 'Real Estate AI Prompts | ChatGPT for Realtors',
    description: 'Boost real estate success with AI prompts for market analysis, client communication, property descriptions. Save 6+ hours weekly. Perfect for agents & brokers.',
    keywords: [
      'ai prompts for realtors', 'chatgpt for real estate', 'realtor ai templates', 'real estate ai tools',
      'property description ai', 'market analysis ai', 'real estate chatgpt prompts', 'realtor ai assistant',
      'real estate marketing ai', 'property listing ai', 'real estate ai', 'realtor chatgpt'
    ],
    openGraph: {
      title: 'Real Estate AI Prompts | ChatGPT Templates for Realtors',
      description: 'Professional AI prompts for market analysis, property descriptions, and client communication. Boost your real estate success.',
      url: '/ai-prompts-for-realtors',
      images: ['/og-realtors.jpg'],
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Real Estate AI Prompts: ChatGPT Templates for Realtors',
      description: 'Professional prompts for market analysis, property descriptions, client communication. Save 6+ hours weekly.',
      images: ['/twitter-realtors.jpg'],
    },
    alternates: {
      canonical: '/ai-prompts-for-realtors',
    },
  } as Metadata,

  'ai-prompts-for-insurance-advisors': {
    title: 'Insurance AI Prompts | ChatGPT for Advisors',
    description: 'Excel in insurance with AI prompts for risk assessment, policy recommendations, client education. Save 4+ hours weekly. Perfect for insurance professionals.',
    keywords: [
      'ai prompts for insurance', 'chatgpt for insurance', 'insurance ai templates', 'insurance advisor ai',
      'risk assessment ai', 'insurance chatgpt prompts', 'policy recommendation ai', 'insurance ai tools',
      'insurance sales ai', 'insurance marketing ai', 'insurance agent ai', 'insurance ai assistant'
    ],
    openGraph: {
      title: 'Insurance AI Prompts | Professional Templates for Advisors',
      description: 'Expert AI prompts for risk assessment, policy recommendations, and client education. Transform your insurance practice.',
      url: '/ai-prompts-for-insurance-advisors',
      images: ['/og-insurance.jpg'],
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Insurance AI Prompts: ChatGPT Templates for Advisors',
      description: 'Professional prompts for risk assessment, policy recommendations, client education. Save 4+ hours weekly.',
      images: ['/twitter-insurance.jpg'],
    },
    alternates: {
      canonical: '/ai-prompts-for-insurance-advisors',
    },
  } as Metadata
}

// 获取特定行业的SEO优化metadata
export function getSeoOptimizedMetadata(industry: keyof typeof seoOptimizedMetadata): Metadata {
  return seoOptimizedMetadata[industry]
}

// URL映射：从旧URL到新URL
export const urlMappings = {
  '/lawyer': '/ai-prompts-for-lawyers',
  '/teacher': '/ai-prompts-for-teachers', 
  '/accountant': '/ai-prompts-for-accountants',
  '/realtor': '/ai-prompts-for-realtors',
  '/insurance': '/ai-prompts-for-insurance-advisors'
} as const

// 反向映射：从新URL到行业标识符
export const industryFromUrl = {
  'ai-prompts-for-lawyers': 'lawyer',
  'ai-prompts-for-teachers': 'teacher',
  'ai-prompts-for-accountants': 'accountant', 
  'ai-prompts-for-realtors': 'realtor',
  'ai-prompts-for-insurance-advisors': 'insurance'
} as const