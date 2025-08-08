'use client'

import { useState, useEffect } from 'react'
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

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { usePromptGenerator } from '@/lib/hooks/use-prompt-generator'
import { industryExamples } from '@/lib/constants/industry-examples'
import PromptResult from '@/components/prompt-result'

// Metadata 在 layout.tsx 中定义

// 律师专用模板分类
const templateCategories = [
  {
    id: 'contract-review',
    name: '合同审查',
    description: '智能合同分析，识别风险点，提供专业建议',
    icon: FileText,
    templates: [
      '商业合同风险分析',
      '劳动合同条款审查', 
      '房地产合同评估',
      '知识产权协议审查'
    ],
    popular: true
  },
  {
    id: 'case-analysis',
    name: '案例分析',
    description: '深度案例研究，提取关键法律观点',
    icon: Search,
    templates: [
      '判决书要点提取',
      '相似案例比对分析',
      '法律先例研究',
      '案件争议焦点分析'
    ]
  },
  {
    id: 'legal-research',
    name: '法律研究',
    description: '法条检索，法理分析，学术研究支持',
    icon: AlertCircle,
    templates: [
      '法条适用性分析',
      '法理依据论证',
      '立法沿革研究',
      '司法解释梳理'
    ]
  },
  {
    id: 'document-drafting',
    name: '文书起草',
    description: '专业法律文书模板生成和优化',
    icon: Users,
    templates: [
      '起诉状草拟',
      '答辩书撰写',
      '法律意见书',
      '律师函起草'
    ]
  }
]

// 成功案例数据
const successMetrics = [
  { label: '服务律师', value: '2,300+', icon: Users },
  { label: '生成提示词', value: '15万+', icon: Sparkles },
  { label: '节省时间', value: '70%', icon: CheckCircle },
  { label: '准确率', value: '95%', icon: Scale },
]

export default function LawyerWorkspace() {
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
    <div className="min-h-screen bg-gradient-to-br from-lawyer/5 via-white to-lawyer/10 dark:from-gray-900 dark:via-lawyer/5 dark:to-gray-900">
      
      {/* Header Section - 页面头部 */}
      <section className="relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />
        <div className="absolute right-0 top-0 -z-10 blur-3xl">
          <div className="aspect-square w-96 bg-gradient-to-br from-lawyer/20 to-lawyer-dark/20 opacity-60" />
        </div>

        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            {/* 行业图标 */}
            <div className="h-20 w-20 rounded-2xl gradient-lawyer flex items-center justify-center">
              <Scale className="h-10 w-10 text-white" />
            </div>
            
            {/* 标题信息 */}
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                律师AI工作台
              </h1>
              <p className="mt-2 text-xl text-gray-600 dark:text-gray-300">
                专业法律AI助手，让法律服务更智能、更高效
              </p>
              
              {/* 面包屑导航 */}
              <nav className="mt-4 flex items-center space-x-2 text-sm text-gray-500">
                <a href="/" className="hover:text-lawyer">首页</a>
                <span>/</span>
                <span className="text-lawyer">律师工作台</span>
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
              <CardHeader className="bg-gradient-to-r from-lawyer/10 to-lawyer-dark/10">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-lawyer" />
                  智能提示词生成器
                </CardTitle>
                <CardDescription className="text-base">
                  填写下方表单信息，我们将为您生成专业的法律AI提示词
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 p-6">
                <form onSubmit={onSubmit} className="space-y-6">
                  {/* 场景选择 */}
                  <div className="space-y-2">
                    <Label htmlFor="scenario" className="text-base font-medium">
                      法律服务场景 *
                    </Label>
                    <select 
                      id="scenario"
                      value={formData.scenario}
                      onChange={(e) => updateFormData('scenario', e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lawyer/20 focus-visible:ring-offset-2"
                      required
                    >
                      <option value="">请选择您的法律服务场景</option>
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
                      placeholder="请详细描述您希望AI助手帮您完成的具体工作，如：分析一份商业合同的主要风险点，并提供相应的法律建议..."
                      className="min-h-[120px] resize-none"
                      required
                    />
                    <div className="text-sm text-gray-500">
                      建议：详细描述您的需求，包括文档类型、关注重点、期望输出格式等
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
                      placeholder="提供更多背景信息，如：案件金额、执业领域、特殊要求等..."
                      className="min-h-[80px] resize-none"
                    />
                  </div>

                  {/* 示例提示词 */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-lawyer" />
                      快速开始 - 选择示例场景
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

                  {/* 生成按钮 */}
                  <div className="flex gap-4 pt-6">
                    <Button 
                      type="submit"
                      size="lg" 
                      disabled={loading || !formData.scenario || !formData.prompt.trim()}
                      className="flex-1 gradient-lawyer hover:opacity-90 btn-press disabled:opacity-50"
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
                <div className="rounded-lg bg-lawyer/5 p-4 border border-lawyer/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-lawyer mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium text-lawyer mb-1">专业提示</div>
                      <div className="text-gray-600 dark:text-gray-400">
                        生成的提示词可直接用于ChatGPT、Claude、文心一言等主流AI助手。建议在使用前根据具体情况进行微调优化。
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