/**
 * 订阅计划API端点
 * 
 * GET /api/subscription/plans
 * 返回所有可用的订阅计划信息，包括定价、功能权限等
 */

import { NextRequest, NextResponse } from 'next/server'
import { getActivePlans, getPlanComparisonData } from '@/lib/subscription/plans'
import { subscriptionManager, createSubscriptionErrorResponse } from '@/lib/subscription'
import { SubscriptionPlansResponse } from '@/types/subscription'

/**
 * 获取订阅计划列表
 * 
 * 支持查询参数：
 * - userEmail: 用户邮箱，用于获取当前用户的订阅状态
 * - comparison: 是否返回比较数据格式 (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('userEmail')
    const returnComparison = searchParams.get('comparison') === 'true'

    // 获取所有激活的订阅计划
    const plans = getActivePlans()
    
    if (plans.length === 0) {
      return NextResponse.json(
        createSubscriptionErrorResponse(
          'PLAN_NOT_FOUND',
          'No active subscription plans available'
        ),
        { status: 404 }
      )
    }

    // 如果请求比较数据格式
    if (returnComparison) {
      const comparisonData = getPlanComparisonData()
      return NextResponse.json({
        success: true,
        data: {
          plans: comparisonData,
          totalPlans: comparisonData.length,
        },
        timestamp: new Date().toISOString()
      })
    }

    // 获取用户当前订阅状态 (如果提供了userEmail)
    let currentUserPlan = undefined
    if (userEmail) {
      try {
        const userStatus = await subscriptionManager.subscription.getUserSubscriptionStatus(userEmail)
        currentUserPlan = userStatus.subscriptionType
      } catch (error) {
        console.warn('Failed to get user subscription status:', error)
        // 不影响计划列表的返回，只是无法显示当前用户状态
      }
    }

    // 构造响应数据
    const response: SubscriptionPlansResponse = {
      plans: plans.map(plan => ({
        ...plan,
        // 添加显示用的价格格式
        priceDisplay: plan.priceMonthly === 0 
          ? 'Free' 
          : `$${(plan.priceMonthly / 100).toFixed(2)}`,
        
        // 添加配额显示格式
        quotaDisplay: plan.monthlyQuota === -1 
          ? 'Unlimited' 
          : `${plan.monthlyQuota.toLocaleString()} prompts`,
        
        // 标记是否为当前用户计划
        isCurrent: currentUserPlan === plan.type,
        
        // 是否可以升级到此计划
        canUpgradeTo: currentUserPlan ? (
          currentUserPlan === 'free' && plan.type !== 'free'
        ) || (
          currentUserPlan === 'pro' && plan.type === 'team'
        ) : false
      })),
      currentUserPlan
    }

    return NextResponse.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Get subscription plans error:', error)
    
    return NextResponse.json(
      createSubscriptionErrorResponse(
        'CREEM_API_ERROR',
        'Failed to retrieve subscription plans',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      ),
      { status: 500 }
    )
  }
}

/**
 * 健康检查端点
 * HEAD /api/subscription/plans
 */
export async function HEAD(request: NextRequest) {
  try {
    const plans = getActivePlans()
    
    if (plans.length === 0) {
      return new NextResponse(null, { status: 404 })
    }
    
    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Plans-Count': plans.length.toString(),
        'X-Last-Updated': new Date().toISOString(),
      }
    })
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}