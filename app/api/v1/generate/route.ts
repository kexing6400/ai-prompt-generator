/**
 * AI Prompt Builder Pro - 提示词生成API
 * 
 * 核心功能：
 * - 基于模板生成提示词
 * - AI直接生成模式（Pro功能）
 * - 参数验证和模板渲染
 * - 使用限制和统计追踪
 * - 性能监控和缓存优化
 * 
 * @author Claude Code (后端架构师)
 * @version 2.0
 * @date 2025-01-10
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { getCacheManager } from '@/lib/cache-manager'
import { getSecurityManager, commonSchemas } from '@/lib/security-manager'
import { getTemplateEngine } from '@/lib/template-engine'

// =================================================================
// 类型定义和验证Schema
// =================================================================

const GeneratePromptSchema = z.object({
  templateId: z.string().uuid('模板ID格式不正确'),
  parameters: z.record(z.any()),
  options: z.object({
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().min(1).max(8000).default(2000),
    includeExamples: z.boolean().default(true),
    includeInstructions: z.boolean().default(true)
  }).optional().default({})
})

const AIDirectGenerateSchema = z.object({
  industry: z.string().min(1, '请选择行业'),
  scenario: z.string().min(1, '请选择场景'),
  requirements: z.string().min(10, '需求描述至少10个字符').max(1000, '需求描述不能超过1000字符'),
  tone: z.enum(['professional', 'casual', 'academic', 'creative']).default('professional'),
  length: z.enum(['brief', 'detailed', 'comprehensive']).default('detailed'),
  language: z.enum(['zh', 'en']).default('zh')
})

interface GenerationResult {
  id: string
  prompt: string
  metadata: {
    templateUsed?: string
    parametersApplied: Record<string, any>
    generationTime: number
    tokenCount: number
    model: string
    source: 'template' | 'ai-direct'
  }
  suggestions?: {
    improvements: string[]
    relatedTemplates: string[]
  }
}

// =================================================================
// 数据库连接
// =================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// =================================================================
// POST /api/v1/generate - 核心提示词生成API
// =================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()
  
  const cacheManager = getCacheManager()
  const securityManager = getSecurityManager()
  const templateEngine = getTemplateEngine()

  try {
    // 1. 解析请求体
    const body = await request.json()
    const { mode = 'template', ...data } = body

    // 2. 根据生成模式选择相应的处理逻辑
    let result: GenerationResult
    
    if (mode === 'template') {
      result = await handleTemplateGeneration(data, requestId, startTime)
    } else if (mode === 'ai-direct') {
      result = await handleAIDirectGeneration(data, requestId, startTime)
    } else {
      throw new Error('不支持的生成模式')
    }

    // 3. 记录生成历史
    await recordGenerationHistory(result, request)

    // 4. 返回结果
    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        requestId,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    }, {
      headers: {
        'X-Request-ID': requestId,
        'X-Response-Time': (Date.now() - startTime).toString()
      }
    })

  } catch (error) {
    console.error('提示词生成失败:', error)

    // 错误分类和响应
    const errorResponse = classifyAndFormatError(error, requestId, startTime)
    return NextResponse.json(errorResponse.body, { status: errorResponse.status })
  }
}

// =================================================================
// 基于模板的生成处理
// =================================================================

async function handleTemplateGeneration(
  data: any,
  requestId: string,
  startTime: number
): Promise<GenerationResult> {
  // 1. 参数验证
  const validated = GeneratePromptSchema.parse(data)
  const { templateId, parameters, options = {} } = validated

  // 2. 获取模板详情
  const template = await getTemplateFromCache(templateId)
  if (!template) {
    throw new Error(`模板不存在: ${templateId}`)
  }

  // 3. 检查访问权限
  await validateTemplateAccess(template, null) // TODO: 从请求中获取用户信息

  // 4. 编译并渲染模板
  const templateEngine = getTemplateEngine()
  
  // 编译模板（如果尚未编译）
  if (!templateEngine.getTemplateStats(templateId)) {
    await compileTemplate(template, templateEngine)
  }

  // 渲染模板
  const renderResult = await templateEngine.renderTemplate(
    templateId,
    parameters,
    { strict: true, escapeHtml: false }
  )

  // 5. 后处理和优化
  const processedPrompt = await postProcessPrompt(renderResult.content, options)

  // 6. 生成建议和推荐
  const suggestions = await generateSuggestions(template, parameters, processedPrompt)

  // 7. 构建结果
  const result: GenerationResult = {
    id: requestId,
    prompt: processedPrompt,
    metadata: {
      templateUsed: (template as any)?.name || templateId,
      parametersApplied: parameters,
      generationTime: renderResult.renderTime,
      tokenCount: estimateTokenCount(processedPrompt),
      model: 'template-engine',
      source: 'template'
    },
    suggestions
  }

  // 8. 更新模板使用统计
  await updateTemplateUsageStats(templateId, renderResult.renderTime, true)

  return result
}

// =================================================================
// AI直接生成处理（Pro功能）
// =================================================================

async function handleAIDirectGeneration(
  data: any,
  requestId: string,
  startTime: number
): Promise<GenerationResult> {
  // 1. 参数验证
  const validated = AIDirectGenerateSchema.parse(data)
  const { industry, scenario, requirements, tone, length, language } = validated

  // 2. 检查Pro权限
  await validateProAccess(null) // TODO: 从请求中获取用户信息

  // 3. 构建AI生成提示
  const aiGenerationPrompt = buildAIGenerationPrompt({
    industry,
    scenario,
    requirements,
    tone,
    length,
    language
  })

  // 4. 调用AI服务生成
  const aiResult = await callAIService(aiGenerationPrompt, {
    model: 'anthropic/claude-3-5-sonnet',
    temperature: 0.7,
    maxTokens: length === 'brief' ? 1000 : length === 'detailed' ? 2000 : 3000
  })

  // 5. 后处理和质量检查
  const processedPrompt = await postProcessAIGenerated(aiResult.content, validated)

  // 6. 生成改进建议
  const suggestions = await generateAIDirectSuggestions(processedPrompt, validated)

  // 7. 构建结果
  const result: GenerationResult = {
    id: requestId,
    prompt: processedPrompt,
    metadata: {
      parametersApplied: validated,
      generationTime: Date.now() - startTime,
      tokenCount: aiResult.tokenCount,
      model: aiResult.model,
      source: 'ai-direct'
    },
    suggestions
  }

  return result
}

// =================================================================
// 辅助函数
// =================================================================

async function getTemplateFromCache(templateId: string) {
  const cacheManager = getCacheManager()
  const cacheKey = cacheManager.generateKey('template-detail', templateId)
  
  let template = await cacheManager.get(cacheKey)
  
  if (!template) {
    // 从数据库获取模板详情
    template = await fetchTemplateFromDatabase(templateId)
    
    if (template) {
      // 缓存10分钟
      await cacheManager.set(cacheKey, template, { ttl: 10 * 60 * 1000 })
    }
  }
  
  return template
}

async function fetchTemplateFromDatabase(templateId: string) {
  try {
    const { data, error } = await supabase
      .from('prompt_templates')
      .select(`
        *,
        scenarios!inner (
          *,
          industries!inner (*)
        )
      `)
      .eq('id', templateId)
      .eq('review_status', 'approved')
      .is('deleted_at', null)
      .single()

    if (error || !data) {
      return null
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      templateContent: data.template_content,
      parametersSchema: data.parameters_schema || {},
      defaultValues: data.default_values || {},
      accessLevel: data.access_level,
      industry: data.scenarios.industries.code,
      scenario: data.scenarios.code,
      maxTokens: data.max_tokens || 2000,
      temperature: data.temperature || 0.7
    }
  } catch (error) {
    console.error('获取模板失败:', error)
    return null
  }
}

async function validateTemplateAccess(template: any, user: any) {
  // 检查模板访问级别
  if (template.accessLevel === 'pro' && (!user || user.subscriptionStatus === 'free')) {
    throw new Error('该模板需要Pro订阅才能使用')
  }
  
  if (template.accessLevel === 'enterprise' && (!user || user.subscriptionStatus !== 'enterprise')) {
    throw new Error('该模板需要企业订阅才能使用')
  }
  
  // 检查使用限制
  if (user) {
    await validateUsageLimits(user)
  }
}

async function validateProAccess(user: any) {
  if (!user || !['pro', 'enterprise'].includes(user.subscriptionStatus)) {
    throw new Error('AI直接生成功能需要Pro或企业订阅')
  }
}

async function validateUsageLimits(user: any) {
  // 获取今日使用次数
  const today = new Date().toISOString().split('T')[0]
  
  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('prompts_generated')
    .eq('user_id', user.id)
    .eq('tracking_date', today)
    .single()

  const todayUsage = usage?.prompts_generated || 0
  
  // 检查订阅限制
  const limits = {
    free: { daily: 3, monthly: 10 },
    pro: { daily: 50, monthly: 500 },
    enterprise: { daily: -1, monthly: -1 } // 无限制
  }

  const userLimits = limits[user.subscriptionStatus] || limits.free
  
  if (userLimits.daily !== -1 && todayUsage >= userLimits.daily) {
    throw new Error(`已达到每日生成限制（${userLimits.daily}次），请明天再试或升级订阅`)
  }
}

async function compileTemplate(template: any, templateEngine: any) {
  const templateSchema = {
    id: template.id,
    name: template.name,
    templateContent: template.templateContent,
    parameters: Object.entries(template.parametersSchema.properties || {}).map(([key, config]: [string, any]) => ({
      key,
      type: config.type || 'string',
      title: config.title || key,
      description: config.description,
      required: template.parametersSchema.required?.includes(key) || false,
      defaultValue: template.defaultValues[key],
      options: config.enum,
      validation: {
        minLength: config.minLength,
        maxLength: config.maxLength,
        min: config.minimum,
        max: config.maximum
      }
    }))
  }

  return templateEngine.compileTemplate(templateSchema)
}

async function postProcessPrompt(prompt: string, options: any): Promise<string> {
  let result = prompt

  // 移除多余的空白行
  result = result.replace(/\n\s*\n\s*\n/g, '\n\n').trim()

  // 添加使用说明（如果需要）
  if (options.includeInstructions) {
    result = `${result}\n\n---\n**使用说明**: 请将此提示词复制到您使用的AI工具中，根据需要调整具体参数。`
  }

  return result
}

async function generateSuggestions(template: any, parameters: any, generatedPrompt: string) {
  // 基于模板和参数生成改进建议
  const improvements: string[] = []
  const relatedTemplates: string[] = []

  // 简化实现 - 实际应该基于AI分析
  if (generatedPrompt.length < 200) {
    improvements.push('建议增加更多具体的上下文信息')
  }

  if (!generatedPrompt.includes('专业') && template.industry === 'lawyer') {
    improvements.push('建议强调专业性和法律准确性')
  }

  // 查找相关模板
  const { data: related } = await supabase
    .from('prompt_templates')
    .select('name')
    .eq('scenario_id', template.scenario_id)
    .neq('id', template.id)
    .limit(3)

  if (related) {
    relatedTemplates.push(...related.map(t => t.name))
  }

  return { improvements, relatedTemplates }
}

function buildAIGenerationPrompt(params: any): string {
  const { industry, scenario, requirements, tone, length, language } = params

  const industryMap = {
    lawyer: '法律服务',
    realtor: '房地产',
    insurance: '保险',
    teacher: '教育',
    accountant: '财务会计'
  }

  const toneMap = {
    professional: '专业正式',
    casual: '轻松友好', 
    academic: '学术严谨',
    creative: '创新创意'
  }

  const lengthMap = {
    brief: '简洁明了（200-400字）',
    detailed: '详细全面（400-800字）',
    comprehensive: '深入透彻（800-1200字）'
  }

  return `请为${industryMap[industry] || industry}行业的${scenario}场景，生成一个${toneMap[tone]}风格的AI提示词。

具体要求：
${requirements}

输出要求：
- 语言：${language === 'zh' ? '中文' : '英文'}
- 长度：${lengthMap[length]}
- 风格：${toneMap[tone]}
- 结构清晰，易于理解和使用
- 包含具体的指导和示例（如适用）

请直接输出提示词内容，不需要额外的解释说明。`
}

async function callAIService(prompt: string, options: any) {
  // 调用OpenRouter API
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: options.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature,
      max_tokens: options.maxTokens
    })
  })

  if (!response.ok) {
    throw new Error(`AI服务调用失败: ${response.status}`)
  }

  const data = await response.json()
  
  return {
    content: data.choices[0].message.content,
    tokenCount: data.usage?.total_tokens || 0,
    model: options.model
  }
}

async function postProcessAIGenerated(content: string, params: any): Promise<string> {
  // AI生成内容的后处理
  let result = content.trim()
  
  // 移除可能的格式标记
  result = result.replace(/^```[\w]*\n/, '').replace(/\n```$/, '')
  
  return result
}

async function generateAIDirectSuggestions(prompt: string, params: any) {
  return {
    improvements: [
      '可以根据具体情况调整语气和详细程度',
      '建议测试不同的AI模型以获得最佳效果'
    ],
    relatedTemplates: [] // AI直接生成模式不推荐模板
  }
}

async function recordGenerationHistory(result: GenerationResult, request: NextRequest) {
  try {
    // TODO: 从请求中获取用户信息
    const userId = 'anonymous' // 临时占位符
    
    await supabase
      .from('prompt_generations')
      .insert({
        user_id: userId,
        template_id: result.metadata.templateUsed ? result.metadata.templateUsed : null,
        input_parameters: result.metadata.parametersApplied,
        generated_prompt: result.prompt,
        generation_source: result.metadata.source,
        model_used: result.metadata.model,
        generation_time_ms: result.metadata.generationTime,
        tokens_used: result.metadata.tokenCount
      })
  } catch (error) {
    console.error('记录生成历史失败:', error)
    // 不抛出错误，避免影响主要功能
  }
}

async function updateTemplateUsageStats(templateId: string, renderTime: number, success: boolean) {
  try {
    // 更新模板使用统计
    await supabase
      .from('prompt_templates')
      .update({
        usage_count: supabase.sql`usage_count + 1`,
        avg_generation_time: supabase.sql`(avg_generation_time * usage_count + ${renderTime}) / (usage_count + 1)`,
        success_rate: success ? 
          supabase.sql`(success_rate * usage_count + 1.0) / (usage_count + 1)` :
          supabase.sql`(success_rate * usage_count) / (usage_count + 1)`
      })
      .eq('id', templateId)
  } catch (error) {
    console.error('更新模板统计失败:', error)
  }
}

function estimateTokenCount(text: string): number {
  // 简化的token计数估算（实际应使用tiktoken等工具）
  return Math.ceil(text.length / 3.5)
}

function classifyAndFormatError(error: any, requestId: string, startTime: number) {
  let status = 500
  let code = 'INTERNAL_ERROR'
  let message = '服务器内部错误'

  if (error instanceof z.ZodError) {
    status = 400
    code = 'VALIDATION_ERROR'
    message = '请求参数验证失败'
  } else if (error.message.includes('模板不存在')) {
    status = 404
    code = 'TEMPLATE_NOT_FOUND'
    message = error.message
  } else if (error.message.includes('权限') || error.message.includes('订阅')) {
    status = 403
    code = 'ACCESS_DENIED'
    message = error.message
  } else if (error.message.includes('限制')) {
    status = 429
    code = 'USAGE_LIMIT_EXCEEDED'
    message = error.message
  }

  return {
    status,
    body: {
      success: false,
      error: { code, message },
      meta: {
        requestId,
        responseTime: Date.now() - startTime
      }
    }
  }
}

// =================================================================
// GET请求处理（获取生成选项和配置）
// =================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    success: true,
    data: {
      supportedModes: ['template', 'ai-direct'],
      aiModels: [
        { id: 'anthropic/claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
        { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' }
      ],
      toneOptions: ['professional', 'casual', 'academic', 'creative'],
      lengthOptions: ['brief', 'detailed', 'comprehensive'],
      languageOptions: ['zh', 'en']
    }
  })
}