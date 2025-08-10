/**
 * AI Prompt Generator - 订阅系统类型定义
 * 
 * 三层订阅体系架构的核心类型定义
 * 🆓 免费版：50次/月生成限制，核心功能完全免费
 * 💎 专业版：$4.99/月，500次/月，高级功能  
 * 🏢 团队版：$19.99/月，无限制，团队协作
 */

// ============ 订阅计划相关类型 ============

/**
 * 订阅计划类型 - 扩展现有定义
 */
export type SubscriptionPlanType = 'free' | 'pro' | 'team'

/**
 * 订阅计划详情接口
 */
export interface SubscriptionPlan {
  id: string
  name: string
  displayName: string
  description: string
  type: SubscriptionPlanType
  
  // 定价信息
  priceMonthly: number // 以分为单位，避免浮点数问题
  priceCurrency: string // 默认 'USD'
  
  // 配额限制
  monthlyQuota: number // 每月生成次数限制，-1表示无限制
  
  // 功能权限配置
  features: SubscriptionFeatures
  
  // 状态信息
  isActive: boolean
  isPopular?: boolean // 推荐标记
  
  // 时间戳
  createdAt: Date
  updatedAt: Date
}

/**
 * 订阅功能权限配置
 */
export interface SubscriptionFeatures {
  // 核心功能权限
  promptGeneration: boolean        // 基础prompt生成
  advancedTemplates: boolean       // 高级模板访问
  customTemplates: boolean         // 自定义模板创建
  
  // AI功能权限
  aiChatAccess: boolean           // AI对话功能
  advancedAiModels: boolean       // 高级AI模型访问
  priorityProcessing: boolean     // 优先处理队列
  
  // 数据与导出
  historyAccess: boolean          // 历史记录访问
  unlimitedHistory: boolean       // 无限历史记录
  dataExport: boolean            // 数据导出功能
  bulkOperations: boolean        // 批量操作
  
  // 协作功能
  teamCollaboration: boolean     // 团队协作
  shareTemplates: boolean        // 模板分享
  teamAnalytics: boolean         // 团队分析
  
  // 支持服务
  emailSupport: boolean          // 邮件支持
  prioritySupport: boolean       // 优先支持
  phoneSupport: boolean          // 电话支持
  
  // 技术限制
  apiRateLimit: number           // API速率限制 (请求/分钟)
  maxTeamMembers?: number        // 最大团队成员数
}

// ============ 用户订阅状态类型 ============

/**
 * 用户订阅状态
 */
export type SubscriptionStatus = 
  | 'active'      // 活跃订阅
  | 'canceled'    // 已取消 (但仍在当前周期内有效)
  | 'expired'     // 已过期
  | 'paused'      // 暂停 (保留功能，未来支持)
  | 'trial'       // 试用期

/**
 * 用户订阅信息接口
 */
export interface UserSubscription {
  id: string
  userEmail: string              // 用户邮箱作为标识
  
  // 订阅计划信息
  planId: string
  planType: SubscriptionPlanType
  status: SubscriptionStatus
  
  // 周期信息
  currentPeriodStart: Date       // 当前周期开始时间
  currentPeriodEnd: Date         // 当前周期结束时间
  cancelAtPeriodEnd: boolean     // 是否在周期结束时取消
  
  // 支付系统集成
  creemSubscriptionId?: string   // Creem.io订阅ID
  creemCustomerId?: string       // Creem.io客户ID
  
  // 试用信息 (为免费用户升级到付费的试用期预留)
  trialStart?: Date
  trialEnd?: Date
  
  // 时间戳
  createdAt: Date
  updatedAt: Date
  canceledAt?: Date
}

// ============ 使用量追踪类型 ============

/**
 * 使用量追踪记录
 */
export interface UsageTracking {
  id: string
  userEmail: string
  yearMonth: string              // 格式：'2025-01'，便于按月统计
  usageCount: number             // 当月使用次数
  lastUsedAt: Date              // 最后使用时间
  createdAt: Date               // 创建时间
}

/**
 * 用户当前使用量状态
 */
export interface UserUsageStatus {
  userEmail: string
  currentPeriod: {
    start: Date
    end: Date
  }
  quota: {
    limit: number                // 配额限制，-1表示无限制
    used: number                 // 已使用次数
    remaining: number            // 剩余次数
  }
  subscriptionType: SubscriptionPlanType
  canGenerate: boolean          // 是否可以继续生成
  resetDate: Date               // 配额重置时间
}

// ============ 支付系统集成类型 ============

/**
 * Creem.io Webhook事件类型
 */
export type CreemWebhookEventType = 
  | 'subscription.created'
  | 'subscription.updated'  
  | 'subscription.canceled'
  | 'subscription.expired'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'

/**
 * Creem.io Webhook载荷
 */
