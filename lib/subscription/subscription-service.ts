/**
 * 核心订阅业务逻辑服务
 * 
 * 负责用户订阅状态管理、权限验证、计划升级等核心功能
 */

import { 
  UserSubscription, 
  SubscriptionStatus,
  SubscriptionPlanType,
  UserUsageStatus,
  PermissionCheckResult,
  SubscriptionErrorCode,
  SubscriptionOperationResult 
} from '@/types/subscription'
import { getPlanByType, getPlanQuota, checkFeatureAccess } from './plans'

// ============ 数据访问层接口 ============

/**
 * 数据访问层接口 (后续集成真实数据库时实现)
 */
export interface SubscriptionRepository {
  getUserSubscription(userEmail: string): Promise<UserSubscription | null>
  createUserSubscription(subscription: Omit<UserSubscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserSubscription>
  updateUserSubscription(id: string, updates: Partial<UserSubscription>): Promise<UserSubscription>
  deleteUserSubscription(id: string): Promise<void>
}

/**
 * 使用量数据访问层接口
 */
export interface UsageRepository {
  getCurrentUsage(userEmail: string): Promise<number>
  incrementUsage(userEmail: string): Promise<number>
  getUsageHistory(userEmail: string, months: number): Promise<Array<{ month: string; usage: number }>>
}

// ============ 内存存储实现 (开发阶段) ============

/**
 * 内存存储 - 用于开发和测试阶段
 * 生产环境需要替换为真实的数据库实现
 */
class InMemorySubscriptionRepository implements SubscriptionRepository {
  private subscriptions: Map<string, UserSubscription> = new Map()
  private idCounter = 1

  async getUserSubscription(userEmail: string): Promise<UserSubscription | null> {
    const subscription = Array.from(this.subscriptions.values())
      .find(sub => sub.userEmail === userEmail)
    return subscription || null
  }

  async createUserSubscription(data: Omit<UserSubscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserSubscription> {
    const now = new Date()
    const subscription: UserSubscription = {
      id: `sub_${this.idCounter++}`,
      ...data,
      createdAt: now,
      updatedAt: now,
    }
    
    this.subscriptions.set(subscription.id, subscription)
    return subscription
  }

  async updateUserSubscription(id: string, updates: Partial<UserSubscription>): Promise<UserSubscription> {
    const existing = this.subscriptions.get(id)
    if (!existing) {
      throw new Error(`Subscription not found: ${id}`)
    }

    const updated: UserSubscription = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    }

    this.subscriptions.set(id, updated)
    return updated
  }

  async deleteUserSubscription(id: string): Promise<void> {
    this.subscriptions.delete(id)
  }
}

/**
 * 内存使用量存储
 */
class InMemoryUsageRepository implements UsageRepository {
  private usage: Map<string, Map<string, number>> = new Map()

  private getYearMonth(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  async getCurrentUsage(userEmail: string): Promise<number> {
    const yearMonth = this.getYearMonth()
    const userUsage = this.usage.get(userEmail)
    return userUsage?.get(yearMonth) || 0
  }

  async incrementUsage(userEmail: string): Promise<number> {
    const yearMonth = this.getYearMonth()
    
    if (!this.usage.has(userEmail)) {
      this.usage.set(userEmail, new Map())
    }
    
    const userUsage = this.usage.get(userEmail)!
    const currentUsage = userUsage.get(yearMonth) || 0
    const newUsage = currentUsage + 1
    
    userUsage.set(yearMonth, newUsage)
    return newUsage
  }

  async getUsageHistory(userEmail: string, months: number): Promise<Array<{ month: string; usage: number }>> {
    const userUsage = this.usage.get(userEmail)
    if (!userUsage) return []

    const now = new Date()
    const history: Array<{ month: string; usage: number }> = []

    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const usage = userUsage.get(yearMonth) || 0
      
      history.push({ month: yearMonth, usage })
    }

    return history
  }
}

// ============ 核心订阅服务 ============

/**
 * 核心订阅服务类
 */
export class SubscriptionService {
  private subscriptionRepo: SubscriptionRepository
  private usageRepo: UsageRepository

  constructor(
    subscriptionRepo?: SubscriptionRepository,
    usageRepo?: UsageRepository
  ) {
    // 使用传入的仓库，或默认使用内存实现
    this.subscriptionRepo = subscriptionRepo || new InMemorySubscriptionRepository()
    this.usageRepo = usageRepo || new InMemoryUsageRepository()
  }

  // ============ 用户订阅管理 ============

