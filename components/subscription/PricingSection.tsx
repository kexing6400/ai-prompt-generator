'use client'

import { useState } from 'react'
import { Check, Star, Zap, Users, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PricingTier {
  id: string
  name: string
  price: number
  period: string
  description: string
  features: string[]
  limitations?: string[]
  highlight?: boolean
  popular?: boolean
  buttonText: string
  icon: React.ReactNode
}

const pricingTiers: PricingTier[] = [
  {
    id: 'free',
    name: '免费版',
    price: 0,
    period: '永远免费',
    description: '完整核心功能，适合个人使用和试用',
    features: [
      '50次/月 AI提示词生成',
      '50+ 专业模板免费使用',
      '文档下载 (.md/.txt/PDF)',
      '基础历史记录 (最近10条)',
      '社区支持',
      '永远免费，无隐藏费用'
    ],
    limitations: ['月生成次数限制', '基础模板库'],
    buttonText: '立即开始使用',
    icon: <Sparkles className="h-5 w-5" />
  },
  {
    id: 'pro',
    name: '专业版',
    price: 4.99,
    period: '/月',
    description: '解锁高级功能，提升工作效率',
    features: [
      '500次/月 AI提示词生成',
      '100+ 高级专业模板',
      '无限历史记录与云同步',
      '批量生成与导出',
      '个性化品牌定制',
      'AI个性化学习',
      '优先客户支持',
      '使用分析报告'
    ],
    highlight: true,
    popular: true,
    buttonText: '升级到专业版',
    icon: <Zap className="h-5 w-5" />
  },
  {
    id: 'team',
    name: '团队版',
    price: 19.99,
    period: '/月',
    description: '团队协作，无限制使用',
    features: [
      '无限次数 AI生成',
      '全部高级模板库',
      '5个团队成员席位',
      '团队协作与共享',
      '高级合规检查',
      '团队使用分析',
      '专属客户成功经理',
      'API集成支持',
      '企业级安全保障'
    ],
    buttonText: '联系团队销售',
    icon: <Users className="h-5 w-5" />
  }
]

interface PricingSectionProps {
  className?: string
  currentPlan?: string
  onUpgrade?: (planId: string) => void
}

export default function PricingSection({ 
  className, 
  currentPlan = 'free',
  onUpgrade 
}: PricingSectionProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const handleUpgrade = (planId: string) => {
    if (onUpgrade) {
      onUpgrade(planId)
    } else {
      // 默认行为：打开订阅模态框或跳转到付费页面
      console.log('Upgrade to:', planId)
    }
  }

  return (
    <section className={cn("py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800", className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Star className="h-4 w-4" />
            简单定价，强大功能
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            选择最适合您的计划
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            从免费开始，随业务增长升级。所有计划都包含核心AI提示词生成功能。
          </p>
        </div>

        {/* 计费周期切换 */}
        <div className="flex items-center justify-center mb-8">
          <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg inline-flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                billingCycle === 'monthly'
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              月付
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all relative",
                billingCycle === 'yearly'
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              年付
              <Badge variant="secondary" className="ml-2 text-xs">省20%</Badge>
            </button>
          </div>
        </div>

        {/* 定价卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier) => (
            <Card 
              key={tier.id} 
              className={cn(
                "relative overflow-hidden transition-all duration-300 hover:shadow-lg",
                tier.highlight && "ring-2 ring-blue-500 dark:ring-blue-400 shadow-lg scale-105",
                currentPlan === tier.id && "border-green-500 dark:border-green-400"
              )}
            >
              {tier.popular && (
                <div className="absolute top-0 left-0 right-0">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center py-2 px-4">
                    <span className="text-sm font-medium">🔥 最受欢迎</span>
                  </div>
                </div>
              )}

              <CardHeader className={cn("text-center", tier.popular && "pt-12")}>
                <div className="flex items-center justify-center mb-4">
                  <div className={cn(
                    "h-12 w-12 rounded-lg flex items-center justify-center",
                    tier.id === 'free' && "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
                    tier.id === 'pro' && "bg-gradient-to-r from-blue-500 to-purple-600 text-white",
                    tier.id === 'team' && "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  )}>
                    {tier.icon}
                  </div>
                </div>

                <CardTitle className="text-xl font-bold mb-2">{tier.name}</CardTitle>
                
                <div className="mb-4">
                  <span className="text-4xl font-bold">
                    {tier.price === 0 ? '免费' : `¥${tier.price}`}
                  </span>
                  {tier.price > 0 && billingCycle === 'yearly' && (
                    <span className="text-2xl font-bold text-green-600 ml-2">
                      ¥{(tier.price * 0.8).toFixed(2)}
                    </span>
                  )}
                  <span className="text-gray-600 dark:text-gray-400 ml-1">
                    {tier.period}
                  </span>
                </div>

                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {tier.description}
                </p>
              </CardHeader>

              <CardContent className="pt-0">
                <Button
                  onClick={() => handleUpgrade(tier.id)}
                  disabled={currentPlan === tier.id}
                  className={cn(
                    "w-full mb-6",
                    tier.id === 'free' && "bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100",
                    tier.id === 'pro' && "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700",
                    tier.id === 'team' && "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
                    currentPlan === tier.id && "bg-green-500 hover:bg-green-600"
                  )}
                  size="lg"
                >
                  {currentPlan === tier.id ? '当前计划' : tier.buttonText}
                </Button>

                <div className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </div>
                  ))}

                  {tier.limitations && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">限制：</p>
                      {tier.limitations.map((limitation, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <span className="h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="h-1 w-1 bg-gray-400 rounded-full"></span>
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {limitation}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 底部说明 */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
            🔒 所有计划都包含企业级安全保护 | 📧 24小时内邮件支持 | 🚀 随时可以升级或降级
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <span>✅ 无长期合约</span>
            <span>✅ 30天退款保证</span>
            <span>✅ 随时取消</span>
          </div>
        </div>
      </div>
    </section>
  )
}