import { NextResponse } from 'next/server';

// OpenRouter API配置
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

// 垂直行业提示词模板
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

// 生成增强的提示词
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
    const body = await request.json();
    const { industry, scenario, prompt, context, useAI = true } = body;

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
        model: 'anthropic/claude-3-haiku', // 使用更便宜的模型
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
      const error = await response.text();
      console.error('OpenRouter API错误:', error);
      
      // 降级到本地增强
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
      usage: data.usage
    });

  } catch (error) {
    console.error('生成提示词错误:', error);
    
    // 错误时返回基础增强
    return NextResponse.json({
      success: false,
      error: '生成失败，请稍后重试',
      enhancedPrompt: '提示词生成失败，请稍后重试',
      method: 'error-fallback'
    }, { status: 500 });
  }
}

// 获取支持的行业列表
export async function GET() {
  return NextResponse.json({
    industries: Object.entries(industryTemplates).map(([key, value]) => ({
      id: key,
      name: value.name,
      systemPrompt: value.systemPrompt,
      enhanceRules: value.enhanceRules
    }))
  });
}