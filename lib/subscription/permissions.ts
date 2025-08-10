/**
 * 订阅权限检查服务
 * 
 * 提供细粒度的权限控制和中间件支持
 * 集成到现有API路由中进行访问控制
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  PermissionCheckResult,
  SubscriptionPlanType,
  SubscriptionFeatures,
  UsageCheckOptions,
  QuotaExceededError,
  SubscriptionErrorCode
} from '@/types/subscription'
import { subscriptionService } from './subscription-service'
import { usageTrackingService } from './usage-tracking-service'
import { checkFeatureAccess, getPlanByType, getUpgradeSuggestion } from './plans'

// ============ 权限检查配置 ============

/**
 * 权限检查配置选项
 */
export interface PermissionConfig {
  // 是否启用权限检查
  enabled: boolean
  
  // 默认用户标识提取方法
  extractUserEmail: (request: NextRequest) => string | null
  
  // 错误处理配置
  returnDetailedErrors: boolean
  includeUpgradeUrls: boolean
  
  // 性能配置
  enableCaching: boolean
  cacheExpiry: number // 秒
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: PermissionConfig = {
  enabled: true,
  extractUserEmail: (request: NextRequest) => {
    // 尝试从多个来源获取用户邮箱
    const email = request.headers.get('x-user-email') ||
                  request.headers.get('user-email') ||
                  request.nextUrl.searchParams.get('userEmail')
    
    return email
  },
  returnDetailedErrors: process.env.NODE_ENV === 'development',
  includeUpgradeUrls: true,
  enableCaching: true,
  cacheExpiry: 60, // 1分钟缓存
}

// ============ 操作定义 ============

/**
 * 系统操作类型定义
 */
export type SystemOperation = 
  | 'prompt_generation'    // Prompt生成
  | 'ai_chat'             // AI对话
  | 'template_create'     // 创建自定义模板
  | 'template_share'      // 分享模板
  | 'data_export'         // 数据导出
  | 'bulk_operations'     // 批量操作
  | 'team_collaboration' // 团队协作
  | 'priority_processing' // 优先处理
  | 'advanced_ai_models' // 高级AI模型
  | 'unlimited_history'  // 无限历史记录

/**
 * 操作权限映射
 */
const OPERATION_PERMISSION_MAP: Record<SystemOperation, keyof SubscriptionFeatures> = {
  prompt_generation: 'promptGeneration',
  ai_chat: 'aiChatAccess',
  template_create: 'customTemplates',
  template_share: 'shareTemplates',
  data_export: 'dataExport',
  bulk_operations: 'bulkOperations',
  team_collaboration: 'teamCollaboration',
  priority_processing: 'priorityProcessing',
  advanced_ai_models: 'advancedAiModels',
  unlimited_history: 'unlimitedHistory',
}

/**
 * 需要计入配额的操作
 */
const QUOTA_TRACKED_OPERATIONS: SystemOperation[] = [
  'prompt_generation',
  'ai_chat',
]

// ============ 权限检查器 ============

/**
 * 权限检查器类
 */
export class PermissionChecker {
  private config: PermissionConfig
  private cache: Map<string, { result: PermissionCheckResult; timestamp: number }> = new Map()

