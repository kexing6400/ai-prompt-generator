/**
 * 🔐 企业级速率限制中间件
 * 防护暴力破解、DDoS攻击和API滥用
 * 支持多种限制策略和自适应调整
 */

import { NextRequest, NextResponse } from 'next/server'
import { RateLimiterMemory, RateLimiterRedis, IRateLimiterOptions } from 'rate-limiter-flexible'

// 🔐 速率限制配置
const RATE_LIMIT_CONFIGS = {
  // 登录限制：15分钟内最多5次
  login: {
    points: 5,
    duration: 15 * 60, // 15分钟
    blockDuration: 15 * 60 // 封禁15分钟
  },
  
  // 一般API限制：1分钟内最多100次
  api: {
    points: 100,
    duration: 60, // 1分钟
    blockDuration: 60 // 封禁1分钟
  },
  
  // 管理API限制：1分钟内最多30次
  adminApi: {
    points: 30,
    duration: 60,
    blockDuration: 5 * 60 // 封禁5分钟
  },
  
  // 密码重置：1小时内最多3次
  passwordReset: {
    points: 3,
    duration: 60 * 60, // 1小时
    blockDuration: 60 * 60 // 封禁1小时
  },
  
  // IP全局限制：1分钟内最多200次
  global: {
    points: 200,
    duration: 60,
    blockDuration: 5 * 60
  }
} as const

// 🔐 速率限制器类型
type RateLimitType = keyof typeof RATE_LIMIT_CONFIGS

// 🔐 速率限制器实例
class RateLimitManager {
  private limiters = new Map<string, RateLimiterMemory>()
  
  constructor() {
    // 初始化所有限制器
    Object.entries(RATE_LIMIT_CONFIGS).forEach(([type, config]) => {
      this.limiters.set(type, new RateLimiterMemory({
        points: config.points,
        duration: config.duration,
        blockDuration: config.blockDuration,
        execEvenly: true // 平滑处理请求
      }))
    })
  }
  
  /**
   * 检查速率限制
   * @param type 限制类型
   * @param key 限制键（通常是IP地址或用户ID）
   * @returns 是否允许请求
   */
  async checkLimit(type: RateLimitType, key: string): Promise<{
    allowed: boolean,
    remainingPoints?: number,
    msBeforeNext?: number,
    resetTime?: Date
  }> {
    const limiter = this.limiters.get(type)
    if (!limiter) {
      throw new Error(`未知的限制类型: ${type}`)
    }
    
    try {
      const result = await limiter.consume(key)
      
      return {
        allowed: true,
        remainingPoints: result.remainingPoints,
        msBeforeNext: result.msBeforeNext,
        resetTime: new Date(Date.now() + result.msBeforeNext)
      }
    } catch (rejRes: any) {
      // 超过限制
      return {
        allowed: false,
        remainingPoints: rejRes.remainingPoints || 0,
        msBeforeNext: rejRes.msBeforeNext || 0,
        resetTime: new Date(Date.now() + (rejRes.msBeforeNext || 0))
      }
    }
  }
  
  /**
   * 重置特定键的限制
   * @param type 限制类型
   * @param key 限制键
   */
  async resetLimit(type: RateLimitType, key: string): Promise<void> {
    const limiter = this.limiters.get(type)
    if (limiter) {
      await limiter.delete(key)
    }
  }
  
  /**
   * 获取限制状态
   * @param type 限制类型
   * @param key 限制键
   */
  async getLimitStatus(type: RateLimitType, key: string): Promise<{
    totalHits: number,
    remainingPoints: number,
    msBeforeNext: number,
    resetTime: Date
  } | null> {
    const limiter = this.limiters.get(type)
    if (!limiter) return null
    
    try {
      const result = await limiter.get(key)
      if (!result) return null
      
      return {
        totalHits: (result as any).totalHits || 0,
        remainingPoints: result.remainingPoints || 0,
        msBeforeNext: result.msBeforeNext || 0,
        resetTime: new Date(Date.now() + (result.msBeforeNext || 0))
      }
    } catch {
      return null
    }
  }
}

// 🔐 全局速率限制管理器
const rateLimitManager = new RateLimitManager()

/**
 * 从请求中获取客户端标识
 * @param request Next.js请求对象
 * @returns 客户端IP地址或标识
 */
export function getClientIdentifier(request: NextRequest): string {
  // 优先使用真实IP
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const remoteAddr = request.ip
  
  const ip = forwarded?.split(',')[0]?.trim() || 
            realIp || 
            remoteAddr || 
            '127.0.0.1'
  
  return ip
}

/**
 * 创建速率限制中间件
 * @param type 限制类型
 * @param getKey 获取限制键的函数（可选）
 */
