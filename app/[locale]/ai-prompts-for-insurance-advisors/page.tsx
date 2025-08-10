'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { 
  Shield, 
  FileText, 
  Heart, 
  Users, 
  CheckCircle,
  ArrowRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react'

import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import PromptWizard from "../../../components/prompt-wizard/PromptWizard"
import type { GeneratedPrompt } from "../../../components/prompt-wizard/types"

// Professional template categories for insurance advisors
const templateCategories = [
  {
    id: 'product-explanation',
    name: 'Product Explanation',
    description: 'Clear policy breakdowns, coverage comparisons, benefit illustrations',
    icon: FileText,
    templates: [
      'Life insurance comparisons',
      'Health plan breakdowns', 
      'Auto coverage explanations',
      'Business insurance guides'
    ],
    popular: true
  },
  {
    id: 'risk-assessment',
    name: 'Risk Assessment',
    description: 'Personal risk analysis, coverage gap identification, protection planning',
    icon: ShieldCheck,
    templates: [
      'Personal risk profiling',
      'Business risk analysis',
      'Coverage adequacy reviews',
      'Protection planning strategies'
    ]
  },
  {
    id: 'claims-assistance',
    name: 'Claims Assistance',
    description: 'Claims process guidance, documentation support, settlement negotiation',
    icon: Heart,
    templates: [
      'Claims filing guides',
      'Documentation checklists',
      'Settlement negotiations',
      'Dispute resolution support'
    ]
  },
  {
    id: 'client-consultation',
    name: 'Client Consultation',
    description: 'Needs analysis, policy reviews, renewal consultations, life changes',
    icon: Users,
    templates: [
      'Needs assessment interviews',
      'Annual policy reviews',
      'Life event consultations',
      'Beneficiary planning'
    ]
  }
]

// Success metrics
const successMetrics = [
  { label: 'Advisors Helped', value: '850+', icon: Users },
  { label: 'Policies Explained', value: '32K+', icon: FileText },
  { label: 'Client Satisfaction', value: '92%', icon: Heart },
  { label: 'Time Efficiency', value: '65%', icon: CheckCircle },
]

export default function InsuranceAdvisorAIPrompts() {
  const params = useParams()
  const locale = params.locale as string
  
  // 生成的提示词结果状态
  const [generatedResults, setGeneratedResults] = useState<GeneratedPrompt[]>([])

  // 处理PromptWizard完成事件
  const handlePromptComplete = useCallback((result: GeneratedPrompt) => {
    setGeneratedResults(prev => [result, ...prev])
    console.log('Generated prompt:', result)
  }, [])

  // 处理重置事件
  const handleReset = useCallback(() => {
    console.log('Wizard reset')
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-purple-900/5 dark:to-gray-900">
      
      {/* Header Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />
        <div className="absolute right-0 top-0 -z-10 blur-3xl">
          <div className="aspect-square w-96 bg-gradient-to-br from-purple-400/20 to-indigo-600/20 opacity-60" />
        </div>

        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
              <Shield className="h-10 w-10 text-white" />
            </div>
            
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                AI Prompts for Insurance Advisors: Professional Protection Templates
              </h1>
              <p className="mt-2 text-xl text-gray-600 dark:text-gray-300">
                Enhance client consultations with AI-powered insurance guidance and risk analysis
              </p>
              
              <nav className="mt-4 flex items-center space-x-2 text-sm text-gray-500">
                <a href="/" className="hover:text-purple-600">Home</a>
                <span>/</span>
                <span className="text-purple-600">AI Prompts for Insurance Advisors</span>
              </nav>
              

            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Insurance Template Categories
              </h2>
              
              <div className="space-y-4">
                {templateCategories.map((category) => {
                  const IconComponent = category.icon
                  return (
                    <Card 
                      key={category.id} 
                      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-purple-500/50 ${
                        category.popular ? 'ring-2 ring-purple-500/20 border-purple-500/30' : ''
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {category.name}
                              {category.popular && (
                                <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                                  Popular
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
                              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 cursor-pointer transition-colors"
                            >
                              <div className="h-1.5 w-1.5 rounded-full bg-purple-500/40" />
                              {template}
                            </div>
                          ))}
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-4 hover:bg-purple-600 hover:text-white"
                        >
                          Select Category
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
                industry="insurance-advisors"
                onComplete={handlePromptComplete}
                onReset={handleReset}
                className="insurance-theme"
              />
              
              {/* Template Library Link */}
              <Card className="text-center p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      专业模板库
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      浏览我们为保险专业人员精心设计的提示词模板
                    </p>
                  </div>
                </div>
                <a 
                  href={`/${locale}/ai-prompts-for-insurance-advisors/templates`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:opacity-90 transition-colors font-medium"
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
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center mx-auto mb-3">
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