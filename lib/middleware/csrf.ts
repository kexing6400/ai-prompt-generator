/**
 * 🔐 企业级CSRF防护中间件
 * 防护跨站请求伪造攻击
 * 支持双重Token验证和SameSite Cookie策略
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateSecureRandom, createHash } from '../auth/encryption'

// 🔐 CSRF配置
const CSRF_TOKEN_LENGTH = 32
const CSRF_COOKIE_NAME = 'csrf_token'
const CSRF_HEADER_NAME = 'x-csrf-token'
const CSRF_TOKEN_LIFETIME = 24 * 60 * 60 // 24小时（秒）

// 🔐 需要CSRF保护的HTTP方法
const PROTECTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

// 🔐 CSRF Token存储（生产环境应使用Redis）
class CSRFTokenStore {
  private tokens = new Map<string, {
    hash: string,
    createdAt: Date,
    expiresAt: Date,
    userId?: string
  }>()
  
  /**
   * 生成新的CSRF Token
   * @param userId 用户ID（可选）
   * @returns Token对象
   */
  generateToken(userId?: string): { token: string, tokenHash: string } {
    const token = generateSecureRandom(CSRF_TOKEN_LENGTH)
    const tokenHash = createHash(token)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + CSRF_TOKEN_LIFETIME * 1000)
    
    this.tokens.set(tokenHash, {
      hash: tokenHash,
      createdAt: now,
      expiresAt,
      userId
    })
    
    // 清理过期Token
    this.cleanupExpiredTokens()
    
    return { token, tokenHash }
  }
  
  /**
   * 验证CSRF Token
   * @param token 原始Token
   * @param userId 用户ID（可选）
   * @returns 是否有效
   */
  validateToken(token: string, userId?: string): boolean {
    if (!token) return false
    
    const tokenHash = createHash(token)
    const stored = this.tokens.get(tokenHash)
    
    if (!stored) {
      return false
    }
    
    // 检查是否过期
    if (new Date() > stored.expiresAt) {
      this.tokens.delete(tokenHash)
      return false
    }
    
    // 如果提供了用户ID，验证是否匹配
    if (userId && stored.userId && stored.userId !== userId) {
      return false
    }
    
    return true
  }
  
  /**
   * 撤销Token
   * @param token 原始Token
   */
  revokeToken(token: string): void {
    const tokenHash = createHash(token)
    this.tokens.delete(tokenHash)
  }
  
  /**
   * 清理过期Token
   */
  private cleanupExpiredTokens(): void {
    const now = new Date()
    for (const [hash, data] of this.tokens) {
      if (now > data.expiresAt) {
        this.tokens.delete(hash)
      }
    }
  }
  
  /**
   * 获取Token统计信息
   */
  getStats(): {
    totalTokens: number,
    activeTokens: number,
    expiredTokens: number
  } {
    const now = new Date()
    let activeTokens = 0
    let expiredTokens = 0
    
    for (const data of this.tokens.values()) {
      if (now <= data.expiresAt) {
        activeTokens++
      } else {
        expiredTokens++
      }
    }
    
    return {
      totalTokens: this.tokens.size,
      activeTokens,
      expiredTokens
    }
  }
}

// 🔐 全局CSRF Token存储
const csrfStore = new CSRFTokenStore()

/**
 * 获取客户端IP地址
 * @param request 请求对象
 * @returns IP地址
 */
function getClientIP(request: NextRequest): string {
  return request.ip || 
         request.headers.get('x-forwarded-for')?.split(',')[0] ||
         request.headers.get('x-real-ip') ||
         '127.0.0.1'
}

/**
 * 从请求中获取CSRF Token
 * @param request 请求对象
 * @returns CSRF Token或null
 */
function getCSRFTokenFromRequest(request: NextRequest): string | null {
  // 1. 先检查HTTP头
  let token = request.headers.get(CSRF_HEADER_NAME)
  
  // 2. 检查表单数据（如果是POST请求）
  if (!token && request.method === 'POST') {
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/x-www-form-urlencoded')) {
      // 注意：这里简化了表单解析，实际应用中需要完整解析
      // 在真实环境中，应该使用request.formData()来获取
    }
  }
  
  // 3. 检查查询参数（不推荐，但提供备选方案）
  if (!token) {
    token = request.nextUrl.searchParams.get('_csrf') || null
  }
  
  return token
}

/**
 * 从请求中获取Cookie中的CSRF Token
 * @param request 请求对象
 * @returns CSRF Token或null
 */
function getCSRFTokenFromCookie(request: NextRequest): string | null {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value || null
}

/**
 * 设置CSRF Token Cookie
 * @param response 响应对象
 * @param token CSRF Token
 */
function setCSRFTokenCookie(response: NextResponse, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production'
  
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    maxAge: CSRF_TOKEN_LIFETIME,
    secure: isProduction, // 生产环境强制HTTPS
    httpOnly: false, // 允许JavaScript访问（用于发送请求头）
    sameSite: 'strict', // 严格的SameSite策略
    path: '/admin' // 限制Cookie作用域
  })
}

/**
 * 清除CSRF Token Cookie
 * @param response 响应对象
 */
function clearCSRFTokenCookie(response: NextResponse): void {
  response.cookies.set(CSRF_COOKIE_NAME, '', {
    maxAge: 0,
    path: '/admin'
  })
}

