/**
 * 🔐 企业级会话管理服务
 * 提供安全的会话创建、验证、清理和监控功能
 * 支持多设备登录管理和异常检测
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateSecureRandom, createHash } from './encryption'
import { UserPayload } from './jwt'

// 🔐 会话配置
const SESSION_COOKIE_NAME = 'admin_session'
const SESSION_MAX_AGE = 24 * 60 * 60 // 24小时（秒）
const MAX_SESSIONS_PER_USER = 3 // 每个用户最大会话数
const SUSPICIOUS_LOGIN_THRESHOLD = 5 // 可疑登录阈值

// 🔐 会话信息接口
export interface SessionInfo {
  sessionId: string
  userId: string
  username: string
  role: 'admin' | 'user'
  createdAt: Date
  lastActivity: Date
  ipAddress?: string
  userAgent?: string
  deviceInfo?: DeviceInfo
  isActive: boolean
  expiresAt: Date
}

// 🔐 设备信息接口
export interface DeviceInfo {
  browser?: string
  os?: string
  device?: string
  isMobile: boolean
}

// 🔐 登录记录接口
export interface LoginRecord {
  userId: string
  ipAddress: string
  userAgent: string
  timestamp: Date
  success: boolean
  failureReason?: string
}

// 🔐 内存会话存储（生产环境应使用Redis）
class SessionStore {
  private sessions = new Map<string, SessionInfo>()
  private loginHistory = new Map<string, LoginRecord[]>()
  private blacklistedTokens = new Set<string>()
  
  /**
   * 创建新会话
   */
  createSession(user: UserPayload, request: NextRequest): SessionInfo {
    const sessionId = generateSecureRandom(32)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE * 1000)
    
    const session: SessionInfo = {
      sessionId,
      userId: user.userId,
      username: user.username,
      role: user.role,
      createdAt: now,
      lastActivity: now,
      ipAddress: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || '',
      deviceInfo: this.parseDeviceInfo(request),
      isActive: true,
      expiresAt
    }
    
    // 清理该用户的过期会话
    this.cleanupUserSessions(user.userId)
    
    // 检查会话数量限制
    this.enforceSessionLimit(user.userId)
    
    this.sessions.set(sessionId, session)
    
    // 记录登录历史
    this.recordLogin(user.userId, request, true)
    
    return session
  }
  
  /**
   * 获取会话信息
   */
  getSession(sessionId: string): SessionInfo | null {
    const session = this.sessions.get(sessionId)
    
    if (!session) return null
    
    // 检查会话是否过期
    if (new Date() > session.expiresAt) {
      this.deleteSession(sessionId)
      return null
    }
    
    // 更新最后活动时间
    session.lastActivity = new Date()
    this.sessions.set(sessionId, session)
    
    return session
  }
  
  /**
   * 删除会话
   */
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId)
  }
  
  /**
   * 获取用户的所有活跃会话
   */
  getUserSessions(userId: string): SessionInfo[] {
    const userSessions: SessionInfo[] = []
    
    for (const [sessionId, session] of this.sessions) {
      if (session.userId === userId && session.isActive) {
        // 检查是否过期
        if (new Date() > session.expiresAt) {
          this.deleteSession(sessionId)
        } else {
          userSessions.push(session)
        }
      }
    }
    
    return userSessions
  }
  
  /**
   * 清理用户过期会话
   */
  private cleanupUserSessions(userId: string): void {
    for (const [sessionId, session] of this.sessions) {
      if (session.userId === userId && 
          (new Date() > session.expiresAt || !session.isActive)) {
        this.deleteSession(sessionId)
      }
    }
  }
  
  /**
   * 强制执行会话数量限制
   */
  private enforceSessionLimit(userId: string): void {
    const userSessions = this.getUserSessions(userId)
    
    if (userSessions.length >= MAX_SESSIONS_PER_USER) {
      // 删除最旧的会话
      userSessions
        .sort((a, b) => a.lastActivity.getTime() - b.lastActivity.getTime())
        .slice(0, userSessions.length - MAX_SESSIONS_PER_USER + 1)
        .forEach(session => this.deleteSession(session.sessionId))
    }
  }
  
  /**
   * 记录登录历史
   */
  private recordLogin(userId: string, request: NextRequest, success: boolean, failureReason?: string): void {
    const record: LoginRecord = {
      userId,
      ipAddress: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || '',
      timestamp: new Date(),
      success,
      failureReason
    }
    
    if (!this.loginHistory.has(userId)) {
      this.loginHistory.set(userId, [])
    }
    
    const history = this.loginHistory.get(userId)!
    history.push(record)
    
    // 只保留最近100条记录
    if (history.length > 100) {
      history.splice(0, history.length - 100)
    }
  }
  
  /**
   * 检测可疑登录活动
   */
  detectSuspiciousActivity(userId: string): boolean {
    const history = this.loginHistory.get(userId) || []
    const recent = history.filter(record => 
      Date.now() - record.timestamp.getTime() < 15 * 60 * 1000 // 15分钟内
    )
    
    const failures = recent.filter(record => !record.success).length
    const uniqueIPs = new Set(recent.map(record => record.ipAddress)).size
    
    return failures >= SUSPICIOUS_LOGIN_THRESHOLD || uniqueIPs > 3
  }
  
  /**
   * 获取客户端IP地址
   */
  private getClientIP(request: NextRequest): string {
    return request.ip || 
           request.headers.get('x-forwarded-for')?.split(',')[0] ||
           request.headers.get('x-real-ip') ||
           '127.0.0.1'
  }
  
  /**
   * 解析设备信息
   */
  private parseDeviceInfo(request: NextRequest): DeviceInfo {
    const userAgent = request.headers.get('user-agent') || ''
    
    return {
      browser: this.getBrowser(userAgent),
      os: this.getOS(userAgent),
      device: this.getDevice(userAgent),
      isMobile: /Mobile|Android|iPhone|iPad/.test(userAgent)
    }
  }
  
  private getBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Unknown'
  }
  
  private getOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows'
    if (userAgent.includes('Mac')) return 'macOS'
    if (userAgent.includes('Linux')) return 'Linux'
    if (userAgent.includes('Android')) return 'Android'
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS'
    return 'Unknown'
  }
  
  private getDevice(userAgent: string): string {
    if (userAgent.includes('iPhone')) return 'iPhone'
    if (userAgent.includes('iPad')) return 'iPad'
    if (userAgent.includes('Android')) return 'Android'
    return 'Desktop'
  }
  
  /**
   * 将Token加入黑名单
   */
  blacklistToken(token: string): void {
    this.blacklistedTokens.add(createHash(token))
  }
  
  /**
   * 检查Token是否在黑名单中
   */
  isTokenBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(createHash(token))
  }
  
  /**
   * 获取活跃会话统计
   */
  getActiveSessionStats(): {
    totalSessions: number,
    userCounts: Map<string, number>,
    deviceTypes: Map<string, number>
  } {
    const stats = {
      totalSessions: 0,
      userCounts: new Map<string, number>(),
      deviceTypes: new Map<string, number>()
    }
    
    for (const session of this.sessions.values()) {
      if (session.isActive && new Date() < session.expiresAt) {
        stats.totalSessions++
        
        // 用户统计
        const userCount = stats.userCounts.get(session.userId) || 0
        stats.userCounts.set(session.userId, userCount + 1)
        
        // 设备类型统计
        const deviceType = session.deviceInfo?.isMobile ? 'Mobile' : 'Desktop'
        const deviceCount = stats.deviceTypes.get(deviceType) || 0
        stats.deviceTypes.set(deviceType, deviceCount + 1)
      }
    }
    
    return stats
  }
}