export function createRateLimit(
  type: RateLimitType,
  getKey?: (request: NextRequest) => string
) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const key = getKey ? getKey(request) : getClientIdentifier(request)
    
    try {
      const result = await rateLimitManager.checkLimit(type, key)
      
      if (!result.allowed) {
        // 请求被限制，返回429状态
        const response = NextResponse.json({
          error: '请求过于频繁',
          message: '您的请求过于频繁，请稍后再试',
          retryAfter: Math.ceil((result.msBeforeNext || 0) / 1000),
          resetTime: result.resetTime?.toISOString()
        }, { status: 429 })
        
        // 设置速率限制响应头
        response.headers.set('X-RateLimit-Limit', RATE_LIMIT_CONFIGS[type].points.toString())
        response.headers.set('X-RateLimit-Remaining', (result.remainingPoints || 0).toString())
        response.headers.set('X-RateLimit-Reset', (result.resetTime?.getTime() || 0).toString())
        response.headers.set('Retry-After', Math.ceil((result.msBeforeNext || 0) / 1000).toString())
        
        // 记录被限制的请求
        console.warn('🚨 请求被速率限制:', {
          type,
          key,
          timestamp: new Date().toISOString(),
          userAgent: request.headers.get('user-agent'),
          url: request.url
        })
        
        return response
      }
      
      // 请求允许，但在响应中包含限制信息
      const response = NextResponse.next()
      response.headers.set('X-RateLimit-Limit', RATE_LIMIT_CONFIGS[type].points.toString())
      response.headers.set('X-RateLimit-Remaining', (result.remainingPoints || 0).toString())
      response.headers.set('X-RateLimit-Reset', (result.resetTime?.getTime() || 0).toString())
      
      return null // 继续处理请求
    } catch (error) {
      console.error('🚨 速率限制检查失败:', error)
      // 发生错误时允许请求通过，但记录日志
      return null
    }
  }
}

/**
 * 登录速率限制中间件
 */
export const loginRateLimit = createRateLimit('login')

/**
 * API速率限制中间件
 */
export const apiRateLimit = createRateLimit('api')

/**
 * 管理API速率限制中间件
 */
export const adminApiRateLimit = createRateLimit('adminApi')

/**
 * 密码重置速率限制中间件
 */
export const passwordResetRateLimit = createRateLimit('passwordReset')

/**
 * 全局速率限制中间件
 */
export const globalRateLimit = createRateLimit('global')

/**
 * 组合多个速率限制器
 * @param limiters 限制器数组
 */
export function combineRateLimits(
  ...limiters: ((request: NextRequest) => Promise<NextResponse | null>)[]
) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    for (const limiter of limiters) {
      const result = await limiter(request)
      if (result) {
        return result // 如果任何一个限制器拒绝请求，立即返回
      }
    }
    return null // 所有限制器都允许请求
  }
}

/**
 * 智能速率限制（根据用户行为自适应调整）
 */
export class AdaptiveRateLimit {
  private static suspiciousIPs = new Set<string>()
  private static trustedIPs = new Set<string>()
  
  /**
   * 标记可疑IP
   */
  static markSuspicious(ip: string): void {
    this.suspiciousIPs.add(ip)
    this.trustedIPs.delete(ip)
  }
  
  /**
   * 标记可信IP
   */
  static markTrusted(ip: string): void {
    this.trustedIPs.add(ip)
    this.suspiciousIPs.delete(ip)
  }
  
  /**
   * 创建自适应速率限制
   */
  static create(baseType: RateLimitType) {
    return async (request: NextRequest): Promise<NextResponse | null> => {
      const ip = getClientIdentifier(request)
      
      let effectiveType = baseType
      
      // 可疑IP使用更严格的限制
      if (this.suspiciousIPs.has(ip)) {
        effectiveType = 'login' // 使用最严格的限制
      }
      
      // 可信IP使用更宽松的限制
      if (this.trustedIPs.has(ip)) {
        effectiveType = 'api' // 使用较宽松的限制
      }
      
      return createRateLimit(effectiveType)(request)
    }
  }
}

/**
 * 重置用户的所有速率限制
 * @param userId 用户ID
 */
export async function resetUserRateLimit(userId: string): Promise<void> {
  for (const type of Object.keys(RATE_LIMIT_CONFIGS) as RateLimitType[]) {
    await rateLimitManager.resetLimit(type, userId)
  }
}

/**
 * 获取速率限制统计信息
 * @param type 限制类型
 * @param key 限制键
 */
export async function getRateLimitStatus(
  type: RateLimitType, 
  key: string
): Promise<any> {
  return rateLimitManager.getLimitStatus(type, key)
}