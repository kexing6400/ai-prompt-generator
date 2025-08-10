import Link from 'next/link'
import { 
  Scale, 
  Home, 
  Shield, 
  GraduationCap, 
  Calculator,
  ArrowRight,
  CheckCircle,
  Zap
} from 'lucide-react'

import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { IndustryType } from "../../types"
import { getTranslations } from "../../lib/hooks/use-translations"
import { Locale } from "../../lib/i18n"

// 路径映射
const industryPaths: Record<string, string> = {
  lawyer: 'ai-prompts-for-lawyers',
  realtor: 'ai-prompts-for-realtors',
  insurance: 'ai-prompts-for-insurance-advisors',
  teacher: 'ai-prompts-for-teachers',
  accountant: 'ai-prompts-for-accountants'
}

// 行业基础配置（图标和样式）
const industryBaseConfig: Record<IndustryType, {
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  stats: { users: string; templates: string }
}> = {
  lawyer: {
    icon: Scale,
    gradient: 'gradient-lawyer',
    stats: { users: '2,300+', templates: '150+' }
  },
  realtor: {
    icon: Home,
    gradient: 'gradient-realtor',
    stats: { users: '1,800+', templates: '120+' }
  },
  insurance: {
    icon: Shield,
    gradient: 'gradient-insurance',
    stats: { users: '1,500+', templates: '100+' }
  },
  teacher: {
    icon: GraduationCap,
    gradient: 'gradient-teacher',
    stats: { users: '3,200+', templates: '200+' }
  },
  accountant: {
    icon: Calculator,
    gradient: 'gradient-accountant',
    stats: { users: '1,900+', templates: '130+' }
  }
}

interface HomePageProps {
  params: { locale: string }
}

export default async function HomePage({ params: { locale } }: HomePageProps) {
  // 获取翻译
  const { t, dictionary } = await getTranslations(locale as Locale)
  
  // 构建行业数据（结合翻译和基础配置）
  const industries = Object.keys(industryBaseConfig).map(industryKey => {
    const id = industryKey as IndustryType
    const baseConfig = industryBaseConfig[id]
    const industryData = dictionary.industries[id]
    
    return {
      id,
      name: industryData.name,
      displayName: industryData.displayName,
      description: industryData.description,
      features: industryData.features,
      enterText: industryData.enter,
      ...baseConfig
    }
  })

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section - 英雄区域 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 pointer-events-none" />

        <div className="container mx-auto px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="text-center">
            {/* 100%免费标识 */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 text-sm font-medium mb-6">
              <CheckCircle className="mr-2 h-4 w-4" />
              {t('common.freeNotice')}
            </div>
            
            {/* 主标题 */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t('common.title')}
              </span>
            </h1>
            
            {/* 副标题 */}
            <p className="mx-auto mt-4 max-w-2xl text-xl text-gray-600 dark:text-gray-300 mb-2">
              {t('common.subtitle')}
            </p>
            
            {/* 简要说明 */}
            <p className="mx-auto max-w-3xl text-lg text-gray-500 dark:text-gray-400 mb-8">
              {t('common.description')}
            </p>
            
            {/* 主要CTA - 只有一个真实功能 */}
            <div className="mb-12">
              <Button 
                size="xl" 
                className="text-lg px-8 py-4 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 border-0"
                asChild
              >
                <a href="#industry-selection">
                  <Zap className="mr-2 h-5 w-5" />
                  {t('common.selectIndustry')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>

            {/* 简化的使用流程 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-sm text-gray-600 dark:text-gray-400">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-semibold mb-2">1</div>
                <span>{t('common.howItWorks.step1')}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-semibold mb-2">2</div>
                <span>{t('common.howItWorks.step2')}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-semibold mb-2">3</div>
                <span>{t('common.howItWorks.step3')}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-semibold mb-2">4</div>
                <span>{t('common.howItWorks.step4')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industry Selection - 行业选择区域 */}
      <section id="industry-selection" className="py-12 sm:py-16 scroll-mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              选择您的专业领域
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              点击进入对应行业，获取专业的AI提示词模板
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {industries.map((industry) => {
              const IconComponent = industry.icon
              return (
                <Link 
                  key={industry.id} 
                  href={`/${locale}/${industryPaths[industry.id]}`}
                  className="group block"
                >
                  <Card className="industry-card hover:shadow-lg hover:scale-105 transition-all duration-300 h-full">
                    <CardHeader className="text-center pb-4">
                      <div className={`mx-auto h-16 w-16 rounded-2xl ${industry.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {industry.displayName}
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed min-h-[3rem]">
                        {industry.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      {/* 核心功能标签 */}
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {industry.features.slice(0, 3).map((feature) => (
                            <span
                              key={feature}
                              className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {/* 进入按钮 */}
                      <Button 
                        className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" 
                        variant="outline"
                      >
                        开始使用
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Footer - 页脚 */}
      <footer className="border-t bg-gray-50 dark:bg-gray-900 mt-auto">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              AI Prompt Generator
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {t('common.footer.tagline')}
            </p>
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              {t('common.footer.copyright')}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}