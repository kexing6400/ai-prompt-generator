/**
 * AI提示词生成API - 动态配置版本
 * 集成DynamicConfigService实现配置热更新和多模型支持
 * 作者：Claude Code (后端架构师)
 * 版本：2.0 - 动态配置集成版本
 */

import { NextResponse } from 'next/server';
import { DynamicConfigService, ModelCallConfig } from '@/lib/server/dynamic-config-service';
import { PromptTemplate } from '@/lib/server/config-manager';

// 动态配置服务实例
const configService = DynamicConfigService.getInstance();

// 增强的缓存管理
const cache = new Map<string, { 
  data: string; 
  timestamp: number; 
  source: 'ai' | 'template' | 'fallback';
  modelUsed?: string;
}>();

// 性能监控
interface ApiMetrics {
  totalCalls: number;
  successCalls: number;
  errorCalls: number;
  avgResponseTime: number;
  configSource: 'dynamic' | 'fallback' | 'cache';
  lastUpdated: number;
  modelUsageStats: Record<string, number>;
}

const metrics: ApiMetrics = {
  totalCalls: 0,
  successCalls: 0,
  errorCalls: 0,
  avgResponseTime: 0,
  configSource: 'dynamic',
  lastUpdated: Date.now(),
  modelUsageStats: {}
};

// 降级用的本地行业模板（保持向后兼容）
const fallbackIndustryTemplates = {
  lawyer: { name: '法律专业', defaultScenario: '合同审查' },
  realtor: { name: '房地产', defaultScenario: '市场分析' },
  insurance: { name: '保险顾问', defaultScenario: '风险评估' },
  teacher: { name: '教育工作者', defaultScenario: '教学设计' },
  accountant: { name: '会计师', defaultScenario: '财务分析' }
};

/**
 * 生成缓存键
 */
function getCacheKey(params: {
  industry: string;
  scenario: string;
  goal: string;
  preferredModel?: string;
}): string {
  return `${params.industry}-${params.scenario}-${params.goal}-${params.preferredModel || 'default'}`.toLowerCase();
}

/**
 * 清理过期缓存
 */
function cleanExpiredCache(): void {
  const now = Date.now();
  const CACHE_DURATION = 60 * 60 * 1000; // 1小时
  
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      cache.delete(key);
    }
  }
}

/**
 * 使用AI模型生成提示词
 */
