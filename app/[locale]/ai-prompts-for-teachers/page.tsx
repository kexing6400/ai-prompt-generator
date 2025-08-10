'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { 
  GraduationCap, 
  FileText, 
  Users, 
  BookOpen,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react'

import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import PromptWizard from "../../../components/prompt-wizard/PromptWizard"
import type { GeneratedPrompt } from "../../../components/prompt-wizard/types"

// Professional template categories for teachers
const templateCategories = [
  {
    id: 'lesson-planning',
    name: 'Lesson Planning',
    description: 'AI-powered lesson design, curriculum alignment, learning objectives',
    icon: BookOpen,
    templates: [
      'Standards-based lesson plans',
      'Differentiated instruction design', 
      'Assessment integration',
      'Learning objective creation'
    ],
    popular: true
  },
  {
    id: 'student-assessment',
    name: 'Student Assessment',
    description: 'Rubric creation, feedback generation, progress tracking',
    icon: CheckCircle,
    templates: [
      'Formative assessment design',
      'Rubric development',
      'Personalized feedback',
      'Progress report writing'
    ]
  },
  {
    id: 'curriculum-design',
    name: 'Curriculum Design',
    description: 'Course structure, unit planning, scope and sequence',
    icon: FileText,
    templates: [
      'Unit planning framework',
      'Scope & sequence mapping',
      'Cross-curricular connections',
      'Skills progression design'
    ]
  },
  {
    id: 'classroom-management',
    name: 'Classroom Management',
    description: 'Behavior strategies, communication templates, parent engagement',
    icon: Users,
    templates: [
      'Behavior intervention plans',
      'Parent communication',
      'Classroom procedures',
      'Student motivation strategies'
    ]
  }
]

// Success metrics
const successMetrics = [
  { label: 'Teachers Helped', value: '1,800+', icon: Users },
  { label: 'Lessons Created', value: '75K+', icon: BookOpen },
  { label: 'Time Saved', value: '65%', icon: CheckCircle },
  { label: 'Student Engagement', value: '+40%', icon: GraduationCap },
]

export default function TeacherAIPrompts() {
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
    <div className="min-h-screen bg-gradient-to-br from-teacher/5 via-white to-teacher/10 dark:from-gray-900 dark:via-teacher/5 dark:to-gray-900">
      
      {/* Header Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />
        <div className="absolute right-0 top-0 -z-10 blur-3xl">
          <div className="aspect-square w-96 bg-gradient-to-br from-teacher/20 to-teacher-dark/20 opacity-60" />
        </div>

        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-2xl gradient-teacher flex items-center justify-center">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
            
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                AI Prompts for Teachers: Educational ChatGPT Templates
              </h1>
              <p className="mt-2 text-xl text-gray-600 dark:text-gray-300">
                Transform your teaching with AI. Save 4+ hours weekly with professional templates
              </p>
              
              <nav className="mt-4 flex items-center space-x-2 text-sm text-gray-500">
                <a href="/" className="hover:text-teacher">Home</a>
                <span>/</span>
                <span className="text-teacher">AI Prompts for Teachers</span>
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
                Educational Template Categories
              </h2>
              
              <div className="space-y-4">
                {templateCategories.map((category) => {
                  const IconComponent = category.icon
                  return (
                    <Card 
                      key={category.id} 
                      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-teacher/50 ${
                        category.popular ? 'ring-2 ring-teacher/20 border-teacher/30' : ''
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg gradient-teacher flex items-center justify-center">
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {category.name}
                              {category.popular && (
                                <span className="text-xs bg-teacher/10 text-teacher px-2 py-1 rounded-full">
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
                              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teacher cursor-pointer transition-colors"
                            >
                              <div className="h-1.5 w-1.5 rounded-full bg-teacher/40" />
                              {template}
                            </div>
                          ))}
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-4 hover:bg-teacher hover:text-white"
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
                industry="teachers"
                onComplete={handlePromptComplete}
                onReset={handleReset}
                className="teacher-theme"
              />
              
              {/* Template Library Link */}
              <Card className="text-center p-6 bg-gradient-to-r from-teacher/5 to-teacher-dark/5 border-teacher/20">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg gradient-teacher flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      专业模板库
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      浏览我们为教育专业人员精心设计的提示词模板
                    </p>
                  </div>
                </div>
                <a 
                  href={`/${locale}/ai-prompts-for-teachers/templates`}
                  className="inline-flex items-center gap-2 px-6 py-3 gradient-teacher text-white rounded-lg hover:opacity-90 transition-colors font-medium"
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
                      <div className="h-10 w-10 rounded-lg gradient-teacher flex items-center justify-center mx-auto mb-3">
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