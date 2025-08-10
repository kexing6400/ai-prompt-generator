/**
 * OpenRouter API连接测试端点
 * 
 * 功能：
 * - 验证API key的有效性
 * - 测试选定模型的可用性  
 * - 返回连接状态和基本信息
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { apiKey, model } = await req.json();

    // 验证必需参数
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API密钥不能为空',
        code: 'MISSING_API_KEY'
      }, { status: 400 });
    }

    if (!model) {
      return NextResponse.json({
        success: false,
        error: '请选择一个AI模型',
        code: 'MISSING_MODEL'
      }, { status: 400 });
    }

    // 测试OpenRouter API连接
    const testResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
        'X-Title': 'AI Prompt Generator - Settings Test'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: '测试连接，请简单回复"连接成功"'
          }
        ],
        max_tokens: 20,
        temperature: 0.1
      })
    });

    if (!testResponse.ok) {
      const errorData = await testResponse.json().catch(() => ({}));
      
      // 处理不同的错误类型
      let errorMessage = '连接失败';
      let errorCode = 'CONNECTION_FAILED';
      
      if (testResponse.status === 401) {
        errorMessage = 'API密钥无效或已过期';
        errorCode = 'INVALID_API_KEY';
      } else if (testResponse.status === 429) {
        errorMessage = '请求次数过多，请稍后重试';
        errorCode = 'RATE_LIMITED';
      } else if (testResponse.status === 403) {
        errorMessage = 'API密钥权限不足';
        errorCode = 'INSUFFICIENT_PERMISSIONS';
      } else if (testResponse.status >= 500) {
        errorMessage = 'OpenRouter服务暂时不可用';
        errorCode = 'SERVICE_UNAVAILABLE';
      }

      return NextResponse.json({
        success: false,
        error: errorMessage,
        code: errorCode,
        details: errorData.error?.message || `HTTP ${testResponse.status}`
      }, { status: testResponse.status });
    }

    // 解析成功响应
    const responseData = await testResponse.json();
    
    // 验证响应格式
    if (!responseData.choices || !responseData.choices[0]) {
      return NextResponse.json({
        success: false,
        error: '模型响应格式异常',
        code: 'INVALID_RESPONSE'
      }, { status: 500 });
    }

    // 获取模型信息（如果可用）
    const modelInfo = {
      id: responseData.model || model,
      usage: responseData.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };

    // 返回成功结果
    return NextResponse.json({
      success: true,
      message: '连接测试成功',
      data: {
        model: modelInfo,
        response: responseData.choices[0].message?.content || '无响应内容',
        timestamp: new Date().toISOString(),
        latency: testResponse.headers.get('x-response-time') || 'unknown'
      }
    });

  } catch (error) {
    console.error('OpenRouter连接测试错误:', error);

    // 处理网络错误
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json({
        success: false,
        error: '网络连接错误，请检查网络设置',
        code: 'NETWORK_ERROR'
      }, { status: 503 });
    }

    // 处理JSON解析错误
    if (error instanceof SyntaxError) {
      return NextResponse.json({
        success: false,
        error: '请求数据格式错误',
        code: 'INVALID_REQUEST_DATA'
      }, { status: 400 });
    }

    // 其他未知错误
    return NextResponse.json({
      success: false,
      error: '连接测试失败，请稍后重试',
      code: 'UNKNOWN_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// 支持CORS预检请求
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}