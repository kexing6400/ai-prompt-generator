/**
 * 🔐 企业级操作审计日志中间件
 * 记录所有管理操作、安全事件和用户行为
 * 支持合规性审计和安全事件分析
 */

import { NextRequest, NextResponse } from 'next/server'
import { UserPayload } from '../auth/jwt'
import { getClientIdentifier } from './rate-limit'

// 🔐 审计事件类型
export enum AuditEventType {
  // 认证事件
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  TOKEN_REVOKE = 'TOKEN_REVOKE',
  
  // 权限事件
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  PERMISSION_CHECK = 'PERMISSION_CHECK',
  
  // 数据操作事件
  CONFIG_READ = 'CONFIG_READ',
  CONFIG_UPDATE = 'CONFIG_UPDATE',
  TEMPLATE_CREATE = 'TEMPLATE_CREATE',
  TEMPLATE_UPDATE = 'TEMPLATE_UPDATE',
  TEMPLATE_DELETE = 'TEMPLATE_DELETE',
  
  // 安全事件
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_HIT = 'RATE_LIMIT_HIT',
  CSRF_ATTACK = 'CSRF_ATTACK',
  INVALID_TOKEN = 'INVALID_TOKEN',
  BRUTE_FORCE_ATTEMPT = 'BRUTE_FORCE_ATTEMPT',
  
  // 系统事件
  API_ERROR = 'API_ERROR',
  SYSTEM_CONFIG_CHANGE = 'SYSTEM_CONFIG_CHANGE',
  SECURITY_POLICY_CHANGE = 'SECURITY_POLICY_CHANGE'
}

// 🔐 审计事件严重性级别
export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// 🔐 审计日志条目接口
export interface AuditLogEntry {
  id: string
  timestamp: Date
  eventType: AuditEventType
  severity: AuditSeverity
  userId?: string
  username?: string
  userRole?: string
  ipAddress: string
  userAgent: string
  resource: string
  action: string
  method: string
  statusCode?: number
  details?: Record<string, any>
  metadata?: {
    sessionId?: string
    deviceInfo?: any
    location?: string
    requestId?: string
  }
  success: boolean
  errorMessage?: string
  duration?: number
}

// 🔐 审计日志存储（生产环境应使用数据库）
class AuditLogStore {
  private logs: AuditLogEntry[] = []
  private readonly MAX_LOGS = 10000 // 最大日志条数
  
  /**
   * 添加审计日志条目
   */
  addEntry(entry: AuditLogEntry): void {
    this.logs.push(entry)
    
    // 保持日志数量在限制内
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.splice(0, this.logs.length - this.MAX_LOGS)
    }
    
