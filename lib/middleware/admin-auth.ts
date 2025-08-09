/**
 * 🔐 企业级管理员权限验证中间件
 * 提供细粒度的访问控制和权限验证
 * 支持RBAC权限模型和操作审计
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, UserPayload } from '../auth/jwt'
import { validateSession, getSessionIdFromRequest } from '../auth/session'
import { isTokenBlacklisted } from '../auth/session'

// 🔐 权限定义
export enum Permission {
  // 系统管理权限
  SYSTEM_CONFIG_READ = 'system:config:read',
  SYSTEM_CONFIG_WRITE = 'system:config:write',
  SYSTEM_LOGS_READ = 'system:logs:read',
  
  // 模板管理权限
  TEMPLATE_READ = 'template:read',
  TEMPLATE_WRITE = 'template:write',
  TEMPLATE_DELETE = 'template:delete',
  
  // 用户管理权限
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  
  // API管理权限
  API_CONFIG_READ = 'api:config:read',
  API_CONFIG_WRITE = 'api:config:write',
  API_STATS_READ = 'api:stats:read',
  
  // 安全管理权限
  SECURITY_AUDIT_READ = 'security:audit:read',
  SECURITY_CONFIG_WRITE = 'security:config:write',
  
  // 超级管理员权限
  SUPER_ADMIN = 'super:admin'
}

// 🔐 角色权限映射
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  'super_admin': [
    Permission.SUPER_ADMIN,
    Permission.SYSTEM_CONFIG_READ,
    Permission.SYSTEM_CONFIG_WRITE,
    Permission.SYSTEM_LOGS_READ,
    Permission.TEMPLATE_READ,
    Permission.TEMPLATE_WRITE,
    Permission.TEMPLATE_DELETE,
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.USER_DELETE,
    Permission.API_CONFIG_READ,
    Permission.API_CONFIG_WRITE,
    Permission.API_STATS_READ,
    Permission.SECURITY_AUDIT_READ,
    Permission.SECURITY_CONFIG_WRITE
  ],
  'admin': [
    Permission.SYSTEM_CONFIG_READ,
    Permission.TEMPLATE_READ,
    Permission.TEMPLATE_WRITE,
    Permission.USER_READ,
    Permission.API_CONFIG_READ,
    Permission.API_STATS_READ,
    Permission.SECURITY_AUDIT_READ
  ],
  'editor': [
    Permission.TEMPLATE_READ,
    Permission.TEMPLATE_WRITE,
    Permission.API_STATS_READ
  ],
  'viewer': [
    Permission.TEMPLATE_READ,
    Permission.API_STATS_READ
  ]
}

// 🔐 路由权限映射
const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  '/api/admin/config': [Permission.SYSTEM_CONFIG_READ],
  'POST:/api/admin/config': [Permission.SYSTEM_CONFIG_WRITE],
  'PUT:/api/admin/config': [Permission.SYSTEM_CONFIG_WRITE],
  'DELETE:/api/admin/config': [Permission.SYSTEM_CONFIG_WRITE],
  
  '/api/admin/templates': [Permission.TEMPLATE_READ],
  'POST:/api/admin/templates': [Permission.TEMPLATE_WRITE],
  'PUT:/api/admin/templates': [Permission.TEMPLATE_WRITE],
  'DELETE:/api/admin/templates': [Permission.TEMPLATE_DELETE],
  
  '/api/admin/users': [Permission.USER_READ],
  'POST:/api/admin/users': [Permission.USER_WRITE],
  'PUT:/api/admin/users': [Permission.USER_WRITE],
  'DELETE:/api/admin/users': [Permission.USER_DELETE],
  
  '/api/admin/security/audit': [Permission.SECURITY_AUDIT_READ],
  'POST:/api/admin/security/config': [Permission.SECURITY_CONFIG_WRITE]
}

// 🔐 认证结果接口
export interface AuthResult {
  success: boolean
  user?: UserPayload
  error?: string
  statusCode?: number
}

/**
 * 从请求中提取Bearer Token
 * @param request 请求对象
 * @returns JWT Token或null
 */
function extractBearerToken(request: NextRequest): string | null {
  const authorization = request.headers.get('authorization')
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null
  }
  return authorization.substring(7)
}

/**
 * 验证用户权限
 * @param user 用户信息
 * @param requiredPermissions 必需的权限
 * @returns 是否有权限
 */
export function hasPermission(user: UserPayload, requiredPermissions: Permission[]): boolean {
  if (!user.permissions || user.permissions.length === 0) {
    return false
  }
  
  // 超级管理员拥有所有权限
  if (user.permissions.includes(Permission.SUPER_ADMIN)) {
    return true
  }
  
  // 检查是否拥有所有必需权限
  return requiredPermissions.every(permission => 
    user.permissions.includes(permission)
  )
}

/**
 * 获取用户角色的所有权限
 * @param role 用户角色
 * @returns 权限列表
 */