export interface CreemWebhookPayload {
  id: string
  type: CreemWebhookEventType
  createdAt: number             // Unix时间戳
  data: {
    subscription?: {
      id: string
      customerId: string
      planId: string
      status: string
      currentPeriodStart: number
      currentPeriodEnd: number
      cancelAtPeriodEnd: boolean
    }
    customer?: {
      id: string
      email: string
      name?: string
    }
    payment?: {
      id: string
      amount: number
      currency: string
      status: string
    }
  }
}

/**
 * 创建订阅请求
 */
export interface CreateSubscriptionRequest {
  userEmail: string
  planId: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}

/**
 * 创建订阅响应
 */
export interface CreateSubscriptionResponse {
  subscriptionId: string
  checkoutUrl: string           // 支付页面URL
  customerId: string
}

// ============ API响应类型 ============

/**
 * 订阅计划列表响应
 */
export interface SubscriptionPlansResponse {
  plans: SubscriptionPlan[]
  currentUserPlan?: SubscriptionPlanType
}

/**
 * 用户订阅状态响应
 */
export interface UserSubscriptionResponse {
  subscription: UserSubscription
  usage: UserUsageStatus
  availableUpgrades: SubscriptionPlan[]
}

/**
 * 使用量查询响应
 */
export interface UsageStatsResponse {
  currentPeriod: UserUsageStatus
  history: Array<{
    month: string              // 格式：'2025-01'
    usage: number
    limit: number
  }>
  trends: {
    averageDaily: number
    projectedMonthly: number
  }
}

/**
 * 订阅操作结果
 */
export interface SubscriptionOperationResult {
  success: boolean
  message: string
  data?: {
    subscription?: UserSubscription
    redirectUrl?: string       // 支付或管理页面URL
  }
  error?: {
    code: SubscriptionErrorCode
    details?: Record<string, unknown>
  }
}

// ============ 错误处理类型 ============

/**
 * 订阅系统错误代码
 */
export type SubscriptionErrorCode = 
  | 'QUOTA_EXCEEDED'           // 配额已用完
  | 'SUBSCRIPTION_EXPIRED'     // 订阅已过期
  | 'SUBSCRIPTION_CANCELED'    // 订阅已取消
  | 'PAYMENT_FAILED'          // 支付失败
  | 'PLAN_NOT_FOUND'          // 计划不存在
  | 'INVALID_SUBSCRIPTION'    // 无效订阅
  | 'WEBHOOK_VERIFICATION_FAILED' // Webhook验证失败
  | 'CREEM_API_ERROR'         // Creem.io API错误
  | 'USAGE_TRACKING_ERROR'    // 使用量跟踪错误

/**
 * 配额限制错误详情
 */
export interface QuotaExceededError {
  code: 'QUOTA_EXCEEDED'
  message: string
  details: {
    currentUsage: number
    quota: number
    resetDate: string
    upgradeUrl: string
    suggestedPlan: SubscriptionPlanType
  }
}

// ============ 中间件相关类型 ============

/**
 * 权限检查结果
 */
export interface PermissionCheckResult {
  allowed: boolean
  reason?: string
  errorCode?: SubscriptionErrorCode
  upgradeRequired?: {
    currentPlan: SubscriptionPlanType
    requiredPlan: SubscriptionPlanType
    upgradeUrl: string
  }
}

/**
 * 使用量检查选项
 */
export interface UsageCheckOptions {
  userEmail: string
  operation: 'prompt_generation' | 'ai_chat' | 'template_create'
  incrementUsage?: boolean      // 是否增加使用计数
}

// ============ 分析和报表类型 ============

/**
 * 订阅分析数据
 */
export interface SubscriptionAnalytics {
  overview: {
    totalSubscribers: number
    activeSubscriptions: number
    monthlyRecurringRevenue: number // MRR
    churnRate: number               // 流失率
  }
  planDistribution: Record<SubscriptionPlanType, {
    count: number
    percentage: number
    revenue: number
  }>
  usageStats: {
    averageUsageByPlan: Record<SubscriptionPlanType, number>
    quotaUtilization: Record<SubscriptionPlanType, number>
    peakUsageHours: Array<{
      hour: number
      count: number
    }>
  }
  conversionMetrics: {
    freeToProRate: number
    proToTeamRate: number
    trialConversionRate: number
  }
}

// ============ 配置类型 ============

/**
 * 订阅系统配置
 */
export interface SubscriptionConfig {
  plans: SubscriptionPlan[]
  creem: {
    apiKey: string
    webhookSecret: string
    baseUrl: string
  }
  features: {
    enableTrials: boolean
    trialDurationDays: number
    enableTeamPlans: boolean
    enableUsageAlerts: boolean
  }
  limits: {
    maxApiRequests: Record<SubscriptionPlanType, number>
    maxTeamMembers: Record<SubscriptionPlanType, number>
    maxHistoryMonths: Record<SubscriptionPlanType, number>
  }
}