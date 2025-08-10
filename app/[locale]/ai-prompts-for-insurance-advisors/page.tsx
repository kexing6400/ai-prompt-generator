'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Shield, Sparkles } from 'lucide-react'

import SimplePromptGenerator from "@/components/simple-prompt-generator"
import { insuranceTemplates } from "@/components/simple-prompt-generator/insurance-templates"
import type { GeneratedResult } from "@/components/simple-prompt-generator"

export default function InsuranceAdvisorAIPrompts() {
  const params = useParams()
  const locale = params.locale || 'en'
  
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult[]>([])

  const handleGenerate = useCallback((result: GeneratedResult) => {
    setGeneratedResults(prev => [result, ...prev])
    console.log('Generated prompt for insurance advisor:', result)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-indigo-900/5 dark:to-gray-900">
      
      {/* 简化的头部区域 */}
      <section className="relative overflow-hidden py-12">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            {/* 图标和标题 */}
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                保险顾问AI提示词生成器
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                专为保险专业人员设计的智能工具，提升客户服务质量，优化保险规划效率
              </p>
            </div>
            
            {/* 面包屑导航 */}
            <nav className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <a href="/" className="hover:text-indigo-600 transition-colors">首页</a>
              <span>/</span>
              <span className="text-indigo-600">保险顾问AI提示词</span>
            </nav>
          </div>
        </div>
      </section>

      {/* 主要内容区域 */}
      <section className="pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* 核心功能：简化的提示词生成器 */}
          <SimplePromptGenerator
            industry="insurance-advisors"
            templates={insuranceTemplates}
            onGenerate={handleGenerate}
            className="mb-12"
          />

          {/* 功能特色说明 */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center space-y-3">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mx-auto">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                专业模板
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                需求分析、产品推荐、理赔协助等专业模板，覆盖保险服务全流程
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-lg">AI</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                智能生成
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                基于保险专业知识和实务经验，生成符合行业标准的高质量内容
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center mx-auto">
                <span className="text-white text-2xl">🛡️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                客户至上
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                以客户需求为中心，提供个性化的保险规划和专业服务指导
              </p>
            </div>
          </div>

          {/* 使用提示 */}
          <div className="mt-12 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl p-6 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                <span className="text-2xl">🤝</span>
                专业承诺
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                所有模板都基于保险行业最佳实践和监管要求设计，生成内容仅供参考。
                具体保险规划和产品推荐请结合客户实际情况，确保合规展业。
              </p>
            </div>
          </div>

        </div>
      </section>
    </div>
  )
}