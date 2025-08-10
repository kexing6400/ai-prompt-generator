/**
 * AI提示词生成API v4 - 支持动态配置管理
 * 集成管理后台配置，支持热更新
 * 作者：Claude Code (后端架构师)
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ConfigManager } from '@/lib/server/config-manager';

// 强制动态渲染 - 确保每次请求都重新执行
export const dynamic = 'force-dynamic';


// 请求参数验证模式
const generatePromptSchema = z.object({
  industry: z.string().min(1, '请选择行业'),
  scenario: z.string().min(1, '请输入使用场景'),
  goal: z.string().min(1, '请输入具体目标'),
  requirements: z.string().optional(),
  context: z.string().optional(),
  locale: z.enum(['zh', 'en']).optional().default('zh')
});

// 动态缓存实现
class DynamicCache {
  private cache = new Map<string, { data: string; timestamp: number }>();
  private configManager = ConfigManager.getInstance();

  async getCacheTTL(): Promise<number> {
    const ttl = await this.configManager.getConfig('cache_ttl');
    return parseInt(ttl) || (60 * 60 * 1000); // 默认1小时
  }

  async get(key: string): Promise<string | null> {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const ttl = await this.getCacheTTL();
    if (Date.now() - cached.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key: string, data: string): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  generateKey(params: any): string {
    return `${params.industry}-${params.scenario}-${params.goal}`.toLowerCase();
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

const dynamicCache = new DynamicCache();

/**
 * 从数据库获取行业模版
 */
async function getIndustryTemplates(industry: string, scenario: string) {
  const configManager = ConfigManager.getInstance();
  const templates = await configManager.getPromptTemplates(industry);
  
  // 查找最匹配的模版
  const matchedTemplate = templates.find(template => 
    template.scenario.toLowerCase().includes(scenario.toLowerCase()) ||
    scenario.toLowerCase().includes(template.scenario.toLowerCase())
  ) || templates[0]; // 如果没有匹配的，使用第一个

  return matchedTemplate;
}

/**
 * 生成增强的提示词
 */
function generateEnhancedPrompt(
  template: any,
  industry: string,
  scenario: string,
  goal: string,
  requirements: string = ''
): string {
  if (!template) {
    return `请帮我生成关于"${goal}"的专业${industry}提示词。要求：${requirements}`;
  }

  const enhancedPrompt = `${template.template}

---
【任务目标】
${goal}

【具体场景】
${scenario}

【特殊要求】
${requirements || '按照标准流程进行'}

【输出要求】
1. 结构清晰，逻辑严密
2. 专业术语准确，表述规范
3. 建议具体可行，具有操作性
4. 根据实际情况灵活调整

请开始你的专业分析：`;

  return enhancedPrompt;
}

/**
 * 调用AI生成服务
 */
async function callAIService(prompt: string, userPrompt: string): Promise<string | null> {
  const configManager = ConfigManager.getInstance();
  
  try {
    // 获取动态配置
    const [apiKey, baseUrl, timeout, model, temperature, maxTokens] = await Promise.all([
      configManager.getConfig('openrouter_api_key'),
      configManager.getConfig('openrouter_base_url'),
      configManager.getConfig('api_timeout'),
      configManager.getConfig('default_model'),
      configManager.getConfig('default_temperature'),
      configManager.getConfig('default_max_tokens')
    ]);

    // 检查API密钥
    if (!apiKey || !apiKey.startsWith('sk-or-')) {
      console.warn('[AI服务] API密钥未配置或格式错误');
      return null;
    }

    const controller = new AbortController();
    const timeoutMs = parseInt(timeout) || 15000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    console.log(`[AI服务] 调用模型: ${model}, 温度: ${temperature}, 最大token: ${maxTokens}`);

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ai-prompt-generator.vercel.app',
        'X-Title': 'AI Prompt Generator'
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: prompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: parseFloat(temperature) || 0.7,
        max_tokens: parseInt(maxTokens) || 2000
      }),
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AI服务] API调用失败: ${response.status} ${response.statusText}`, errorText);
      return null;
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;
    
    if (!aiResponse) {
      console.error('[AI服务] AI响应为空');
      return null;
    }

    return aiResponse;

  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('[AI服务] 请求超时');
    } else {
      console.error('[AI服务] 调用失败:', error.message);
    }
    return null;
  }
}

/**
 * POST - 生成提示词
 */
export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    // 解析和验证请求参数
    const body = await request.json();
    const { industry, scenario, goal, requirements, context, locale } = generatePromptSchema.parse(body);

    console.log(`[API v4] 收到请求:`, { 
      industry, 
      scenario,
      timestamp: new Date().toISOString()
    });

    // 检查缓存
    const cacheKey = dynamicCache.generateKey({ industry, scenario, goal });
    const cached = await dynamicCache.get(cacheKey);
    
    if (cached) {
      console.log('[API v4] 返回缓存结果');
      return NextResponse.json({
        success: true,
        prompt: cached,
        source: 'cache',
        version: 'v4',
        responseTime: `${Date.now() - startTime}ms`
      });
    }

    // 获取模版
    const template = await getIndustryTemplates(industry, scenario);
    
    // 生成系统提示词
    const systemPrompt = `你是世界顶级的${industry}领域提示词工程专家。

