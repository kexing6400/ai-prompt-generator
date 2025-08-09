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

// 路径映射
const industryPaths: Record<string, string> = {
  lawyer: 'ai-prompts-for-lawyers',
  realtor: 'ai-prompts-for-realtors',
  insurance: 'ai-prompts-for-insurance-advisors',
  teacher: 'ai-prompts-for-teachers',
  accountant: 'ai-prompts-for-accountants'
}

// 行业配置数据
const industries: Array<{
  id: IndustryType
  name: string
  displayName: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  features: string[]
  stats: { users: string; templates: string }
}> = [
  {
    id: 'lawyer',
    name: '律师',
    displayName: '法律专业',
    description: '专为法律从业者设计的AI助手，涵盖合同审查、案例分析、法律研究等专业场景',
    icon: Scale,
    gradient: 'gradient-lawyer',
    features: ['合同审查', '案例分析', '法律研究', '文书起草'],
    stats: { users: '2,300+', templates: '150+' }
  },
  {
    id: 'realtor',
    name: '房产经纪人',
    displayName: '房地产行业',
    description: '房地产专业人士的智能伙伴，提供市场分析、客户沟通、投资建议等专业支持',
    icon: Home,
    gradient: 'gradient-realtor',
    features: ['市场分析', '客户咨询', '投资建议', '房源描述'],
    stats: { users: '1,800+', templates: '120+' }
  },
  {
    id: 'insurance',
    name: '保险顾问',
    displayName: '保险行业',
    description: '保险行业专家的专业工具，协助风险评估、产品推荐、理赔处理等核心业务',
    icon: Shield,
    gradient: 'gradient-insurance',
    features: ['风险评估', '产品推荐', '理赔指导', '客户教育'],
    stats: { users: '1,500+', templates: '100+' }
  },
  {
    id: 'teacher',
    name: '教师',
    displayName: '教育行业',
    description: '教育工作者的智能助手，涵盖教学设计、学生评估、课程规划等教育场景',
    icon: GraduationCap,
    gradient: 'gradient-teacher',
    features: ['教学设计', '学生评估', '课程规划', '作业设计'],
    stats: { users: '3,200+', templates: '200+' }
  },
  {
    id: 'accountant',
    name: '会计师',
    displayName: '财务会计',
    description: '财务专业人士的得力助手，支持财务分析、税务规划、审计工作等专业领域',
    icon: Calculator,
    gradient: 'gradient-accountant',
    features: ['财务分析', '税务规划', '审计支持', '报表解读'],
    stats: { users: '1,900+', templates: '130+' }
  }
]

// 平台优势特性
const platformFeatures = [
  {
    icon: Sparkles,
    title: '智能化生成',
    description: '基于行业专业知识的AI算法，生成精准、专业的提示词模板'
  },
  {
    icon: Users,
    title: '专业定制',
    description: '针对5大垂直行业深度定制，理解每个行业的独特需求'
  },
  {
    icon: Award,
    title: '持续优化',
    description: '基于用户反馈持续优化模板质量，确保最佳使用体验'
  },
  {
    icon: Zap,
    title: '即用即得',
    description: '简单填写表单，一键生成专业提示词，复制即用，高效便捷'
  }
]

interface HomePageProps {
  params: { locale: string }
}

export default function HomePage({ params: { locale } }: HomePageProps) {
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
              专业垂直行业
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {' '}AI提示词生成器
              </span>
            </h1>
            
            {/* 副标题 */}
            <p className="mx-auto mt-6 max-w-3xl text-responsive-md text-gray-600 dark:text-gray-300">
              为<strong>律师、房产经纪人、保险顾问、教师、会计师</strong>等专业人士量身打造<br />
              让AI助手更懂你的行业，释放专业工作的无限潜能
            </p>
            
            {/* CTA按钮组 - 世界级交互体验 */}
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center relative z-10">
              <Link href="#industry-selection" className="w-full sm:w-auto">
                <Button 
                  size="xl" 
                  className="w-full sm:w-auto hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 border-0"
                >
                  <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
                  立即开始使用
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
                  了解平台特色
                </Button>
              </Link>
            </div>
            
            {/* 社会证明 */}
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3 lg:grid-cols-5">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">9,000+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">专业用户</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">700+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">专业模板</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">50万+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">提示词生成</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">98%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">满意度</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">5</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">垂直行业</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industry Selection - 行业选择区域 */}
      <section id="industry-selection" className="py-16 sm:py-24 scroll-mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="section-title">选择您的专业领域</h2>
            <p className="mt-4 section-subtitle max-w-3xl mx-auto">
              我们深度理解每个行业的专业需求，为您提供最贴合的AI提示词解决方案
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
                          核心功能
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
                        <span>{industry.stats.users} 用户</span>
                        <span>{industry.stats.templates} 模板</span>
                      </div>
                      
                      {/* 进入按钮 */}
                      <Button 
                        className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors" 
                        variant="outline"
                      >
                        进入 {industry.name} 工作台
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
            <h2 className="section-title">为什么选择我们</h2>
            <p className="mt-4 section-subtitle max-w-3xl mx-auto">
              专业、智能、高效的AI提示词生成平台，让每一个专业人士都能轻松驾驭AI助手
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
              准备好释放AI的专业潜能了吗？
            </h2>
            <p className="mt-6 text-xl text-blue-100">
              加入数万名专业人士，让AI成为您工作中的得力助手
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="#industry-selection" className="w-full sm:w-auto">
                <Button 
                  size="xl" 
                  variant="secondary" 
                  className="w-full sm:w-auto hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Zap className="mr-2 h-5 w-5 animate-pulse" />
                  立即免费开始
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
                  联系专业顾问
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
              让专业工作更智能，让AI助手更懂你
            </p>
            <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
              © 2024 AI Prompt Builder Pro. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}