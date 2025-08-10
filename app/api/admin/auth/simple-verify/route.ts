/**
 * 简化的认证验证API
 * 用于检查用户是否已登录
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// 强制动态路由 - 防止Vercel部署时的静态生成错误
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // 检查是否有会话cookie
    const cookieStore = cookies()
    const sessionId = cookieStore.get('admin_session')
    
    if (sessionId && sessionId.value === 'authenticated') {
      // 如果有会话，返回已认证
      return NextResponse.json({
        success: true,
        authenticated: true,
        message: '已认证',
        timestamp: new Date().toISOString()
      })
    }
    
    // 没有会话，返回未认证
    return NextResponse.json({
      success: false,
      authenticated: false,
      message: '未认证',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('认证验证失败:', error)
    return NextResponse.json({
      success: false,
      authenticated: false,
      error: '验证失败',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}