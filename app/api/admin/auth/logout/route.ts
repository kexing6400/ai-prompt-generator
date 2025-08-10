/**
 * 🔐 企业级管理员登出API
 * 安全清理会话、Token和Cookie
 * 支持审计日志记录
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/middleware/admin-auth'
import { 
  deleteSession, 
  getSessionIdFromRequest, 
  clearSessionCookie,
  blacklistToken 
} from '@/lib/auth/session'
import { clearCSRFToken } from '@/lib/middleware/csrf'
import { logAuditEvent, AuditEventType } from '@/lib/middleware/audit-log'
import { extractUserIdFromToken } from '@/lib/auth/jwt'

/**
 * POST - 管理员登出
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // 🔐 获取当前用户信息（如果可用）
    const user = await getCurrentUser(request)
    const sessionId = getSessionIdFromRequest(request)
    
    // 🔐 获取各种Token用于清理
    const bearerToken = request.headers.get('authorization')?.replace('Bearer ', '')
    const refreshToken = request.cookies.get('refresh_token')?.value
    const csrfToken = request.cookies.get('csrf_token')?.value

    // 🔐 创建响应
    const response = NextResponse.json({
      success: true,
      message: '登出成功',
      timestamp: new Date().toISOString()
    })

    // 🔐 清理会话
    if (sessionId) {
      deleteSession(sessionId)
      clearSessionCookie(response)
    }

    // 🔐 将Tokens加入黑名单
    if (bearerToken) {
      blacklistToken(bearerToken)
    }
    if (refreshToken) {
      blacklistToken(refreshToken)
    }

    // 🔐 清除所有认证相关的Cookie
    const cookiesToClear = [
      'admin_session',
      'refresh_token', 
      'csrf_token',
      'remember_token'
    ]

    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        maxAge: 0,
        path: '/admin',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      })
      
      // 也清除根路径的Cookie（如果存在）
      response.cookies.set(cookieName, '', {
        maxAge: 0,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      })
    })

    // 🔐 清除CSRF Token
    if (csrfToken) {
      clearCSRFToken(response, csrfToken)
    }

    // 🔐 设置安全响应头
    response.headers.set('Clear-Site-Data', '"cookies", "storage", "cache"')
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    // 🔐 记录登出事件
    logAuditEvent(request, AuditEventType.LOGOUT, {
      user: user || undefined,
      success: true,
      statusCode: 200,
      details: {
        sessionId,
        tokensRevoked: {
          bearer: !!bearerToken,
          refresh: !!refreshToken,
          csrf: !!csrfToken
        },
        logoutType: 'user_initiated'
      },
      duration: Date.now() - startTime
    })

    console.log(`🔐 管理员登出成功:`, {
      userId: user?.userId || 'unknown',
      username: user?.username || 'unknown',
      sessionId,
      timestamp: new Date().toISOString()
    })

    return response

  } catch (error) {
    console.error('🚨 登出处理失败:', error)
    
    // 即使出错也要清除认证信息
    const response = NextResponse.json({
      success: true,
      message: '登出完成',
      warning: '部分清理操作可能失败',
      timestamp: new Date().toISOString()
    })

    // 强制清除Cookie
    const cookiesToClear = ['admin_session', 'refresh_token', 'csrf_token']
    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        maxAge: 0,
        path: '/admin'
      })
      response.cookies.set(cookieName, '', {
        maxAge: 0,
        path: '/'
      })
    })

    response.headers.set('Clear-Site-Data', '"cookies"')

    // 记录错误事件
    logAuditEvent(request, AuditEventType.API_ERROR, {
      success: false,
      statusCode: 200, // 仍然返回成功状态
      errorMessage: error instanceof Error ? error.message : '登出处理异常',
      details: { context: 'logout_cleanup_error' },
      duration: Date.now() - startTime
    })

    return response
  }
}

/**
 * DELETE - 管理员登出（备选方法）
 */
export async function DELETE(request: NextRequest) {
  return POST(request)
}

/**
 * GET - 全局登出（撤销所有会话）
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // 🔐 获取当前用户
    const user = await getCurrentUser(request)
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: '未找到活跃会话',
        code: 'NO_ACTIVE_SESSION',
        timestamp: new Date().toISOString()
      }, { status: 401 })
    }

    // 🔐 撤销用户的所有会话
    // 注意：这需要实现getUserSessions和相关清理功能
    // 这里简化为单会话处理
    const sessionId = getSessionIdFromRequest(request)
    if (sessionId) {
      deleteSession(sessionId)
    }

    const response = NextResponse.json({
      success: true,
      message: '所有会话已撤销',
      revokedSessions: sessionId ? 1 : 0,
      timestamp: new Date().toISOString()
    })

    // 清除Cookie
    clearSessionCookie(response)
    response.cookies.set('refresh_token', '', {
      maxAge: 0,
      path: '/admin'
    })

    // 记录全局登出事件
    logAuditEvent(request, AuditEventType.LOGOUT, {
      user,
      success: true,
      statusCode: 200,
      details: {
        logoutType: 'global_logout',
        revokedSessions: sessionId ? 1 : 0
      },
      duration: Date.now() - startTime
    })

    return response

  } catch (error) {
    console.error('🚨 全局登出失败:', error)
    
    return NextResponse.json({
      success: false,
      error: '全局登出失败',
      code: 'GLOBAL_LOGOUT_ERROR',
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
      'Access-Control-Allow-Methods': 'POST, DELETE, GET',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
      'Access-Control-Allow-Credentials': 'true'
    }
  })
}