'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { 
  Scale, 
  FileText, 
  Search, 
  Users, 
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react'

import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import PromptWizard from "../../../components/prompt-wizard/PromptWizard"
import { useClientTranslations } from "../../../lib/hooks/use-client-translations"
import { Locale } from "../../../lib/i18n"
import type { GeneratedPrompt } from "../../../components/prompt-wizard/types"

export default function LawyerAIPrompts() {
  const params = useParams()
  const locale = params.locale as Locale
  const { t, dictionary, loading: translationsLoading } = useClientTranslations(locale)
  
  // 生成的提示词结果状态
  const [generatedResults, setGeneratedResults] = useState<GeneratedPrompt[]>([])

  // 处理PromptWizard完成事件
  const handlePromptComplete = useCallback((result: GeneratedPrompt) => {
    setGeneratedResults(prev => [result, ...prev])
    // 可以在这里添加其他逻辑，如保存到本地存储等
    console.log('Generated prompt:', result)
  }, [])

  // 处理重置事件
  const handleReset = useCallback(() => {
    // 可以添加重置相关的逻辑
    console.log('Wizard reset')
  }, [])

  // 如果翻译还在加载中，显示加载状态
  if (translationsLoading || !dictionary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lawyer/5 via-white to-lawyer/10 dark:from-gray-900 dark:via-lawyer/5 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-8 w-8 text-lawyer animate-pulse mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  // 构建模板分类数据（使用翻译）
  const templateCategories = [
    {
      id: 'contract-review',
      name: t('pages.lawyer.categories.contractReview.name'),
      description: t('pages.lawyer.categories.contractReview.description'),
      icon: FileText,
      templates: dictionary.pages.lawyer.categories.contractReview.templates,
      popular: true
    },
    {
      id: 'case-analysis',
      name: t('pages.lawyer.categories.caseAnalysis.name'),
      description: t('pages.lawyer.categories.caseAnalysis.description'),
      icon: Search,
      templates: dictionary.pages.lawyer.categories.caseAnalysis.templates
    },
    {
      id: 'legal-research',
      name: t('pages.lawyer.categories.legalResearch.name'),
      description: t('pages.lawyer.categories.legalResearch.description'),
      icon: AlertCircle,
      templates: dictionary.pages.lawyer.categories.legalResearch.templates
    },
    {
      id: 'document-drafting',
      name: t('pages.lawyer.categories.documentDrafting.name'),
      description: t('pages.lawyer.categories.documentDrafting.description'),
      icon: Users,
      templates: dictionary.pages.lawyer.categories.documentDrafting.templates
    }
  ]

  // 成功指标数据（使用翻译）
  const successMetrics = [
    { label: t('pages.lawyer.metrics.served'), value: '2,300+', icon: Users },
    { label: t('pages.lawyer.metrics.generated'), value: '150K+', icon: Sparkles },
    { label: t('pages.lawyer.metrics.timeSaved'), value: '70%', icon: CheckCircle },
    { label: t('pages.lawyer.metrics.accuracy'), value: '95%', icon: Scale },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-lawyer/5 via-white to-lawyer/10 dark:from-gray-900 dark:via-lawyer/5 dark:to-gray-900">
      
      {/* Header Section */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />
        <div className="absolute right-0 top-0 -z-10 blur-3xl">
          <div className="aspect-square w-96 bg-gradient-to-br from-lawyer/20 to-lawyer-dark/20 opacity-60" />
        </div>

        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            {/* Industry icon */}
            <div className="h-20 w-20 rounded-2xl gradient-lawyer flex items-center justify-center">
              <Scale className="h-10 w-10 text-white" />
            </div>
            
            {/* Title information */}
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                {t('pages.lawyer.title')}
              </h1>
              <p className="mt-2 text-xl text-gray-600 dark:text-gray-300">
                {t('pages.lawyer.subtitle')}
              </p>
              
              {/* Breadcrumb navigation */}
              <nav className="mt-4 flex items-center space-x-2 text-sm text-gray-500">
                <a href={`/${locale}`} className="hover:text-lawyer">{t('navigation.home')}</a>
                <span>/</span>
                <span className="text-lawyer">{t('pages.lawyer.breadcrumb')}</span>
              </nav>
              

            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* Left Sidebar - Template Categories */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {t('pages.lawyer.categoriesTitle')}
              </h2>
              
              <div className="space-y-4">
                {templateCategories.map((category) => {
                  const IconComponent = category.icon
                  return (
                    <Card 
                      key={category.id} 
                      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-lawyer/50 ${
                        category.popular ? 'ring-2 ring-lawyer/20 border-lawyer/30' : ''
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg gradient-lawyer flex items-center justify-center">
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {category.name}
                              {category.popular && (
                                <span className="text-xs bg-lawyer/10 text-lawyer px-2 py-1 rounded-full">
                                  {t('pages.lawyer.popular')}
                                </span>
                              )}
                            </CardTitle>
                          </div>
                        </div>
                        <CardDescription>{category.description}</CardDescription>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-2">
                          {category.templates.map((template, index) => (
                            <div 
                              key={index}
                              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-lawyer cursor-pointer transition-colors"
                            >
                              <div className="h-1.5 w-1.5 rounded-full bg-lawyer/40" />
                              {template}
                            </div>
                          ))}
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-4 hover:bg-lawyer hover:text-white"
                        >
                          {t('pages.lawyer.selectCategory')}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Main Content - AI Prompt Wizard */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* PromptWizard Integration */}
              <PromptWizard
                industry="lawyers"
                onComplete={handlePromptComplete}
                onReset={handleReset}
                className="lawyer-theme"
              />
              
              {/* Template Library Link */}
              <Card className="text-center p-6 bg-gradient-to-r from-lawyer/5 to-lawyer-dark/5 border-lawyer/20">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg gradient-lawyer flex items-center justify-center">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      专业模板库
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      浏览我们为法律专业人员精心设计的提示词模板
                    </p>
                  </div>
                </div>
                <a 
                  href={`/${locale}/ai-prompts-for-lawyers/templates`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-lawyer text-white rounded-lg hover:bg-lawyer-dark transition-colors font-medium"
                >
                  <Sparkles className="h-5 w-5" />
                  查看专业模板库 (10个模板)
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Card>

              {/* Success metrics display */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {successMetrics.map((metric) => {
                  const IconComponent = metric.icon
                  return (
                    <Card key={metric.label} className="text-center p-4">
                      <div className="h-10 w-10 rounded-lg gradient-lawyer flex items-center justify-center mx-auto mb-3">
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {metric.value}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {metric.label}
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}