/**
 * AI Prompt Builder Pro - 安全管理系统
 * 
 * 安全层级：
 * 1. 输入验证与清理
 * 2. 认证与授权
 * 3. API限流与防护
 * 4. 数据加密与隐私保护
 * 5. 审计与监控
 * 
 * @author Claude Code (后端架构师)
 * @version 2.0
 * @date 2025-01-10
 */

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import { Request, Response, NextFunction } from 'express'

// =================================================================
// 核心安全类型定义
// =================================================================

export interface SecurityConfig {
  jwt: {
    secret: string
    expiresIn: string
    refreshExpiresIn: string
  }
  rateLimit: {
    windowMs: number
    max: number
    skipSuccessfulRequests?: boolean
  }
  encryption: {
    algorithm: string
    keyLength: number
  }
  password: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSymbols: boolean
  }
}

export interface UserPayload {
  id: string
  email: string
  role: string
  subscriptionStatus: string
  permissions: string[]
}

export interface SecurityContext {
  user?: UserPayload
  apiKey?: string
  ipAddress: string
  userAgent: string
  requestId: string
}

export interface RateLimitConfig {
  identifier: string // 'ip' | 'user' | 'api-key'
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests?: boolean
  message?: string
}

// =================================================================
// 安全管理器主类
// =================================================================

