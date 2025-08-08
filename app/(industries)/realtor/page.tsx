'use client'

import { useState, useEffect } from 'react'
import { 
  Home, 
  TrendingUp, 
  Users, 
  MapPin, 
  DollarSign,
  CheckCircle,
  ArrowRight,
  Sparkles,
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

const templateCategories = [
  {
    id: 'market-analysis',
    name: '市场分析',
    description: '深度市场研究，价格趋势分析，区域对比',
    icon: TrendingUp,
    templates: [
      '区域房价走势分析',
      '市场供需关系评估', 
      '投资回报率计算',
      '竞品楼盘对比'
    ],
    popular: true
  },
  {
    id: 'client-consultation',
    name: '客户咨询',
    description: '专业客户服务，需求匹配，购房建议',
    icon: Users,
    templates: [
      '购房需求分析',
      '客户画像构建',
      '房源推荐逻辑',
      '投资风险评估'
    ]
  },
  {
    id: 'property-description',
    name: '房源描述',
    description: '吸引人的房源文案，专业描述模板',
    icon: Home,
    templates: [
      '房源卖点提炼',
      '朋友圈文案生成',
      '房源详情描述',
      '户型优势分析'
    ]
  },
  {
    id: 'location-analysis',
    name: '地段分析',
    description: '周边配套分析，交通便利性，发展潜力',
    icon: MapPin,
    templates: [
      '周边配套梳理',
      '交通便利性评估',
      '学区房价值分析',
      '区域发展前景'
    ]
  }
]

const successMetrics = [
  { label: '服务经纪人', value: '1,800+', icon: Users },
  { label: '生成提示词', value: '12万+', icon: Sparkles },
  { label: '成交提升', value: '45%', icon: TrendingUp },
  { label: '客户满意度', value: '96%', icon: CheckCircle },
]

export default function RealtorWorkspace() {
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
  } = usePromptGenerator('realtor')

  const [wordCount, setWordCount] = useState(0)
  const examples = industryExamples.realtor

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
    <div className="min-h-screen bg-gradient-to-br from-realtor/5 via-white to-realtor/10 dark:from-gray-900 dark:via-realtor/5 dark:to-gray-900">
      
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />
        <div className="absolute right-0 top-0 -z-10 blur-3xl">
          <div className="aspect-square w-96 bg-gradient-to-br from-realtor/20 to-realtor-dark/20 opacity-60" />
        </div>

        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-2xl gradient-realtor flex items-center justify-center">
              <Home className="h-10 w-10 text-white" />
            </div>
            
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                房产经纪人AI工作台
              </h1>
              <p className="mt-2 text-xl text-gray-600 dark:text-gray-300">
                专业房地产AI助手，让您的房产服务更专业、更高效
              </p>
              
              <nav className="mt-4 flex items-center space-x-2 text-sm text-gray-500">
                <a href="/" className="hover:text-realtor">首页</a>
                <span>/</span>
                <span className="text-realtor">房产工作台</span>
              </nav>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
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
                      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-realtor/50 ${
                        category.popular ? 'ring-2 ring-realtor/20 border-realtor/30' : ''
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg gradient-realtor flex items-center justify-center">
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {category.name}
                              {category.popular && (
                                <span className="text-xs bg-realtor/10 text-realtor px-2 py-1 rounded-full">
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
                              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-realtor cursor-pointer transition-colors"
                            >
                              <div className="h-1.5 w-1.5 rounded-full bg-realtor/40" />
                              {template}
                            </div>
                          ))}
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-4 hover:bg-realtor hover:text-white"
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

          <div className="lg:col-span-2">
            <Card className="shadow-xl border-2 border-gray-100 dark:border-gray-700">
              <CardHeader className="bg-gradient-to-r from-realtor/10 to-realtor-dark/10">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-realtor" />
                  智能提示词生成器
                </CardTitle>
                <CardDescription className="text-base">
                  填写下方表单信息，我们将为您生成专业的房地产AI提示词
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 p-6">
                <form onSubmit={onSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="scenario" className="text-base font-medium">
                    房产服务场景 *
                  </Label>
                  <select 
                    id="scenario"
                    value={formData.scenario}
                    onChange={(e) => updateFormData('scenario', e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-realtor/20 focus-visible:ring-offset-2"
                    required
                  >
                    <option value="">请选择您的房产服务场景</option>
                    <option value="selling">房屋销售</option>
                    <option value="buying">购房咨询</option>
                    <option value="investment">投资建议</option>
                    <option value="market-research">市场研究</option>
                    <option value="property-evaluation">房产评估</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requirements" className="text-base font-medium">
                    具体需求描述 *
                  </Label>
                  <Textarea
                    id="requirements"
                    value={formData.prompt}
                    onChange={(e) => updateFormData('prompt', e.target.value)}
                    placeholder="请详细描述您希望AI助手帮您完成的具体工作，如：分析某个区域的房价走势，为客户推荐合适的投资房产..."
                    className="min-h-[120px] resize-none"
                    required
                  />
                  <div className="text-sm text-gray-500">
                    建议：详细描述房产类型、地理位置、价格区间、目标客户等信息
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="property-type" className="text-base font-medium">
                      主要房产类型
                    </Label>
                    <select 
                      id="property-type"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-realtor/20 focus-visible:ring-offset-2"
                    >
                      <option value="">请选择房产类型</option>
                      <option value="residential">住宅</option>
                      <option value="commercial">商业地产</option>
                      <option value="office">写字楼</option>
                      <option value="land">土地</option>
                      <option value="mixed">综合地产</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience" className="text-base font-medium">
                      从业经验
                    </Label>
                    <select 
                      id="experience"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-realtor/20 focus-visible:ring-offset-2"
                    >
                      <option value="">请选择从业年限</option>
                      <option value="1-2">1-2年</option>
                      <option value="3-5">3-5年</option>
                      <option value="5-10">5-10年</option>
                      <option value="10+">10年以上</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="output-format" className="text-base font-medium">
                    期望输出格式
                  </Label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {['市场报告', '客户建议', '房源文案', '投资分析'].map((format) => (
                      <label key={format} className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-realtor focus:ring-realtor/20"
                        />
                        <span className="text-sm">{format}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <Button 
                    type="submit"
                    disabled={loading}
                    size="lg" 
                    className="flex-1 gradient-realtor hover:opacity-90 btn-press"
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    {loading ? '生成中...' : '生成专业提示词'}
                  </Button>
                  <Button variant="outline" size="lg" type="button" onClick={() => saveDraft()}>
                    保存草稿
                  </Button>
                </div>
                </form>

                <div className="rounded-lg bg-realtor/5 p-4 border border-realtor/20">
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-realtor mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium text-realtor mb-1">房产专业提示</div>
                      <div className="text-gray-600 dark:text-gray-400">
                        生成的提示词专门针对房地产行业优化，包含专业术语和行业最佳实践，可直接应用于客户沟通和市场分析。
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {successMetrics.map((metric) => {
                const IconComponent = metric.icon
                return (
                  <Card key={metric.label} className="text-center p-4">
                    <div className="h-10 w-10 rounded-lg gradient-realtor flex items-center justify-center mx-auto mb-3">
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