/**
 * 🔐 企业级身份验证API
 * 验证当前会话和Token状态
 * 提供详细的用户信息和权限数据
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/middleware/admin-auth'
import { validateSession, getSessionIdFromRequest } from '@/lib/auth/session'
import { verifyAccessToken, isTokenExpiringSoon, getTokenRemainingTime } from '@/lib/auth/jwt'
import { logAuditEvent, AuditEventType } from '@/lib/middleware/audit-log'
import { apiRateLimit } from '@/lib/middleware/rate-limit'

// 强制动态渲染 - 确保每次请求都重新执行
export const dynamic = 'force-dynamic';


/**
 * GET - 验证当前身份认证状态
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // 🔐 应用速率限制（相对宽松）
    const rateLimitResponse = await apiRateLimit(request)
    if (rateLimitResponse) {
      logAuditEvent(request, AuditEventType.RATE_LIMIT_HIT, {
        success: false,
        statusCode: 429,
        details: { endpoint: 'auth_verify' },
        duration: Date.now() - startTime
      })
      return rateLimitResponse
    }

    // 🔐 尝试获取用户信息
    const user = await getCurrentUser(request)
    
    if (!user) {
      const response = NextResponse.json({
        success: false,
        authenticated: false,
        error: '未认证',
        code: 'NOT_AUTHENTICATED',
        timestamp: new Date().toISOString()
      }, { status: 401 })

      logAuditEvent(request, AuditEventType.ACCESS_DENIED, {
        success: false,
        statusCode: 401,
        errorMessage: '身份验证失败',
        duration: Date.now() - startTime
      })

      return response
    }

    // 🔐 获取会话信息
    const sessionId = getSessionIdFromRequest(request)
    const session = sessionId ? validateSession(sessionId) : null

    // 🔐 检查Token状态
    const bearerToken = request.headers.get('authorization')?.replace('Bearer ', '')
    let tokenInfo = null
    
    if (bearerToken) {
      try {
        const tokenPayload = verifyAccessToken(bearerToken)
        tokenInfo = {
          valid: true,
          expiringSoon: isTokenExpiringSoon(bearerToken, 30), // 30分钟内过期
          remainingTime: getTokenRemainingTime(bearerToken),
          type: 'Bearer JWT'
        }
      } catch {
        tokenInfo = {
          valid: false,
          error: 'Token无效或已过期',
          type: 'Bearer JWT'
        }
      }
    }

    // 🔐 构建用户权限信息
    const userPermissions = {
      canReadConfig: user.permissions.includes('system:config:read'),
      canWriteConfig: user.permissions.includes('system:config:write'),
      canReadTemplates: user.permissions.includes('template:read'),
      canWriteTemplates: user.permissions.includes('template:write'),
      canDeleteTemplates: user.permissions.includes('template:delete'),
      canReadAuditLogs: user.permissions.includes('security:audit:read'),
      canWriteSecurityConfig: user.permissions.includes('security:config:write'),
      isSuperAdmin: user.permissions.includes('super:admin')
    }

    // 🔐 构建响应数据
    const responseData = {
      success: true,
      authenticated: true,
      user: {
        userId: user.userId,
        username: user.username,
        role: user.role,
        permissions: user.permissions,
        lastLogin: user.lastLogin,
        capabilities: userPermissions
      },
      session: session ? {
        sessionId: session.sessionId,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress,
        deviceInfo: session.deviceInfo,
        isActive: session.isActive
      } : null,
      token: tokenInfo,
      security: {
        requiresTwoFactor: false, // 未来扩展
        passwordExpired: false, // 未来扩展
        accountLocked: false
      },
      timestamp: new Date().toISOString()
    }

    // 🔐 记录验证事件（低频记录）
    if (Math.random() < 0.1) { // 10%的概率记录，避免日志过多
      logAuditEvent(request, AuditEventType.ACCESS_GRANTED, {
        user,
        success: true,
        statusCode: 200,
        details: {
          verificationMethod: session ? 'session' : 'token',
          userAgent: request.headers.get('user-agent')?.substring(0, 100),
          hasValidToken: tokenInfo?.valid || false
        },
        duration: Date.now() - startTime
      })
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('🚨 身份验证检查失败:', error)
    
    const response = NextResponse.json({
      success: false,
      authenticated: false,
      error: '身份验证检查失败',
      code: 'VERIFICATION_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 })

    logAuditEvent(request, AuditEventType.API_ERROR, {
      success: false,
      statusCode: 500,
      errorMessage: error instanceof Error ? error.message : '验证过程异常',
      duration: Date.now() - startTime
    })

    return response
  }
}

/**
 * POST - 刷新Token
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // 🔐 获取刷新Token
    const refreshToken = request.cookies.get('refresh_token')?.value
    
    if (!refreshToken) {
      return NextResponse.json({
        success: false,
        error: '缺少刷新Token',
        code: 'MISSING_REFRESH_TOKEN',
        timestamp: new Date().toISOString()
      }, { status: 401 })
    }

    // 🔐 验证刷新Token
    let refreshPayload
    try {
      const { verifyRefreshToken } = await import('@/lib/auth/jwt')
      refreshPayload = verifyRefreshToken(refreshToken)
    } catch {
      return NextResponse.json({
        success: false,
        error: '刷新Token无效',
        code: 'INVALID_REFRESH_TOKEN',
        timestamp: new Date().toISOString()
      }, { status: 401 })
    }

    // 🔐 获取用户完整信息
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({
        success: false,
        error: '用户信息不可用',
        code: 'USER_INFO_UNAVAILABLE',
        timestamp: new Date().toISOString()
      }, { status: 401 })
    }

    // 🔐 生成新的Token对
    const { generateTokenPair } = await import('@/lib/auth/jwt')
    const newTokenPair = generateTokenPair(user)

    // 🔐 创建响应
    const response = NextResponse.json({
      success: true,
      message: 'Token刷新成功',
      data: {
        tokenExpiresAt: newTokenPair.accessTokenExpiresAt,
        refreshExpiresAt: newTokenPair.refreshTokenExpiresAt
      },
      timestamp: new Date().toISOString()
    })

    // 🔐 设置新的Token
    response.headers.set('Authorization', `Bearer ${newTokenPair.accessToken}`)
    response.cookies.set('refresh_token', newTokenPair.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60, // 30天
      path: '/admin'
    })

    // 🔐 记录Token刷新事件
    logAuditEvent(request, AuditEventType.TOKEN_REFRESH, {
      user,
      success: true,
      statusCode: 200,
      details: {
        refreshMethod: 'refresh_token',
        newTokenExpiresAt: newTokenPair.accessTokenExpiresAt
      },
      duration: Date.now() - startTime
    })

    return response

  } catch (error) {
    console.error('🚨 Token刷新失败:', error)
    
    const response = NextResponse.json({
      success: false,
      error: 'Token刷新失败',
      code: 'TOKEN_REFRESH_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 })

    logAuditEvent(request, AuditEventType.API_ERROR, {
      success: false,
      statusCode: 500,
      errorMessage: error instanceof Error ? error.message : 'Token刷新异常',
      duration: Date.now() - startTime
    })

    return response
  }
}

/**
 * PUT - 延长会话
 */
export async function PUT(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({
        success: false,
        error: '未认证',
        code: 'NOT_AUTHENTICATED',
        timestamp: new Date().toISOString()
      }, { status: 401 })
    }

    const sessionId = getSessionIdFromRequest(request)
    const session = sessionId ? validateSession(sessionId) : null

    if (!session) {
      return NextResponse.json({
        success: false,
        error: '会话不存在或已过期',
        code: 'INVALID_SESSION',
        timestamp: new Date().toISOString()
      }, { status: 401 })
    }

    // 🔐 延长会话（通过更新最后活动时间实现）
    // 实际的延长逻辑已在validateSession中自动完成
    
    return NextResponse.json({
      success: true,
      message: '会话已延长',
      data: {
        sessionId: session.sessionId,
        expiresAt: session.expiresAt,
        extendedAt: new Date()
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('🚨 会话延长失败:', error)
    
    return NextResponse.json({
      success: false,
      error: '会话延长失败',
      code: 'SESSION_EXTEND_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * OPTIONS - 处理预检请求
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
        ? 'https://your-domain.com' 
        : 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'GET, POST, PUT',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
      'Access-Control-Allow-Credentials': 'true'
    }
  })
}