/**
 * 简化的管理后台登录API
 * 用于测试和开发
 */

import { NextRequest, NextResponse } from 'next/server'

// 硬编码的管理员账号（仅用于测试）
const ADMIN_CREDENTIALS = {
  username: 'kexing',
  password: 'zzxxcc123'
}

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json()
    const { username, password } = body
    
    // 验证凭证
    if (username === ADMIN_CREDENTIALS.username && 
        password === ADMIN_CREDENTIALS.password) {
      
      // 创建响应
      const response = NextResponse.json({
        success: true,
        message: '登录成功',
        data: {
          user: {
            userId: 'admin_001',
            username: username,
            role: 'super_admin'
          }
        },
        timestamp: new Date().toISOString()
      })
      
      // 设置简单的会话cookie
      response.cookies.set('admin_session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 24小时
        path: '/'
      })
      
      return response
    }
    
    // 凭证无效
    return NextResponse.json({
      success: false,
      error: '用户名或密码错误',
      timestamp: new Date().toISOString()
    }, { status: 401 })
    
  } catch (error) {
    console.error('登录处理失败:', error)
    return NextResponse.json({
      success: false,
      error: '服务器错误',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}