  constructor(config?: Partial<PermissionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  // ============ 核心权限检查 ============

  /**
   * 检查用户是否有权限执行特定操作
   */
  async checkPermission(
    userEmail: string,
    operation: SystemOperation,
    options: {
      incrementUsage?: boolean
      bypassCache?: boolean
    } = {}
  ): Promise<PermissionCheckResult> {
    if (!this.config.enabled) {
      return { allowed: true }
    }

    const { incrementUsage = false, bypassCache = false } = options
    
    // 尝试从缓存获取 (不包含使用量增加的情况)
    if (!incrementUsage && !bypassCache) {
      const cached = this.getCachedResult(userEmail, operation)
      if (cached) return cached
    }

    try {
      // 获取用户订阅状态
      const usageStatus = await subscriptionService.getUserSubscriptionStatus(userEmail)
      const planType = usageStatus.subscriptionType

      // 1. 检查功能权限
      const featureCheck = this.checkFeaturePermission(planType, operation)
      if (!featureCheck.allowed) {
        return this.cacheAndReturn(userEmail, operation, featureCheck)
      }

      // 2. 检查配额限制 (仅对需要计入配额的操作)
      if (QUOTA_TRACKED_OPERATIONS.includes(operation)) {
        const quotaCheck = await this.checkQuotaLimit(userEmail, usageStatus, incrementUsage)
        if (!quotaCheck.allowed) {
          return quotaCheck // 配额检查失败不缓存，因为可能很快就会重置
        }
      }

      const successResult: PermissionCheckResult = { allowed: true }
      return this.cacheAndReturn(userEmail, operation, successResult)

    } catch (error) {
      console.error('Permission check error:', error)
      return {
        allowed: false,
        reason: 'Internal error during permission check',
        errorCode: 'USAGE_TRACKING_ERROR'
      }
    }
  }

  /**
   * 批量检查多个操作权限
   */
  async checkMultiplePermissions(
    userEmail: string,
    operations: SystemOperation[]
  ): Promise<Record<SystemOperation, PermissionCheckResult>> {
    const results: Record<SystemOperation, PermissionCheckResult> = {} as any

    // 并行检查所有权限 (不增加使用量)
    const checks = operations.map(async operation => ({
      operation,
      result: await this.checkPermission(userEmail, operation, { incrementUsage: false })
    }))

    const resolvedChecks = await Promise.all(checks)
    
    for (const { operation, result } of resolvedChecks) {
      results[operation] = result
    }

    return results
  }

  // ============ 具体检查逻辑 ============

  /**
   * 检查功能权限
   */
  private checkFeaturePermission(
    planType: SubscriptionPlanType,
    operation: SystemOperation
  ): PermissionCheckResult {
    const permissionKey = OPERATION_PERMISSION_MAP[operation]
    if (!permissionKey) {
      // 未定义的操作默认允许
      return { allowed: true }
    }

    const hasAccess = checkFeatureAccess(planType, permissionKey)
    if (hasAccess) {
      return { allowed: true }
    }

    // 确定需要升级到的计划
    const requiredPlan = this.getRequiredPlanForOperation(operation)
    const upgradeOption = getUpgradeSuggestion(planType)

    return {
      allowed: false,
      reason: `This feature requires ${requiredPlan} subscription`,
      errorCode: 'INVALID_SUBSCRIPTION',
      upgradeRequired: this.config.includeUpgradeUrls ? {
        currentPlan: planType,
        requiredPlan,
        upgradeUrl: '/pricing'
      } : undefined
    }
  }

  /**
   * 检查配额限制
   */
  private async checkQuotaLimit(
    userEmail: string,
    usageStatus: any,
    incrementUsage: boolean
  ): Promise<PermissionCheckResult> {
    const { quota } = usageStatus

    // 无限制计划
    if (quota.limit === -1) {
      if (incrementUsage) {
        await usageTrackingService.incrementUsage(userEmail)
      }
      return { allowed: true }
    }

    // 检查是否已超出配额
    if (quota.used >= quota.limit) {
      const upgradeOption = getUpgradeSuggestion(usageStatus.subscriptionType)
      
      const error: QuotaExceededError = {
        code: 'QUOTA_EXCEEDED',
        message: `Monthly quota of ${quota.limit} prompts exceeded`,
        details: {
          currentUsage: quota.used,
          quota: quota.limit,
          resetDate: usageStatus.resetDate.toISOString(),
          upgradeUrl: '/pricing',
          suggestedPlan: upgradeOption?.type || 'pro'
        }
      }

      return {
        allowed: false,
        reason: error.message,
        errorCode: error.code,
        upgradeRequired: this.config.includeUpgradeUrls ? {
          currentPlan: usageStatus.subscriptionType,
          requiredPlan: error.details.suggestedPlan,
          upgradeUrl: error.details.upgradeUrl
        } : undefined
      }
    }

    // 增加使用量计数
    if (incrementUsage) {
      await usageTrackingService.incrementUsage(userEmail)
    }

    return { allowed: true }
  }

  /**
   * 确定操作所需的最低计划级别
   */
  private getRequiredPlanForOperation(operation: SystemOperation): SubscriptionPlanType {
    // 根据功能映射确定所需计划
    switch (operation) {
      case 'template_create':
      case 'template_share':
      case 'data_export':
      case 'bulk_operations':
      case 'priority_processing':
      case 'advanced_ai_models':
      case 'unlimited_history':
        return 'pro'
      
      case 'team_collaboration':
        return 'team'
      
      case 'prompt_generation':
      case 'ai_chat':
      default:
        return 'free'
    }
  }

  // ============ 缓存管理 ============

  /**
   * 获取缓存结果
   */
  private getCachedResult(userEmail: string, operation: SystemOperation): PermissionCheckResult | null {
    if (!this.config.enableCaching) return null

    const key = `${userEmail}:${operation}`
    const cached = this.cache.get(key)
    
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > this.config.cacheExpiry * 1000
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return cached.result
  }

  /**
   * 缓存并返回结果
   */
  private cacheAndReturn(
    userEmail: string,
    operation: SystemOperation,
    result: PermissionCheckResult
  ): PermissionCheckResult {
    if (this.config.enableCaching && result.allowed) {
      const key = `${userEmail}:${operation}`
      this.cache.set(key, {
        result,
        timestamp: Date.now()
      })
    }

    return result
  }

  /**
   * 清理过期缓存
   */
  clearExpiredCache(): void {
    const now = Date.now()
    const expiry = this.config.cacheExpiry * 1000

    for (const [key, cached] of Array.from(this.cache.entries())) {
      if (now - cached.timestamp > expiry) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 清空所有缓存
   */
  clearCache(): void {
    this.cache.clear()
  }
}

// ============ Next.js中间件工厂 ============

/**
 * 创建权限检查中间件
 */
export function createPermissionMiddleware(
  operation: SystemOperation,
  options: {
    incrementUsage?: boolean
    extractUserEmail?: (request: NextRequest) => string | null
  } = {}
) {
  const permissionChecker = new PermissionChecker()

  return async (request: NextRequest): Promise<NextResponse | null> => {
    const { incrementUsage = false, extractUserEmail } = options
    
    // 提取用户邮箱
    const userEmail = extractUserEmail ? 
      extractUserEmail(request) : 
      DEFAULT_CONFIG.extractUserEmail(request)

    if (!userEmail) {
      return NextResponse.json(
        { 
          error: 'User identification required',
          code: 'INVALID_SUBSCRIPTION'
        },
        { status: 401 }
      )
    }

    // 检查权限
    const permissionResult = await permissionChecker.checkPermission(
      userEmail,
      operation,
      { incrementUsage }
    )

    if (!permissionResult.allowed) {
      const status = permissionResult.errorCode === 'QUOTA_EXCEEDED' ? 429 : 403
      
      return NextResponse.json(
        {
          error: permissionResult.reason || 'Permission denied',
          code: permissionResult.errorCode || 'INVALID_SUBSCRIPTION',
          ...(permissionResult.upgradeRequired && {
            upgrade: permissionResult.upgradeRequired
          })
        },
        { status }
      )
    }

    // 权限检查通过，继续请求
    return null
  }
}

/**
 * API路由权限装饰器
 */
export function withPermission(
  operation: SystemOperation,
  options: {
    incrementUsage?: boolean
    extractUserEmail?: (request: NextRequest) => string | null
  } = {}
) {
  return function <T extends any[]>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
      const middleware = createPermissionMiddleware(operation, options)
      const middlewareResult = await middleware(request)
      
      // 如果中间件返回响应，说明权限检查失败
      if (middlewareResult) {
        return middlewareResult
      }
      
      // 权限检查通过，执行原始处理函数
      return handler(request, ...args)
    }
  }
}

// ============ 工具函数 ============

/**
 * 快速权限检查 (不增加使用量)
 */
export async function quickPermissionCheck(
  userEmail: string,
  operation: SystemOperation
): Promise<boolean> {
  const checker = new PermissionChecker()
  const result = await checker.checkPermission(userEmail, operation, { incrementUsage: false })
  return result.allowed
}

/**
 * 获取用户权限摘要
 */
export async function getUserPermissionSummary(userEmail: string) {
  const checker = new PermissionChecker()
  const allOperations: SystemOperation[] = [
    'prompt_generation',
    'ai_chat', 
    'template_create',
    'template_share',
    'data_export',
    'bulk_operations',
    'team_collaboration',
    'priority_processing',
    'advanced_ai_models',
    'unlimited_history'
  ]

  const permissions = await checker.checkMultiplePermissions(userEmail, allOperations)
  const usageStatus = await subscriptionService.getUserSubscriptionStatus(userEmail)

  return {
    subscriptionType: usageStatus.subscriptionType,
    usageStatus,
    permissions,
    allowedOperations: Object.entries(permissions)
      .filter(([_, result]) => result.allowed)
      .map(([operation]) => operation),
    restrictedOperations: Object.entries(permissions)
      .filter(([_, result]) => !result.allowed)
      .map(([operation, result]) => ({
        operation,
        reason: result.reason,
        upgradeRequired: result.upgradeRequired
      }))
  }
}

// ============ 单例导出 ============

/**
 * 默认权限检查器实例
 */
export const permissionChecker = new PermissionChecker()