export class SecurityManager {
  private config: SecurityConfig
  private blacklistedTokens = new Set<string>()
  private rateLimiters = new Map<string, any>()

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
        expiresIn: '24h',
        refreshExpiresIn: '7d',
        ...config.jwt
      },
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15分钟
        max: 100, // 每个IP最多100次请求
        skipSuccessfulRequests: false,
        ...config.rateLimit
      },
      encryption: {
        algorithm: 'aes-256-gcm',
        keyLength: 32,
        ...config.encryption
      },
      password: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSymbols: false,
        ...config.password
      }
    }

    this.initializeRateLimiters()
  }

  // =================================================================
  // 认证管理
  // =================================================================

  /**
   * 生成JWT Token
   */
  public generateTokens(payload: UserPayload): {
    accessToken: string
    refreshToken: string
    expiresIn: number
  } {
    const accessToken = jwt.sign(
      payload,
      this.config.jwt.secret,
      { expiresIn: this.config.jwt.expiresIn }
    )

    const refreshToken = jwt.sign(
      { id: payload.id, type: 'refresh' },
      this.config.jwt.secret,
      { expiresIn: this.config.jwt.refreshExpiresIn }
    )

    // 计算过期时间（秒）
    const expiresIn = this.parseTimeToSeconds(this.config.jwt.expiresIn)

    return {
      accessToken,
      refreshToken,
      expiresIn
    }
  }

  /**
   * 验证JWT Token
   */
  public verifyToken(token: string): UserPayload | null {
    try {
      // 检查是否在黑名单中
      if (this.blacklistedTokens.has(token)) {
        return null
      }

      const decoded = jwt.verify(token, this.config.jwt.secret) as any
      
      // 验证token结构
      if (!decoded.id || !decoded.email) {
        return null
      }

      return decoded as UserPayload
    } catch (error) {
      console.error('Token验证失败:', error)
      return null
    }
  }

  /**
   * 刷新Token
   */
  public async refreshToken(refreshToken: string): Promise<{
    accessToken: string
    refreshToken: string
    expiresIn: number
  } | null> {
    try {
      const decoded = jwt.verify(refreshToken, this.config.jwt.secret) as any
      
      if (decoded.type !== 'refresh') {
        return null
      }

      // 从数据库获取最新的用户信息
      const userPayload = await this.getUserPayload(decoded.id)
      if (!userPayload) {
        return null
      }

      return this.generateTokens(userPayload)
    } catch (error) {
      console.error('Token刷新失败:', error)
      return null
    }
  }

  /**
   * 撤销Token（加入黑名单）
   */
  public revokeToken(token: string): void {
    this.blacklistedTokens.add(token)
    
    // 定期清理过期的黑名单token
    setTimeout(() => {
      this.blacklistedTokens.delete(token)
    }, this.parseTimeToSeconds(this.config.jwt.expiresIn) * 1000)
  }

  // =================================================================
  // 密码管理
  // =================================================================

  /**
   * 密码强度验证
   */
  public validatePassword(password: string): {
    isValid: boolean
    errors: string[]
    strength: number // 1-5
  } {
    const errors: string[] = []
    let strength = 1

    // 长度检查
    if (password.length < this.config.password.minLength) {
      errors.push(`密码长度至少${this.config.password.minLength}位`)
    } else {
      strength++
    }

    // 大写字母
    if (this.config.password.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('密码必须包含大写字母')
    } else if (/[A-Z]/.test(password)) {
      strength++
    }

    // 小写字母
    if (this.config.password.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('密码必须包含小写字母')
    } else if (/[a-z]/.test(password)) {
      strength++
    }

    // 数字
    if (this.config.password.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('密码必须包含数字')
    } else if (/[0-9]/.test(password)) {
      strength++
    }

    // 特殊字符
    if (this.config.password.requireSymbols && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('密码必须包含特殊字符')
    } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      strength++
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength: Math.min(strength, 5)
    }
  }

  /**
   * 密码哈希
   */
  public async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return bcrypt.hash(password, saltRounds)
  }

  /**
   * 密码验证
   */
  public async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }

  // =================================================================
  // 输入验证与清理
  // =================================================================

  /**
   * 创建输入验证中间件
   */
  public createValidator<T>(schema: z.ZodSchema<T>) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const validatedData = schema.parse({
          body: req.body,
          query: req.query,
          params: req.params
        })

        // 将验证后的数据附加到请求对象
        req.validatedData = validatedData
        next()
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '请求参数验证失败',
              details: error.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message,
                code: e.code
              }))
            }
          })
        }
        next(error)
      }
    }
  }

  /**
   * HTML清理和XSS防护
   */
  public sanitizeHtml(input: string): string {
    if (!input) return ''
    
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // 移除script标签
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // 移除iframe
      .replace(/javascript:/gi, '') // 移除javascript:链接
      .replace(/on\w+\s*=/gi, '') // 移除事件处理器
      .trim()
  }

  /**
   * SQL注入防护 - 参数化查询辅助
   */
  public sanitizeSql(input: string): string {
    if (!input) return ''
    
    return input
      .replace(/['";\\]/g, '') // 移除SQL特殊字符
      .replace(/--/g, '') // 移除SQL注释
      .replace(/\/\*/g, '') // 移除多行注释开始
      .replace(/\*\//g, '') // 移除多行注释结束
      .trim()
  }

  // =================================================================
  // API限流
  // =================================================================

  /**
   * 初始化限流器
   */
  private initializeRateLimiters(): void {
    // 通用API限流
    this.rateLimiters.set('general', rateLimit({
      windowMs: this.config.rateLimit.windowMs,
      max: this.config.rateLimit.max,
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: '请求过于频繁，请稍后再试'
        }
      },
      standardHeaders: true,
      legacyHeaders: false
    }))

    // 认证相关限流（更严格）
    this.rateLimiters.set('auth', rateLimit({
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 5, // 最多5次尝试
      message: {
        success: false,
        error: {
          code: 'AUTH_RATE_LIMIT_EXCEEDED',
          message: '认证尝试次数过多，请15分钟后再试'
        }
      },
      skipSuccessfulRequests: true
    }))

    // 提示词生成限流
    this.rateLimiters.set('generate', rateLimit({
      windowMs: 60 * 1000, // 1分钟
      max: 10, // 最多10次生成
      keyGenerator: (req) => {
        // 优先使用用户ID，其次使用IP
        return req.user?.id || req.ip
      },
      message: {
        success: false,
        error: {
          code: 'GENERATION_RATE_LIMIT_EXCEEDED',
          message: '生成请求过于频繁，请稍后再试'
        }
      }
    }))
  }

  /**
   * 获取限流中间件
   */
  public getRateLimiter(type: 'general' | 'auth' | 'generate' = 'general') {
    return this.rateLimiters.get(type) || this.rateLimiters.get('general')
  }

  /**
   * 动态限流检查
   */
  public async checkRateLimit(
    identifier: string,
    config: RateLimitConfig
  ): Promise<{
    allowed: boolean
    remaining: number
    resetTime: Date
  }> {
    // 这里实现基于Redis或内存的动态限流逻辑
    // 由于Vercel限制，使用简化的内存实现
    
    const key = `${config.identifier}:${identifier}`
    const now = Date.now()
    const window = Math.floor(now / config.windowMs)
    const windowKey = `${key}:${window}`

    // 获取当前窗口的请求计数
    const count = await this.getRequestCount(windowKey)
    
    if (count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date((window + 1) * config.windowMs)
      }
    }

    // 增加计数
    await this.incrementRequestCount(windowKey, config.windowMs)

    return {
      allowed: true,
      remaining: config.maxRequests - count - 1,
      resetTime: new Date((window + 1) * config.windowMs)
    }
  }

  // =================================================================
  // 权限控制
  // =================================================================

  /**
   * 检查用户权限
   */
  public checkPermission(
    user: UserPayload,
    requiredPermission: string,
    resource?: string
  ): boolean {
    // 管理员拥有所有权限
    if (user.role === 'admin') {
      return true
    }

    // 检查直接权限
    if (user.permissions.includes(requiredPermission)) {
      return true
    }

    // 基于订阅状态的权限检查
    return this.checkSubscriptionPermission(user, requiredPermission, resource)
  }

  /**
   * 基于订阅状态的权限检查
   */
  private checkSubscriptionPermission(
    user: UserPayload,
    permission: string,
    resource?: string
  ): boolean {
    switch (user.subscriptionStatus) {
      case 'free':
        return this.freeUserPermissions.includes(permission)
      
      case 'pro':
        return this.proUserPermissions.includes(permission)
      
      case 'enterprise':
        return this.enterpriseUserPermissions.includes(permission)
      
      default:
        return false
    }
  }

  private readonly freeUserPermissions = [
    'generate_prompt',
    'view_templates',
    'view_history'
  ]

  private readonly proUserPermissions = [
    ...this.freeUserPermissions,
    'download_files',
    'ai_direct_generation',
    'access_pro_templates',
    'unlimited_generation'
  ]

  private readonly enterpriseUserPermissions = [
    ...this.proUserPermissions,
    'api_access',
    'bulk_operations',
    'custom_templates',
    'team_management'
  ]

  /**
   * 创建权限检查中间件
   */
  public requirePermission(permission: string, resource?: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '请先登录'
          }
        })
      }

      if (!this.checkPermission(req.user, permission, resource)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: '权限不足'
          }
        })
      }

      next()
    }
  }

  // =================================================================
  // 数据加密
  // =================================================================

  /**
   * 加密敏感数据
   */
  public async encrypt(data: string, key?: string): Promise<{
    encrypted: string
    iv: string
    authTag: string
  }> {
    const crypto = await import('crypto')
    const algorithm = this.config.encryption.algorithm
    const encryptionKey = key || this.generateEncryptionKey()
    const iv = crypto.randomBytes(16)
    
    const cipher = crypto.createCipher(algorithm, encryptionKey)
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: cipher.getAuthTag?.().toString('hex') || ''
    }
  }

  /**
   * 解密数据
   */
  public async decrypt(
    encryptedData: string,
    iv: string,
    authTag: string,
    key?: string
  ): Promise<string> {
    const crypto = await import('crypto')
    const algorithm = this.config.encryption.algorithm
    const decryptionKey = key || this.generateEncryptionKey()
    
    const decipher = crypto.createDecipher(algorithm, decryptionKey)
    
    if (authTag) {
      decipher.setAuthTag(Buffer.from(authTag, 'hex'))
    }
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }

  private generateEncryptionKey(): string {
    return process.env.ENCRYPTION_KEY || 'default-encryption-key-change-me'
  }

  // =================================================================
  // 审计和日志
  // =================================================================

  /**
   * 记录安全事件
   */
  public logSecurityEvent(
    event: 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN' | 'PERMISSION_DENIED' | 'RATE_LIMIT' | 'SUSPICIOUS_ACTIVITY',
    context: SecurityContext,
    details?: any
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      userId: context.user?.id,
      email: context.user?.email,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      requestId: context.requestId,
      details
    }

    // 在生产环境中，这应该发送到专门的日志系统
    console.log('Security Event:', JSON.stringify(logEntry, null, 2))

    // 对于严重事件，发送警报
    if (event === 'SUSPICIOUS_ACTIVITY') {
      this.sendSecurityAlert(logEntry)
    }
  }

  /**
   * 发送安全警报
   */
  private async sendSecurityAlert(logEntry: any): Promise<void> {
    // 实现警报发送逻辑（邮件、Slack、webhook等）
    console.error('Security Alert:', logEntry)
  }

  // =================================================================
  // 辅助方法
  // =================================================================

  private parseTimeToSeconds(time: string): number {
    const units = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400
    }

    const match = time.match(/^(\d+)([smhd])$/)
    if (!match) return 3600 // 默认1小时

    const [, amount, unit] = match
    return parseInt(amount) * (units[unit as keyof typeof units] || 1)
  }

  private async getUserPayload(userId: string): Promise<UserPayload | null> {
    // 从数据库获取用户信息
    // 这里应该连接到实际的数据库
    return null
  }

  private requestCounts = new Map<string, number>()
  private requestTimers = new Map<string, NodeJS.Timeout>()

  private async getRequestCount(key: string): Promise<number> {
    return this.requestCounts.get(key) || 0
  }

  private async incrementRequestCount(key: string, windowMs: number): Promise<void> {
    const current = this.requestCounts.get(key) || 0
    this.requestCounts.set(key, current + 1)

    // 清理过期计数
    if (!this.requestTimers.has(key)) {
      const timer = setTimeout(() => {
        this.requestCounts.delete(key)
        this.requestTimers.delete(key)
      }, windowMs)
      
      this.requestTimers.set(key, timer)
    }
  }
}

