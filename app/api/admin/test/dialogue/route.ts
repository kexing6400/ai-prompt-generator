/**
 * 专业角色连续对话API
 * 支持上下文记忆的多轮对话测试
 */

import { NextRequest, NextResponse } from 'next/server'

// OpenRouter API配置
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''

// 对话历史接口
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface DialogueSession {
  sessionId: string;
  roleName: string;
  systemPrompt: string;
  model: string;
  modelConfig: any;
  messages: Message[];
  createdAt: string;
  lastActivity: string;
}

// 简单的内存存储（生产环境应使用数据库）
const dialogueSessions = new Map<string, DialogueSession>();

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
      sessionId,
      message,
      model = 'openai/gpt-3.5-turbo',
      systemPrompt = '你是一个专业的AI助手。',
      temperature = 0.7,
      maxTokens = 1000,
      topP = 0.9,
      frequencyPenalty = 0,
      presencePenalty = 0,
      roleName = '通用助手',
      action = 'send' // send, new, clear
    } = body

    console.log(`🗣️ 对话请求 [${action}] - 角色: ${roleName}, 会话: ${sessionId || '新会话'}`)

    // 处理不同的操作
    switch (action) {
      case 'new':
        return handleNewSession(roleName, systemPrompt, model, { temperature, maxTokens, topP, frequencyPenalty, presencePenalty })
      
      case 'clear':
        return handleClearSession(sessionId)
      
      case 'send':
        return handleSendMessage(sessionId, message, model, systemPrompt, { temperature, maxTokens, topP, frequencyPenalty, presencePenalty }, roleName)
      
      default:
        return NextResponse.json(
          { success: false, error: '无效的操作类型' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ 对话处理失败:', error)
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

// 创建新对话会话
function handleNewSession(roleName: string, systemPrompt: string, model: string, modelConfig: any) {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const session: DialogueSession = {
    sessionId,
    roleName,
    systemPrompt,
    model,
    modelConfig,
    messages: [
      {
        role: 'system',
        content: systemPrompt,
        timestamp: new Date().toISOString()
      }
    ],
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  }
  
  dialogueSessions.set(sessionId, session)
  
  console.log(`🆕 创建新对话会话: ${sessionId} - 角色: ${roleName}`)
  
  return NextResponse.json({
    success: true,
    message: '对话会话创建成功',
    data: {
      sessionId,
      roleName,
      model,
      systemPrompt,
      greeting: getRoleGreeting(roleName)
    }
  })
}

// 清空对话历史
function handleClearSession(sessionId: string) {
  if (!sessionId) {
    return NextResponse.json(
      { success: false, error: '会话ID不能为空' },
      { status: 400 }
    )
  }
  
  const session = dialogueSessions.get(sessionId)
  if (!session) {
    return NextResponse.json(
      { success: false, error: '会话不存在' },
      { status: 404 }
    )
  }
  
  // 只保留系统提示词
  session.messages = [session.messages[0]] // 保留第一条系统消息
  session.lastActivity = new Date().toISOString()
  
  console.log(`🧹 清空对话历史: ${sessionId}`)
  
  return NextResponse.json({
    success: true,
    message: '对话历史已清空',
    data: {
      sessionId,
      messagesCount: session.messages.length
    }
  })
}

// 发送消息并获取AI回复
async function handleSendMessage(
  sessionId: string, 
  message: string, 
  model: string, 
  systemPrompt: string, 
  modelConfig: any,
  roleName: string
) {
  if (!sessionId) {
    return NextResponse.json(
      { success: false, error: '会话ID不能为空' },
      { status: 400 }
    )
  }
  
  if (!message?.trim()) {
    return NextResponse.json(
      { success: false, error: '消息内容不能为空' },
      { status: 400 }
    )
  }
  
  let session = dialogueSessions.get(sessionId)
  if (!session) {
    return NextResponse.json(
      { success: false, error: '会话不存在，请先创建新会话' },
      { status: 404 }
    )
  }
  
  // 添加用户消息到历史
  const userMessage: Message = {
    role: 'user',
    content: message.trim(),
    timestamp: new Date().toISOString()
  }
  session.messages.push(userMessage)
  
  try {
    // 准备API请求消息
    const apiMessages = session.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
    
    const openRouterRequest = {
      model: model,
      messages: apiMessages,
      temperature: modelConfig.temperature,
      max_tokens: modelConfig.maxTokens,
      top_p: modelConfig.topP,
      frequency_penalty: modelConfig.frequencyPenalty,
      presence_penalty: modelConfig.presencePenalty,
      stream: false
    }
    
    console.log(`📡 发送对话请求到OpenRouter - 历史消息: ${session.messages.length}条`)
    
    // 调用OpenRouter API
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)
    
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'AI Prompt Generator Dialogue'
      },
      body: JSON.stringify(openRouterRequest),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ OpenRouter API错误:', errorData)
      
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
    const assistantReply = data.choices?.[0]?.message?.content || ''
    
    if (!assistantReply) {
      return NextResponse.json(
        { 
          success: false, 
          error: '未生成任何回复',
          details: '模型返回了空响应'
        },
        { status: 500 }
      )
    }
    
    // 添加AI回复到历史
    const assistantMessage: Message = {
      role: 'assistant',
      content: assistantReply,
      timestamp: new Date().toISOString()
    }
    session.messages.push(assistantMessage)
    session.lastActivity = new Date().toISOString()
    
    // 计算使用统计
    const usage = data.usage || {}
    
    console.log(`✅ 对话成功 [${roleName}] - 回复长度: ${assistantReply.length}字符`)
    
    return NextResponse.json({
      success: true,
      message: '对话成功',
      data: {
        sessionId,
        userMessage: message,
        assistantReply,
        totalMessages: session.messages.length,
        usage: {
          promptTokens: usage.prompt_tokens || 0,
          completionTokens: usage.completion_tokens || 0,
          totalTokens: usage.total_tokens || 0
        },
        metadata: {
          model,
          roleName,
          timestamp: new Date().toISOString()
        }
      }
    })
    
  } catch (fetchError: any) {
    console.error('❌ 对话请求失败:', fetchError)
    
    if (fetchError.name === 'AbortError') {
      return NextResponse.json(
        { 
          success: false, 
          error: '请求超时',
          details: 'AI响应超时（30秒），请检查网络连接'
        },
        { status: 504 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: '网络连接失败',
        details: `无法连接到AI服务: ${fetchError.message || '未知网络错误'}`
      },
      { status: 503 }
    )
  }
}

// 获取角色问候语
function getRoleGreeting(roleName: string): string {
  const greetings: { [key: string]: string } = {
    '法律专家': '您好，我是您的法律顾问。请描述您需要咨询的法律问题，我将为您提供专业的分析和建议。',
    '房产顾问': '您好，我是您的房地产投资顾问。请告诉我您的投资需求或房产相关问题，我将为您提供专业建议。',
    '保险顾问': '您好，我是您的保险规划顾问。请分享您的保险需求或疑问，我将为您提供专业的保险规划建议。',
    '教育专家': '您好，我是您的教育顾问。无论是学习规划还是教学设计，我都很乐意为您提供专业建议。',
    '财务会计': '您好，我是您的财务顾问。请描述您的财务问题或需求，我将为您提供专业的会计和税务建议。',
    '营销专家': '您好，我是您的营销策略顾问。请分享您的品牌或产品情况，我将为您制定有效的营销策略。'
  }
  
  return greetings[roleName] || '您好，我是您的AI助手。有什么可以帮助您的吗？'
}

// 获取对话会话列表
export async function GET(request: NextRequest) {
  try {
    // 验证管理员会话
    const sessionCookie = request.cookies.get('admin_session')
    if (!sessionCookie || sessionCookie.value !== 'authenticated') {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      )
    }
    
    const sessions = Array.from(dialogueSessions.values()).map(session => ({
      sessionId: session.sessionId,
      roleName: session.roleName,
      model: session.model,
      messagesCount: session.messages.length - 1, // 排除系统消息
      createdAt: session.createdAt,
      lastActivity: session.lastActivity
    }))
    
    return NextResponse.json({
      success: true,
      data: {
        sessions,
        totalSessions: sessions.length
      }
    })
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}