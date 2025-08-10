'use client'

import { useState, useEffect } from 'react'
import { X, Check, Crown, Zap, Users, CreditCard, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { SubscriptionPlan, BillingCycle } from '@/types/subscription'

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  selectedPlanId?: string
  onSuccess?: (planId: string) => void
}

export default function SubscriptionModal({
  isOpen,
  onClose,
  selectedPlanId = 'pro',
  onSuccess
}: SubscriptionModalProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState(selectedPlanId)
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // 获取订阅计划
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/subscription/plans')
        if (!response.ok) throw new Error('获取计划失败')
        
        const data = await response.json()
        setPlans(data.plans)
      } catch (error) {
        console.error('Error fetching plans:', error)
        setError(error instanceof Error ? error.message : '获取计划失败')
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      fetchPlans()
    }
  }, [isOpen])

  // 重置选中的计划
  useEffect(() => {
    setSelectedPlan(selectedPlanId)
  }, [selectedPlanId])

  const handleUpgrade = async () => {
    if (!selectedPlan || selectedPlan === 'free') return

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlan,
          billingCycle
        })
      })

      if (!response.ok) {
        throw new Error('升级失败，请稍后重试')
      }

      const data = await response.json()
      
      if (data.requiresPayment && data.paymentUrl) {
        // 重定向到Creem.io支付页面
        window.location.href = data.paymentUrl
      } else {
        // 升级成功
        onSuccess?.(selectedPlan)
        onClose()
      }
      
    } catch (error) {
      console.error('Upgrade error:', error)
      setError(error instanceof Error ? error.message : '升级失败')
    } finally {
      setIsProcessing(false)
    }
  }

  const getCurrentPlan = () => plans.find(p => p.id === selectedPlan)
  
  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'pro': return <Crown className="h-5 w-5" />
      case 'team': return <Users className="h-5 w-5" />
      default: return <Zap className="h-5 w-5" />
    }
  }

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'pro': return 'from-blue-500 to-purple-600'
      case 'team': return 'from-purple-600 to-pink-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const calculatePrice = (plan: SubscriptionPlan) => {
    if (!plan || plan.id === 'free') return 0
    return billingCycle === 'yearly' ? plan.price * 0.8 * 12 : plan.price
  }

  const currentPlan = getCurrentPlan()
  const finalPrice = calculatePrice(currentPlan!)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Crown className="h-4 w-4 text-white" />
            </div>
            升级订阅计划
          </DialogTitle>
          <DialogDescription>
            选择最适合您的计划，立即解锁更强大的功能
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* 计费周期选择 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">计费周期</Label>
              <RadioGroup
                value={billingCycle}
                onValueChange={(value) => setBillingCycle(value as BillingCycle)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="monthly" id="monthly" />
                  <Label htmlFor="monthly">月付</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yearly" id="yearly" />
                  <Label htmlFor="yearly" className="flex items-center gap-2">
                    年付
                    <Badge variant="secondary" className="text-xs">省20%</Badge>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* 计划选择 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">选择计划</Label>
              <RadioGroup
                value={selectedPlan}
                onValueChange={setSelectedPlan}
                className="grid gap-4"
              >
                {plans.filter(plan => plan.id !== 'free').map((plan) => (
                  <div key={plan.id} className="flex items-center space-x-3">
                    <RadioGroupItem value={plan.id} id={plan.id} />
                    <Label htmlFor={plan.id} className="flex-1 cursor-pointer">
                      <div className={cn(
                        "p-4 rounded-lg border-2 transition-all",
                        selectedPlan === plan.id 
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      )}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-8 w-8 rounded-lg flex items-center justify-center bg-gradient-to-r text-white",
                              getPlanColor(plan.id)
                            )}>
                              {getPlanIcon(plan.id)}
                            </div>
                            <div>
                              <h3 className="font-semibold">{plan.name}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {plan.description}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">
                              ¥{calculatePrice(plan)}
                            </div>
                            <div className="text-sm text-gray-500">
                              /{billingCycle === 'yearly' ? '年' : '月'}
                            </div>
                          </div>
                        </div>
                        
                        {/* 功能列表 */}
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          {plan.features.slice(0, 4).map((feature, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {feature}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* 价格总结 */}
            {currentPlan && currentPlan.id !== 'free' && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">订阅计划:</span>
                  <span>{currentPlan.name}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">计费周期:</span>
                  <span>{billingCycle === 'yearly' ? '年付' : '月付'}</span>
                </div>
                {billingCycle === 'yearly' && (
                  <div className="flex items-center justify-between mb-2 text-green-600">
                    <span className="font-medium">优惠折扣:</span>
                    <span>-20%</span>
                  </div>
                )}
                <hr className="my-2 border-gray-200 dark:border-gray-700" />
                <div className="flex items-center justify-between font-bold text-lg">
                  <span>总计:</span>
                  <span>¥{finalPrice}</span>
                </div>
              </div>
            )}

            {/* 错误信息 */}
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isProcessing}
              >
                取消
              </Button>
              <Button
                onClick={handleUpgrade}
                disabled={!selectedPlan || selectedPlan === 'free' || isProcessing}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    处理中...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    立即升级
                  </>
                )}
              </Button>
            </div>

            {/* 安全保障 */}
            <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2 border-t">
              🔒 安全支付 | 30天退款保证 | 随时可以取消订阅
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}