  /**
   * 获取用户当前订阅状态
   */
  async getUserSubscriptionStatus(userEmail: string): Promise<UserUsageStatus> {
    const subscription = await this.subscriptionRepo.getUserSubscription(userEmail)
    
    // 如果没有订阅记录，创建免费版订阅
    if (!subscription) {
      await this.createFreeSubscription(userEmail)
      return this.getUserSubscriptionStatus(userEmail)
    }

    // 检查订阅是否已过期
    const now = new Date()
    const isExpired = subscription.status === 'expired' || 
                     subscription.currentPeriodEnd < now

    if (isExpired && subscription.status !== 'expired') {
      // 更新订阅状态为已过期
      await this.subscriptionRepo.updateUserSubscription(subscription.id, {
        status: 'expired'
      })
      subscription.status = 'expired'
    }

    // 获取当前使用量
    const currentUsage = await this.usageRepo.getCurrentUsage(userEmail)
    const plan = getPlanByType(subscription.planType)
    const quota = plan.monthlyQuota
    
    const remaining = quota === -1 ? Infinity : Math.max(0, quota - currentUsage)
    const canGenerate = subscription.status === 'active' && 
                       (quota === -1 || currentUsage < quota)

    return {
      userEmail,
      currentPeriod: {
        start: subscription.currentPeriodStart,
        end: subscription.currentPeriodEnd,
      },
      quota: {
        limit: quota,
        used: currentUsage,
        remaining: remaining === Infinity ? -1 : remaining,
      },
      subscriptionType: subscription.planType,
      canGenerate,
      resetDate: subscription.currentPeriodEnd,
    }
  }

  /**
   * 创建免费版订阅
   */
  private async createFreeSubscription(userEmail: string): Promise<UserSubscription> {
    const now = new Date()
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())

    return this.subscriptionRepo.createUserSubscription({
      userEmail,
      planId: 'free-plan',
      planType: 'free',
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
      cancelAtPeriodEnd: false,
    })
  }

  /**
   * 升级订阅计划
   */
  async upgradeSubscription(
    userEmail: string,
    newPlanType: SubscriptionPlanType,
    creemSubscriptionId?: string
  ): Promise<SubscriptionOperationResult> {
    try {
      const existingSubscription = await this.subscriptionRepo.getUserSubscription(userEmail)
      
      if (!existingSubscription) {
        throw new Error('User subscription not found')
      }

      const newPlan = getPlanByType(newPlanType)
      const now = new Date()
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())

      const updatedSubscription = await this.subscriptionRepo.updateUserSubscription(
        existingSubscription.id,
        {
          planId: newPlan.id,
          planType: newPlanType,
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: nextMonth,
          creemSubscriptionId,
          cancelAtPeriodEnd: false,
        }
      )

      return {
        success: true,
        message: `Successfully upgraded to ${newPlan.displayName}`,
        data: {
          subscription: updatedSubscription,
        }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to upgrade subscription',
        error: {
          code: 'INVALID_SUBSCRIPTION',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      }
    }
  }

