/**
 * Creem.io支付系统集成服务
 * 
 * 负责与Creem.io支付平台的集成，包括订阅创建、Webhook处理、支付状态同步
 */

import { 
  CreateSubscriptionRequest,
  CreateSubscriptionResponse,
  CreemWebhookPayload,
  CreemWebhookEventType,
  SubscriptionOperationResult,
  SubscriptionPlanType 
} from '@/types/subscription'
import { getPlanByType, getPlanPrice } from './plans'
import * as crypto from 'crypto'

// ============ Creem.io API配置 ============

/**
 * Creem.io API配置接口
 */
export interface CreemConfig {
  apiKey: string
  baseUrl: string
  webhookSecret: string
  environment: 'sandbox' | 'production'
}

/**
 * 默认配置 (从环境变量读取)
 */
const getDefaultConfig = (): CreemConfig => ({
  apiKey: process.env.CREEM_API_KEY || '',
  baseUrl: process.env.CREEM_BASE_URL || 'https://api.creem.io',
  webhookSecret: process.env.CREEM_WEBHOOK_SECRET || '',
  environment: (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox') as 'sandbox' | 'production',
})

// ============ Creem.io API客户端 ============

/**
 * Creem.io API响应接口
 */
interface CreemApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
}

/**
 * 订阅创建响应
 */
interface CreemSubscriptionData {
  id: string
  customerId: string
  planId: string
  status: string
  currentPeriodStart: number
  currentPeriodEnd: number
  checkoutUrl: string
  cancelAtPeriodEnd: boolean
}

/**
 * 客户创建响应
 */
interface CreemCustomerData {
  id: string
  email: string
  name?: string
}

/**
 * Creem.io API客户端
 */
class CreemApiClient {
  private config: CreemConfig

  constructor(config: CreemConfig) {
    this.config = config
  }

  /**
   * 发送HTTP请求到Creem.io API
   */
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<CreemApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'User-Agent': 'AI-Prompt-Generator/1.0',
        },
        body: data ? JSON.stringify(data) : undefined,
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: result.code || 'API_ERROR',
            message: result.message || 'Unknown API error',
            details: result,
          }
        }
      }

      return {
        success: true,
        data: result,
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network request failed',
          details: error,
        }
      }
    }
  }

  /**
   * 创建或获取客户
   */
  async createOrGetCustomer(email: string, name?: string): Promise<CreemApiResponse<CreemCustomerData>> {
    return this.makeRequest<CreemCustomerData>('/customers', 'POST', {
      email,
      name,
    })
  }

  /**
   * 创建订阅
   */
  async createSubscription(
    customerId: string,
    planId: string,
    successUrl: string,
    cancelUrl: string,
    metadata?: Record<string, string>
  ): Promise<CreemApiResponse<CreemSubscriptionData>> {
    return this.makeRequest<CreemSubscriptionData>('/subscriptions', 'POST', {
      customerId,
      planId,
      successUrl,
      cancelUrl,
      metadata,
    })
  }

  /**
   * 获取订阅详情
   */
  async getSubscription(subscriptionId: string): Promise<CreemApiResponse<CreemSubscriptionData>> {
    return this.makeRequest<CreemSubscriptionData>(`/subscriptions/${subscriptionId}`)
  }

  /**
   * 取消订阅
   */
  async cancelSubscription(subscriptionId: string): Promise<CreemApiResponse<CreemSubscriptionData>> {
    return this.makeRequest<CreemSubscriptionData>(`/subscriptions/${subscriptionId}/cancel`, 'POST')
  }

  /**
   * 获取客户的所有订阅
   */
  async getCustomerSubscriptions(customerId: string): Promise<CreemApiResponse<CreemSubscriptionData[]>> {
    return this.makeRequest<CreemSubscriptionData[]>(`/customers/${customerId}/subscriptions`)
  }
}

// ============ 支付服务 ============

/**
 * 支付服务类
 */
export class PaymentService {
  private apiClient: CreemApiClient
  private config: CreemConfig

  constructor(config?: Partial<CreemConfig>) {
    this.config = { ...getDefaultConfig(), ...config }
    this.apiClient = new CreemApiClient(this.config)
    
    // 验证配置
    this.validateConfig()
  }

  /**
   * 验证配置有效性
   */
  private validateConfig(): void {
    if (!this.config.apiKey) {
      console.warn('Creem.io API key not configured. Payment features will be disabled.')
    }
    if (!this.config.webhookSecret) {
      console.warn('Creem.io webhook secret not configured. Webhook verification will be disabled.')
    }
  }

