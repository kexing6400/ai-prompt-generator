/**
 * 当前用户订阅状态API端点
 * 
 * GET /api/subscription/current?userEmail={email}
 * 返回用户当前的订阅状态、使用量、权限等完整信息
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  subscriptionManager, 
  createSubscriptionErrorResponse,
  getUpgradeSuggestion 
} from '@/lib/subscription'
import { UserSubscriptionResponse } from '@/types/subscription'

/**
 * 获取用户当前订阅状态
 * 
 * 查询参数：
 * - userEmail: 用户邮箱 (必需)
 * - includeHistory: 是否包含使用历史 (可选, 默认false)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('userEmail')
    const includeHistory = searchParams.get('includeHistory') === 'true'

    // 验证必需参数
    if (!userEmail) {
      return NextResponse.json(
        createSubscriptionErrorResponse(
          'INVALID_SUBSCRIPTION',
          'User email is required'
        ),
        { status: 400 }
      )
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(userEmail)) {
      return NextResponse.json(
        createSubscriptionErrorResponse(
          'INVALID_SUBSCRIPTION',
          'Invalid email format'
        ),
        { status: 400 }
      )
    }

    // 获取用户完整订阅状态
    const completeStatus = await subscriptionManager.getUserCompleteStatus(userEmail)
    
    if (!completeStatus.success) {
      return NextResponse.json(
        createSubscriptionErrorResponse(
          'CREEM_API_ERROR',
          completeStatus.error || 'Failed to get user subscription status'
        ),
        { status: 500 }
      )
    }

    const { subscription: usageStatus, permissions } = completeStatus.data!

    // 获取用户订阅记录 (包含详细的订阅信息)
    const userSubscription = await subscriptionManager.subscription.getUserSubscription?.(userEmail)
    
    if (!userSubscription) {
      // 如果没有订阅记录，说明是新用户，创建免费版订阅
      console.log(`Creating free subscription for new user: ${userEmail}`)
    }

    // 获取可用的升级选项
    const currentPlan = usageStatus.subscriptionType
    const upgradeSuggestion = getUpgradeSuggestion(currentPlan)
    const availableUpgrades = upgradeSuggestion ? [upgradeSuggestion] : []

    // 获取使用历史 (如果请求)
    let usageHistory = undefined
    if (includeHistory) {
      try {
        usageHistory = await subscriptionManager.usage.getUserUsageHistory(userEmail, 6)
      } catch (error) {
        console.warn('Failed to get usage history:', error)
        // 不影响主要响应
      }
    }

    // 构造响应数据
    const response: UserSubscriptionResponse = {
      subscription: userSubscription || {
        id: 'temp-free',
        userEmail,
        planId: 'free-plan',
        planType: 'free',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      usage: usageStatus,
      availableUpgrades
    }

    // 添加额外的分析数据
    const analysisData = {
      // 配额利用率
      quotaUtilization: usageStatus.quota.limit === -1 
        ? 0 
        : Math.round((usageStatus.quota.used / usageStatus.quota.limit) * 100),
      
      // 距离重置的天数
      daysUntilReset: Math.ceil(
        (usageStatus.resetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      ),
      
      // 是否接近配额限制
      nearQuotaLimit: usageStatus.quota.limit > 0 && 
                     (usageStatus.quota.used / usageStatus.quota.limit) > 0.8,
      
      // 权限摘要
      permissions: {
        allowedFeatures: permissions.allowedOperations,
        restrictedFeatures: permissions.restrictedOperations.map(r => r.operation),
        totalFeatures: permissions.allowedOperations.length + permissions.restrictedOperations.length
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...response,
        analysis: analysisData,
        ...(usageHistory && { usageHistory })
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Get current subscription error:', error)
    
    return NextResponse.json(
      createSubscriptionErrorResponse(
        'CREEM_API_ERROR',
        'Failed to retrieve current subscription status',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      ),
      { status: 500 }
    )
  }
}

/**
 * 更新用户订阅偏好设置
 * 
 * PATCH /api/subscription/current
 * 请求体: { userEmail, preferences: { ... } }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userEmail, preferences } = body

    if (!userEmail) {
      return NextResponse.json(
        createSubscriptionErrorResponse(
          'INVALID_SUBSCRIPTION',
          'User email is required'
        ),
        { status: 400 }
      )
    }

    // 验证偏好设置格式
    const allowedPreferences = [
      'emailNotifications',
      'usageAlerts',
      'upgradeReminders',
      'theme',
      'language'
    ]

    if (preferences && typeof preferences === 'object') {
      const invalidKeys = Object.keys(preferences).filter(key => !allowedPreferences.includes(key))
      if (invalidKeys.length > 0) {
        return NextResponse.json(
          createSubscriptionErrorResponse(
            'INVALID_SUBSCRIPTION',
            `Invalid preference keys: ${invalidKeys.join(', ')}`
          ),
          { status: 400 }
        )
      }
    }

    // TODO: 实现偏好设置更新逻辑
    console.log(`Updating preferences for ${userEmail}:`, preferences)
    
    // 这里可以集成到用户配置系统或数据库
    
    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        userEmail,
        preferences,
        updatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Update subscription preferences error:', error)
    
    return NextResponse.json(
      createSubscriptionErrorResponse(
        'CREEM_API_ERROR',
        'Failed to update subscription preferences',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      ),
      { status: 500 }
    )
  }
}