export function getRolePermissions(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

/**
 * 验证请求的身份认证
 * @param request 请求对象
 * @returns 认证结果
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  try {
    // 1. 尝试从Authorization头获取Token
    let token = extractBearerToken(request)
    let user: UserPayload | undefined
    
    if (token) {
      // 检查Token黑名单
      if (isTokenBlacklisted(token)) {
        return {
          success: false,
          error: 'Token已被撤销',
          statusCode: 401
        }
      }
      
      // 验证JWT Token
      try {
        user = verifyAccessToken(token)
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Token验证失败',
          statusCode: 401
        }
      }
    }
    
    // 2. 如果没有Bearer Token，尝试会话验证
    if (!user) {
      const sessionId = getSessionIdFromRequest(request)
      if (sessionId) {
        const session = validateSession(sessionId)
        if (session) {
          user = {
            userId: session.userId,
            username: session.username,
            role: session.role,
            permissions: getRolePermissions(session.role)
          }
        }
      }
    }
    
    // 3. 验证是否有有效用户
    if (!user) {
      return {
        success: false,
        error: '未提供有效的认证凭据',
        statusCode: 401
      }
    }
    
    // 4. 验证用户角色
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return {
        success: false,
        error: '权限不足，需要管理员权限',
        statusCode: 403
      }
    }
    
    return {
      success: true,
      user
    }
  } catch (error) {
    console.error('🚨 身份验证失败:', error)
    return {
      success: false,
      error: '身份验证过程出现错误',
      statusCode: 500
    }
  }
}

/**
 * 检查路由访问权限
 * @param request 请求对象
 * @param user 用户信息
 * @returns 是否有权限访问
 */
export function checkRoutePermission(request: NextRequest, user: UserPayload): boolean {
  const method = request.method
  const pathname = request.nextUrl.pathname
  
  // 构造路由权限键
  const routeKey = `${method}:${pathname}`
  const pathKey = pathname
  
  // 查找所需权限
  const requiredPermissions = ROUTE_PERMISSIONS[routeKey] || ROUTE_PERMISSIONS[pathKey]
  
  if (!requiredPermissions) {
    // 如果没有定义特定权限，默认需要管理员权限
    return user.role === 'admin' || user.role === 'super_admin'
  }
  
  return hasPermission(user, requiredPermissions)
}

/**
 * 创建管理员认证中间件
 * @param options 配置选项
 */
export function createAdminAuthMiddleware(options?: {
  requiredPermissions?: Permission[]
  allowSessionAuth?: boolean
  skipRouteCheck?: boolean
}) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const authResult = await authenticateRequest(request)
    
    if (!authResult.success) {
      const response = NextResponse.json({
        error: authResult.error,
        code: 'AUTHENTICATION_FAILED',
        timestamp: new Date().toISOString()
      }, { status: authResult.statusCode || 401 })
      
      // 设置认证响应头
      response.headers.set('WWW-Authenticate', 'Bearer realm="Admin API"')
      
      return response
    }
    
    const user = authResult.user!
    
    // 检查特定权限要求
    if (options?.requiredPermissions && 
        !hasPermission(user, options.requiredPermissions)) {
      return NextResponse.json({
        error: '权限不足',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: options.requiredPermissions,
        timestamp: new Date().toISOString()
      }, { status: 403 })
    }
    
    // 检查路由权限
    if (!options?.skipRouteCheck && !checkRoutePermission(request, user)) {
      return NextResponse.json({
        error: '无权访问此资源',
        code: 'ROUTE_ACCESS_DENIED',
        timestamp: new Date().toISOString()
      }, { status: 403 })
    }
    
    // 在请求头中传递用户信息
    const response = NextResponse.next()
    response.headers.set('X-User-ID', user.userId)
    response.headers.set('X-User-Role', user.role)
    response.headers.set('X-User-Permissions', JSON.stringify(user.permissions))
    
    return null // 允许请求继续
  }
}

/**
 * 默认管理员认证中间件
 */
export const adminAuthMiddleware = createAdminAuthMiddleware()

/**
 * 超级管理员认证中间件
 */
export const superAdminAuthMiddleware = createAdminAuthMiddleware({
  requiredPermissions: [Permission.SUPER_ADMIN]
})

/**
 * 系统配置权限中间件
 */
export const systemConfigAuthMiddleware = createAdminAuthMiddleware({
  requiredPermissions: [Permission.SYSTEM_CONFIG_WRITE]
})

/**
 * 安全审计权限中间件
 */
export const securityAuditAuthMiddleware = createAdminAuthMiddleware({
  requiredPermissions: [Permission.SECURITY_AUDIT_READ]
})

/**
 * 从Next.js API路由中获取认证用户
 * @param request API路由请求
 * @returns 用户信息或null
 */
export async function getCurrentUser(request: NextRequest): Promise<UserPayload | null> {
  const authResult = await authenticateRequest(request)
  return authResult.success ? authResult.user! : null
}

/**
 * API路由认证装饰器
 * @param handler 原始处理函数
 * @param options 认证选项
 */
export function withAuth(
  handler: (request: NextRequest, user: UserPayload) => Promise<NextResponse>,
  options?: {
    requiredPermissions?: Permission[]
    skipRouteCheck?: boolean
  }
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authMiddleware = createAdminAuthMiddleware(options)
    const authResponse = await authMiddleware(request)
    
    if (authResponse) {
      return authResponse // 认证失败，返回错误响应
    }
    
    // 获取用户信息
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({
        error: '无法获取用户信息',
        code: 'USER_INFO_UNAVAILABLE'
      }, { status: 500 })
    }
    
    // 调用原始处理函数
    try {
      return await handler(request, user)
    } catch (error) {
      console.error('🚨 API处理函数错误:', error)
      return NextResponse.json({
        error: '服务器内部错误',
        code: 'INTERNAL_SERVER_ERROR'
      }, { status: 500 })
    }
  }
}