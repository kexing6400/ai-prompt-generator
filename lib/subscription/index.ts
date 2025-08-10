/**
 * 订阅系统统一导出入口
 * 
 * 提供完整的三层订阅体系服务接口
 * 🆓 免费版：50次/月生成限制，核心功能完全免费
 * 💎 专业版：$4.99/月，500次/月，高级功能
 * 🏢 团队版：$19.99/月，无限制，团队协作
 */

// ============ 核心服务导出 ============

// 订阅计划定义
export * from './plans'

// 核心订阅服务
export {
  SubscriptionService,
  subscriptionService,
  createSubscriptionService,
  type SubscriptionRepository,
  type UsageRepository
} from './subscription-service'

// 使用量追踪服务
export {
  UsageTrackingService,
  usageTrackingService,
  createUsageTrackingService,
  type UsageTrackingRepository,
  type UsageTrackingConfig
} from './usage-tracking-service'

// 支付系统集成
export {
  PaymentService,
  paymentService,
  createPaymentService,
  type CreemConfig
} from './payment-service'

// 权限检查系统
export {
  PermissionChecker,
  permissionChecker,
  createPermissionMiddleware,
  withPermission,
  quickPermissionCheck,
  getUserPermissionSummary,
  type SystemOperation,
  type PermissionConfig
} from './permissions'

// ============ 便捷服务组合 ============

import { subscriptionService } from './subscription-service'
import { usageTrackingService } from './usage-tracking-service'
import { paymentService } from './payment-service'
import { permissionChecker } from './permissions'

/**
 * 订阅系统服务集合
 * 提供统一的服务访问接口
 */
export class SubscriptionManager {
  public readonly subscription = subscriptionService
  public readonly usage = usageTrackingService
  public readonly payment = paymentService
  public readonly permissions = permissionChecker

  // ============ 快捷操作方法 ============