// 🔐 全局会话存储实例
const sessionStore = new SessionStore()

/**
 * 创建安全的会话Cookie
 */
export function createSessionCookie(
  response: NextResponse, 
  sessionId: string,
  options?: {
    maxAge?: number
    secure?: boolean
    httpOnly?: boolean
  }
): void {
  const isProduction = process.env.NODE_ENV === 'production'
  
  response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
    maxAge: options?.maxAge || SESSION_MAX_AGE,
    secure: options?.secure ?? isProduction, // 生产环境强制HTTPS
    httpOnly: options?.httpOnly ?? true, // 防止XSS
    sameSite: 'strict', // 防止CSRF
    path: '/admin'
  })
}

/**
 * 清除会话Cookie
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    maxAge: 0,
    path: '/admin'
  })
}

/**
 * 从请求中获取会话ID
 */
export function getSessionIdFromRequest(request: NextRequest): string | null {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value || null
}

/**
 * 验证会话
 */
export function validateSession(sessionId: string): SessionInfo | null {
  return sessionStore.getSession(sessionId)
}

/**
 * 创建新会话
 */
export function createSession(user: UserPayload, request: NextRequest): SessionInfo {
  return sessionStore.createSession(user, request)
}

/**
 * 删除会话
 */
export function deleteSession(sessionId: string): boolean {
  return sessionStore.deleteSession(sessionId)
}

/**
 * 检测可疑活动
 */
export function detectSuspiciousActivity(userId: string): boolean {
  return sessionStore.detectSuspiciousActivity(userId)
}

/**
 * 获取用户所有会话
 */
export function getUserSessions(userId: string): SessionInfo[] {
  return sessionStore.getUserSessions(userId)
}

/**
 * 将Token加入黑名单
 */
export function blacklistToken(token: string): void {
  sessionStore.blacklistToken(token)
}

/**
 * 检查Token黑名单状态
 */
export function isTokenBlacklisted(token: string): boolean {
  return sessionStore.isTokenBlacklisted(token)
}

/**
 * 获取会话统计信息
 */
export function getSessionStats() {
  return sessionStore.getActiveSessionStats()
}