/**
 * 🔐 认证API路由重定向
 * 将旧的认证端点重定向到新的安全框架端点
 * 保持向后兼容性
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * 所有请求重定向到相应的新端点
 */
async function handleRedirect(request: NextRequest, method: string) {
  const baseUrl = new URL(request.url).origin
  
  // 根据HTTP方法重定向到相应的新端点
  switch (method) {
    case 'POST':
      // 登录请求重定向
      return NextResponse.redirect(`${baseUrl}/api/admin/auth/login`, 308)
    
    case 'GET':
      // 验证请求重定向
      return NextResponse.redirect(`${baseUrl}/api/admin/auth/verify`, 308)
    
    case 'DELETE':
      // 登出请求重定向
      return NextResponse.redirect(`${baseUrl}/api/admin/auth/logout`, 308)
    
    case 'PUT':
      // 密码修改等操作需要实现专门的端点
      return NextResponse.json({
        success: false,
        error: '此端点已迁移',
        message: '请使用新的认证端点',
        newEndpoints: {
          login: '/api/admin/auth/login',
          logout: '/api/admin/auth/logout',
          verify: '/api/admin/auth/verify'
        },
        timestamp: new Date().toISOString()
      }, { status: 301 })
    
    default:
      return NextResponse.json({
        success: false,
        error: '不支持的HTTP方法',
        supportedMethods: ['GET', 'POST', 'DELETE'],
        timestamp: new Date().toISOString()
      }, { status: 405 })
  }
}

export async function POST(request: NextRequest) {
  return handleRedirect(request, 'POST')
}

export async function GET(request: NextRequest) {
  return handleRedirect(request, 'GET')
}

export async function DELETE(request: NextRequest) {
  return handleRedirect(request, 'DELETE')
}

export async function PUT(request: NextRequest) {
  return handleRedirect(request, 'PUT')
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  })
}