'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  Scale, 
  FileText, 
  Search, 
  Users, 
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  BookmarkPlus,
  History
} from 'lucide-react'

import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Textarea } from "../../../components/ui/textarea"
import { usePromptGenerator } from "../../../lib/hooks/use-prompt-generator"
import { industryExamples } from "../../../lib/constants/industry-examples"
import PromptResult from "../../../components/prompt-result"
import { useClientTranslations } from "../../../lib/hooks/use-client-translations"
import { Locale } from "../../../lib/i18n"

export default function LawyerAIPrompts() {
  const params = useParams()
  const locale = params.locale as Locale
  const { t, dictionary, loading: translationsLoading } = useClientTranslations(locale)
  
  const {
    loading,
    result,
    error,
    formData,
    updateFormData,
    handleSubmit,
    clearResult,
    copyToClipboard,
    saveDraft,
    loadDraft
  } = usePromptGenerator('lawyer')

  const [wordCount, setWordCount] = useState(0)
  const examples = industryExamples.lawyer

  // Load draft on component mount
  useEffect(() => {
    loadDraft()
  }, [])

  // Calculate word count
  useEffect(() => {
    setWordCount(formData.prompt.length)
  }, [formData.prompt])

  // Fill example data
  const fillExample = (example: typeof examples.examples[0]) => {
    updateFormData('scenario', example.scenario)
    updateFormData('prompt', example.prompt)
    updateFormData('context', example.context)
  }

  // Form submit handler
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleSubmit()
  }

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

          {/* Main Content - AI Prompt Generator */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-2 border-gray-100 dark:border-gray-700">
              <CardHeader className="bg-gradient-to-r from-lawyer/10 to-lawyer-dark/10">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-lawyer" />
                  {t('pages.lawyer.generatorTitle')}
                </CardTitle>
                <CardDescription className="text-base">
                  {t('pages.lawyer.generatorSubtitle')}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 p-6">
                <form onSubmit={onSubmit} className="space-y-6">
                  {/* Scenario selection */}
                  <div className="space-y-2">
                    <Label htmlFor="scenario" className="text-base font-medium">
                      {t('pages.lawyer.scenarioLabel')} *
                    </Label>
                    <select 
                      id="scenario"
                      value={formData.scenario}
                      onChange={(e) => updateFormData('scenario', e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lawyer/20 focus-visible:ring-offset-2"
                      required
                    >
                      <option value="">{t('pages.lawyer.scenarioPlaceholder')}</option>
                      {examples.scenarios.map(scenario => (
                        <option key={scenario.value} value={scenario.value}>
                          {scenario.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Specific requirements description */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="requirements" className="text-base font-medium">
                        {t('pages.lawyer.requirementsLabel')} *
                      </Label>
                      <span className="text-sm text-gray-500">{wordCount} {t('forms.characters')}</span>
                    </div>
                    <Textarea
                      id="requirements"
                      value={formData.prompt}
                      onChange={(e) => updateFormData('prompt', e.target.value)}
                      placeholder={t('pages.lawyer.requirementsPlaceholder')}
                      className="min-h-[120px] resize-none"
                      required
                    />
                    <div className="text-sm text-gray-500">
                      {t('pages.lawyer.requirementsTip')}
                    </div>
                  </div>

                  {/* Additional information */}
                  <div className="space-y-2">
                    <Label htmlFor="context" className="text-base font-medium">
                      {t('pages.lawyer.contextLabel')}
                    </Label>
                    <Textarea
                      id="context"
                      value={formData.context}
                      onChange={(e) => updateFormData('context', e.target.value)}
                      placeholder={t('pages.lawyer.contextPlaceholder')}
                      className="min-h-[80px] resize-none"
                    />
                  </div>

                  {/* Example prompts */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-lawyer" />
                      {t('forms.quickStart')}
                    </Label>
                    <div className="grid gap-3">
                      {examples.examples.map((example, index) => (
                        <Card 
                          key={index} 
                          className="cursor-pointer hover:border-lawyer/50 transition-colors"
                          onClick={() => fillExample(example)}
                        >
                          <CardContent className="p-4">
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {examples.scenarios.find(s => s.value === example.scenario)?.label}
                            </div>
                            <div className="text-xs text-gray-600 mb-2">{example.prompt}</div>
                            <div className="text-xs text-gray-400">{example.context}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Generate button */}
                  <div className="flex gap-4 pt-6">
                    <Button 
                      type="submit"
                      size="lg" 
                      disabled={loading || !formData.scenario || !formData.prompt.trim()}
                      className="flex-1 gradient-lawyer hover:opacity-90 btn-press disabled:opacity-50"
                    >
                      <Sparkles className="mr-2 h-5 w-5" />
                      {loading ? t('forms.generating') : t('pages.lawyer.generateButton')}
                    </Button>
                    <Button 
                      type="button"
                      variant="outline" 
                      size="lg"
                      onClick={saveDraft}
                    >
                      <BookmarkPlus className="mr-2 h-4 w-4" />
                      {t('forms.saveDraft')}
                    </Button>
                    <Button 
                      type="button"
                      variant="outline" 
                      size="lg"
                      onClick={loadDraft}
                    >
                      <History className="mr-2 h-4 w-4" />
                      {t('forms.loadDraft')}
                    </Button>
                  </div>
                </form>

                {/* Usage tips */}
                <div className="rounded-lg bg-lawyer/5 p-4 border border-lawyer/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-lawyer mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium text-lawyer mb-1">{t('forms.professionalTip')}</div>
                      <div className="text-gray-600 dark:text-gray-400">
                        {t('forms.tipContent')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Result display */}
                <PromptResult
                  result={result}
                  loading={loading}
                  error={error}
                  onCopy={copyToClipboard}
                  onClear={clearResult}
                  onRegenerate={handleSubmit}
                />
              </CardContent>
            </Card>

            {/* Success metrics display */}
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
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
  )
}