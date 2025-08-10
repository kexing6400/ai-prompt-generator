'use client'

import { useState, useEffect } from 'react'
import { Calendar, TrendingUp, Zap, Crown, Users, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { 
  UserSubscription, 
  UsageStats,
  SubscriptionPlan 
} from '@/types/subscription'

interface UserDashboardProps {
  className?: string
  onUpgrade?: () => void
}

export default function UserDashboard({ 
  className,
  onUpgrade 
}: UserDashboardProps) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取用户订阅信息
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        
        // 并行请求所有数据
        const [subscriptionRes, usageRes, plansRes] = await Promise.all([
          fetch('/api/subscription/current'),
          fetch('/api/subscription/usage'),
          fetch('/api/subscription/plans')
        ])

        if (!subscriptionRes.ok || !usageRes.ok || !plansRes.ok) {
          throw new Error('获取数据失败')
        }

        const [subscriptionData, usageData, plansData] = await Promise.all([
          subscriptionRes.json(),
          usageRes.json(), 
          plansRes.json()
        ])

        setSubscription(subscriptionData)
        setUsage(usageData)
        setPlans(plansData.plans)
        
      } catch (error) {
        console.error('Error fetching user data:', error)
        setError(error instanceof Error ? error.message : '加载失败')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const getPlanInfo = (planId: string) => {
    return plans.find(p => p.id === planId)
  }

  const getUsagePercentage = () => {
    if (!subscription || !usage) return 0
    const plan = getPlanInfo(subscription.planId)
    if (!plan) return 0
    const limit = plan.monthlyQuota
    if (limit === -1) return 0 // 无限制
    return Math.min((usage.currentMonth.generations / limit) * 100, 100)
  }

  const getRemainingGenerations = () => {
    if (!subscription || !usage) return 0
    const plan = getPlanInfo(subscription.planId)
    if (!plan) return 0
    const limit = plan.monthlyQuota
    if (limit === -1) return Infinity
    return Math.max(limit - usage.currentMonth.generations, 0)
  }

  const getNextBillingDate = () => {
    if (!subscription || subscription.planType === 'free') return null
    return new Date(subscription.currentPeriodEnd).toLocaleDateString('zh-CN')
  }

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free': return <Zap className="h-5 w-5" />
      case 'pro': return <Crown className="h-5 w-5" />
      case 'team': return <Users className="h-5 w-5" />
      default: return <Zap className="h-5 w-5" />
    }
  }

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'free': return 'bg-gray-500'
      case 'pro': return 'bg-gradient-to-r from-blue-500 to-purple-600'  
      case 'team': return 'bg-gradient-to-r from-purple-600 to-pink-600'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="animate-pulse">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-semibold">加载失败</h3>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <Button onClick={() => window.location.reload()}>
            重新加载
          </Button>
        </div>
      </div>
    )
  }

  if (!subscription || !usage) {
    return null
  }

  const currentPlan = getPlanInfo(subscription.planId)
  const usagePercentage = getUsagePercentage()
  const remainingGenerations = getRemainingGenerations()
  const nextBillingDate = getNextBillingDate()

  return (
    <div className={cn("space-y-6", className)}>
      
      {/* 当前计划概览 */}
      <Card className="overflow-hidden">
        <CardHeader className={cn("text-white", getPlanColor(subscription.planId))}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                {getPlanIcon(subscription.planId)}
              </div>
              <div>
                <CardTitle className="text-white">{currentPlan?.name || '未知计划'}</CardTitle>
                <p className="text-white/80 text-sm">{currentPlan?.description}</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              {subscription.status === 'active' ? '有效' : '已暂停'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 使用情况 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">本月使用量</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {usage.currentMonth.generations} / {currentPlan?.monthlyQuota === -1 ? '无限制' : currentPlan?.monthlyQuota}
                </span>
              </div>
              <Progress 
                value={usagePercentage} 
                className={cn(
                  "h-2",
                  usagePercentage > 80 && "bg-red-100",
                  usagePercentage > 60 && usagePercentage <= 80 && "bg-yellow-100"
                )}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {remainingGenerations === Infinity 
                  ? '无限制使用' 
                  : `剩余 ${remainingGenerations} 次生成`}
              </p>
            </div>

            {/* 计费信息 */}
            <div className="space-y-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                计费信息
              </span>
              {subscription.planType === 'free' ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  永远免费使用
                </p>
              ) : (
                <div className="space-y-1">
                  <p className="text-lg font-semibold">
                    ¥{currentPlan?.priceMonthly ? (currentPlan.priceMonthly / 100).toFixed(2) : '0.00'}/月
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    下次扣费：{nextBillingDate}
                  </p>
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="space-y-2">
              <span className="text-sm font-medium">操作</span>
              <div className="flex flex-col gap-2">
                {subscription.planType === 'free' && (
                  <Button 
                    onClick={onUpgrade}
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    升级到专业版
                  </Button>
                )}
                {subscription.planType !== 'free' && (
                  <Button variant="outline" size="sm">
                    管理订阅
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 使用统计 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        
        {/* 本月生成次数 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月生成</CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.currentMonth.generations}</div>
            <p className="text-xs text-muted-foreground">
              本月使用量
            </p>
          </CardContent>
        </Card>

        {/* 本月文档数 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月文档</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.currentMonth.documents}</div>
            <p className="text-xs text-muted-foreground">
              处理文档数
            </p>
          </CardContent>
        </Card>

        {/* 总使用次数 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总计使用</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.totalUsage}</div>
            <p className="text-xs text-muted-foreground">
              累计生成次数
            </p>
          </CardContent>
        </Card>

        {/* Token使用量 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token使用</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.currentMonth.tokens}</div>
            <p className="text-xs text-muted-foreground">
              本月Token使用量
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 升级提示 */}
      {subscription.planType === 'free' && usagePercentage > 60 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                  使用量即将用完
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  您已使用了本月 {usagePercentage.toFixed(0)}% 的免费额度。升级到专业版可获得更多生成次数和高级功能。
                </p>
              </div>
              <Button 
                onClick={onUpgrade}
                size="sm"
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                立即升级
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}