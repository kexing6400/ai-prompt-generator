'use client'

import { useState, useEffect } from 'react'
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  Target, 
  CheckCircle,
  ArrowRight,
  Sparkles,
  Award,
  TrendingUp,
  BookmarkPlus,
  History
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { usePromptGenerator } from '@/lib/hooks/use-prompt-generator'
import { industryExamples } from '@/lib/constants/industry-examples'
import PromptResult from '@/components/prompt-result'

// Metadata 在 layout.tsx 中定义

// 教师专用模板分类
const templateCategories = [
  {
    id: 'instructional-design',
    name: '教学设计',
    description: '科学的教学方案设计，课堂活动规划',
    icon: BookOpen,
    templates: [
      '课程教学目标制定',
      '教学活动设计方案', 
      '课堂互动环节设计',
      '教学方法选择建议'
    ],
    popular: true
  },
  {
    id: 'student-assessment',
    name: '学生评估',
    description: '多元化评估方法，学习效果分析',
    icon: Target,
    templates: [
      '学习成果评价标准',
      '个性化学习诊断',
      '学生能力发展评估',
      '学习进度跟踪分析'
    ]
  },
  {
    id: 'curriculum-planning',
    name: '课程规划',
    description: '系统性课程体系，知识点梳理',
    icon: Users,
    templates: [
      '学期课程安排',
      '知识体系构建',
      '教学重难点分析',
      '跨学科整合方案'
    ]
  },
  {
    id: 'assignment-creation',
    name: '作业设计',
    description: '创新作业形式，分层作业设计',
    icon: GraduationCap,
    templates: [
      '分层作业设计',
      '项目式作业规划',
      '作业评价标准',
      '作业反馈优化'
    ]
  }
]

// 成功案例数据
const successMetrics = [
  { label: '服务教师', value: '3,200+', icon: Users },
  { label: '生成提示词', value: '18万+', icon: Sparkles },
  { label: '提升效率', value: '65%', icon: TrendingUp },
  { label: '教学满意度', value: '92%', icon: Award },
]