// =================================================================
// 常用验证Schema
// =================================================================

export const commonSchemas = {
  // 用户注册验证
  register: z.object({
    body: z.object({
      email: z.string().email('邮箱格式不正确'),
      password: z.string().min(8, '密码至少8位'),
      firstName: z.string().min(1, '请输入姓名').optional(),
      lastName: z.string().min(1, '请输入姓氏').optional(),
      company: z.string().optional()
    })
  }),

  // 用户登录验证
  login: z.object({
    body: z.object({
      email: z.string().email('邮箱格式不正确'),
      password: z.string().min(1, '请输入密码')
    })
  }),

  // 提示词生成验证
  generatePrompt: z.object({
    body: z.object({
      templateId: z.string().uuid('模板ID格式不正确'),
      parameters: z.record(z.any()),
      options: z.object({
        model: z.string().optional(),
        temperature: z.number().min(0).max(2).optional(),
        maxTokens: z.number().min(1).max(8000).optional()
      }).optional()
    })
  }),

  // 分页查询验证
  pagination: z.object({
    query: z.object({
      page: z.string().transform(val => parseInt(val)).refine(val => val > 0).optional(),
      limit: z.string().transform(val => parseInt(val)).refine(val => val > 0 && val <= 100).optional()
    })
  })
}

// =================================================================
// 全局安全管理器实例
// =================================================================

let globalSecurityManager: SecurityManager | null = null

export function getSecurityManager(config?: Partial<SecurityConfig>): SecurityManager {
  if (!globalSecurityManager) {
    globalSecurityManager = new SecurityManager(config)
  }
  return globalSecurityManager
}

export default SecurityManager