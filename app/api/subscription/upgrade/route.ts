/**
 * 订阅升级API端点
 * 
 * POST /api/subscription/upgrade
 * 处理用户订阅升级请求，创建支付链接并跳转到Creem.io支付页面
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  subscriptionManager, 
  createSubscriptionErrorResponse,
  getPlanByType 
} from '@/lib/subscription'
import { CreateSubscriptionRequest, SubscriptionPlanType } from '@/types/subscription'

// 支持的升级计划类型
const VALID_UPGRADE_PLANS: SubscriptionPlanType[] = ['pro', 'team']

/**
 * 处理订阅升级请求
 * 
 * 请求体：
 * {
 *   userEmail: string,
 *   targetPlan: 'pro' | 'team',
 *   successUrl?: string,
 *   cancelUrl?: string,
 *   metadata?: Record<string, string>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userEmail, 
      targetPlan, 
      successUrl = `${request.nextUrl.origin}/dashboard?upgrade=success`,
      cancelUrl = `${request.nextUrl.origin}/pricing?upgrade=canceled`,
      metadata = {}
    } = body

    // 输入验证
    const validation = validateUpgradeRequest(body)
    if (!validation.valid) {
      return NextResponse.json(
        createSubscriptionErrorResponse(
          'INVALID_SUBSCRIPTION',
          validation.error!
        ),
        { status: 400 }
      )
    }

    // 获取用户当前订阅状态
    const currentStatus = await subscriptionManager.getUserCompleteStatus(userEmail)
    
    if (!currentStatus.success) {
      return NextResponse.json(
        createSubscriptionErrorResponse(
          'CREEM_API_ERROR',
          'Failed to get current subscription status'
        ),
        { status: 500 }
      )
    }

    const currentPlan = currentStatus.data!.subscription.subscriptionType

    // 验证升级路径
    const upgradeValidation = validateUpgradePath(currentPlan, targetPlan)
    if (!upgradeValidation.valid) {
      return NextResponse.json(
        createSubscriptionErrorResponse(
          'INVALID_SUBSCRIPTION',
          upgradeValidation.error!
        ),
        { status: 400 }
      )
    }

    // 获取目标计划信息
    const targetPlanInfo = getPlanByType(targetPlan)
    
    // 添加元数据
    const enhancedMetadata = {
      ...metadata,
      currentPlan,
      targetPlan,
      upgradeTimestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent') || 'unknown',
      upgradeSource: 'api'
    }

    // 处理升级
    const upgradeResult = await subscriptionManager.processUpgrade(
      userEmail,
      targetPlan,
      successUrl,
      cancelUrl
    )

    if (!upgradeResult.success) {
      return NextResponse.json(
        createSubscriptionErrorResponse(
          upgradeResult.error?.code || 'CREEM_API_ERROR',
          upgradeResult.message || 'Failed to process upgrade'
        ),
        { status: 500 }
      )
    }

    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: `Upgrade to ${targetPlanInfo.displayName} initiated successfully`,
      data: {
        checkoutUrl: upgradeResult.data?.redirectUrl,
        targetPlan: {
          id: targetPlanInfo.id,
          name: targetPlanInfo.displayName,
          price: targetPlanInfo.priceMonthly,
          currency: targetPlanInfo.priceCurrency,
          quota: targetPlanInfo.monthlyQuota
        },
        currentPlan: {
          type: currentPlan,
          usage: currentStatus.data!.subscription.quota
        },
        estimated: {
          savingsPercentage: calculateSavings(currentPlan, targetPlan),
          additionalFeatures: getAdditionalFeatures(currentPlan, targetPlan),
          quotaIncrease: calculateQuotaIncrease(currentPlan, targetPlan)
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Subscription upgrade error:', error)
    
    return NextResponse.json(
      createSubscriptionErrorResponse(
        'CREEM_API_ERROR',
        'Internal error processing upgrade request',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      ),
      { status: 500 }
    )
  }
}

/**
 * 获取升级预览信息
 * 
 * GET /api/subscription/upgrade?userEmail={email}&targetPlan={plan}
 * 返回升级预览信息，不实际创建支付
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('userEmail')
    const targetPlan = searchParams.get('targetPlan') as SubscriptionPlanType

    if (!userEmail || !targetPlan) {
      return NextResponse.json(
        createSubscriptionErrorResponse(
          'INVALID_SUBSCRIPTION',
          'userEmail and targetPlan parameters are required'
        ),
        { status: 400 }
      )
    }

    if (!VALID_UPGRADE_PLANS.includes(targetPlan)) {
      return NextResponse.json(
        createSubscriptionErrorResponse(
          'PLAN_NOT_FOUND',
          `Invalid target plan: ${targetPlan}`
        ),
        { status: 400 }
      )
    }

    // 获取当前状态
    const currentStatus = await subscriptionManager.getUserCompleteStatus(userEmail)
    
    if (!currentStatus.success) {
      return NextResponse.json(
        createSubscriptionErrorResponse(
          'CREEM_API_ERROR',
          'Failed to get current subscription status'
        ),
        { status: 500 }
      )
    }

    const currentPlan = currentStatus.data!.subscription.subscriptionType
    const targetPlanInfo = getPlanByType(targetPlan)

    // 验证升级路径
    const upgradeValidation = validateUpgradePath(currentPlan, targetPlan)
    if (!upgradeValidation.valid) {
      return NextResponse.json(
        createSubscriptionErrorResponse(
          'INVALID_SUBSCRIPTION',
          upgradeValidation.error!
        ),
        { status: 400 }
      )
    }

    // 返回升级预览
    return NextResponse.json({
      success: true,
      data: {
        upgrade: {
          from: {
            plan: currentPlan,
            quota: currentStatus.data!.subscription.quota
          },
          to: {
            plan: targetPlan,
            name: targetPlanInfo.displayName,
            price: targetPlanInfo.priceMonthly / 100, // 转为美元
            quota: targetPlanInfo.monthlyQuota,
            features: targetPlanInfo.features
          }
        },
        benefits: {
          additionalFeatures: getAdditionalFeatures(currentPlan, targetPlan),
          quotaIncrease: calculateQuotaIncrease(currentPlan, targetPlan),
          estimatedSavings: calculateSavings(currentPlan, targetPlan)
        },
        pricing: {
          monthlyPrice: targetPlanInfo.priceMonthly / 100,
          currency: targetPlanInfo.priceCurrency,
          billingCycle: 'monthly',
          priceComparison: {
            current: currentPlan === 'free' ? 0 : getPlanByType(currentPlan).priceMonthly / 100,
            target: targetPlanInfo.priceMonthly / 100
          }
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Upgrade preview error:', error)
    
    return NextResponse.json(
      createSubscriptionErrorResponse(
        'CREEM_API_ERROR',
        'Failed to generate upgrade preview',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      ),
      { status: 500 }
    )
  }
}

// ============ 辅助函数 ============

/**
 * 验证升级请求
 */
