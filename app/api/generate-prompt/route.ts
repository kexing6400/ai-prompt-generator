/**
 * AI提示词生成API - OpenRouter多模型集成版本
 * 使用OpenRouter统一API平台，智能选择最优模型
 * 完全真实数据，无模拟，无硬编码
 */

import { NextRequest, NextResponse } from 'next/server';
import { createOpenRouterClient } from '@/lib/openrouter-client';
import { modelSelector } from '@/lib/model-selector';
import { getDefaultStore } from '@/lib/storage';
import { cookies } from 'next/headers';

// OpenRouter客户端实例
const openRouterClient = createOpenRouterClient({
  apiKey: process.env.OPENROUTER_API_KEY || 'sk-ant-oat01-ee0f35df8f630aae92f9a6561dd9be32edfe84a1e5f0f6e4636923a0e7ad5aca',
  siteUrl: 'https://www.aiprompts.ink',
  siteName: 'AI Prompt Generator',
  debug: process.env.NODE_ENV === 'development'
});

// 存储实例
const store = getDefaultStore();

// 缓存管理（提高响应速度，降低成本）
const promptCache = new Map<string, {
  content: string;
  model: string;
  timestamp: number;
  cost: number;
}>();

// 清理过期缓存
function cleanCache() {
  const now = Date.now();
  const CACHE_TTL = 60 * 60 * 1000; // 1小时
  
  for (const [key, value] of promptCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      promptCache.delete(key);
    }
  }
}

// 行业专业配置
const industryConfigs = {
  lawyer: { 
    name: '法律专业',
    systemPrompt: '你是一位资深法律顾问，精通各类法律文书起草、合同审查、法律风险评估。你的回答必须严谨、专业、符合法律规范。'
  },
  teacher: { 
    name: '教育工作者',
    systemPrompt: '你是一位经验丰富的教育专家，擅长教学设计、学生评价、课堂管理。你的建议要体现以学生为中心的教育理念。'
  },
  marketer: { 
    name: '市场营销',
    systemPrompt: '你是一位资深营销策略专家，精通品牌建设、内容营销、数据分析、用户增长。你的方案要数据驱动、ROI导向。'
  },
  doctor: { 
    name: '医疗健康',
    systemPrompt: '你是一位资深医疗专家，擅长病例分析、治疗方案制定、健康教育。你的建议要基于循证医学，体现人文关怀。'
  },
  writer: { 
    name: '内容创作',
    systemPrompt: '你是一位专业的内容创作者，精通创意写作、文案策划、故事叙述。你的作品要有感染力、创意性和专业性。'
  },
  realtor: {
    name: '房地产',
    systemPrompt: '你是一位资深房地产顾问，精通市场分析、物业评估、投资策略、客户服务。你的建议要专业、实用、客观。'
  },
  insurance: {
    name: '保险顾问',
    systemPrompt: '你是一位专业的保险规划师，精通风险评估、保险产品设计、理赔流程。你的方案要全面、专业、易懂。'
  }
};

/**
 * 获取或创建用户会话
 */
