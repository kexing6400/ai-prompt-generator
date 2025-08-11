/**
 * OpenRouter模型生态研究API
 * 获取318个模型并按维度智能分类
 * 作者：Claude Code (AI专家工厂架构师)
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 模型信息接口
interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
  top_provider?: {
    name: string;
    max_completion_tokens?: number;
  };
  architecture?: {
    modality: string;
    tokenizer: string;
  };
  per_request_limits?: any;
}

// 专业维度分类
interface ModelCategories {
  free: ModelInfo[];              // 💰 完全免费
  costEffective: ModelInfo[];     // 🏆 性价比之王  
  premium: ModelInfo[];           // 💎 顶级效果
  latest: ModelInfo[];            // 🚀 最新2024
  fastest: ModelInfo[];           // ⚡ 最快响应
  longContext: ModelInfo[];       // 📄 长文档处理
  coding: ModelInfo[];            // 💻 编程专家
  creative: ModelInfo[];          // 🎨 创意写作
  reasoning: ModelInfo[];         // 🧠 逻辑推理
  multimodal: ModelInfo[];        // 👁️ 多模态
}

/**
 * GET - 获取OpenRouter完整模型生态分析
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 开始OpenRouter模型生态深度分析...');
    const startTime = Date.now();
    
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'OpenRouter API密钥未配置'
      }, { status: 500 });
    }

    // 获取完整模型列表
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'AI Prompt Generator'
      },
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API调用失败: HTTP ${response.status}`);
    }

    const data = await response.json();
    const allModels: ModelInfo[] = data.data || [];
    
    console.log(`📊 成功获取${allModels.length}个AI模型`);

    // 智能分类所有模型
    const categorizedModels = intelligentCategorization(allModels);
    
    // 生成深度统计分析
    const deepAnalysis = generateDeepAnalysis(allModels);
    
    // 推荐最佳配置
    const recommendations = generateProfessionalRecommendations(categorizedModels);

    const responseTime = Date.now() - startTime;
    console.log(`✅ 模型分析完成，用时${responseTime}ms`);

    return NextResponse.json({
      success: true,
      totalModels: allModels.length,
      categories: categorizedModels,
      analysis: deepAnalysis,
      recommendations,
      responseTime: `${responseTime}ms`,
      lastUpdated: new Date().toISOString(),
      message: `🎯 成功分析${allModels.length}个AI模型，已按10个专业维度分类`
    });

  } catch (error: any) {
    console.error('❌ OpenRouter模型分析失败:', error);
    
    return NextResponse.json({
      success: false,
      error: 'OpenRouter模型分析失败',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * 🧠 智能模型分类算法
 */
function intelligentCategorization(models: ModelInfo[]): ModelCategories {
  const categories: ModelCategories = {
    free: [],
    costEffective: [],
    premium: [],
    latest: [],
    fastest: [],
    longContext: [],
    coding: [],
    creative: [],
    reasoning: [],
    multimodal: []
  };

  models.forEach(model => {
    const promptPrice = parseFloat(model.pricing?.prompt || '0');
    const completionPrice = parseFloat(model.pricing?.completion || '0');
    const avgPrice = (promptPrice + completionPrice) / 2;
    const modelId = model.id.toLowerCase();
    const modelName = (model.name || '').toLowerCase();
    const description = (model.description || '').toLowerCase();
    
    // 💰 完全免费模型
    if (promptPrice === 0 && completionPrice === 0) {
      categories.free.push(model);
    }
    
    // 🏆 性价比之王 (价格低但效果好)
    if (avgPrice > 0 && avgPrice <= 0.002) {
      categories.costEffective.push(model);
    }
    
    // 💎 顶级效果模型 (GPT-4, Claude-3 Opus等)
    if (modelId.includes('gpt-4') || modelId.includes('claude-3-opus') || 
        modelId.includes('gemini-1.5-pro') || avgPrice >= 0.015) {
      categories.premium.push(model);
    }
    
    // 🚀 最新2024模型
    if (modelId.includes('2024') || modelName.includes('2024') || 
        modelId.includes('gemini-1.5') || modelId.includes('claude-3.5')) {
      categories.latest.push(model);
    }
    
    // ⚡ 最快响应 (Turbo, 3.5, Haiku等)
    if (modelId.includes('turbo') || modelId.includes('3.5') || 
        modelId.includes('haiku') || modelId.includes('flash')) {
      categories.fastest.push(model);
    }
    
    // 📄 长文档处理 (>32K context)
    if (model.context_length && model.context_length >= 32000) {
      categories.longContext.push(model);
    }
    
    // 💻 编程专家
    if (modelId.includes('code') || modelId.includes('deepseek') || 
        modelName.includes('code') || description.includes('programming')) {
      categories.coding.push(model);
    }
    
    // 🎨 创意写作
    if (modelId.includes('claude') || modelName.includes('creative') || 
        description.includes('creative') || description.includes('writing')) {
      categories.creative.push(model);
    }
    
    // 🧠 逻辑推理 (GPT-4, Claude Sonnet等)
    if (modelId.includes('gpt-4') || modelId.includes('sonnet') || 
        modelId.includes('reasoning') || description.includes('reasoning')) {
      categories.reasoning.push(model);
    }
    
    // 👁️ 多模态 (支持图像、音频等)
    if (model.architecture?.modality !== 'text' || 
        modelId.includes('vision') || modelName.includes('vision')) {
      categories.multimodal.push(model);
    }
  });

  // 对每个分类按价格和性能排序，限制数量
  Object.keys(categories).forEach(categoryKey => {
    const category = categoryKey as keyof ModelCategories;
    categories[category] = categories[category]
      .sort((a, b) => {
        const aPrice = (parseFloat(a.pricing?.prompt || '0') + parseFloat(a.pricing?.completion || '0')) / 2;
        const bPrice = (parseFloat(b.pricing?.prompt || '0') + parseFloat(b.pricing?.completion || '0')) / 2;
        return aPrice - bPrice; // 价格从低到高
      })
      .slice(0, 12); // 每个类别最多12个模型
  });

  return categories;
}

