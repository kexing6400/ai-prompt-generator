'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { GraduationCap, Sparkles } from 'lucide-react'

import SimplePromptGenerator from "@/components/simple-prompt-generator"
import { teacherTemplates } from "@/components/simple-prompt-generator/teachers-templates"
import type { GeneratedResult } from "@/components/simple-prompt-generator"

export default function TeacherAIPrompts() {
  const params = useParams()
  const locale = params.locale || 'en'
  
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult[]>([])

  const handleGenerate = useCallback((result: GeneratedResult) => {
    setGeneratedResults(prev => [result, ...prev])
    console.log('Generated prompt for teacher:', result)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-purple-900/5 dark:to-gray-900">
      
      {/* 简化的头部区域 */}
      <section className="relative overflow-hidden py-12">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            {/* 图标和标题 */}
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                教师AI提示词生成器
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                专为教育工作者设计的智能教学工具，提升教案质量，优化课堂互动效果
              </p>
            </div>
            
            {/* 面包屑导航 */}
            <nav className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <a href="/" className="hover:text-purple-600 transition-colors">首页</a>
              <span>/</span>
              <span className="text-purple-600">教师AI提示词</span>
            </nav>
          </div>
        </div>
      </section>

      {/* 主要内容区域 */}
      <section className="pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* 核心功能：简化的提示词生成器 */}
          <SimplePromptGenerator
            industry="teachers"
            templates={teacherTemplates}
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
                教案设计、学生评价、家长沟通等教学模板，覆盖教育教学全流程
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-lg">AI</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                智能生成
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                结合教育学理论和教学实践，生成符合教学规律的个性化内容
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center mx-auto">
                <span className="text-white text-2xl">🎯</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                因材施教
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                根据不同年龄段和学科特点，生成适配的教学内容和评价方案
              </p>
            </div>
          </div>

          {/* 使用提示 */}
          <div className="mt-12 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                <span className="text-2xl">🌟</span>
                教育理念
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                所有模板都基于现代教育理念和最佳教学实践设计，注重学生主体地位，
                促进全面发展。生成的内容请结合具体教学情境灵活运用。
              </p>
            </div>
          </div>

        </div>
      </section>
    </div>
  )
}