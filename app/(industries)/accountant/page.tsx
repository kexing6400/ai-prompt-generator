'use client'

import { useState, useEffect } from 'react'
import { 
  Calculator, 
  PieChart, 
  Receipt, 
  FileSpreadsheet, 
  CheckCircle,
  ArrowRight,
  Sparkles,
  Users,
  TrendingUp,
  BarChart3,
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

// 会计师专用模板分类
const templateCategories = [
  {
    id: 'financial-analysis',
    name: '财务分析',
    description: '深度财务数据分析，经营状况评估',
    icon: PieChart,
    templates: [
      '财务比率分析',
      '现金流分析报告', 
      '盈利能力评估',
      '财务风险识别'
    ],
    popular: true
  },
  {
    id: 'tax-planning',
    name: '税务规划',
    description: '税务筹划建议，合规优化方案',
    icon: Receipt,
    templates: [
      '税务筹划方案',
      '税收优化建议',
      '合规风险评估',
      '税务申报指导'
    ]
  },
  {
    id: 'audit-support',
    name: '审计支持',
    description: '审计程序设计，风险控制评估',
    icon: CheckCircle,
    templates: [
      '审计程序设计',
      '内控制度评估',
      '风险点识别',
      '审计报告撰写'
    ]
  },
  {
    id: 'report-interpretation',
    name: '报表解读',
    description: '财务报表分析，经营指标解释',
    icon: FileSpreadsheet,
    templates: [
      '资产负债表分析',
      '利润表深度解读',
      '现金流量表分析',
      '财务指标解释'
    ]
  }
]

// 成功案例数据
const successMetrics = [
  { label: '服务会计师', value: '2,100+', icon: Users },
  { label: '生成提示词', value: '13万+', icon: Sparkles },
  { label: '效率提升', value: '72%', icon: TrendingUp },
  { label: '准确率', value: '97%', icon: BarChart3 },
]

export default function AccountantWorkspace() {
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
  } = usePromptGenerator('accountant')

  const [wordCount, setWordCount] = useState(0)
  const examples = industryExamples.accountant

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
    <div className="min-h-screen bg-gradient-to-br from-accountant/5 via-white to-accountant/10 dark:from-gray-900 dark:via-accountant/5 dark:to-gray-900">
      
      {/* Header Section - 页面头部 */}
      <section className="relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />
        <div className="absolute right-0 top-0 -z-10 blur-3xl">
          <div className="aspect-square w-96 bg-gradient-to-br from-accountant/20 to-accountant-dark/20 opacity-60" />
        </div>

        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            {/* 行业图标 */}
            <div className="h-20 w-20 rounded-2xl gradient-accountant flex items-center justify-center">
              <Calculator className="h-10 w-10 text-white" />
            </div>
            
            {/* 标题信息 */}
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                会计师AI工作台
              </h1>
              <p className="mt-2 text-xl text-gray-600 dark:text-gray-300">
                专业财务AI助手，让财务工作更精准、更高效
              </p>
              
              {/* 面包屑导航 */}
              <nav className="mt-4 flex items-center space-x-2 text-sm text-gray-500">
                <a href="/" className="hover:text-accountant">首页</a>
                <span>/</span>
                <span className="text-accountant">会计工作台</span>
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
                      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-accountant/50 ${
                        category.popular ? 'ring-2 ring-accountant/20 border-accountant/30' : ''
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg gradient-accountant flex items-center justify-center">
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {category.name}
                              {category.popular && (
                                <span className="text-xs bg-accountant/10 text-accountant px-2 py-1 rounded-full">
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
                              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-accountant cursor-pointer transition-colors"
                            >
                              <div className="h-1.5 w-1.5 rounded-full bg-accountant/40" />
                              {template}
                            </div>
                          ))}
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-4 hover:bg-accountant hover:text-white"
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
              <CardHeader className="bg-gradient-to-r from-accountant/10 to-accountant-dark/10">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-accountant" />
                  智能提示词生成器
                </CardTitle>
                <CardDescription className="text-base">
                  填写下方表单信息，我们将为您生成专业的财务AI提示词
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 p-6">
                <form onSubmit={onSubmit} className="space-y-6">
                  {/* 财务场景选择 */}
                  <div className="space-y-2">
                    <Label htmlFor="scenario" className="text-base font-medium">
                      财务工作场景 *
                    </Label>
                    <select 
                      id="scenario"
                      value={formData.scenario}
                      onChange={(e) => updateFormData('scenario', e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accountant/20 focus-visible:ring-offset-2"
                      required
                    >
                      <option value="">请选择您的财务工作场景</option>
                      {examples.scenarios.map(scenario => (
                        <option key={scenario.value} value={scenario.value}>
                          {scenario.label}
                        </option>
                      ))}
                    </select>
                  </div>

                {/* 具体需求描述 */}
                <div className="space-y-2">
                  <Label htmlFor="requirements" className="text-base font-medium">
                    具体需求描述 *
                  </Label>
                  <Textarea
                    id="requirements"
                    industry="accountant"
                    placeholder="请详细描述您希望AI助手帮您完成的具体财务工作，如：分析一家制造业企业的财务报表，识别潜在的财务风险和改善建议..."
                    className="min-h-[120px] resize-none"
                  />
                  <div className="text-sm text-gray-500">
                    建议：详细描述企业规模、行业类型、分析重点、期望输出格式等信息
                  </div>
                </div>

                {/* 专业背景 */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="specialization" className="text-base font-medium">
                      专业领域
                    </Label>
                    <select 
                      id="specialization"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accountant/20 focus-visible:ring-offset-2"
                    >
                      <option value="">请选择专业领域</option>
                      <option value="financial-accounting">财务会计</option>
                      <option value="management-accounting">管理会计</option>
                      <option value="tax-accounting">税务会计</option>
                      <option value="audit">审计</option>
                      <option value="financial-management">财务管理</option>
                      <option value="cost-accounting">成本会计</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience" className="text-base font-medium">
                      执业经验
                    </Label>
                    <select 
                      id="experience"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accountant/20 focus-visible:ring-offset-2"
                    >
                      <option value="">请选择执业年限</option>
                      <option value="1-3">1-3年</option>
                      <option value="3-5">3-5年</option>
                      <option value="5-10">5-10年</option>
                      <option value="10+">10年以上</option>
                    </select>
                  </div>
                </div>

                {/* 行业重点 */}
                <div className="space-y-2">
                  <Label htmlFor="industry-focus" className="text-base font-medium">
                    行业服务重点
                  </Label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {['制造业', '服务业', '零售业', '科技业'].map((industry) => (
                      <label key={industry} className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-accountant focus:ring-accountant/20"
                        />
                        <span className="text-sm">{industry}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 生成按钮 */}
                <div className="flex gap-4 pt-6">
                  <Button 
                    size="lg" 
                    className="flex-1 gradient-accountant hover:opacity-90 btn-press"
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    生成专业提示词
                  </Button>
                  <Button variant="outline" size="lg">
                    保存草稿
                  </Button>
                </div>

                {/* 使用提示 */}
                <div className="rounded-lg bg-accountant/5 p-4 border border-accountant/20">
                  <div className="flex items-start gap-3">
                    <BarChart3 className="h-5 w-5 text-accountant mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium text-accountant mb-1">专业财务提示</div>
                      <div className="text-gray-600 dark:text-gray-400">
                        生成的提示词遵循会计准则和财务规范，结合了实务经验和专业判断，可直接应用于日常财务工作中。
                      </div>
                    </div>
                  </div>
                </div>
                </form>
              </CardContent>
            </Card>

            {/* 成功数据展示 */}
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {successMetrics.map((metric) => {
                const IconComponent = metric.icon
                return (
                  <Card key={metric.label} className="text-center p-4">
                    <div className="h-10 w-10 rounded-lg gradient-accountant flex items-center justify-center mx-auto mb-3">
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