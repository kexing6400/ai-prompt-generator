/**
 * Creem.io支付系统Webhook处理端点
 * 
 * POST /api/subscription/webhook
 * 接收并处理来自Creem.io的Webhook事件，同步订阅状态
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { 
  subscriptionManager, 
  createSubscriptionErrorResponse 
} from '@/lib/subscription'

/**
 * 处理Creem.io Webhook事件
 * 
 * 请求头要求：
 * - Content-Type: application/json
 * - X-Creem-Signature: webhook签名 (用于验证请求来源)
 */
export async function POST(request: NextRequest) {
  let rawBody = ''
  
  try {
    // 获取原始请求体 (用于签名验证)
    rawBody = await request.text()
    
    // 获取签名头
    const signature = request.headers.get('x-creem-signature') || 
                     request.headers.get('creem-signature') || ''

    if (!signature) {
      console.warn('Webhook received without signature')
      // 在开发环境可能没有签名，生产环境必须有
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          createSubscriptionErrorResponse(
            'WEBHOOK_VERIFICATION_FAILED',
            'Missing webhook signature'
          ),
          { status: 401 }
        )
      }
    }

    // 验证请求体不为空
    if (!rawBody.trim()) {
      return NextResponse.json(
        createSubscriptionErrorResponse(
          'WEBHOOK_VERIFICATION_FAILED',
          'Empty webhook payload'
        ),
        { status: 400 }
      )
    }

    // 处理webhook事件
    const webhookResult = await subscriptionManager.handlePaymentWebhook(rawBody, signature)
    
    if (!webhookResult.success) {
      console.error('Webhook processing failed:', webhookResult.error)
      
      const statusCode = webhookResult.error?.includes('signature') ? 401 : 400
      
      return NextResponse.json(
        createSubscriptionErrorResponse(
          'WEBHOOK_VERIFICATION_FAILED',
          webhookResult.error || 'Failed to process webhook'
        ),
        { status: statusCode }
      )
    }

    // 返回成功响应 (Creem.io期望200状态码)
    return NextResponse.json(
      {
        success: true,
        message: webhookResult.message || 'Webhook processed successfully',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
    
    // 记录详细错误信息用于调试
    const errorDetails = {
      error: error instanceof Error ? error.message : 'Unknown error',
      hasRawBody: Boolean(rawBody),
      bodyLength: rawBody.length,
      timestamp: new Date().toISOString()
    }
    
    console.error('Webhook error details:', errorDetails)
    
    return NextResponse.json(
      createSubscriptionErrorResponse(
        'WEBHOOK_VERIFICATION_FAILED',
        'Internal webhook processing error',
        errorDetails
      ),
      { status: 500 }
    )
  }
}

/**
 * 健康检查端点
 * GET /api/subscription/webhook
 * 用于验证webhook端点是否可访问
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Subscription webhook endpoint is healthy',
    endpoint: '/api/subscription/webhook',
    methods: ['POST'],
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown'
  })
}

/**
 * 选项预检请求处理
 * OPTIONS /api/subscription/webhook
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'POST, GET, OPTIONS',
      'Content-Type': 'application/json',
    },
  })
}

/**
 * 不支持的HTTP方法
 */
export async function PUT() {
  return NextResponse.json(
    createSubscriptionErrorResponse(
      'CREEM_API_ERROR',
      'Method PUT not allowed on webhook endpoint'
    ),
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    createSubscriptionErrorResponse(
      'CREEM_API_ERROR',
      'Method DELETE not allowed on webhook endpoint'
    ),
    { status: 405 }
  )
}

export async function PATCH() {
  return NextResponse.json(
    createSubscriptionErrorResponse(
      'CREEM_API_ERROR',
      'Method PATCH not allowed on webhook endpoint'
    ),
    { status: 405 }
  )
}