你的任务是生成极其专业、详细、可立即使用的AI提示词。生成的提示词必须：
1. 包含明确的角色定位和专业背景
2. 详细的任务分解（至少5个步骤）
3. 具体的输出要求和格式
4. 相关的专业术语和行业标准
5. 至少500字以上的详细内容`;

    const userPrompt = `请为以下需求生成专业的AI提示词：

【行业】${industry}
【场景】${scenario}
【目标】${goal}
【具体要求】${requirements || context || '无'}

要求生成的提示词要让用户直接复制给ChatGPT/Claude使用，就能得到专业的结果。`;

    // 尝试AI生成
    let finalPrompt = await callAIService(systemPrompt, userPrompt);
    let source = 'ai';

    // 如果AI生成失败，使用增强模版
    if (!finalPrompt) {
      console.log('[API v4] AI生成失败，使用增强模版');
      finalPrompt = generateEnhancedPrompt(template, industry, scenario, goal, requirements || context || '');
      source = 'enhanced-template';
    }

    // 缓存结果
    dynamicCache.set(cacheKey, finalPrompt);

    // 获取默认模型信息用于响应
    const configManager = ConfigManager.getInstance();
    const defaultModel = await configManager.getConfig('default_model');

    return NextResponse.json({
      success: true,
      prompt: finalPrompt,
      source,
      version: 'v4',
      model: source === 'ai' ? defaultModel : 'template-enhanced',
      templateUsed: template ? {
        name: template.name,
        industry: template.industry,
        scenario: template.scenario
      } : null,
      responseTime: `${Date.now() - startTime}ms`,
      cacheStats: dynamicCache.getStats()
    });

  } catch (error: any) {
    console.error('[API v4] 处理请求失败:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: '请求参数无效',
        details: error.issues,
        version: 'v4',
        responseTime: `${Date.now() - startTime}ms`
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: '生成失败，请稍后重试',
      details: error.message,
      version: 'v4',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 500 });
  }
}

/**
 * GET - 健康检查和状态
 */
export async function GET() {
  const configManager = ConfigManager.getInstance();
  
  try {
    // 获取关键配置状态
    const [apiKey, baseUrl, defaultModel] = await Promise.all([
      configManager.getConfig('openrouter_api_key'),
      configManager.getConfig('openrouter_base_url'),
      configManager.getConfig('default_model')
    ]);

    const hasValidApiKey = apiKey && apiKey.startsWith('sk-or-');

    return NextResponse.json({
      status: 'healthy',
      version: 'v4',
      timestamp: new Date().toISOString(),
      configuration: {
        hasApiKey: hasValidApiKey,
        baseUrl: baseUrl || 'not-configured',
        defaultModel: defaultModel || 'not-configured'
      },
      cache: dynamicCache.getStats(),
      configCache: configManager.getCacheStats(),
      features: [
        'dynamic-configuration',
        'hot-reload',
        'template-management',
        'enhanced-caching',
        'ai-fallback'
      ],
      message: '✅ API v4 运行正常 - 支持动态配置管理'
    });
    
  } catch (error: any) {
    return NextResponse.json({
      status: 'degraded',
      version: 'v4',
      timestamp: new Date().toISOString(),
      error: error.message,
      message: '⚠️ API v4 运行异常 - 配置可能有问题'
    }, { status: 500 });
  }
}