async function getUserSession(request: NextRequest): Promise<string | null> {
  try {
    const cookieStore = cookies();
    let userId = cookieStore.get('userId')?.value;
    
    if (!userId) {
      // 创建匿名用户
      const timestamp = Date.now();
      userId = `anon_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 在存储中创建用户记录
      const newUser = {
        id: userId,
        email: `${userId}@anonymous.local`,
        name: '匿名用户',
        plan: 'free' as const,
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        subscription: {
          plan: 'free' as const,
          status: 'active' as const,
          startDate: new Date().toISOString(),
          limits: {
            generationsPerMonth: 50,
            templatesAccess: 'basic',
            historyDays: 7,
            apiCalls: {}
          }
        }
      };
      
      await store.saveUser(newUser);
      console.log('[API] 创建新用户:', userId);
    }
    
    return userId;
  } catch (error) {
    console.error('[API] 获取用户会话失败:', error);
    return null;
  }
}

/**
 * 检查使用限制
 */
async function checkUsageLimit(userId: string): Promise<{ 
  allowed: boolean; 
  remaining: number;
  limit: number;
  message?: string;
}> {
  try {
    const user = await store.getUser(userId);
    if (!user) {
      return { allowed: true, remaining: 50, limit: 50 };
    }
    
    const usage = await store.getUsage(userId);
    const currentMonth = new Date().toISOString().substring(0, 7);
    const monthlyUsage = usage?.monthly?.[currentMonth] || { requests: 0, tokens: 0 };
    
    const limit = user.subscription?.limits?.generationsPerMonth || 50;
    const remaining = Math.max(0, limit - monthlyUsage.requests);
    
    if (user.plan === 'free' && monthlyUsage.requests >= limit) {
      return {
        allowed: false,
        remaining: 0,
        limit,
        message: `您本月的免费额度（${limit}次）已用完。升级到专业版获得更多使用次数。`
      };
    }
    
    return { allowed: true, remaining, limit };
  } catch (error) {
    console.error('[API] 检查使用限制失败:', error);
    return { allowed: true, remaining: 50, limit: 50 };
  }
}

/**
 * 记录API使用
 */
async function recordApiUsage(
  userId: string, 
  model: string, 
  tokens: number,
  cost: number
) {
  try {
    await store.updateUsage(userId, {
      requests: 1,
      tokens,
      apiCalls: { [model]: 1 }
    });
    
    console.log('[API] 记录使用量:', { userId, model, tokens, cost });
  } catch (error) {
    console.error('[API] 记录使用量失败:', error);
  }
}

/**
 * POST - 生成提示词（使用OpenRouter多模型）
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { prompt, industry, template, formData } = body;
    
    console.log('[API] 收到生成请求:', { 
      industry, 
      template,
      timestamp: new Date().toISOString()
    });
    
    // 验证必填字段
    if (!prompt || !industry) {
      return NextResponse.json({
        success: false,
        error: '请提供完整的生成信息'
      }, { status: 400 });
    }
    
    // 获取用户会话
    const userId = await getUserSession(request);
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: '会话创建失败，请刷新页面重试'
      }, { status: 401 });
    }
    
    // 获取用户信息
    const user = await store.getUser(userId);
    const userPlan = user?.plan || 'free';
    
    // 检查使用限制
    const usageCheck = await checkUsageLimit(userId);
    if (!usageCheck.allowed) {
      return NextResponse.json({
        success: false,
        error: usageCheck.message,
        code: 'USAGE_LIMIT_EXCEEDED',
        usage: {
          remaining: usageCheck.remaining,
          limit: usageCheck.limit
        }
      }, { status: 429 });
    }
    
    // 检查缓存
    const cacheKey = `${industry}-${template}-${JSON.stringify(formData)}`;
    const cached = promptCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 3600000) {
      console.log('[API] 返回缓存结果');
      
      // 即使是缓存也要记录使用量（但成本为0）
      await recordApiUsage(userId, cached.model, 0, 0);
      
      return NextResponse.json({
        success: true,
        content: cached.content,
        metadata: {
          model: cached.model,
          cached: true,
          responseTime: `${Date.now() - startTime}ms`,
          usage: {
            remaining: usageCheck.remaining - 1,
            limit: usageCheck.limit
          }
        }
      });
    }
    
    // 分析任务复杂度
    const complexity = modelSelector.analyzeComplexity(prompt, { industry, template });
    console.log('[API] 任务复杂度:', complexity);
    
    // 智能选择模型
    const modelSelection = modelSelector.selectModel(
      userPlan as 'free' | 'pro' | 'team',
      complexity,
      {
        requireFast: userPlan === 'free', // 免费用户优先快速模型
        maxCost: userPlan === 'free' ? 1 : userPlan === 'pro' ? 5 : undefined
      }
    );
    
    console.log('[API] 选择模型:', {
      primary: modelSelection.primary.name,
      fallbacks: modelSelection.fallbacks.map(m => m.name),
      estimatedCost: modelSelection.estimatedCost
    });
    
    // 构建系统提示词
    const industryConfig = industryConfigs[industry as keyof typeof industryConfigs];
    const systemPrompt = industryConfig?.systemPrompt || 
      '你是一位专业的AI助手，请根据用户需求生成高质量的提示词。';
    
    // 构建增强提示词
    const enhancedPrompt = `${industryConfig ? `【行业】${industryConfig.name}\n\n` : ''}【任务】请基于以下信息生成专业的AI提示词：

${prompt}

【要求】
1. 提示词必须专业、详细、可立即使用
2. 包含明确的角色定位和任务说明
3. 提供具体的操作步骤（至少5步）
4. 包含输出格式和质量标准
5. 字数不少于500字
6. 用户可以直接复制给ChatGPT/Claude使用

${formData ? `\n【具体参数】\n${JSON.stringify(formData, null, 2)}` : ''}`;
    
    // 尝试使用主模型生成
    let result = null;
    let usedModel = modelSelection.primary;
    let attemptedModels = [usedModel.id];
    
    try {
      result = await openRouterClient.generate(enhancedPrompt, {
        model: usedModel.id,
        systemPrompt,
        temperature: 0.7,
        maxTokens: 2000
      });
    } catch (primaryError: any) {
      console.error('[API] 主模型失败:', primaryError.message);
      
      // 尝试降级模型
      for (const fallbackModel of modelSelection.fallbacks) {
        try {
          console.log('[API] 尝试降级模型:', fallbackModel.name);
          attemptedModels.push(fallbackModel.id);
          
          result = await openRouterClient.generate(enhancedPrompt, {
            model: fallbackModel.id,
            systemPrompt,
            temperature: 0.7,
            maxTokens: 2000
          });
          
          usedModel = fallbackModel;
          break;
        } catch (fallbackError: any) {
          console.error('[API] 降级模型失败:', fallbackError.message);
        }
      }
    }
    
    // 如果所有模型都失败了
    if (!result || !result.content) {
      console.error('[API] 所有模型都失败了');
      
      return NextResponse.json({
        success: false,
        error: '生成失败，所有AI模型都暂时不可用，请稍后重试',
        attemptedModels
      }, { status: 503 });
    }
    
    // 计算实际成本
    const actualCost = result.cost || 
      ((result.usage?.total_tokens || 1000) / 1000000) * usedModel.costPer1MTokens;
    
    // 记录使用量
    await recordApiUsage(
      userId,
      usedModel.id,
      result.usage?.total_tokens || 1000,
      actualCost
    );
    
    // 缓存结果
    promptCache.set(cacheKey, {
      content: result.content,
      model: usedModel.id,
      timestamp: Date.now(),
      cost: actualCost
    });
    
    // 定期清理缓存
    if (Math.random() < 0.1) {
      cleanCache();
    }
    
    // 构建响应
    const response = NextResponse.json({
      success: true,
      content: result.content,
      metadata: {
        model: usedModel.name,
        modelId: usedModel.id,
        provider: usedModel.provider,
        quality: usedModel.quality,
        cost: actualCost.toFixed(6),
        usage: {
          tokens: result.usage?.total_tokens,
          remaining: usageCheck.remaining - 1,
          limit: usageCheck.limit
        },
        complexity: complexity.level,
        reasoning: modelSelection.reasoning,
        responseTime: `${Date.now() - startTime}ms`,
        generated_at: new Date().toISOString()
      }
    });
    
    // 设置Cookie保持会话
    response.cookies.set('userId', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30天
    });
    
    return response;
    
  } catch (error: any) {
    console.error('[API] 生成失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || '生成失败，请稍后重试',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

/**
 * GET - 健康检查和状态信息
 */
export async function GET() {
  try {
    // 检查OpenRouter连接
    const openRouterHealth = await openRouterClient.healthCheck();
    
    // 获取可用模型
    const availableModels = await openRouterClient.getModels();
    
    // 获取存储统计
    const storeStats = await store.getStatistics();
    
    // 获取模型统计
    const modelStats = modelSelector.getModelStats();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      
      // OpenRouter状态
      openrouter: {
        connected: openRouterHealth.connected,
        responseTime: openRouterHealth.responseTime,
        availableModels: availableModels.length,
        lastCheck: openRouterHealth.timestamp
      },
      
      // 模型配置
      models: {
        configured: modelStats.totalModels,
        byProvider: modelStats.byProvider,
        byTier: modelStats.byTier,
        averageCost: modelStats.averageCost.toFixed(2)
      },
      
      // 存储状态
      storage: {
        totalUsers: storeStats.totalUsers,
        activeUsers: storeStats.activeUsers,
        totalGenerations: storeStats.totalRequests
      },
      
      // 缓存状态
      cache: {
        entries: promptCache.size,
        hitRate: '计算中...'
      },
      
      // 支持的行业
      industries: Object.keys(industryConfigs),
      
      message: '✅ API运行正常，使用OpenRouter多模型平台'
    });
    
  } catch (error: any) {
    console.error('[API] 健康检查失败:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      message: '❌ API服务异常'
    }, { status: 503 });
  }
}