'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Home, Sparkles } from 'lucide-react'

import SimplePromptGenerator from "@/components/simple-prompt-generator"
import { realtorTemplates } from "@/components/simple-prompt-generator/realtors-templates"
import type { GeneratedResult } from "@/components/simple-prompt-generator"

export default function RealtorAIPrompts() {
  const params = useParams()
  const locale = params.locale || 'en'
  
  // 生成结果处理
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult[]>([])

  const handleGenerate = useCallback((result: GeneratedResult) => {
    setGeneratedResults(prev => [result, ...prev])
    console.log('Generated prompt for realtor:', result)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-green-900/5 dark:to-gray-900">
      
      {/* 简化的头部区域 */}
      <section className="relative overflow-hidden py-12">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            {/* 图标和标题 */}
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                <Home className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                房地产AI提示词生成器
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                专为房地产专业人员设计的智能提示词工具，提升营销效果，优化客户沟通
              </p>
            </div>
            
            {/* 面包屑导航 */}
            <nav className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <a href="/" className="hover:text-green-600 transition-colors">首页</a>
              <span>/</span>
              <span className="text-green-600">房地产AI提示词</span>
            </nav>
          </div>
        </div>
      </section>

      {/* 主要内容区域 */}
      <section className="pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* 核心功能：简化的提示词生成器 */}
          <SimplePromptGenerator
            industry="realtors"
            templates={realtorTemplates}
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
                房产描述、客户跟进、市场分析等专业模板，覆盖房地产全业务场景
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-lg">AI</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                智能生成
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                基于最新AI技术，根据您的具体需求生成个性化的专业提示词内容
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center mx-auto">
                <span className="text-white text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                即时可用
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                选择模板，填写信息，一键生成。简单三步，立即获得专业级提示词
              </p>
            </div>
          </div>

          {/* 使用提示 */}
          <div className="mt-12 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                <span className="text-2xl">💡</span>
                使用提示
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                所有模板都经过房地产行业专家优化，确保生成内容的专业性和实用性。
                您可以直接使用生成的内容，也可以根据具体情况进行微调。
              </p>
            </div>
          </div>

        </div>
      </section>
    </div>
  )
}