function validateUpgradeRequest(body: any): { valid: boolean; error?: string } {
  if (!body.userEmail) {
    return { valid: false, error: 'User email is required' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(body.userEmail)) {
    return { valid: false, error: 'Invalid email format' }
  }

  if (!body.targetPlan) {
    return { valid: false, error: 'Target plan is required' }
  }

  if (!VALID_UPGRADE_PLANS.includes(body.targetPlan)) {
    return { valid: false, error: `Invalid target plan: ${body.targetPlan}. Must be one of: ${VALID_UPGRADE_PLANS.join(', ')}` }
  }

  // 验证URLs (如果提供)
  if (body.successUrl && !isValidUrl(body.successUrl)) {
    return { valid: false, error: 'Invalid successUrl format' }
  }

  if (body.cancelUrl && !isValidUrl(body.cancelUrl)) {
    return { valid: false, error: 'Invalid cancelUrl format' }
  }

  return { valid: true }
}

/**
 * 验证升级路径
 */
function validateUpgradePath(
  currentPlan: SubscriptionPlanType, 
  targetPlan: SubscriptionPlanType
): { valid: boolean; error?: string } {
  if (currentPlan === targetPlan) {
    return { valid: false, error: 'Cannot upgrade to the same plan' }
  }

  // 定义升级路径
  const validUpgradePaths: Record<SubscriptionPlanType, SubscriptionPlanType[]> = {
    free: ['pro', 'team'],
    pro: ['team'],
    team: [] // 团队版已经是最高级
  }

  const allowedTargets = validUpgradePaths[currentPlan] || []
  
  if (!allowedTargets.includes(targetPlan)) {
    return { 
      valid: false, 
      error: `Cannot upgrade from ${currentPlan} to ${targetPlan}. Allowed upgrades: ${allowedTargets.join(', ') || 'none'}` 
    }
  }

  return { valid: true }
}

/**
 * 验证URL格式
 */
function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}

/**
 * 计算升级后的额外功能
 */
function getAdditionalFeatures(
  currentPlan: SubscriptionPlanType, 
  targetPlan: SubscriptionPlanType
): string[] {
  const currentFeatures = getPlanByType(currentPlan).features
  const targetFeatures = getPlanByType(targetPlan).features
  
  const additionalFeatures: string[] = []
  
  // 比较功能差异
  Object.keys(targetFeatures).forEach(key => {
    const featureKey = key as keyof typeof targetFeatures
    if (targetFeatures[featureKey] && !currentFeatures[featureKey]) {
      // 将驼峰命名转换为用户友好的文本
      const friendlyName = key
        .replace(/([A-Z])/g, ' $1')
        .toLowerCase()
        .replace(/^\w/, c => c.toUpperCase())
      
      additionalFeatures.push(friendlyName)
    }
  })
  
  return additionalFeatures
}

/**
 * 计算配额增长
 */
function calculateQuotaIncrease(
  currentPlan: SubscriptionPlanType, 
  targetPlan: SubscriptionPlanType
): { type: 'increase' | 'unlimited'; value?: number; percentage?: number } {
  const currentQuota = getPlanByType(currentPlan).monthlyQuota
  const targetQuota = getPlanByType(targetPlan).monthlyQuota
  
  if (targetQuota === -1) {
    return { type: 'unlimited' }
  }
  
  if (currentQuota === -1) {
    return { type: 'increase', value: 0, percentage: 0 }
  }
  
  const increase = targetQuota - currentQuota
  const percentage = currentQuota > 0 ? Math.round((increase / currentQuota) * 100) : 0
  
  return {
    type: 'increase',
    value: increase,
    percentage
  }
}

/**
 * 计算预期节省 (这里是示例逻辑)
 */
function calculateSavings(
  currentPlan: SubscriptionPlanType, 
  targetPlan: SubscriptionPlanType
): number {
  // 这里可以根据实际业务逻辑计算
  // 比如年度订阅折扣、首月优惠等
  return 0 // 暂时返回0，后续可以添加促销逻辑
}