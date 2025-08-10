/**
 * AI提示词生成API - 生产级OpenRouter集成
 * 真实API调用，无模拟，企业级错误处理和性能优化
 */

import { NextRequest, NextResponse } from 'next/server';
import { createOpenRouterClient } from '@/lib/openrouter-client';
import { modelSelector } from '@/lib/model-selector';
import { getDefaultStore } from '@/lib/storage';
import { cookies } from 'next/headers';

// 强制动态渲染
export const dynamic = 'force-dynamic';

// ✅ OpenRouter客户端实例 - 使用环境变量
if (!process.env.OPENROUTER_API_KEY) {
  throw new Error('OPENROUTER_API_KEY环境变量未设置');
}

const openRouterClient = createOpenRouterClient({
  apiKey: process.env.OPENROUTER_API_KEY!,
  siteUrl: 'https://www.aiprompts.ink',
  siteName: 'AI Prompt Generator',
  debug: process.env.NODE_ENV === 'development'
});

const store = getDefaultStore();

// 智能缓存系统
const promptCache = new Map<string, {
  content: string;
  model: string;
  timestamp: number;
  cost: number;
}>();

// 请求去重系统（防止短时间内重复请求）
const requestDeduplicator = new Map<string, Promise<any>>();

// 缓存清理
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
      const timestamp = Date.now();
      userId = `anon_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newUser = {
        id: userId,
        email: `${userId}@anonymous.local`,
        name: '匿名用户',
        createdAt: new Date(),
        updatedAt: new Date(),
        preferences: {
          language: 'zh' as const,
          theme: 'light' as const,
          defaultModel: 'claude-3-sonnet',
          autoSave: true,
          notifications: {
            email: false,
            browser: false,
            quotaWarning: true
          }
        },
        isActive: true,
        emailVerified: false,
        subscription: {
          plan: 'free' as const,
          status: 'active' as const,
          startDate: new Date(),
          autoRenew: false,
          limits: {
            dailyRequests: 10,
            monthlyRequests: 50,
            maxTokensPerRequest: 2000,
            maxPromptsPerDay: 10,
            maxDocumentSize: 5
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
    const monthlyUsage = usage?.month === currentMonth ? usage : { requests: 0, tokens: 0 };
    
    const limit = user.subscription?.limits?.monthlyRequests || 50;
    const remaining = Math.max(0, limit - monthlyUsage.requests);
    
    if (user.subscription.plan === 'free' && monthlyUsage.requests >= limit) {
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
 * 智能提示词生成 - 使用真实OpenRouter API
 */
async function generateWithOpenRouter(
  enhancedPrompt: string,
  systemPrompt: string,
  modelSelection: any,
  userPlan: string
): Promise<any> {
  const modelsToTry = [modelSelection.primary, ...modelSelection.fallbacks];
  let lastError: Error | null = null;
  let attemptedModels: string[] = [];
  
  for (const model of modelsToTry) {
    try {
      attemptedModels.push(model.id);
      console.log(`[API] 尝试模型: ${model.name} (${model.id})`);
      
      const result = await openRouterClient.generate(enhancedPrompt, {
        model: model.id,
        systemPrompt,
        temperature: 0.7,
        maxTokens: userPlan === 'free' ? 1500 : 3000,
        topP: 0.9
      });
      
      console.log(`[API] 模型 ${model.name} 生成成功, tokens: ${result.usage?.total_tokens}, cost: ${result.cost}`);
      
      return {
        ...result,
        usedModel: model,
        attemptedModels
      };
      
    } catch (error: any) {
      lastError = error;
      console.error(`[API] 模型 ${model.name} 失败:`, error.message);
      
      // 如果是认证错误或API密钥问题，立即停止尝试其他模型
      if (error.message.includes('401') || error.message.includes('API key') || error.message.includes('authentication')) {
        throw new Error(`API认证失败: ${error.message}`);
      }
      
      // 如果是速率限制，等待后再试下一个模型
      if (error.message.includes('429')) {
        console.log('[API] 速率限制，尝试下一个模型...');
        continue;
      }
    }
  }
  
  throw lastError || new Error('所有模型都无法生成结果');
}

/**
 * POST - 生成提示词（生产级实现）
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { prompt, industry, template, formData } = body;
    
    console.log('[API] 收到生成请求:', { 
      industry, 
      template,
      timestamp: new Date().toISOString(),
      promptLength: prompt?.length
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
    const userPlan = user?.subscription?.plan || 'free';
    
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
    
    // 请求去重检查
    const cacheKey = `${industry}-${template}-${JSON.stringify(formData)}-${prompt.substring(0, 100)}`;
    const duplicateKey = `${userId}-${cacheKey}`;
    
    // 检查是否正在处理相同请求
    if (requestDeduplicator.has(duplicateKey)) {
      console.log('[API] 检测到重复请求，等待现有请求完成...');
      try {
        return await requestDeduplicator.get(duplicateKey);
      } catch (error) {
        // 如果重复请求失败，继续正常处理
        requestDeduplicator.delete(duplicateKey);
      }
    }
    
    // 创建当前请求处理器
    const requestPromise = (async () => {
      try {
        // 检查缓存
        const cached = promptCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 3600000) {
          console.log('[API] 返回缓存结果');
          
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
        
        // 智能选择模型（针对gaccode代理优化）
        const isGaccodeProxy = process.env.OPENROUTER_BASE_URL?.includes('gaccode.com');
        const modelSelection = modelSelector.selectModel(
        userPlan as 'free' | 'pro' | 'team',
        complexity,
        {
        requireFast: userPlan === 'free',
          maxCost: userPlan === 'free' ? 1 : userPlan === 'pro' ? 5 : undefined,
            preferredProvider: isGaccodeProxy ? 'anthropic' : undefined
      }
    );
        
        console.log('[API] 选择模型:', {
          primary: modelSelection.primary.name,
          fallbacks: modelSelection.fallbacks.map((m: any) => m.name),
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
        
        // ✅ 使用真实的OpenRouter API生成
        console.log('[API] 调用OpenRouter API生成...');
        const result = await generateWithOpenRouter(
          enhancedPrompt,
          systemPrompt,
          modelSelection,
          userPlan
        );
        
        // 记录使用量
        await recordApiUsage(
          userId,
          result.usedModel.id,
          result.usage?.total_tokens || 1000,
          result.cost || 0
        );
        
        // 缓存结果
        promptCache.set(cacheKey, {
          content: result.content,
          model: result.usedModel.id,
          timestamp: Date.now(),
          cost: result.cost || 0
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
            model: result.usedModel.name,
            modelId: result.usedModel.id,
            provider: result.usedModel.provider,
            quality: result.usedModel.quality,
            cost: (result.cost || 0).toFixed(6),
            usage: {
              tokens: result.usage?.total_tokens,
              promptTokens: result.usage?.prompt_tokens,
              completionTokens: result.usage?.completion_tokens,
              remaining: usageCheck.remaining - 1,
              limit: usageCheck.limit
            },
            complexity: complexity.level,
            reasoning: modelSelection.reasoning,
            attemptedModels: result.attemptedModels,
            responseTime: `${Date.now() - startTime}ms`,
            generated_at: new Date().toISOString(),
            requestId: result.id
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
        
      } finally {
        // 请求完成，移除去重标记
        requestDeduplicator.delete(duplicateKey);
      }
    })();
    
    // 设置去重标记
    requestDeduplicator.set(duplicateKey, requestPromise);
    
    return await requestPromise;
    
  } catch (error: any) {
    console.error('[API] 生成失败:', error);
    
    // 提供更详细的错误信息
    let errorMessage = error.message || '生成失败，请稍后重试';
    let errorCode = 'GENERATION_FAILED';
    let statusCode = 500;
    
    if (error.message.includes('API认证失败')) {
      errorMessage = 'API服务认证失败，请联系管理员';
      errorCode = 'AUTH_FAILED';
      statusCode = 503;
    } else if (error.message.includes('429') || error.message.includes('速率限制')) {
      errorMessage = '请求过于频繁，请稍后再试';
      errorCode = 'RATE_LIMITED';
      statusCode = 429;
    } else if (error.message.includes('timeout') || error.message.includes('超时')) {
      errorMessage = '请求超时，请重试';
      errorCode = 'TIMEOUT';
      statusCode = 408;
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      code: errorCode,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: statusCode });
  }
}

/**
 * GET - 健康检查和状态信息
 */
export async function GET() {
  try {
    // 检查OpenRouter连接
    const healthCheck = await openRouterClient.healthCheck();
    
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
        connected: healthCheck.connected,
        responseTime: healthCheck.responseTime,
        availableModels: availableModels.length,
        lastCheck: healthCheck.timestamp
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
        deduplicator: requestDeduplicator.size
      },
      
      // 支持的行业
      industries: Object.keys(industryConfigs),
      
      message: '✅ API运行正常，使用真实OpenRouter API'
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