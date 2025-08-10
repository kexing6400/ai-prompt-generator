'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Calculator, Sparkles } from 'lucide-react'

import SimplePromptGenerator from "@/components/simple-prompt-generator"
import { accountantTemplates } from "@/components/simple-prompt-generator/accountants-templates"
import type { GeneratedResult } from "@/components/simple-prompt-generator"

export default function AccountantAIPrompts() {
  const params = useParams()
  const locale = params.locale || 'en'
  
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult[]>([])

  const handleGenerate = useCallback((result: GeneratedResult) => {
    setGeneratedResults(prev => [result, ...prev])
    console.log('Generated prompt for accountant:', result)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-emerald-900/5 dark:to-gray-900">
      
      {/* 简化的头部区域 */}
      <section className="relative overflow-hidden py-12">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            {/* 图标和标题 */}
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center justify-center">
                <Calculator className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                会计师AI提示词生成器
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                专为财务会计专业人员设计的智能工具，提升财务分析质量，优化会计工作效率
              </p>
            </div>
            
            {/* 面包屑导航 */}
            <nav className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <a href="/" className="hover:text-emerald-600 transition-colors">首页</a>
              <span>/</span>
              <span className="text-emerald-600">会计师AI提示词</span>
            </nav>
          </div>
        </div>
      </section>

      {/* 主要内容区域 */}
      <section className="pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* 核心功能：简化的提示词生成器 */}
          <SimplePromptGenerator
            industry="accountants"
            templates={accountantTemplates}
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
                财务分析、税务筹划、审计报告等专业模板，覆盖会计实务全领域
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-lg">AI</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                智能生成
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                基于会计准则和财务规范，生成符合专业标准的高质量内容
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 flex items-center justify-center mx-auto">
                <span className="text-white text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                精准专业
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                严格遵循会计制度和税法规定，确保内容的准确性和合规性
              </p>
            </div>
          </div>

          {/* 使用提示 */}
          <div className="mt-12 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                <span className="text-2xl">⚖️</span>
                合规提醒
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                所有模板都基于现行会计准则和税法规定设计，生成内容仅供参考。
                具体业务处理请结合实际情况，必要时咨询专业会计师或税务师。
              </p>
            </div>
          </div>

        </div>
      </section>
    </div>
  )
}