/**
 * 用户使用量查询API端点
 * 
 * GET /api/subscription/usage?userEmail={email}
 * 返回用户的使用量统计、历史记录和趋势分析
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  subscriptionManager, 
  createSubscriptionErrorResponse 
} from '@/lib/subscription'
import { UsageStatsResponse } from '@/types/subscription'

/**
 * 获取用户使用量统计
 * 
 * 查询参数：
 * - userEmail: 用户邮箱 (必需)
 * - months: 历史月份数 (可选, 默认6)
 * - includeTrends: 是否包含趋势分析 (可选, 默认true)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('userEmail')
    const months = parseInt(searchParams.get('months') || '6')
    const includeTrends = searchParams.get('includeTrends') !== 'false'

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

    // 验证月份参数
    if (months < 1 || months > 24) {
      return NextResponse.json(
        createSubscriptionErrorResponse(
          'INVALID_SUBSCRIPTION',
          'Months parameter must be between 1 and 24'
        ),
        { status: 400 }
      )
    }

    // 获取用户当前状态
    const currentStatus = await subscriptionManager.subscription.getUserSubscriptionStatus(userEmail)
    
    // 获取使用量历史
    const usageHistory = await subscriptionManager.usage.getUserUsageHistory(userEmail, months)
    
    // 获取使用量统计
    const usageStats = await subscriptionManager.usage.getUserUsageStatus(
      userEmail, 
      currentStatus.subscriptionType
    )

    // 计算趋势数据
    let trends = undefined
    if (includeTrends && usageHistory.length > 0) {
      trends = calculateUsageTrends(usageHistory)
    }

    // 构造响应数据
    const response: UsageStatsResponse = {
      currentPeriod: usageStats,
      history: usageHistory.map(record => ({
        month: record.month,
        usage: record.usage,
        limit: usageStats.quota.limit
      })),
      trends: trends || {
        averageDaily: 0,
        projectedMonthly: usageStats.quota.used
      }
    }

    // 添加分析数据
    const analysisData = {
      // 使用模式分析
      usagePattern: analyzeUsagePattern(usageHistory),
      
      // 配额建议
      quotaRecommendation: generateQuotaRecommendation(
        usageStats, 
        currentStatus.subscriptionType
      ),
      
      // 升级建议
      upgradeRecommendation: generateUpgradeRecommendation(
        usageStats,
        trends,
        currentStatus.subscriptionType
      ),
      
      // 统计摘要
      summary: {
        totalHistoricalUsage: usageHistory.reduce((sum, r) => sum + r.usage, 0),
        averageMonthlyUsage: usageHistory.length > 0 
          ? Math.round(usageHistory.reduce((sum, r) => sum + r.usage, 0) / usageHistory.length)
          : 0,
        highestMonthUsage: Math.max(...usageHistory.map(r => r.usage), 0),
        currentUtilization: usageStats.quota.limit === -1 
          ? 0 
          : Math.round((usageStats.quota.used / usageStats.quota.limit) * 100)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...response,
        analysis: analysisData
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Get usage statistics error:', error)
    
    return NextResponse.json(
      createSubscriptionErrorResponse(
        'USAGE_TRACKING_ERROR',
        'Failed to retrieve usage statistics',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      ),
      { status: 500 }
    )
  }
}

// ============ 分析辅助函数 ============

/**
 * 计算使用量趋势
 */
function calculateUsageTrends(history: Array<{ month: string; usage: number }>) {
  if (history.length < 2) {
    return {
      averageDaily: 0,
      projectedMonthly: history[0]?.usage || 0
    }
  }

  // 计算最近3个月的平均使用量
  const recentMonths = history.slice(0, 3)
  const averageMonthly = recentMonths.reduce((sum, r) => sum + r.usage, 0) / recentMonths.length
  const averageDaily = Math.round(averageMonthly / 30 * 100) / 100

  // 基于当前月已使用天数推算整月使用量
  const currentDay = new Date().getDate()
  const currentMonthUsage = history[0]?.usage || 0
  const projectedMonthly = Math.round((currentMonthUsage / currentDay) * 30)

  return {
    averageDaily,
    projectedMonthly
  }
}

/**
 * 分析使用模式
 */
function analyzeUsagePattern(history: Array<{ month: string; usage: number }>) {
  if (history.length < 3) {
    return 'insufficient_data'
  }

  const usages = history.map(h => h.usage)
  const average = usages.reduce((sum, u) => sum + u, 0) / usages.length
  const variance = usages.reduce((sum, u) => sum + Math.pow(u - average, 2), 0) / usages.length
  const standardDeviation = Math.sqrt(variance)
  
  const coefficientOfVariation = average > 0 ? standardDeviation / average : 0

  if (coefficientOfVariation < 0.3) {
    return 'stable' // 使用量稳定
  } else if (coefficientOfVariation < 0.7) {
    return 'moderate' // 使用量中等变化
  } else {
    return 'volatile' // 使用量波动大
  }
}

/**
 * 生成配额建议
 */
function generateQuotaRecommendation(usageStatus: any, planType: string) {
  const { quota } = usageStatus
  
  if (quota.limit === -1) {
    return {
      type: 'unlimited',
      message: 'You have unlimited usage with your current plan'
    }
  }

  const utilization = quota.used / quota.limit
  
  if (utilization < 0.5) {
    return {
      type: 'under_utilized',
      message: `You're using only ${Math.round(utilization * 100)}% of your quota. Your current plan fits well.`
    }
  } else if (utilization < 0.8) {
    return {
      type: 'well_utilized',
      message: `You're using ${Math.round(utilization * 100)}% of your quota. Good utilization of your current plan.`
    }
  } else if (utilization < 0.95) {
    return {
      type: 'near_limit',
      message: `You're near your quota limit (${Math.round(utilization * 100)}%). Consider upgrading if you need more usage.`
    }
  } else {
    return {
      type: 'exceeded_or_near',
      message: `You've used ${Math.round(utilization * 100)}% of your quota. Upgrade recommended to avoid interruptions.`
    }
  }
}

/**
 * 生成升级建议
 */
function generateUpgradeRecommendation(
  usageStatus: any, 
  trends: any, 
  currentPlan: string
) {
  if (currentPlan === 'team') {
    return null // 已经是最高级计划
  }

  const utilization = usageStatus.quota.limit === -1 ? 0 : usageStatus.quota.used / usageStatus.quota.limit
  const projectedUsage = trends?.projectedMonthly || usageStatus.quota.used
  
  // 基于使用量和趋势给出升级建议
  if (utilization > 0.8 || projectedUsage > usageStatus.quota.limit * 0.9) {
    const recommendedPlan = currentPlan === 'free' ? 'pro' : 'team'
    
    return {
      recommended: true,
      targetPlan: recommendedPlan,
      reason: utilization > 0.8 
        ? 'Current usage is near or exceeding quota limit'
        : 'Projected usage suggests you may need more quota',
      benefits: currentPlan === 'free' 
        ? ['10x more quota (500 prompts)', 'Advanced templates', 'Priority support']
        : ['Unlimited quota', 'Team collaboration', 'Phone support']
    }
  }

  return {
    recommended: false,
    message: 'Your current plan seems to meet your usage needs'
  }
}