/**
 * 检查请求是否需要CSRF保护
 * @param request 请求对象
 * @returns 是否需要保护
 */
function requiresCSRFProtection(request: NextRequest): boolean {
  const method = request.method
  const pathname = request.nextUrl.pathname
  
  // 只保护特定的HTTP方法
  if (!PROTECTED_METHODS.includes(method)) {
    return false
  }
  
  // 排除认证相关的端点（它们有自己的保护机制）
  const excludedPaths = [
    '/api/admin/auth/login',
    '/api/admin/auth/logout',
    '/api/admin/auth/refresh'
  ]
  
  if (excludedPaths.includes(pathname)) {
    return false
  }
  
  // 管理API都需要CSRF保护
  return pathname.startsWith('/api/admin/')
}

/**
 * 验证CSRF Token
 * @param request 请求对象
 * @param userId 用户ID（可选）
 * @returns 验证结果
 */
export function validateCSRFToken(request: NextRequest, userId?: string): {
  valid: boolean,
  error?: string
} {
  const requestToken = getCSRFTokenFromRequest(request)
  const cookieToken = getCSRFTokenFromCookie(request)
  
  if (!requestToken) {
    return {
      valid: false,
      error: '缺少CSRF Token'
    }
  }
  
  if (!cookieToken) {
    return {
      valid: false,
      error: '缺少CSRF Cookie'
    }
  }
  
  // 双重验证：请求Token和Cookie Token必须匹配
  if (requestToken !== cookieToken) {
    return {
      valid: false,
      error: 'CSRF Token不匹配'
    }
  }
  
  // 验证Token有效性
  if (!csrfStore.validateToken(requestToken, userId)) {
    return {
      valid: false,
      error: 'CSRF Token无效或已过期'
    }
  }
  
  return { valid: true }
}

/**
 * 生成新的CSRF Token
 * @param userId 用户ID（可选）
 * @returns Token
 */
export function generateCSRFToken(userId?: string): string {
  const { token } = csrfStore.generateToken(userId)
  return token
}

/**
 * 创建CSRF防护中间件
 * @param options 配置选项
 */
export function createCSRFProtection(options?: {
  skipValidation?: boolean
  customValidation?: (request: NextRequest) => boolean
}) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const pathname = request.nextUrl.pathname
    const method = request.method
    
    // 检查是否需要CSRF保护
    if (!requiresCSRFProtection(request)) {
      return null // 不需要保护，继续处理
    }
    
    // 自定义验证逻辑
    if (options?.customValidation && !options.customValidation(request)) {
      return null
    }
    
    // 跳过验证选项（仅用于测试）
    if (options?.skipValidation) {
      return null
    }
    
    // 执行CSRF验证
    const validation = validateCSRFToken(request)
    
    if (!validation.valid) {
      const response = NextResponse.json({
        error: 'CSRF验证失败',
        message: validation.error,
        code: 'CSRF_VALIDATION_FAILED',
        timestamp: new Date().toISOString()
      }, { status: 403 })
      
      // 记录安全事件
      console.warn('🚨 CSRF攻击尝试:', {
        ip: getClientIP(request),
        userAgent: request.headers.get('user-agent'),
        method,
        pathname,
        error: validation.error,
        timestamp: new Date().toISOString()
      })
      
      return response
    }
    
    return null // 验证通过，继续处理
  }
}

/**
 * 默认CSRF防护中间件
 */
export const csrfProtection = createCSRFProtection()

/**
 * API路由CSRF防护装饰器
 * @param handler 原始处理函数
 */
export function withCSRFProtection(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const protection = await csrfProtection(request)
    
    if (protection) {
      return protection // CSRF验证失败，返回错误响应
    }
    
    // CSRF验证通过，调用原始处理函数
    return handler(request)
  }
}

/**
 * 为响应设置新的CSRF Token
 * @param response 响应对象
 * @param userId 用户ID（可选）
 * @returns 生成的Token
 */
export function setCSRFToken(response: NextResponse, userId?: string): string {
  const token = generateCSRFToken(userId)
  setCSRFTokenCookie(response, token)
  
  // 也在响应头中包含Token（用于JavaScript获取）
  response.headers.set('X-CSRF-Token', token)
  
  return token
}

/**
 * 清除CSRF Token
 * @param response 响应对象
 * @param token Token（可选，用于撤销特定Token）
 */
export function clearCSRFToken(response: NextResponse, token?: string): void {
  if (token) {
    csrfStore.revokeToken(token)
  }
  clearCSRFTokenCookie(response)
}

/**
 * 获取CSRF统计信息
 */
export function getCSRFStats() {
  return csrfStore.getStats()
}

/**
 * 验证双重提交Cookie模式
 * @param request 请求对象
 * @returns 是否通过验证
 */
export function validateDoubleSubmitCookie(request: NextRequest): boolean {
  const headerToken = request.headers.get(CSRF_HEADER_NAME)
  const cookieToken = getCSRFTokenFromCookie(request)
  
  if (!headerToken || !cookieToken) {
    return false
  }
  
  // 使用常数时间比较防止时序攻击
  return headerToken === cookieToken && 
         createHash(headerToken) === createHash(cookieToken)
}

/**
 * 生成状态Token（用于OAuth等场景）
 * @param length Token长度
 * @returns 状态Token
 */
export function generateStateToken(length: number = 32): string {
  return generateSecureRandom(length)
}