async function generateWithAI(
  modelConfig: ModelCallConfig,
  industry: string,
  scenario: string,
  goal: string,
  requirements: string,
  template?: PromptTemplate
): Promise<{ prompt: string; source: string; modelUsed: string } | null> {
  
  try {
    const apiConfig = await configService.getApiConfig();
    
    if (!apiConfig.openrouterApiKey || !apiConfig.openrouterApiKey.startsWith('sk-or-')) {
      console.log('[API] API密钥无效，跳过AI生成');
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), modelConfig.timeout);

    // 构建系统提示
    const industryName = fallbackIndustryTemplates[industry as keyof typeof fallbackIndustryTemplates]?.name || industry;
    const systemPrompt = `你是世界顶级的${industryName}领域提示词工程专家。

你的任务是生成极其专业、详细、可立即使用的AI提示词。生成的提示词必须：
1. 包含明确的角色定位和专业背景
2. 详细的任务分解（至少5个步骤）
3. 具体的输出要求和格式
4. 相关的专业术语和行业标准
5. 至少500字以上的详细内容

${template ? `\n参考模版：\n${template.template}\n` : ''}`;

    // 构建用户请求
    const userPrompt = `请为以下需求生成专业的AI提示词：

【行业】${industry}
【场景】${scenario}
【目标】${goal}
【具体要求】${requirements || '请根据行业最佳实践提供专业建议'}

要求生成的提示词要让用户直接复制给ChatGPT/Claude使用，就能得到专业的结果。`;

    console.log(`[API] 使用AI模型生成: ${modelConfig.model.model_id}`);

    const response = await fetch(`${apiConfig.openrouterBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiConfig.openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ai-prompt-generator.vercel.app',
        'X-Title': 'AI Prompt Builder Pro'
      },
      body: JSON.stringify({
        model: modelConfig.model.model_id,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.maxTokens
      }),
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));

    if (response.ok) {
      const data = await response.json();
      const aiGeneratedPrompt = data.choices[0]?.message?.content;
      
      if (aiGeneratedPrompt) {
        // 更新模型使用统计
        metrics.modelUsageStats[modelConfig.model.model_id] = 
          (metrics.modelUsageStats[modelConfig.model.model_id] || 0) + 1;
        
        return {
          prompt: aiGeneratedPrompt,
          source: 'ai',
          modelUsed: modelConfig.model.model_id
        };
      }
    } else {
      console.error(`[API] AI API调用失败: ${response.status} ${response.statusText}`);
    }

    return null;

  } catch (error: any) {
    console.error('[API] AI生成失败:', error.message);
    return null;
  }
}

/**
 * 使用模板生成提示词
 */
function generateWithTemplate(
  template: PromptTemplate,
  goal: string,
  requirements: string
): string {
  
  const baseTemplate = template.template;
  const variables = template.variables || [];
  
  // 简单的变量替换（可以根据需要扩展）
  let enhancedTemplate = baseTemplate;
  
  // 替换常见变量
  enhancedTemplate = enhancedTemplate.replace(/\{goal\}/g, goal);
  enhancedTemplate = enhancedTemplate.replace(/\{requirements\}/g, requirements);
  
  return `${enhancedTemplate}

---
【任务目标】
${goal}

【具体要求】
${requirements}

【输出要求】
1. 结构清晰，逻辑严密
2. 专业术语准确，表述规范  
3. 建议具体可行，具有操作性
4. 根据实际情况灵活调整

请开始你的专业分析：`;
}

/**
 * 生成降级提示词
 */
function generateFallbackPrompt(
  industry: string,
  scenario: string,
  goal: string,
  requirements: string
): string {
  
  const industryInfo = fallbackIndustryTemplates[industry as keyof typeof fallbackIndustryTemplates];
  
  if (!industryInfo) {
    return `请帮我生成关于"${goal}"的专业提示词。

【行业背景】${industry}
【应用场景】${scenario}
【具体要求】${requirements}

请确保生成的提示词专业、详细，适合直接使用。`;
  }

  return `作为一名经验丰富的${industryInfo.name}专家，我将为您提供专业的${scenario}解决方案。

【专业背景】
我拥有多年${industryInfo.name}从业经验，深入了解行业规范和最佳实践。

【任务目标】
${goal}

【分析框架】
1. **现状评估** - 分析当前情况和关键因素
2. **专业分析** - 运用行业知识进行深度分析  
3. **方案设计** - 制定具体可行的解决方案
4. **风险控制** - 识别潜在风险并提供预防措施
5. **实施建议** - 提供操作性强的执行指导

【具体要求】
${requirements}

【输出标准】
- 专业术语准确，分析深入
- 方案具体可行，操作性强
- 考虑实际情况，避免纸上谈兵
- 结构清晰，易于理解和执行

请开始你的专业分析：`;
}

/**
 * 更新性能指标
 */
function updateMetrics(
  responseTime: number,
  success: boolean,
  configSource: ApiMetrics['configSource']
): void {
  metrics.totalCalls++;
  
  if (success) {
    metrics.successCalls++;
  } else {
    metrics.errorCalls++;
  }
  
  // 更新平均响应时间
  metrics.avgResponseTime = (
    (metrics.avgResponseTime * (metrics.totalCalls - 1)) + responseTime
  ) / metrics.totalCalls;
  
  metrics.configSource = configSource;
  metrics.lastUpdated = Date.now();
}

/**
 * POST - 生成提示词
 */
export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { 
      industry, 
      scenario, 
      goal, 
      requirements, 
      context, 
      locale = 'zh',
      preferredModel // 新增：支持指定模型
    } = body;

    console.log(`[API] 收到请求:`, { 
      industry, 
      scenario,
      preferredModel,
      timestamp: new Date().toISOString()
    });

    // 验证必填字段
    if (!industry || !scenario || !goal) {
      updateMetrics(Date.now() - startTime, false, 'dynamic');
      
      return NextResponse.json({
        success: false,
        error: locale === 'zh' ? '请填写完整信息' : 'Please fill in all required fields'
      }, { status: 400 });
    }

    // 检查缓存
    const cacheKey = getCacheKey({ industry, scenario, goal, preferredModel });
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 60 * 60 * 1000) { // 1小时缓存
      console.log('[API] 返回缓存结果');
      updateMetrics(Date.now() - startTime, true, 'cache');
      
      return NextResponse.json({
        success: true,
        prompt: cached.data,
        source: cached.source,
        modelUsed: cached.modelUsed,
        responseTime: `${Date.now() - startTime}ms`,
        fromCache: true
      });
    }

    const combinedRequirements = requirements || context || '';
    let generationResult: { prompt: string; source: string; modelUsed?: string } | null = null;

    try {
      // 1. 优先尝试使用AI模型生成
      console.log('[API] 获取模型配置...');
      const modelConfig = await configService.getBestModelConfig(preferredModel);
      
      // 尝试获取数据库中的提示词模板
      const template = await configService.getPromptTemplate(industry, scenario);
      
      if (template) {
        console.log(`[API] 找到匹配模板: ${template.name}`);
      }

      // 使用AI生成
      generationResult = await generateWithAI(
        modelConfig,
        industry,
        scenario,
        goal,
        combinedRequirements,
        template || undefined
      );
      
      // 2. 如果AI生成失败，尝试使用模板
      if (!generationResult && template) {
        console.log('[API] AI生成失败，使用模板生成');
        generationResult = {
          prompt: generateWithTemplate(template, goal, combinedRequirements),
          source: 'template'
        };
      }
      
      // 3. 最后的降级方案
      if (!generationResult) {
        console.log('[API] 使用降级方案生成');
        generationResult = {
          prompt: generateFallbackPrompt(industry, scenario, goal, combinedRequirements),
          source: 'fallback'
        };
      }

      // 缓存结果
      cache.set(cacheKey, {
        data: generationResult.prompt,
        timestamp: Date.now(),
        source: generationResult.source as any,
        modelUsed: generationResult.modelUsed
      });

      // 定期清理缓存
      cleanExpiredCache();

      updateMetrics(Date.now() - startTime, true, 'dynamic');

      return NextResponse.json({
        success: true,
        prompt: generationResult.prompt,
        source: generationResult.source,
        modelUsed: generationResult.modelUsed,
        responseTime: `${Date.now() - startTime}ms`,
        fromCache: false,
        notice: generationResult.source === 'fallback' ? 
          '使用降级生成。配置API密钥和模型可获得更智能的结果。' : undefined
      });

    } catch (configError) {
      console.error('[API] 动态配置获取失败，使用完全降级方案:', configError);
      
      // 完全降级方案
      const fallbackPrompt = generateFallbackPrompt(
        industry, 
        scenario, 
        goal, 
        combinedRequirements
      );

      updateMetrics(Date.now() - startTime, true, 'fallback');

      return NextResponse.json({
        success: true,
        prompt: fallbackPrompt,
        source: 'fallback',
        responseTime: `${Date.now() - startTime}ms`,
        notice: '配置服务暂时不可用，使用降级方案。'
      });
    }

  } catch (error: any) {
    console.error('[API] 处理请求失败:', error);
    updateMetrics(Date.now() - startTime, false, 'dynamic');
    
    return NextResponse.json({
      success: false,
      error: '生成失败，请稍后重试',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * GET - 健康检查和状态信息
 */
export async function GET() {
  try {
    // 获取配置状态
    const configValidation = await configService.validateConfiguration();
    const availableModels = await configService.getAvailableModels();
    const configStats = configService.getStats();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      
      // 配置状态
      configuration: {
        valid: configValidation.valid,
        errors: configValidation.errors,
        availableModels: availableModels.length,
        models: availableModels.map(m => ({
          name: m.name,
          provider: m.provider,
          model_id: m.model_id,
          enabled: m.enabled,
          is_default: m.is_default
        }))
      },
      
      // 性能指标
      metrics: {
        ...metrics,
        successRate: metrics.totalCalls > 0 ? 
          (metrics.successCalls / metrics.totalCalls * 100).toFixed(2) + '%' : '100%',
        errorRate: metrics.totalCalls > 0 ? 
          (metrics.errorCalls / metrics.totalCalls * 100).toFixed(2) + '%' : '0%'
      },
      
      // 缓存状态
      cache: {
        size: cache.size,
        configServiceStats: configStats
      },
      
      // 支持的行业
      industries: Object.keys(fallbackIndustryTemplates),
      
      message: '✅ 动态配置API运行正常'
    });
    
  } catch (error) {
    console.error('[API] 健康检查失败:', error);
    
    return NextResponse.json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      error: error.message,
      message: '⚠️ API运行在降级模式'
    }, { status: 200 });
  }
}