export default function TeacherWorkspace() {
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
  } = usePromptGenerator('teacher')

  const [wordCount, setWordCount] = useState(0)
  const examples = industryExamples.teacher

  // 组件挂载时加载草稿
  useEffect(() => {
    loadDraft()
  }, [])

  // 计算字数
  useEffect(() => {
    setWordCount(formData.prompt.length)
  }, [formData.prompt])

  // 填充示例数据
  const fillExample = (example: typeof examples.examples[0]) => {
    updateFormData('scenario', example.scenario)
    updateFormData('prompt', example.prompt)
    updateFormData('context', example.context)
  }

  // 表单提交处理
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleSubmit()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teacher/5 via-white to-teacher/10 dark:from-gray-900 dark:via-teacher/5 dark:to-gray-900">
      
      {/* Header Section - 页面头部 */}
      <section className="relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />
        <div className="absolute right-0 top-0 -z-10 blur-3xl">
          <div className="aspect-square w-96 bg-gradient-to-br from-teacher/20 to-teacher-dark/20 opacity-60" />
        </div>

        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            {/* 行业图标 */}
            <div className="h-20 w-20 rounded-2xl gradient-teacher flex items-center justify-center">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
            
            {/* 标题信息 */}
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                教师AI工作台
              </h1>
              <p className="mt-2 text-xl text-gray-600 dark:text-gray-300">
                专业教育AI助手，让教学工作更智能、更高效
              </p>
              
              {/* 面包屑导航 */}
              <nav className="mt-4 flex items-center space-x-2 text-sm text-gray-500">
                <a href="/" className="hover:text-teacher">首页</a>
                <span>/</span>
                <span className="text-teacher">教师工作台</span>
              </nav>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* Left Sidebar - 模板分类 */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                专业模板分类
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
                                  热门
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
                          选择此分类
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Main Content - 提示词生成器 */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-2 border-gray-100 dark:border-gray-700">
              <CardHeader className="bg-gradient-to-r from-teacher/10 to-teacher-dark/10">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-teacher" />
                  智能提示词生成器
                </CardTitle>
                <CardDescription className="text-base">
                  填写下方表单信息，我们将为您生成专业的教育AI提示词
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 p-6">
                <form onSubmit={onSubmit} className="space-y-6">
                  {/* 教学场景选择 */}
                  <div className="space-y-2">
                    <Label htmlFor="scenario" className="text-base font-medium">
                      教学场景 *
                    </Label>
                    <select 
                      id="scenario"
                      value={formData.scenario}
                      onChange={(e) => updateFormData('scenario', e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teacher/20 focus-visible:ring-offset-2"
                      required
                    >
                      <option value="">请选择您的教学场景</option>
                      {examples.scenarios.map(scenario => (
                        <option key={scenario.value} value={scenario.value}>
                          {scenario.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 具体需求描述 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="requirements" className="text-base font-medium">
                        具体需求描述 *
                      </Label>
                      <span className="text-sm text-gray-500">{wordCount} 字</span>
                    </div>
                    <Textarea
                      id="requirements"
                      value={formData.prompt}
                      onChange={(e) => updateFormData('prompt', e.target.value)}
                      placeholder="请详细描述您希望AI助手帮您完成的具体教学工作，如：为三年级数学课设计一个关于分数概念的互动教学活动..."
                      className="min-h-[120px] resize-none"
                      required
                    />
                    <div className="text-sm text-gray-500">
                      建议：详细描述学科、年级、教学内容、预期目标等信息
                    </div>
                  </div>

                  {/* 补充信息 */}
                  <div className="space-y-2">
                    <Label htmlFor="context" className="text-base font-medium">
                      补充信息（选填）
                    </Label>
                    <Textarea
                      id="context"
                      value={formData.context}
                      onChange={(e) => updateFormData('context', e.target.value)}
                      placeholder="提供更多背景信息，如：学生基础水平、班级规模、教学设备、特殊要求等..."
                      className="min-h-[80px] resize-none"
                    />
                  </div>

                  {/* 示例提示词 */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-teacher" />
                      快速开始 - 选择示例场景
                    </Label>
                    <div className="grid gap-3">
                      {examples.examples.map((example, index) => (
                        <Card 
                          key={index} 
                          className="cursor-pointer hover:border-teacher/50 transition-colors"
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

                  {/* 生成按钮 */}
                  <div className="flex gap-4 pt-6">
                    <Button 
                      type="submit"
                      size="lg" 
                      disabled={loading || !formData.scenario || !formData.prompt.trim()}
                      className="flex-1 gradient-teacher hover:opacity-90 btn-press disabled:opacity-50"
                    >
                      <Sparkles className="mr-2 h-5 w-5" />
                      {loading ? '生成中...' : '生成专业提示词'}
                    </Button>
                    <Button 
                      type="button"
                      variant="outline" 
                      size="lg"
                      onClick={saveDraft}
                    >
                      <BookmarkPlus className="mr-2 h-4 w-4" />
                      保存草稿
                    </Button>
                    <Button 
                      type="button"
                      variant="outline" 
                      size="lg"
                      onClick={loadDraft}
                    >
                      <History className="mr-2 h-4 w-4" />
                      加载草稿
                    </Button>
                  </div>
                </form>

                {/* 使用提示 */}
                <div className="rounded-lg bg-teacher/5 p-4 border border-teacher/20">
                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-teacher mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium text-teacher mb-1">专业教育提示</div>
                      <div className="text-gray-600 dark:text-gray-400">
                        生成的提示词融合了现代教育理论和实践经验，可帮助您提升教学效果，激发学生学习兴趣。
                      </div>
                    </div>
                  </div>
                </div>

                {/* 结果显示 */}
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

            {/* 成功数据展示 */}
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
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
  )
}