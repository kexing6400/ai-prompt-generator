'use client'

import { useState, useEffect } from 'react'
import { Crown, Zap, AlertCircle, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// 适配现有API数据结构
interface ApiSubscriptionData {
  subscription: {
    plan: string
    status: string
  }
  usage: {
    current: number
    limit: number
    remaining: number
    percentage: number
  }
  permissions: {
    canGenerate: boolean
  }
}

interface UsageIndicatorProps {
  className?: string
  showUpgradePrompt?: boolean
  onUpgrade?: () => void
  variant?: 'compact' | 'detailed' | 'floating'
}

export default function UsageIndicator({
  className,
  showUpgradePrompt = true,
  onUpgrade,
  variant = 'compact'
}: UsageIndicatorProps) {
  const [subscriptionData, setSubscriptionData] = useState<ApiSubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取使用情况数据
  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/subscription/current')

        if (!response.ok) {
          throw new Error('获取数据失败')
        }

        const apiResponse = await response.json()
        if (apiResponse.success && apiResponse.data) {
          setSubscriptionData(apiResponse.data)
        } else {
          throw new Error(apiResponse.error || '获取数据失败')
        }
      } catch (error) {
        console.error('Error fetching usage data:', error)
        setError(error instanceof Error ? error.message : '加载失败')
      } finally {
        setLoading(false)
      }
    }

    fetchUsageData()
  }, [])

  if (loading || error || !subscriptionData) {
    return null
  }

  const { subscription, usage } = subscriptionData
  const limit = usage.limit
  const used = usage.current
  const percentage = usage.percentage
  const remaining = usage.remaining
  
  const isLimitApproaching = limit !== -1 && percentage > 70
  const isLimitExceeded = limit !== -1 && used >= limit
  const shouldShowUpgrade = showUpgradePrompt && subscription.plan === 'free' && isLimitApproaching

  // 紧凑版本
  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {subscription.plan !== 'free' && (
          <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <Crown className="h-3 w-3 mr-1" />
            {subscription.plan === 'pro' ? '专业版' : '团队版'}
          </Badge>
        )}
        
        {limit !== -1 && (
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-blue-500" />
            <span className={cn(
              "font-medium",
              isLimitExceeded && "text-red-600",
              isLimitApproaching && !isLimitExceeded && "text-yellow-600"
            )}>
              {used}/{limit}
            </span>
            {shouldShowUpgrade && (
              <Button
                size="sm"
                variant="outline"
                onClick={onUpgrade}
                className="ml-2 text-xs h-6 px-2 border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                升级
              </Button>
            )}
          </div>
        )}
        
        {limit === -1 && (
          <Badge variant="outline" className="text-green-600 border-green-500">
            无限制
          </Badge>
        )}
      </div>
    )
  }

  // 详细版本
  if (variant === 'detailed') {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-500" />
                <span className="font-medium">本月使用量</span>
              </div>
              <Badge variant={subscription.plan === 'free' ? 'secondary' : 'default'}>
                {subscription.plan === 'free' ? '免费版' : subscription.plan === 'pro' ? '专业版' : '团队版'}
              </Badge>
            </div>

            {limit !== -1 ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span>已使用: {used} 次</span>
                  <span className={cn(
                    isLimitExceeded ? "text-red-600" : 
                    isLimitApproaching ? "text-yellow-600" : "text-gray-600"
                  )}>
                    剩余: {remaining} 次
                  </span>
                </div>
                
                <Progress 
                  value={percentage} 
                  className={cn(
                    "h-2",
                    percentage > 90 && "[&>div]:bg-red-500",
                    percentage > 70 && percentage <= 90 && "[&>div]:bg-yellow-500"
                  )}
                />

                <div className="text-xs text-gray-500 text-center">
                  {percentage.toFixed(0)}% 已使用
                </div>
              </>
            ) : (
              <div className="text-center text-green-600 font-medium">
                <span className="text-2xl">∞</span>
                <div className="text-sm">无限制使用</div>
              </div>
            )}

            {shouldShowUpgrade && (
              <div className="pt-3 border-t">
                <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-sm mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>使用量即将用完</span>
                </div>
                <Button
                  onClick={onUpgrade}
                  size="sm"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Crown className="mr-2 h-4 w-4" />
                  升级到专业版
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // 浮动版本
  if (variant === 'floating') {
    if (!shouldShowUpgrade && !isLimitExceeded) return null

    return (
      <div className={cn(
        "fixed bottom-4 right-4 z-50 max-w-sm",
        className
      )}>
        <Card className="shadow-lg border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center flex-shrink-0">
                {isLimitExceeded ? (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-yellow-600" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  {isLimitExceeded ? '使用量已用完' : '使用量即将用完'}
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                  {isLimitExceeded 
                    ? '您本月的免费额度已用完，升级可获得更多使用次数。'
                    : `您已使用了 ${percentage.toFixed(0)}% 的免费额度，升级可获得更多功能。`
                  }
                </p>
                
                <div className="flex gap-2">
                  <Button
                    onClick={onUpgrade}
                    size="sm"
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    立即升级
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // 隐藏浮动提示（可以添加本地存储记住用户选择）
                      const element = document.querySelector('[data-usage-floating]') as HTMLElement
                      if (element) element.style.display = 'none'
                    }}
                    className="text-yellow-700 hover:text-yellow-800"
                  >
                    暂不升级
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}