import Link from 'next/link'
import { 
  Scale, 
  Home, 
  Shield, 
  GraduationCap, 
  Calculator,
  ArrowRight,
  Sparkles,
  Users,
  Award,
  Zap
} from 'lucide-react'

import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { LanguageSwitcher } from "../../components/ui/language-switcher"
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

// 平台优势特性（图标配置）
const platformFeatureIcons = {
  intelligent: Sparkles,
  customized: Users,
  continuous: Award,
  instant: Zap
}

interface HomePageProps {
  params: { locale: string }
}

export default async function HomePage({ params: { locale } }: HomePageProps) {
  // 获取翻译
  const { t, tArray, dictionary } = await getTranslations(locale as Locale)
  
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
  
  // 构建平台特性数据
  const platformFeatures = [
    {
      icon: platformFeatureIcons.intelligent,
      title: t('common.features.intelligent'),
      description: t('common.features.intelligentDesc')
    },
    {
      icon: platformFeatureIcons.customized,
      title: t('common.features.customized'),
      description: t('common.features.customizedDesc')
    },
    {
      icon: platformFeatureIcons.continuous,
      title: t('common.features.continuous'),
      description: t('common.features.continuousDesc')
    },
    {
      icon: platformFeatureIcons.instant,
      title: t('common.features.instant'),
      description: t('common.features.instantDesc')
    }
  ]

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section - 英雄区域 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        {/* 背景装饰 - 确保不遮挡交互元素 */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 pointer-events-none" />
        <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 blur-3xl xl:-top-6 pointer-events-none" aria-hidden="true">
          <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20" />
        </div>

        <div className="container mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="text-center">
            {/* 主标题 */}
            <h1 className="text-responsive-xl font-bold tracking-tight text-gray-900 dark:text-white">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t('common.title')}
              </span>
            </h1>
            
            {/* 副标题 */}
            <p className="mx-auto mt-6 max-w-3xl text-responsive-md text-gray-600 dark:text-gray-300">
              {t('common.subtitle')}<br />
              {t('common.description')}
            </p>
            
            {/* CTA按钮组 - 世界级交互体验 */}
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center relative z-10">
              <Link href="#industry-selection" className="w-full sm:w-auto">
                <Button 
                  size="xl" 
                  className="w-full sm:w-auto hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 border-0"
                >
                  <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
                  {t('common.getStarted')}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#platform-features" className="w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="xl" 
                  className="w-full sm:w-auto hover:scale-105 transition-all duration-300 border-2 hover:border-primary"
                >
                  <Award className="mr-2 h-5 w-5" />
                  {t('common.learnMore')}
                </Button>
              </Link>
            </div>
            
            {/* 社会证明 */}
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3 lg:grid-cols-5">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">9,000+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{t('common.users')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">700+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{t('common.templates')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">50万+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{t('common.generated')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">98%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{t('common.satisfaction')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">5</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{t('common.industries')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industry Selection - 行业选择区域 */}
      <section id="industry-selection" className="py-16 sm:py-24 scroll-mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="section-title">{t('common.selectIndustry')}</h2>
            <p className="mt-4 section-subtitle max-w-3xl mx-auto">
              {t('common.selectIndustryDesc')}
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {industries.map((industry) => {
              const IconComponent = industry.icon
              return (
                <Link 
                  key={industry.id} 
                  href={`/${locale}/${industryPaths[industry.id]}`}
                  className="group block"
                >
                  <Card className="industry-card hover-lift group-hover:border-2 group-hover:border-current transition-all duration-300">
                    <CardHeader className="text-center pb-4">
                      <div className={`mx-auto h-16 w-16 rounded-2xl ${industry.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {industry.displayName}
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
                        {industry.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      {/* 核心功能 */}
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                          {t('ui.coreFeatures')}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {industry.features.map((feature) => (
                            <span
                              key={feature}
                              className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {/* 使用统计 */}
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>{industry.stats.users} {t('common.users')}</span>
                        <span>{industry.stats.templates} {t('common.templates')}</span>
                      </div>
                      
                      {/* 进入按钮 */}
                      <Button 
                        className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors" 
                        variant="outline"
                      >
                        {industry.enterText}
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

      {/* Platform Features - 平台特色 */}
      <section id="platform-features" className="bg-gray-50 dark:bg-gray-900/50 py-16 sm:py-24 scroll-mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="section-title">{t('common.whyChooseUs')}</h2>
            <p className="mt-4 section-subtitle max-w-3xl mx-auto">
              {t('common.whyChooseUsDesc')}
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {platformFeatures.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <div key={index} className="text-center group">
                  <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section - 行动召唤 */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {t('common.cta.title')}
            </h2>
            <p className="mt-6 text-xl text-blue-100">
              {t('common.cta.subtitle')}
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="#industry-selection" className="w-full sm:w-auto">
                <Button 
                  size="xl" 
                  variant="secondary" 
                  className="w-full sm:w-auto hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Zap className="mr-2 h-5 w-5 animate-pulse" />
                  {t('common.freeStart')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="mailto:contact@aiprompts.ink" className="w-full sm:w-auto">
                <Button 
                  size="xl" 
                  variant="outline" 
                  className="w-full sm:w-auto bg-white/10 backdrop-blur-sm text-white border-2 border-white/50 hover:bg-white hover:text-blue-600 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                  <Users className="mr-2 h-5 w-5" />
                  {t('common.contactAdvisor')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - 页脚 */}
      <footer className="border-t bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              AI Prompt Builder Pro
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {t('common.footer.tagline')}
            </p>
            <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
              {t('common.footer.copyright')}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}