  /**
   * 快速获取用户完整状态
   */
  async getUserCompleteStatus(userEmail: string) {
    try {
      const [subscriptionStatus, permissionSummary] = await Promise.all([
        this.subscription.getUserSubscriptionStatus(userEmail),
        getUserPermissionSummary(userEmail)
      ])

      return {
        success: true,
        data: {
          subscription: subscriptionStatus,
          permissions: permissionSummary,
          canUpgrade: subscriptionStatus.subscriptionType !== 'team',
          recommendedUpgrade: subscriptionStatus.subscriptionType === 'free' ? 'pro' : 'team'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 处理订阅升级流程
   */
  async processUpgrade(
    userEmail: string,
    targetPlan: 'pro' | 'team',
    successUrl: string,
    cancelUrl: string
  ) {
    try {
      // 1. 创建支付订阅
      const paymentResult = await this.payment.createSubscription({
        userEmail,
        planId: targetPlan,
        successUrl,
        cancelUrl,
      })

      if (!paymentResult.success) {
        return paymentResult
      }

      // 2. 清理权限缓存
      this.permissions.clearCache()

      return {
        success: true,
        message: 'Upgrade initiated successfully',
        data: {
          redirectUrl: paymentResult.data?.redirectUrl
        }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to process upgrade',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 执行带权限检查的操作
   */
  async executeWithPermission(
    userEmail: string,
    operation: 'prompt_generation' | 'ai_chat' | 'template_create',
    action: () => Promise<any>
  ) {
    try {
      // 1. 权限检查并增加使用量
      const permissionResult = await this.permissions.checkPermission(
        userEmail,
        operation,
        { incrementUsage: true }
      )

      if (!permissionResult.allowed) {
        return {
          success: false,
          error: permissionResult.reason || 'Permission denied',
          errorCode: permissionResult.errorCode,
          upgradeRequired: permissionResult.upgradeRequired
        }
      }

      // 2. 执行操作
      const result = await action()
      
      return {
        success: true,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Operation failed'
      }
    }
  }

  /**
   * 处理Webhook事件
   */
  async handlePaymentWebhook(rawPayload: string, signature: string) {
    try {
      // 1. 验证签名
      const isValidSignature = this.payment.verifyWebhookSignature(rawPayload, signature)
      if (!isValidSignature) {
        return {
          success: false,
          error: 'Invalid webhook signature'
        }
      }

      // 2. 解析载荷
      const payload = this.payment.parseWebhookPayload(rawPayload)
      if (!payload) {
        return {
          success: false,
          error: 'Invalid webhook payload'
        }
      }

      // 3. 处理事件
      const result = await this.payment.processWebhookEvent(payload)
      
      // 4. 清理相关缓存
      if (result.processed) {
        this.permissions.clearCache()
      }

      return {
        success: result.processed,
        message: result.message,
        error: result.error
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook processing failed'
      }
    }
  }

  // ============ 分析和监控 ============

  /**
   * 获取订阅系统健康状态
   */
  async getSystemHealth() {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
      
      const [monthlyStats, trends] = await Promise.all([
        this.usage.getMonthlyStats(currentMonth),
        this.usage.getUsageTrends(3)
      ])

      return {
        success: true,
        data: {
          services: {
            subscription: 'healthy',
            usage: 'healthy',
            payment: this.payment.isAvailable() ? 'healthy' : 'unavailable',
            permissions: 'healthy'
          },
          statistics: {
            monthly: monthlyStats,
            trends: trends
          },
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed'
      }
    }
  }

  /**
   * 清理所有缓存
   */
  clearAllCaches() {
    this.usage.clearCache()
    this.permissions.clearCache()
    console.log('All subscription system caches cleared')
  }

  /**
   * 关闭所有服务
   */
  shutdown() {
    this.usage.destroy()
    this.permissions.clearCache()
    console.log('Subscription system shutdown complete')
  }
}

// ============ 默认实例导出 ============

/**
 * 默认订阅管理器实例
 * 推荐在应用中使用此实例
 */
export const subscriptionManager = new SubscriptionManager()

// ============ 工具函数 ============

/**
 * 初始化订阅系统
 * 在应用启动时调用
 */
export async function initializeSubscriptionSystem() {
  try {
    console.log('Initializing subscription system...')
    
    // 检查系统健康状态
    const health = await subscriptionManager.getSystemHealth()
    
    if (health.success) {
      console.log('Subscription system initialized successfully')
      console.log('Services status:', health.data?.services)
    } else {
      console.error('Subscription system initialization failed:', health.error)
    }

    return health
  } catch (error) {
    console.error('Failed to initialize subscription system:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown initialization error'
    }
  }
}

/**
 * 创建API错误响应
 */
export function createSubscriptionErrorResponse(
  errorCode: string,
  message: string,
  details?: any
) {
  const status = (() => {
    switch (errorCode) {
      case 'QUOTA_EXCEEDED':
        return 429 // Too Many Requests
      case 'SUBSCRIPTION_EXPIRED':
      case 'INVALID_SUBSCRIPTION':
        return 403 // Forbidden
      case 'PAYMENT_FAILED':
        return 402 // Payment Required
      case 'PLAN_NOT_FOUND':
        return 404 // Not Found
      default:
        return 400 // Bad Request
    }
  })()

  return {
    error: message,
    code: errorCode,
    ...(details && { details }),
    timestamp: new Date().toISOString()
  }
}

// ============ 类型重导出 ============

// 从types/subscription.ts重新导出主要类型，方便使用
export type {
  // 基础类型
  SubscriptionPlanType,
  SubscriptionStatus,
  SubscriptionPlan,
  SubscriptionFeatures,
  UserSubscription,
  UserUsageStatus,
  
  // 使用量追踪
  UsageTracking,
  
  // 支付相关
  CreateSubscriptionRequest,
  CreateSubscriptionResponse,
  CreemWebhookPayload,
  
  // 权限检查
  PermissionCheckResult,
  
  // 错误处理
  SubscriptionErrorCode,
  QuotaExceededError,
  SubscriptionOperationResult,
  
  // API响应
  SubscriptionPlansResponse,
  UserSubscriptionResponse,
  UsageStatsResponse
} from '@/types/subscription'