/**
 * 专业角色测试生成API
 * 使用选定角色的配置进行实际API调用测试
 */

import { NextRequest, NextResponse } from 'next/server'

// OpenRouter API配置
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''

export async function POST(request: NextRequest) {
  try {
    // 验证管理员会话
    const sessionCookie = request.cookies.get('admin_session')
    if (!sessionCookie || sessionCookie.value !== 'authenticated') {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      )
    }

    // 解析请求体
    const body = await request.json()
    const { 
      prompt, 
      model = 'openai/gpt-3.5-turbo',
      systemPrompt = '你是一个专业的AI助手。',
      temperature = 0.7,
      maxTokens = 1000,
      topP = 0.9,
      frequencyPenalty = 0,
      presencePenalty = 0,
      roleName = '通用助手'
    } = body

    if (!prompt?.trim()) {
      return NextResponse.json(
        { success: false, error: '测试输入不能为空' },
        { status: 400 }
      )
    }

    console.log(`🧪 开始测试 [${roleName}] 角色，使用模型: ${model}`)

    // 构建OpenRouter请求
    const openRouterRequest = {
      model: model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: temperature,
      max_tokens: maxTokens,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      stream: false
    }

    // 调用OpenRouter API（添加超时和错误处理）
    console.log(`📡 正在连接OpenRouter API: ${OPENROUTER_API_URL}`)
    console.log(`🔑 API密钥长度: ${OPENROUTER_API_KEY?.length || 0}`)
    
    let response: Response
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30秒超时
      
      response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'AI Prompt Generator Admin Test'
        },
        body: JSON.stringify(openRouterRequest),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
    } catch (fetchError: any) {
      console.error('❌ 网络请求失败:', fetchError)
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { 
            success: false, 
            error: '请求超时',
            details: 'OpenRouter API响应超时（30秒），请检查网络连接'
          },
          { status: 504 }
        )
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: '网络连接失败',
          details: `无法连接到OpenRouter API: ${fetchError.message || '未知网络错误'}`,
          troubleshooting: [
            '1. 检查网络连接是否正常',
            '2. 确认OpenRouter服务是否可用',
            '3. 检查防火墙或代理设置',
            '4. 尝试使用免费模型测试'
          ]
        },
        { status: 503 }
      )
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ OpenRouter API错误:', errorData)
      
      // 处理特定错误
      if (response.status === 401) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'API密钥无效或未配置',
            details: '请在环境变量中设置OPENROUTER_API_KEY'
          },
          { status: 401 }
        )
      }
      
      if (response.status === 429) {
        return NextResponse.json(
          { 
            success: false, 
            error: '请求频率过高，请稍后重试',
            details: errorData.error?.message || '达到速率限制'
          },
          { status: 429 }
        )
      }

      if (response.status === 400) {
        return NextResponse.json(
          { 
            success: false, 
            error: '请求参数错误',
            details: errorData.error?.message || '模型可能不可用或参数无效'
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { 
          success: false, 
          error: `API调用失败 (${response.status})`,
          details: errorData.error?.message || '请检查模型配置和API密钥'
        },
        { status: response.status }
      )
    }

    const data = await response.json()

    // 提取生成的内容
    const generatedContent = data.choices?.[0]?.message?.content || ''
    
    if (!generatedContent) {
      return NextResponse.json(
        { 
          success: false, 
          error: '未生成任何内容',
          details: '模型返回了空响应'
        },
        { status: 500 }
      )
    }

    // 计算使用统计
    const usage = data.usage || {}
    const cost = calculateCost(model, usage)

    console.log(`✅ 测试成功 [${roleName}]，生成${generatedContent.length}个字符`)

    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: '生成成功',
      data: {
        content: generatedContent,
        model: model,
        role: roleName,
        usage: {
          promptTokens: usage.prompt_tokens || 0,
          completionTokens: usage.completion_tokens || 0,
          totalTokens: usage.total_tokens || 0,
          estimatedCost: cost
        },
        metadata: {
          temperature,
          maxTokens,
          topP,
          timestamp: new Date().toISOString()
        }
      }
    })

  } catch (error) {
    console.error('❌ 测试生成失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '服务器内部错误',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

// 计算API调用成本（基于OpenRouter定价）
function calculateCost(model: string, usage: any): string {
  // 简化的成本计算，实际应该从模型定价数据中获取
  const costPerToken = getCostPerToken(model)
  const promptCost = (usage.prompt_tokens || 0) * costPerToken.prompt / 1000
  const completionCost = (usage.completion_tokens || 0) * costPerToken.completion / 1000
  const totalCost = promptCost + completionCost
  
  if (totalCost === 0) return '免费'
  if (totalCost < 0.001) return '<$0.001'
  return `$${totalCost.toFixed(4)}`
}

// 获取模型定价（简化版）
function getCostPerToken(model: string): { prompt: number; completion: number } {
  // 常见模型的定价映射
  const pricing: Record<string, { prompt: number; completion: number }> = {
    'openai/gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 },
    'openai/gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
    'anthropic/claude-3.5-sonnet': { prompt: 0.003, completion: 0.015 },
    'anthropic/claude-3-haiku': { prompt: 0.00025, completion: 0.00125 },
    'google/gemini-pro': { prompt: 0.00025, completion: 0.0005 },
    'meta-llama/llama-3.1-8b-instruct:free': { prompt: 0, completion: 0 },
    'qwen/qwen-2.5-72b-instruct': { prompt: 0.00035, completion: 0.0004 },
    'mistralai/mistral-7b-instruct:free': { prompt: 0, completion: 0 }
  }
  
  // 返回匹配的定价或默认值
  return pricing[model] || { prompt: 0.001, completion: 0.002 }
}

// OPTIONS请求处理（CORS）
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}