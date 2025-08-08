'use client'

import { useState, useEffect } from 'react'
import { 
  Shield, 
  Heart, 
  AlertCircle, 
  FileCheck, 
  CheckCircle,
  ArrowRight,
  Sparkles,
  Users,
  TrendingUp,
  DollarSign,
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

// 保险顾问专用模板分类
const templateCategories = [
  {
    id: 'risk-assessment',
    name: '风险评估',
    description: '客户风险分析，保障需求评估',
    icon: AlertCircle,
    templates: [
      '个人风险状况分析',
      '家庭保障缺口评估', 
      '职业风险评估',
      '健康风险分析'
    ],
    popular: true
  },
  {
    id: 'product-recommendation',
    name: '产品推荐',
    description: '精准产品匹配，个性化方案设计',
    icon: Shield,
    templates: [
      '保险产品对比分析',
      '个性化保险方案',
      '保费预算规划',
      '产品组合优化'
    ]
  },
  {
    id: 'claims-guidance',
    name: '理赔指导',
    description: '理赔流程指导，材料准备建议',
    icon: FileCheck,
    templates: [
      '理赔材料清单',
      '理赔流程指导',
      '理赔注意事项',
      '理赔争议处理'
    ]
  },
  {
    id: 'client-education',
    name: '客户教育',
    description: '保险知识普及，风险意识培养',
    icon: Heart,
    templates: [
      '保险基础知识讲解',
      '保单条款解读',
      '风险防范建议',
      '保险误区澄清'
    ]
  }
]

// 成功案例数据
const successMetrics = [
  { label: '服务顾问', value: '1,500+', icon: Users },
  { label: '生成提示词', value: '10万+', icon: Sparkles },
  { label: '签单提升', value: '58%', icon: TrendingUp },
  { label: '客户满意度', value: '94%', icon: CheckCircle },
]

export default function InsuranceWorkspace() {
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
  } = usePromptGenerator('insurance')

  const [wordCount, setWordCount] = useState(0)
  const examples = industryExamples.insurance

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
    <div className="min-h-screen bg-gradient-to-br from-insurance/5 via-white to-insurance/10 dark:from-gray-900 dark:via-insurance/5 dark:to-gray-900">
      
      {/* Header Section - 页面头部 */}
      <section className="relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />
        <div className="absolute right-0 top-0 -z-10 blur-3xl">
          <div className="aspect-square w-96 bg-gradient-to-br from-insurance/20 to-insurance-dark/20 opacity-60" />
        </div>

        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            {/* 行业图标 */}
            <div className="h-20 w-20 rounded-2xl gradient-insurance flex items-center justify-center">
              <Shield className="h-10 w-10 text-white" />
            </div>
            
            {/* 标题信息 */}
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                保险顾问AI工作台
              </h1>
              <p className="mt-2 text-xl text-gray-600 dark:text-gray-300">
                专业保险AI助手，让保险服务更贴心、更专业
              </p>
              
              {/* 面包屑导航 */}
              <nav className="mt-4 flex items-center space-x-2 text-sm text-gray-500">
                <a href="/" className="hover:text-insurance">首页</a>
                <span>/</span>
                <span className="text-insurance">保险工作台</span>
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
                      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-insurance/50 ${
                        category.popular ? 'ring-2 ring-insurance/20 border-insurance/30' : ''
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg gradient-insurance flex items-center justify-center">
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {category.name}
                              {category.popular && (
                                <span className="text-xs bg-insurance/10 text-insurance px-2 py-1 rounded-full">
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
                              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-insurance cursor-pointer transition-colors"
                            >
                              <div className="h-1.5 w-1.5 rounded-full bg-insurance/40" />
                              {template}
                            </div>
                          ))}
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-4 hover:bg-insurance hover:text-white"
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
              <CardHeader className="bg-gradient-to-r from-insurance/10 to-insurance-dark/10">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-insurance" />
                  智能提示词生成器
                </CardTitle>
                <CardDescription className="text-base">
                  填写下方表单信息，我们将为您生成专业的保险AI提示词
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 p-6">
                <form onSubmit={onSubmit} className="space-y-6">
                  {/* 服务场景选择 */}
                  <div className="space-y-2">
                    <Label htmlFor="scenario" className="text-base font-medium">
                      保险服务场景 *
                    </Label>
                    <select 
                      id="scenario"
                      value={formData.scenario}
                      onChange={(e) => updateFormData('scenario', e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-insurance/20 focus-visible:ring-offset-2"
                      required
                    >
                      <option value="">请选择您的保险服务场景</option>
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
                      placeholder="请详细描述您希望AI助手帮您完成的具体保险工作，如：为一个30岁的IT工程师家庭制定全面的保险保障方案..."
                      className="min-h-[120px] resize-none"
                      required
                    />
                    <div className="text-sm text-gray-500">
                      建议：详细描述客户背景、保险需求、预算范围、关注重点等信息
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
                      placeholder="提供更多背景信息，如：客户年龄、职业、家庭结构、现有保险、特殊需求等..."
                      className="min-h-[80px] resize-none"
                    />
                  </div>

                  {/* 示例提示词 */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-insurance" />
                      快速开始 - 选择示例场景
                    </Label>
                    <div className="grid gap-3">
                      {examples.examples.map((example, index) => (
                        <Card 
                          key={index} 
                          className="cursor-pointer hover:border-insurance/50 transition-colors"
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

                {/* 专业背景 */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="insurance-type" className="text-base font-medium">
                      主营保险类型
                    </Label>
                    <select 
                      id="insurance-type"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-insurance/20 focus-visible:ring-offset-2"
                    >
                      <option value="">请选择主营保险类型</option>
                      <option value="life">人寿保险</option>
                      <option value="health">健康保险</option>
                      <option value="property">财产保险</option>
                      <option value="auto">车险</option>
                      <option value="travel">旅行保险</option>
                      <option value="business">商业保险</option>
                      <option value="comprehensive">综合保险</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience" className="text-base font-medium">
                      从业经验
                    </Label>
                    <select 
                      id="experience"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-insurance/20 focus-visible:ring-offset-2"
                    >
                      <option value="">请选择从业年限</option>
                      <option value="1-2">1-2年</option>
                      <option value="3-5">3-5年</option>
                      <option value="5-10">5-10年</option>
                      <option value="10+">10年以上</option>
                    </select>
                  </div>
                </div>

                {/* 服务特色 */}
                <div className="space-y-2">
                  <Label htmlFor="service-focus" className="text-base font-medium">
                    服务特色重点
                  </Label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {['风险管理', '理财规划', '家庭保障', '企业保险'].map((focus) => (
                      <label key={focus} className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-insurance focus:ring-insurance/20"
                        />
                        <span className="text-sm">{focus}</span>
                      </label>
                    ))}
                  </div>
                </div>

                  {/* 生成按钮 */}
                  <div className="flex gap-4 pt-6">
                    <Button 
                      type="submit"
                      size="lg" 
                      disabled={loading || !formData.scenario || !formData.prompt.trim()}
                      className="flex-1 gradient-insurance hover:opacity-90 btn-press disabled:opacity-50"
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
                <div className="rounded-lg bg-insurance/5 p-4 border border-insurance/20">
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-insurance mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium text-insurance mb-1">专业保险提示</div>
                      <div className="text-gray-600 dark:text-gray-400">
                        生成的提示词结合了保险行业专业知识和客户服务经验，帮助您提供更精准的保险建议和更贴心的服务体验。
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
                    <div className="h-10 w-10 rounded-lg gradient-insurance flex items-center justify-center mx-auto mb-3">
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