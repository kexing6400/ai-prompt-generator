import { NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/security/rate-limit';

// 🔐 输入验证Schema
const GeneratePromptSchema = z.object({
  industry: z.enum(['lawyer', 'realtor', 'insurance', 'teacher', 'accountant'], {
    errorMap: () => ({ message: '不支持的行业类型' })
  }),
  scenario: z.string()
    .min(5, '场景描述至少5个字符')
    .max(200, '场景描述不能超过200字符')
    .regex(/^[a-zA-Z0-9\u4e00-\u9fa5\s\-_.,!?()]*$/, '场景描述包含非法字符'),
  prompt: z.string()
    .min(10, 'Prompt至少10个字符')
    .max(1000, 'Prompt不能超过1000字符')
    .regex(/^[a-zA-Z0-9\u4e00-\u9fa5\s\-_.,!?()]*$/, 'Prompt包含非法字符'),
  context: z.string()
    .max(500, '上下文信息不能超过500字符')
    .optional(),
  useAI: z.boolean().default(true)
});

// OpenRouter API配置
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

// 🔐 API密钥验证
function validateApiKey(): boolean {
  if (!OPENROUTER_API_KEY) {
    console.error('🚨 OPENROUTER_API_KEY未配置');
    return false;
  }
  
  if (!OPENROUTER_API_KEY.startsWith('sk-or-')) {
    console.error('🚨 API密钥格式错误，应以sk-or-开头');
    return false;
  }
  
  return true;
}

// 🔐 安全的错误响应
function createErrorResponse(message: string, status: number = 500) {
  return NextResponse.json({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  }, { status });
}

// 垂直行业提示词模板 (保持原有逻辑)
const industryTemplates = {
  lawyer: {
    name: '法律专业',
    systemPrompt: '你是一位资深法律顾问，精通各类法律文书和法规。请帮助用户生成专业、准确、符合法律规范的内容。',
    enhanceRules: [
      '包含相关法律依据和条款引用',
      '使用准确的法律术语',
      '考虑潜在的法律风险',
      '提供多角度的法律分析'
    ]
  },
  realtor: {
    name: '房地产',
    systemPrompt: '你是一位经验丰富的房地产专家，了解市场动态和客户需求。请帮助用户生成专业的房地产相关内容。',
    enhanceRules: [
      '包含市场数据和趋势分析',
      '突出房产的独特卖点',
      '使用吸引人的营销语言',
      '考虑目标客户的需求'
    ]
  },
  insurance: {
    name: '保险顾问',
    systemPrompt: '你是一位专业的保险顾问，精通各类保险产品和风险评估。请帮助用户生成专业的保险相关内容。',
    enhanceRules: [
      '详细解释保障范围',
      '进行风险评估分析',
      '比较不同产品优劣',
      '使用通俗易懂的语言'
    ]
  },
  teacher: {
    name: '教育工作者',
    systemPrompt: '你是一位经验丰富的教育专家，擅长教学设计和学生评估。请帮助用户生成教育相关的专业内容。',
    enhanceRules: [
      '符合教育心理学原理',
      '考虑不同学习风格',
      '包含互动和评估方法',
      '注重知识的循序渐进'
    ]
  },
  accountant: {
    name: '会计师',
    systemPrompt: '你是一位专业的注册会计师，精通财务分析和税务规划。请帮助用户生成财务相关的专业内容。',
    enhanceRules: [
      '遵循会计准则和法规',
      '提供详细的数据分析',
      '考虑税务影响',
      '使用标准财务术语'
    ]
  }
};

function enhancePrompt(
  industry: string,
  scenario: string,
  originalPrompt: string,
  additionalContext?: string
): string {
  const template = industryTemplates[industry as keyof typeof industryTemplates];
  
  if (!template) {
    return originalPrompt;
  }

  const enhancedPrompt = `
【行业背景】${template.name}专业场景
【具体场景】${scenario}
【原始需求】${originalPrompt}
${additionalContext ? `【补充信息】${additionalContext}` : ''}

请按照以下专业要求优化和扩展这个提示词：
${template.enhanceRules.map((rule, index) => `${index + 1}. ${rule}`).join('\n')}

生成一个详细、专业、可直接使用的提示词，确保AI能够准确理解并生成高质量的回复。
`;

  return enhancedPrompt;
}

export async function POST(request: Request) {
  try {
    // 🔐 速率限制检查
    const rateLimitResult = await rateLimit(request);
    if (!rateLimitResult.success) {
      return createErrorResponse('请求过于频繁，请稍后再试', 429);
    }

    // 🔐 输入验证
    let validatedData;
    try {
      const body = await request.json();
      validatedData = GeneratePromptSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return createErrorResponse(
          `输入验证失败: ${error.errors.map(e => e.message).join(', ')}`,
          400
        );
      }
      return createErrorResponse('请求格式错误', 400);
    }

    const { industry, scenario, prompt, context, useAI } = validatedData;

    // 🔐 API密钥验证
    if (useAI && !validateApiKey()) {
      return createErrorResponse('API配置错误', 500);
    }

    // 如果不使用AI，直接返回本地增强的提示词
    if (!useAI || !OPENROUTER_API_KEY) {
      const enhancedPrompt = enhancePrompt(industry, scenario, prompt, context);
      return NextResponse.json({
        success: true,
        enhancedPrompt,
        method: 'local',
        industry: industryTemplates[industry as keyof typeof industryTemplates]?.name
      });
    }

    // 使用OpenRouter API进行AI增强
    const template = industryTemplates[industry as keyof typeof industryTemplates];
    const userMessage = enhancePrompt(industry, scenario, prompt, context);

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'AI Prompt Builder Pro'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [
          {
            role: 'system',
            content: template?.systemPrompt || '你是一个专业的AI助手，帮助用户优化他们的提示词。'
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      // 🔐 安全的错误处理 - 不泄露详细错误信息
      console.error('OpenRouter API错误:', response.status, response.statusText);
      
      const enhancedPrompt = enhancePrompt(industry, scenario, prompt, context);
      return NextResponse.json({
        success: true,
        enhancedPrompt,
        method: 'local-fallback',
        industry: template?.name
      });
    }

    const data = await response.json();
    const aiEnhancedPrompt = data.choices[0]?.message?.content || enhancePrompt(industry, scenario, prompt, context);

    return NextResponse.json({
      success: true,
      enhancedPrompt: aiEnhancedPrompt,
      method: 'ai-enhanced',
      industry: template?.name,
      usage: {
        // 🔐 过滤敏感使用统计信息
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0
      }
    });

  } catch (error) {
    // 🔐 安全的错误日志记录
    console.error('生成提示词错误:', error instanceof Error ? error.message : '未知错误');
    
    return createErrorResponse('生成失败，请稍后重试', 500);
  }
}

export async function GET() {
  return NextResponse.json({
    industries: Object.entries(industryTemplates).map(([key, value]) => ({
      id: key,
      name: value.name,
      // 🔐 不暴露完整的系统提示词
      description: `专业的${value.name}提示词生成`
    }))
  });
}