  /**
   * 取消订阅
   */
  async cancelSubscription(userEmail: string): Promise<SubscriptionOperationResult> {
    try {
      const subscription = await this.subscriptionRepo.getUserSubscription(userEmail)
      
      if (!subscription || subscription.planType === 'free') {
        return {
          success: false,
          message: 'No paid subscription to cancel',
          error: {
            code: 'INVALID_SUBSCRIPTION'
          }
        }
      }

      // 标记在周期结束时取消，而不是立即取消
      await this.subscriptionRepo.updateUserSubscription(subscription.id, {
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
      })

      return {
        success: true,
        message: 'Subscription will be canceled at the end of the current period',
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to cancel subscription',
        error: {
          code: 'INVALID_SUBSCRIPTION',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      }
    }
  }

  // ============ 权限检查 ============

  /**
   * 检查用户是否可以执行特定操作
   */
  async checkPermission(
    userEmail: string,
    operation: 'prompt_generation' | 'ai_chat' | 'template_create' | 'data_export' | 'team_feature',
    incrementUsage = false
  ): Promise<PermissionCheckResult> {
    const usageStatus = await this.getUserSubscriptionStatus(userEmail)
    const planType = usageStatus.subscriptionType

    // 检查订阅是否有效
    if (!usageStatus.canGenerate) {
      const errorCode: SubscriptionErrorCode = usageStatus.quota.used >= usageStatus.quota.limit 
        ? 'QUOTA_EXCEEDED' 
        : 'SUBSCRIPTION_EXPIRED'
      
      return {
        allowed: false,
        reason: errorCode === 'QUOTA_EXCEEDED' 
          ? `Monthly quota of ${usageStatus.quota.limit} prompts exceeded`
          : 'Subscription has expired',
        errorCode,
        upgradeRequired: planType === 'free' ? {
          currentPlan: planType,
          requiredPlan: 'pro',
          upgradeUrl: '/pricing'
        } : undefined
      }
    }

    // 检查功能权限
    const hasFeatureAccess = this.checkFeaturePermission(planType, operation)
    if (!hasFeatureAccess) {
      const requiredPlan = this.getRequiredPlanForOperation(operation)
      
      return {
        allowed: false,
        reason: `This feature requires ${requiredPlan} subscription`,
        errorCode: 'INVALID_SUBSCRIPTION',
        upgradeRequired: {
          currentPlan: planType,
          requiredPlan,
          upgradeUrl: '/pricing'
        }
      }
    }

    // 如果需要增加使用量计数 (仅对有限制的操作)
    if (incrementUsage && this.shouldTrackUsage(operation)) {
      await this.usageRepo.incrementUsage(userEmail)
    }

    return {
      allowed: true
    }
  }

  /**
   * 检查特定操作的功能权限
   */
  private checkFeaturePermission(planType: SubscriptionPlanType, operation: string): boolean {
    switch (operation) {
      case 'prompt_generation':
        return checkFeatureAccess(planType, 'promptGeneration')
      case 'ai_chat':
        return checkFeatureAccess(planType, 'aiChatAccess')
      case 'template_create':
        return checkFeatureAccess(planType, 'customTemplates')
      case 'data_export':
        return checkFeatureAccess(planType, 'dataExport')
      case 'team_feature':
        return checkFeatureAccess(planType, 'teamCollaboration')
      default:
        return true // 未知操作默认允许
    }
  }

  /**
   * 获取操作所需的最低计划等级
   */
  private getRequiredPlanForOperation(operation: string): SubscriptionPlanType {
    switch (operation) {
      case 'template_create':
      case 'data_export':
        return 'pro'
      case 'team_feature':
        return 'team'
      default:
        return 'free'
    }
  }

  /**
   * 判断操作是否需要计入使用量
   */
  private shouldTrackUsage(operation: string): boolean {
    return ['prompt_generation', 'ai_chat'].includes(operation)
  }

  // ============ 使用量统计 ============

  /**
   * 获取用户使用量历史
   */
  async getUserUsageHistory(userEmail: string, months = 6) {
    const history = await this.usageRepo.getUsageHistory(userEmail, months)
    const usageStatus = await this.getUserSubscriptionStatus(userEmail)
    
    // 计算趋势数据
    const totalUsage = history.reduce((sum, record) => sum + record.usage, 0)
    const averageDaily = totalUsage / (months * 30) // 粗略估算
    const currentMonthUsage = history[0]?.usage || 0
    const projectedMonthly = currentMonthUsage * (30 / new Date().getDate())

    return {
      currentPeriod: usageStatus,
      history: history.map(record => ({
        ...record,
        limit: usageStatus.quota.limit
      })),
      trends: {
        averageDaily: Math.round(averageDaily * 100) / 100,
        projectedMonthly: Math.round(projectedMonthly)
      }
    }
  }

  // ============ Webhook处理 ============

  /**
   * 处理Creem.io Webhook事件
   */
  async handleWebhook(eventType: string, data: any): Promise<void> {
    switch (eventType) {
      case 'subscription.created':
      case 'subscription.updated':
        await this.syncSubscriptionFromWebhook(data)
        break
      
      case 'subscription.canceled':
        await this.handleSubscriptionCanceled(data)
        break
        
      case 'subscription.expired':
        await this.handleSubscriptionExpired(data)
        break
        
      default:
        console.warn(`Unhandled webhook event: ${eventType}`)
    }
  }

  /**
   * 同步Webhook订阅数据
   */
  private async syncSubscriptionFromWebhook(data: any): Promise<void> {
    // TODO: 实现Webhook数据同步逻辑
    console.log('Syncing subscription from webhook:', data)
  }

  /**
   * 处理订阅取消
   */
  private async handleSubscriptionCanceled(data: any): Promise<void> {
    // TODO: 实现订阅取消处理
    console.log('Handling subscription canceled:', data)
  }

  /**
   * 处理订阅过期
   */
  private async handleSubscriptionExpired(data: any): Promise<void> {
    // TODO: 实现订阅过期处理，降级到免费版
    console.log('Handling subscription expired:', data)
  }
}

// ============ 单例导出 ============

/**
 * 默认订阅服务实例
 */
export const subscriptionService = new SubscriptionService()

/**
 * 创建自定义订阅服务实例 (用于测试或特殊配置)
 */
export function createSubscriptionService(
  subscriptionRepo?: SubscriptionRepository,
  usageRepo?: UsageRepository
): SubscriptionService {
  return new SubscriptionService(subscriptionRepo, usageRepo)
}