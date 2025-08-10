/**
 * 🔐 企业级管理员登录API
 * 使用新的安全认证框架
 * 支持速率限制、审计日志、CSRF防护
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyPassword } from '@/lib/auth/password'
import { generateTokenPair } from '@/lib/auth/jwt'
import { createSession, createSessionCookie } from '@/lib/auth/session'
import { setCSRFToken } from '@/lib/middleware/csrf'
import { logAuditEvent, AuditEventType, AuditSeverity } from '@/lib/middleware/audit-log'
import { loginRateLimit, getClientIdentifier } from '@/lib/middleware/rate-limit'

// 强制动态渲染 - 确保每次请求都重新执行
export const dynamic = 'force-dynamic';

// 🔐 登录请求验证模式
const loginSchema = z.object({
  username: z.string()
    .min(1, '用户名不能为空')
    .max(50, '用户名过长'),
  password: z.string()
    .min(1, '密码不能为空')
    .max(100, '密码过长'),
  remember: z.boolean().optional().default(false),
  captcha: z.string().optional() // 验证码（可选）
})

// 🔐 企业级管理员账户配置
// ⚠️ 安全说明：密码已使用bcrypt哈希加密（工作因子12），绝不存储明文密码
// 🔒 生产环境建议：将用户配置迁移到加密数据库或环境变量中
const ADMIN_USERS = {
  'kexing': {
    userId: 'admin_kexing_001',
    username: 'kexing',
    // 🔐 密码哈希值（使用bcrypt加密，工作因子12）
    // 原始密码复杂度：8+字符，包含大小写字母、数字、特殊字符
    passwordHash: '$2b$12$z8hxhr6KaIuXIZBSA.cTXupZ.RrM0xQm569uLRPxlQnMvCN0/7JNW',
    role: 'super_admin' as const,
    permissions: [
      'system:config:read',
      'system:config:write', 
      'template:read',
      'template:write',
      'template:delete',
      'security:audit:read',
      'security:config:write',
      'super:admin'
    ],
    isActive: true,
    lastPasswordChange: new Date('2024-12-10'),
    // 🔐 安全设置
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15分钟
    passwordExpiryDays: 90,
    requireMFA: false // 双因素认证（未来实现）
  }
}

/**
 * POST - 管理员登录
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const clientIP = getClientIdentifier(request)
  
  try {
    // 🔐 应用速率限制
    const rateLimitResponse = await loginRateLimit(request)
    if (rateLimitResponse) {
      // 记录速率限制事件
      logAuditEvent(request, AuditEventType.RATE_LIMIT_HIT, {
        success: false,
        statusCode: 429,
        details: { reason: '登录请求频率过高' },
        duration: Date.now() - startTime
      })
      return rateLimitResponse
    }

    // 🔐 解析和验证请求体
    let body: any
    try {
      body = await request.json()
    } catch {
      const response = NextResponse.json({
        success: false,
        error: '请求格式错误',
        code: 'INVALID_JSON',
        timestamp: new Date().toISOString()
      }, { status: 400 })
      
      logAuditEvent(request, AuditEventType.LOGIN_FAILURE, {
        success: false,
        statusCode: 400,
        errorMessage: '请求格式错误',
        duration: Date.now() - startTime
      })
      
      return response
    }

    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      const response = NextResponse.json({
        success: false,
        error: '请求参数无效',
        details: validation.error.issues,
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      }, { status: 400 })
      
      logAuditEvent(request, AuditEventType.LOGIN_FAILURE, {
        success: false,
        statusCode: 400,
        errorMessage: '请求参数验证失败',
        details: { errors: validation.error.issues },
        duration: Date.now() - startTime
      })
      
      return response
    }

    const { username, password, remember } = validation.data

    // 🔐 查找用户
    const user = ADMIN_USERS[username as keyof typeof ADMIN_USERS]
    if (!user || !user.isActive) {
      const response = NextResponse.json({
        success: false,
        error: '用户名或密码错误',
        code: 'INVALID_CREDENTIALS',
        timestamp: new Date().toISOString()
      }, { status: 401 })
      
      logAuditEvent(request, AuditEventType.LOGIN_FAILURE, {
        success: false,
        statusCode: 401,
        errorMessage: '用户不存在或已禁用',
        details: { username, attemptedUser: username },
        duration: Date.now() - startTime
      })
      
      return response
    }

    // 🔐 验证密码
    const isPasswordValid = await verifyPassword(password, user.passwordHash)
    if (!isPasswordValid) {
      const response = NextResponse.json({
        success: false,
        error: '用户名或密码错误',
        code: 'INVALID_CREDENTIALS',
        timestamp: new Date().toISOString()
      }, { status: 401 })
      
      logAuditEvent(request, AuditEventType.LOGIN_FAILURE, {
        user: {
          userId: user.userId,
          username: user.username,
          role: user.role,
          permissions: user.permissions
        },
        success: false,
        statusCode: 401,
        errorMessage: '密码验证失败',
        duration: Date.now() - startTime
      })
      
      return response
    }

    // 🔐 创建用户信息对象
    const userPayload = {
      userId: user.userId,
      username: user.username,
      role: user.role,
      permissions: user.permissions,
      lastLogin: new Date()
    }

    // 🔐 生成JWT Token对
    const tokenPair = generateTokenPair(userPayload)
    
    // 🔐 创建会话
    const session = createSession(userPayload, request)
    
    // 🔐 创建响应
    const response = NextResponse.json({
      success: true,
      message: '登录成功',
      data: {
        sessionId: session.sessionId,
        user: {
          userId: userPayload.userId,
          username: userPayload.username,
          role: userPayload.role,
          permissions: userPayload.permissions,
          lastLogin: userPayload.lastLogin
        },
        tokenExpiresAt: tokenPair.accessTokenExpiresAt,
        sessionExpiresAt: session.expiresAt
      },
      timestamp: new Date().toISOString()
    })

    // 🔐 设置安全Cookie
    createSessionCookie(response, session.sessionId, {
      maxAge: remember ? 30 * 24 * 60 * 60 : 24 * 60 * 60 // 记住登录30天，否则24小时
    })

    // 🔐 设置JWT Token在Authorization头（可选，用于API调用）
    response.headers.set('Authorization', `Bearer ${tokenPair.accessToken}`)
    
    // 🔐 设置刷新Token在HttpOnly Cookie中
    response.cookies.set('refresh_token', tokenPair.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60, // 30天
      path: '/admin'
    })

    // 🔐 设置CSRF Token
    setCSRFToken(response, userPayload.userId)

    // 🔐 记录成功登录
    logAuditEvent(request, AuditEventType.LOGIN_SUCCESS, {
      user: userPayload,
      success: true,
      statusCode: 200,
      details: {
        sessionId: session.sessionId,
        deviceInfo: session.deviceInfo,
        rememberMe: remember,
        tokenType: 'JWT + Session'
      },
      duration: Date.now() - startTime
    })

    console.log(`🔐 管理员登录成功:`, {
      userId: userPayload.userId,
      username: userPayload.username,
      ip: clientIP,
      sessionId: session.sessionId,
      timestamp: new Date().toISOString()
    })

    return response

  } catch (error) {
    console.error('🚨 登录处理失败:', error)
    
    const response = NextResponse.json({
      success: false,
      error: '服务器内部错误',
      code: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 })

    logAuditEvent(request, AuditEventType.API_ERROR, {
      success: false,
      statusCode: 500,
      errorMessage: error instanceof Error ? error.message : '未知错误',
      duration: Date.now() - startTime,
      customSeverity: AuditSeverity.HIGH
    })

    return response
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
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
      'Access-Control-Allow-Credentials': 'true'
    }
  })
}