  // ============ 订阅管理 ============

  /**
   * 创建订阅
   */
  async createSubscription(request: CreateSubscriptionRequest): Promise<SubscriptionOperationResult> {
    try {
      // 验证订阅计划存在
      const plan = getPlanByType(request.planId as SubscriptionPlanType)
      if (!plan) {
        return {
          success: false,
          message: 'Invalid subscription plan',
          error: {
            code: 'PLAN_NOT_FOUND',
          }
        }
      }

      // 创建或获取客户
      const customerResult = await this.apiClient.createOrGetCustomer(request.userEmail)
      if (!customerResult.success || !customerResult.data) {
        return {
          success: false,
          message: 'Failed to create customer',
          error: {
            code: 'CREEM_API_ERROR',
            details: customerResult.error,
          }
        }
      }

      // 创建订阅
      const subscriptionResult = await this.apiClient.createSubscription(
        customerResult.data.id,
        plan.id,
        request.successUrl,
        request.cancelUrl,
        request.metadata
      )

      if (!subscriptionResult.success || !subscriptionResult.data) {
        return {
          success: false,
          message: 'Failed to create subscription',
          error: {
            code: 'CREEM_API_ERROR',
            details: subscriptionResult.error,
          }
        }
      }

      const subscriptionData = subscriptionResult.data

      return {
        success: true,
        message: 'Subscription created successfully',
        data: {
          redirectUrl: subscriptionData.checkoutUrl,
        }
      }

    } catch (error) {
      console.error('Create subscription error:', error)
      return {
        success: false,
        message: 'Internal error creating subscription',
        error: {
          code: 'CREEM_API_ERROR',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      }
    }
  }

  /**
   * 取消订阅
   */
  async cancelSubscription(creemSubscriptionId: string): Promise<SubscriptionOperationResult> {
    try {
      const result = await this.apiClient.cancelSubscription(creemSubscriptionId)
      
      if (!result.success) {
        return {
          success: false,
          message: 'Failed to cancel subscription',
          error: {
            code: 'CREEM_API_ERROR',
            details: result.error,
          }
        }
      }

      return {
        success: true,
        message: 'Subscription canceled successfully',
      }

    } catch (error) {
      console.error('Cancel subscription error:', error)
      return {
        success: false,
        message: 'Internal error canceling subscription',
        error: {
          code: 'CREEM_API_ERROR',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      }
    }
  }

  /**
   * 获取订阅详情
   */
  async getSubscriptionDetails(creemSubscriptionId: string) {
    try {
      const result = await this.apiClient.getSubscription(creemSubscriptionId)
      
      if (!result.success || !result.data) {
        return null
      }

      const data = result.data
      return {
        id: data.id,
        customerId: data.customerId,
        planId: data.planId,
        status: data.status,
        currentPeriodStart: new Date(data.currentPeriodStart * 1000),
        currentPeriodEnd: new Date(data.currentPeriodEnd * 1000),
        cancelAtPeriodEnd: data.cancelAtPeriodEnd,
      }

    } catch (error) {
      console.error('Get subscription details error:', error)
      return null
    }
  }

  // ============ Webhook处理 ============

  /**
   * 验证Webhook签名
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.config.webhookSecret) {
      console.warn('Webhook secret not configured, skipping signature verification')
      return true // 在开发环境跳过验证
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.config.webhookSecret)
        .update(payload, 'utf8')
        .digest('hex')

      const providedSignature = signature.replace('sha256=', '')
      
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      )
    } catch (error) {
      console.error('Webhook signature verification error:', error)
      return false
    }
  }

  /**
   * 解析Webhook载荷
   */
  parseWebhookPayload(rawPayload: string): CreemWebhookPayload | null {
    try {
      const payload = JSON.parse(rawPayload) as CreemWebhookPayload
      
      // 基础验证
      if (!payload.id || !payload.type || !payload.data) {
        console.error('Invalid webhook payload structure')
        return null
      }

      return payload
    } catch (error) {
      console.error('Failed to parse webhook payload:', error)
      return null
    }
  }

  /**
   * 处理Webhook事件
   */
  async processWebhookEvent(payload: CreemWebhookPayload): Promise<{
    processed: boolean
    message: string
    error?: string
  }> {
    try {
      console.log(`Processing webhook event: ${payload.type}`)

      switch (payload.type) {
        case 'subscription.created':
          return await this.handleSubscriptionCreated(payload)
        
        case 'subscription.updated':
          return await this.handleSubscriptionUpdated(payload)
        
        case 'subscription.canceled':
          return await this.handleSubscriptionCanceled(payload)
        
        case 'subscription.expired':
          return await this.handleSubscriptionExpired(payload)
        
        case 'payment.succeeded':
          return await this.handlePaymentSucceeded(payload)
        
        case 'payment.failed':
          return await this.handlePaymentFailed(payload)
        
        default:
          console.warn(`Unhandled webhook event type: ${payload.type}`)
          return {
            processed: false,
            message: `Unhandled event type: ${payload.type}`
          }
      }

    } catch (error) {
      console.error('Webhook processing error:', error)
      return {
        processed: false,
        message: 'Internal error processing webhook',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // ============ 私有Webhook处理方法 ============

  private async handleSubscriptionCreated(payload: CreemWebhookPayload) {
    const subscription = payload.data.subscription
    if (!subscription) {
      return { processed: false, message: 'Missing subscription data' }
    }

    console.log(`Subscription created: ${subscription.id}`)
    
    // TODO: 更新本地数据库的订阅状态
    // await subscriptionService.syncSubscriptionFromWebhook(subscription)
    
    return { processed: true, message: 'Subscription created processed' }
  }

  private async handleSubscriptionUpdated(payload: CreemWebhookPayload) {
    const subscription = payload.data.subscription
    if (!subscription) {
      return { processed: false, message: 'Missing subscription data' }
    }

    console.log(`Subscription updated: ${subscription.id}`)
    
    // TODO: 同步订阅状态变更
    
    return { processed: true, message: 'Subscription updated processed' }
  }

  private async handleSubscriptionCanceled(payload: CreemWebhookPayload) {
    const subscription = payload.data.subscription
    if (!subscription) {
      return { processed: false, message: 'Missing subscription data' }
    }

    console.log(`Subscription canceled: ${subscription.id}`)
    
    // TODO: 处理订阅取消逻辑
    
    return { processed: true, message: 'Subscription canceled processed' }
  }

  private async handleSubscriptionExpired(payload: CreemWebhookPayload) {
    const subscription = payload.data.subscription
    if (!subscription) {
      return { processed: false, message: 'Missing subscription data' }
    }

    console.log(`Subscription expired: ${subscription.id}`)
    
    // TODO: 处理订阅过期，降级到免费版
    
    return { processed: true, message: 'Subscription expired processed' }
  }

  private async handlePaymentSucceeded(payload: CreemWebhookPayload) {
    const payment = payload.data.payment
    if (!payment) {
      return { processed: false, message: 'Missing payment data' }
    }

    console.log(`Payment succeeded: ${payment.id}`)
    
    // TODO: 处理支付成功逻辑，激活订阅
    
    return { processed: true, message: 'Payment succeeded processed' }
  }

  private async handlePaymentFailed(payload: CreemWebhookPayload) {
    const payment = payload.data.payment
    if (!payment) {
      return { processed: false, message: 'Missing payment data' }
    }

    console.log(`Payment failed: ${payment.id}`)
    
    // TODO: 处理支付失败逻辑，通知用户，可能暂停服务
    
    return { processed: true, message: 'Payment failed processed' }
  }

  // ============ 工具方法 ============

  /**
   * 生成支付链接 (快速方法)
   */
  async generatePaymentLink(
    userEmail: string,
    planType: SubscriptionPlanType,
    successUrl: string,
    cancelUrl: string
  ): Promise<string | null> {
    const result = await this.createSubscription({
      userEmail,
      planId: planType,
      successUrl,
      cancelUrl,
    })

    return result.success && result.data?.redirectUrl ? result.data.redirectUrl : null
  }

  /**
   * 获取定价信息 (用于前端显示)
   */
  getPricingInfo(planType: SubscriptionPlanType) {
    const plan = getPlanByType(planType)
    const price = getPlanPrice(planType)
    
    return {
      planId: plan.id,
      planName: plan.displayName,
      price: price,
      currency: plan.priceCurrency,
      quota: plan.monthlyQuota,
      features: plan.features,
    }
  }

  /**
   * 检查支付服务是否可用
   */
  isAvailable(): boolean {
    return Boolean(this.config.apiKey)
  }
}

// ============ 单例导出 ============

/**
 * 默认支付服务实例
 */
export const paymentService = new PaymentService()

/**
 * 创建自定义支付服务 (用于测试或特殊配置)
 */
export function createPaymentService(config?: Partial<CreemConfig>): PaymentService {
  return new PaymentService(config)
}