    // 对于高严重性事件，立即输出到控制台
    if (entry.severity === AuditSeverity.HIGH || entry.severity === AuditSeverity.CRITICAL) {
      console.warn(`🚨 安全事件 [${entry.severity}]:`, {
        eventType: entry.eventType,
        userId: entry.userId,
        resource: entry.resource,
        ipAddress: entry.ipAddress,
        timestamp: entry.timestamp.toISOString(),
        details: entry.details
      })
    }
  }
  
  /**
   * 查询审计日志
   */
  queryLogs(filters: {
    eventType?: AuditEventType
    userId?: string
    severity?: AuditSeverity
    startTime?: Date
    endTime?: Date
    ipAddress?: string
    success?: boolean
    limit?: number
    offset?: number
  }): AuditLogEntry[] {
    let filtered = [...this.logs]
    
    // 应用过滤器
    if (filters.eventType) {
      filtered = filtered.filter(log => log.eventType === filters.eventType)
    }
    
    if (filters.userId) {
      filtered = filtered.filter(log => log.userId === filters.userId)
    }
    
    if (filters.severity) {
      filtered = filtered.filter(log => log.severity === filters.severity)
    }
    
    if (filters.startTime) {
      filtered = filtered.filter(log => log.timestamp >= filters.startTime!)
    }
    
    if (filters.endTime) {
      filtered = filtered.filter(log => log.timestamp <= filters.endTime!)
    }
    
    if (filters.ipAddress) {
      filtered = filtered.filter(log => log.ipAddress === filters.ipAddress)
    }
    
    if (filters.success !== undefined) {
      filtered = filtered.filter(log => log.success === filters.success)
    }
    
    // 按时间倒序排列
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    
    // 分页
    const offset = filters.offset || 0
    const limit = filters.limit || 100
    
    return filtered.slice(offset, offset + limit)
  }
  
  /**
   * 获取审计统计信息
   */
  getStats(): {
    totalLogs: number
    eventTypeStats: Record<string, number>
    severityStats: Record<string, number>
    recentActivity: AuditLogEntry[]
    topUsers: Array<{ userId: string, count: number }>
    topIPs: Array<{ ipAddress: string, count: number }>
  } {
    const eventTypeStats: Record<string, number> = {}
    const severityStats: Record<string, number> = {}
    const userActivity: Record<string, number> = {}
    const ipActivity: Record<string, number> = {}
    
    this.logs.forEach(log => {
      // 事件类型统计
      eventTypeStats[log.eventType] = (eventTypeStats[log.eventType] || 0) + 1
      
      // 严重性统计
      severityStats[log.severity] = (severityStats[log.severity] || 0) + 1
      
      // 用户活动统计
      if (log.userId) {
        userActivity[log.userId] = (userActivity[log.userId] || 0) + 1
      }
      
      // IP活动统计
      ipActivity[log.ipAddress] = (ipActivity[log.ipAddress] || 0) + 1
    })
    
    // 获取最近活动（最近100条）
    const recentActivity = [...this.logs]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 100)
    
    // 获取最活跃用户
    const topUsers = Object.entries(userActivity)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    
    // 获取最活跃IP
    const topIPs = Object.entries(ipActivity)
      .map(([ipAddress, count]) => ({ ipAddress, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    
    return {
      totalLogs: this.logs.length,
      eventTypeStats,
      severityStats,
      recentActivity,
      topUsers,
      topIPs
    }
  }
  
  /**
   * 检测异常活动
   */
  detectAnomalies(): {
    suspiciousIPs: string[]
    unusualUserActivity: Array<{ userId: string, reason: string }>
    securityAlerts: AuditLogEntry[]
  } {
    const now = new Date()
    const oneHour = 60 * 60 * 1000
    const recentLogs = this.logs.filter(log => 
      now.getTime() - log.timestamp.getTime() < oneHour
    )
    
    // 检测可疑IP
    const ipCounts: Record<string, number> = {}
    const ipFailures: Record<string, number> = {}
    
    recentLogs.forEach(log => {
      ipCounts[log.ipAddress] = (ipCounts[log.ipAddress] || 0) + 1
      if (!log.success) {
        ipFailures[log.ipAddress] = (ipFailures[log.ipAddress] || 0) + 1
      }
    })
    
    const suspiciousIPs = Object.entries(ipCounts)
      .filter(([ip, count]) => count > 100 || (ipFailures[ip] || 0) > 10)
      .map(([ip]) => ip)
    
    // 检测异常用户活动
    const userCounts: Record<string, number> = {}
    recentLogs.forEach(log => {
      if (log.userId) {
        userCounts[log.userId] = (userCounts[log.userId] || 0) + 1
      }
    })
    
    const unusualUserActivity = Object.entries(userCounts)
      .filter(([userId, count]) => count > 50)
      .map(([userId, count]) => ({
        userId,
        reason: `一小时内${count}次操作，可能异常`
      }))
    
    // 获取安全告警
    const securityAlerts = recentLogs.filter(log =>
      log.severity === AuditSeverity.HIGH || 
      log.severity === AuditSeverity.CRITICAL
    )
    
    return {
      suspiciousIPs,
      unusualUserActivity,
      securityAlerts
    }
  }
}

// 🔐 全局审计日志存储
const auditStore = new AuditLogStore()

/**
 * 生成唯一的审计日志ID
 */
function generateAuditId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 确定事件严重性级别
 */
function getEventSeverity(eventType: AuditEventType, success: boolean): AuditSeverity {
  // 安全相关事件的严重性映射
  const severityMap: Record<AuditEventType, AuditSeverity> = {
    // 认证事件
    [AuditEventType.LOGIN_SUCCESS]: AuditSeverity.LOW,
    [AuditEventType.LOGIN_FAILURE]: AuditSeverity.MEDIUM,
    [AuditEventType.LOGOUT]: AuditSeverity.LOW,
    [AuditEventType.TOKEN_REFRESH]: AuditSeverity.LOW,
    [AuditEventType.TOKEN_REVOKE]: AuditSeverity.MEDIUM,
    
    // 权限事件
    [AuditEventType.ACCESS_GRANTED]: AuditSeverity.LOW,
    [AuditEventType.ACCESS_DENIED]: AuditSeverity.MEDIUM,
    [AuditEventType.PERMISSION_CHECK]: AuditSeverity.LOW,
    
    // 数据操作事件
    [AuditEventType.CONFIG_READ]: AuditSeverity.LOW,
    [AuditEventType.CONFIG_UPDATE]: AuditSeverity.MEDIUM,
    [AuditEventType.TEMPLATE_CREATE]: AuditSeverity.LOW,
    [AuditEventType.TEMPLATE_UPDATE]: AuditSeverity.LOW,
    [AuditEventType.TEMPLATE_DELETE]: AuditSeverity.MEDIUM,
    
    // 安全事件
    [AuditEventType.SUSPICIOUS_ACTIVITY]: AuditSeverity.HIGH,
    [AuditEventType.RATE_LIMIT_HIT]: AuditSeverity.LOW,
    [AuditEventType.CSRF_ATTACK]: AuditSeverity.HIGH,
    [AuditEventType.INVALID_TOKEN]: AuditSeverity.MEDIUM,
    [AuditEventType.BRUTE_FORCE_ATTEMPT]: AuditSeverity.HIGH,
    
    // 系统事件
    [AuditEventType.API_ERROR]: AuditSeverity.MEDIUM,
    [AuditEventType.SYSTEM_CONFIG_CHANGE]: AuditSeverity.HIGH,
    [AuditEventType.SECURITY_POLICY_CHANGE]: AuditSeverity.CRITICAL
  }
  
  // 如果有明确映射，使用映射的严重性
  if (severityMap[eventType]) {
    return severityMap[eventType]
  }
  
  // 否则根据成功/失败状态确定
  if (!success) {
    return AuditSeverity.MEDIUM
  }
  
  return AuditSeverity.LOW
}

/**
 * 记录审计日志
 */
export function logAuditEvent(
  request: NextRequest,
  eventType: AuditEventType,
  options: {
    user?: UserPayload
    success: boolean
    statusCode?: number
    details?: Record<string, any>
    errorMessage?: string
    duration?: number
    customSeverity?: AuditSeverity
  }
): void {
  const entry: AuditLogEntry = {
    id: generateAuditId(),
    timestamp: new Date(),
    eventType,
    severity: options.customSeverity || getEventSeverity(eventType, options.success),
    userId: options.user?.userId,
    username: options.user?.username,
    userRole: options.user?.role,
    ipAddress: getClientIdentifier(request),
    userAgent: request.headers.get('user-agent') || '',
    resource: request.nextUrl.pathname,
    action: request.method,
    method: request.method,
    statusCode: options.statusCode,
    details: options.details,
    metadata: {
      requestId: request.headers.get('x-request-id') || undefined,
      sessionId: request.cookies.get('admin_session')?.value || undefined
    },
    success: options.success,
    errorMessage: options.errorMessage,
    duration: options.duration
  }
  
  auditStore.addEntry(entry)
}

/**
 * 创建审计日志中间件
 */
export function createAuditLogMiddleware(options?: {
  excludePaths?: string[]
  logSuccessfulGET?: boolean
}) {
  return async (
    request: NextRequest,
    response?: NextResponse,
    user?: UserPayload,
    duration?: number
  ): Promise<void> => {
    const pathname = request.nextUrl.pathname
    
    // 排除特定路径
    if (options?.excludePaths?.includes(pathname)) {
      return
    }
    
    // 默认不记录成功的GET请求（除非特别指定）
    if (request.method === 'GET' && 
        response?.status && response.status < 400 && 
        !options?.logSuccessfulGET) {
      return
    }
    
    const statusCode = response?.status || 200
    const success = statusCode < 400
    
    // 确定事件类型
    let eventType: AuditEventType
    
    if (pathname.includes('/auth/login')) {
      eventType = success ? AuditEventType.LOGIN_SUCCESS : AuditEventType.LOGIN_FAILURE
    } else if (pathname.includes('/auth/logout')) {
      eventType = AuditEventType.LOGOUT
    } else if (pathname.includes('/config')) {
      eventType = request.method === 'GET' ? AuditEventType.CONFIG_READ : AuditEventType.CONFIG_UPDATE
    } else if (pathname.includes('/template')) {
      if (request.method === 'POST') eventType = AuditEventType.TEMPLATE_CREATE
      else if (request.method === 'PUT') eventType = AuditEventType.TEMPLATE_UPDATE
      else if (request.method === 'DELETE') eventType = AuditEventType.TEMPLATE_DELETE
      else eventType = AuditEventType.CONFIG_READ
    } else if (statusCode === 403) {
      eventType = AuditEventType.ACCESS_DENIED
    } else if (statusCode === 429) {
      eventType = AuditEventType.RATE_LIMIT_HIT
    } else if (statusCode >= 500) {
      eventType = AuditEventType.API_ERROR
    } else {
      eventType = success ? AuditEventType.ACCESS_GRANTED : AuditEventType.ACCESS_DENIED
    }
    
    logAuditEvent(request, eventType, {
      user,
      success,
      statusCode,
      duration,
      details: {
        queryParams: Object.fromEntries(request.nextUrl.searchParams),
        contentType: request.headers.get('content-type'),
        responseSize: response?.headers.get('content-length')
      }
    })
  }
}

/**
 * 默认审计日志中间件
 */
export const auditLogMiddleware = createAuditLogMiddleware()

/**
 * 查询审计日志
 */
export function queryAuditLogs(filters: Parameters<typeof auditStore.queryLogs>[0]) {
  return auditStore.queryLogs(filters)
}

/**
 * 获取审计统计信息
 */
export function getAuditStats() {
  return auditStore.getStats()
}

/**
 * 检测异常活动
 */
export function detectAuditAnomalies() {
  return auditStore.detectAnomalies()
}

/**
 * 记录安全事件的便捷函数
 */
export function logSecurityEvent(
  request: NextRequest,
  eventType: AuditEventType,
  details: Record<string, any>,
  severity: AuditSeverity = AuditSeverity.HIGH
): void {
  logAuditEvent(request, eventType, {
    success: false,
    details,
    customSeverity: severity
  })
}

/**
 * 记录用户操作的便捷函数
 */
export function logUserAction(
  request: NextRequest,
  user: UserPayload,
  action: string,
  success: boolean,
  details?: Record<string, any>
): void {
  logAuditEvent(request, AuditEventType.ACCESS_GRANTED, {
    user,
    success,
    details: {
      ...details,
      action
    }
  })
}

/**
 * 生成审计报告
 */
export function generateAuditReport(
  startTime: Date,
  endTime: Date
): {
  summary: any
  securityEvents: AuditLogEntry[]
  userActivity: any
  recommendations: string[]
} {
  const logs = auditStore.queryLogs({ startTime, endTime, limit: 10000 })
  const stats = auditStore.getStats()
  const anomalies = auditStore.detectAnomalies()
  
  const securityEvents = logs.filter(log => 
    log.severity === AuditSeverity.HIGH || 
    log.severity === AuditSeverity.CRITICAL
  )
  
  const recommendations: string[] = []
  
  // 生成安全建议
  if (securityEvents.length > 10) {
    recommendations.push('检测到大量安全事件，建议审查系统配置')
  }
  
  if (anomalies.suspiciousIPs.length > 0) {
    recommendations.push('发现可疑IP活动，建议加强访问控制')
  }
  
  if (anomalies.unusualUserActivity.length > 0) {
    recommendations.push('检测到异常用户活动，建议审查用户权限')
  }
  
  return {
    summary: {
      totalEvents: logs.length,
      securityEvents: securityEvents.length,
      timeRange: { startTime, endTime },
      ...stats
    },
    securityEvents,
    userActivity: stats.topUsers,
    recommendations
  }
}