/**
 * 📈 深度数据分析
 */
function generateDeepAnalysis(models: ModelInfo[]) {
  const providers = new Map<string, number>();
  const priceRanges = { free: 0, low: 0, medium: 0, high: 0, premium: 0 };
  const contextLengths = new Map<string, number>();
  let totalCost = 0;
  let maxContext = 0;
  let minNonZeroCost = Infinity;

  models.forEach(model => {
    // 提供商统计
    const provider = model.top_provider?.name || 'Unknown';
    providers.set(provider, (providers.get(provider) || 0) + 1);
    
    // 价格区间分析
    const avgPrice = (parseFloat(model.pricing?.prompt || '0') + parseFloat(model.pricing?.completion || '0')) / 2;
    totalCost += avgPrice;
    
    if (avgPrice === 0) priceRanges.free++;
    else if (avgPrice <= 0.001) priceRanges.low++;
    else if (avgPrice <= 0.01) priceRanges.medium++;
    else if (avgPrice <= 0.05) priceRanges.high++;
    else priceRanges.premium++;
    
    if (avgPrice > 0 && avgPrice < minNonZeroCost) {
      minNonZeroCost = avgPrice;
    }
    
    // 上下文长度分析
    const contextStr = model.context_length ? `${Math.floor(model.context_length / 1000)}K` : '未知';
    contextLengths.set(contextStr, (contextLengths.get(contextStr) || 0) + 1);
    
    if (model.context_length > maxContext) {
      maxContext = model.context_length;
    }
  });

  return {
    overview: {
      totalModels: models.length,
      avgCostPer1KTokens: totalCost / models.length,
      cheapestModel: minNonZeroCost === Infinity ? 0 : minNonZeroCost,
      maxContextLength: maxContext,
      lastAnalyzed: new Date().toISOString()
    },
    providers: {
      total: providers.size,
      distribution: Array.from(providers.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, count]) => ({ provider: name, modelCount: count }))
    },
    pricing: {
      distribution: priceRanges,
      analysis: {
        freeModels: `${((priceRanges.free / models.length) * 100).toFixed(1)}%`,
        budgetFriendly: `${(((priceRanges.free + priceRanges.low) / models.length) * 100).toFixed(1)}%`,
        enterprise: `${(((priceRanges.high + priceRanges.premium) / models.length) * 100).toFixed(1)}%`
      }
    },
    contextLength: {
      distribution: Array.from(contextLengths.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([length, count]) => ({ length, count }))
    }
  };
}

/**
 * 🎯 专业推荐算法
 */
function generateProfessionalRecommendations(categories: ModelCategories) {
  return {
    // 为不同专业场景推荐最优模型
    scenarios: {
      startup: {
        title: "🚀 初创公司推荐",
        description: "成本控制优先，性价比最高",
        primaryModel: categories.costEffective[0],
        fallbackModel: categories.free[0],
        reasoning: "平衡成本与效果，适合MVP阶段"
      },
      enterprise: {
        title: "🏢 企业级推荐", 
        description: "效果和可靠性优先",
        primaryModel: categories.premium[0],
        fallbackModel: categories.reasoning[0],
        reasoning: "顶级效果保证业务关键任务"
      },
      developer: {
        title: "💻 开发者推荐",
        description: "代码生成和技术文档",
        primaryModel: categories.coding[0],
        fallbackModel: categories.fastest[0],
        reasoning: "专门优化编程任务"
      },
      creative: {
        title: "🎨 创意工作推荐",
        description: "内容创作和营销文案",
        primaryModel: categories.creative[0],
        fallbackModel: categories.latest[0],
        reasoning: "创意表达和文字质量优异"
      },
      analysis: {
        title: "📊 数据分析推荐",
        description: "长文档分析和推理",
        primaryModel: categories.longContext[0],
        fallbackModel: categories.reasoning[0],
        reasoning: "处理大量信息和复杂推理"
      }
    },
    
    // 按行业推荐
    industries: {
      legal: {
        title: "⚖️ 法律行业",
        models: [categories.premium[0], categories.reasoning[0], categories.longContext[0]],
        reason: "需要精确推理和长文档处理能力"
      },
      realEstate: {
        title: "🏠 房地产行业", 
        models: [categories.costEffective[0], categories.creative[0], categories.fastest[0]],
        reason: "快速响应客户需求，营销内容生成"
      },
      education: {
        title: "🎓 教育行业",
        models: [categories.creative[0], categories.reasoning[0], categories.multimodal[0]],
        reason: "多样化内容创作和教学辅助"
      },
      insurance: {
        title: "🛡️ 保险行业",
        models: [categories.reasoning[0], categories.longContext[0], categories.premium[0]],
        reason: "风险评估和政策条款分析"
      },
      finance: {
        title: "💰 金融行业",
        models: [categories.premium[0], categories.reasoning[0], categories.latest[0]],
        reason: "高精度计算和合规要求"
      }
    }
  };
}