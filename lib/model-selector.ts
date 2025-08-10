/**
 * 智能模型选择器
 * 根据用户等级、任务复杂度、成本预算智能选择最优AI模型
 * 基于OpenRouter多模型平台
 */

import { RECOMMENDED_MODELS } from './openrouter-client';

// 模型配置
export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  tier: 'basic' | 'standard' | 'premium';
  costPer1MTokens: number;
  speed: 'fast' | 'medium' | 'slow';
  quality: 1 | 2 | 3 | 4 | 5; // 1-5评分
  maxTokens: number;
  strengths: string[];
  weaknesses: string[];
}

// 完整的模型配置列表
export const MODEL_CONFIGS: ModelConfig[] = [
  // 基础层模型（免费用户）
  {
    id: 'google/gemini-pro',
    name: 'Gemini Pro',
    provider: 'google',
    tier: 'basic',
    costPer1MTokens: 0.125,
    speed: 'fast',
    quality: 3,
    maxTokens: 8192,
    strengths: ['快速响应', '成本极低', '支持中文'],
    weaknesses: ['创造力一般', '专业深度不足']
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    tier: 'basic',
    costPer1MTokens: 0.25,
    speed: 'fast',
    quality: 3,
    maxTokens: 4096,
    strengths: ['极快速度', '低成本', '逻辑清晰'],
    weaknesses: ['创意有限', '长文本处理一般']
  },
  {
    id: 'meta-llama/llama-3-8b-instruct',
    name: 'Llama 3 8B',
    provider: 'meta',
    tier: 'basic',
    costPer1MTokens: 0.05,
    speed: 'fast',
    quality: 2,
    maxTokens: 8192,
    strengths: ['成本最低', '开源模型', '速度快'],
    weaknesses: ['质量不稳定', '中文支持一般']
  },
  
  // 标准层模型（专业版用户）
  {
    id: 'anthropic/claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'anthropic',
    tier: 'standard',
    costPer1MTokens: 3,
    speed: 'medium',
    quality: 4,
    maxTokens: 4096,
    strengths: ['平衡性能', '推理能力强', '安全可靠'],
    weaknesses: ['成本较高', '速度中等']
  },
  {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    tier: 'standard',
    costPer1MTokens: 0.5,
    speed: 'fast',
    quality: 3,
    maxTokens: 4096,
    strengths: ['经典稳定', '速度快', '广泛支持'],
    weaknesses: ['创新性一般', '知识截止较早']
  },
  {
    id: 'mistral/mistral-medium',
    name: 'Mistral Medium',
    provider: 'mistral',
    tier: 'standard',
    costPer1MTokens: 2.7,
    speed: 'medium',
    quality: 4,
    maxTokens: 32768,
    strengths: ['长上下文', '欧洲模型', '多语言'],
    weaknesses: ['中文一般', '成本较高']
  },
  
  // 高级层模型（团队版用户）
  {
    id: 'openai/gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    tier: 'premium',
    costPer1MTokens: 10,
    speed: 'slow',
    quality: 5,
    maxTokens: 128000,
    strengths: ['最强能力', '长上下文', '多模态'],
    weaknesses: ['成本高', '速度慢']
  },
  {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    tier: 'premium',
    costPer1MTokens: 15,
    speed: 'slow',
    quality: 5,
    maxTokens: 4096,
    strengths: ['顶级推理', '创造力强', '安全性高'],
    weaknesses: ['成本最高', '速度慢']
  },
  {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini Pro 1.5',
    provider: 'google',
    tier: 'premium',
    costPer1MTokens: 7,
    speed: 'medium',
    quality: 5,
    maxTokens: 1000000,
    strengths: ['超长上下文', '多模态', '最新技术'],
    weaknesses: ['成本高', '可用性受限']
  }
];

// 任务复杂度评估
export interface TaskComplexity {
  level: 'simple' | 'moderate' | 'complex';
  score: number; // 0-100
  factors: {
    length: number;
    technicalTerms: number;
    requirements: number;
    creativity: number;
  };
}

// 模型选择结果
export interface ModelSelection {
  primary: ModelConfig;
  fallbacks: ModelConfig[];
  estimatedCost: number;
  reasoning: string;
}

export class ModelSelector {
  private modelConfigs: ModelConfig[];
  
  constructor() {
    this.modelConfigs = MODEL_CONFIGS;
  }
  
  /**
   * 分析提示词复杂度
   */
  analyzeComplexity(prompt: string, context?: any): TaskComplexity {
    const factors = {
      length: prompt.length,
      technicalTerms: this.countTechnicalTerms(prompt),
      requirements: this.countRequirements(prompt),
      creativity: this.assessCreativity(prompt)
    };
    
    // 计算综合分数
    const score = Math.min(100, 
      (factors.length / 10) +
      (factors.technicalTerms * 5) +
      (factors.requirements * 10) +
      (factors.creativity * 20)
    );
    
    let level: TaskComplexity['level'];
    if (score < 30) level = 'simple';
    else if (score < 70) level = 'moderate';
    else level = 'complex';
    
    return { level, score, factors };
  }
  
  /**
   * 根据用户等级和任务选择最佳模型
   */
  selectModel(
    userPlan: 'free' | 'pro' | 'team',
    complexity: TaskComplexity,
    preferences?: {
      preferredProvider?: string;
      maxCost?: number;
      minQuality?: number;
      requireFast?: boolean;
    }
  ): ModelSelection {
    // 确定可用的模型层级
    let availableTiers: ModelConfig['tier'][] = [];
    
    switch (userPlan) {
      case 'free':
        availableTiers = ['basic'];
        break;
      case 'pro':
        availableTiers = ['basic', 'standard'];
        break;
      case 'team':
        availableTiers = ['basic', 'standard', 'premium'];
        break;
    }
    
    // 筛选可用模型
    let candidates = this.modelConfigs.filter(m => 
      availableTiers.includes(m.tier)
    );
    
    // 应用用户偏好
    if (preferences) {
      if (preferences.preferredProvider) {
        const preferred = candidates.filter(m => 
          m.provider === preferences.preferredProvider
        );
        if (preferred.length > 0) candidates = preferred;
      }
      
      if (preferences.maxCost !== undefined) {
        candidates = candidates.filter(m => 
          m.costPer1MTokens <= preferences.maxCost
        );
      }
      
      if (preferences.minQuality !== undefined) {
        candidates = candidates.filter(m => 
          m.quality >= preferences.minQuality
        );
      }
      
      if (preferences.requireFast) {
        candidates = candidates.filter(m => 
          m.speed === 'fast' || m.speed === 'medium'
        );
      }
    }
    
    // 根据复杂度选择
    let primary: ModelConfig;
    
    if (complexity.level === 'simple') {
      // 简单任务：优先选择快速、低成本的模型
      primary = candidates.sort((a, b) => 
        (a.costPer1MTokens - b.costPer1MTokens) * 0.7 +
        (this.speedScore(a.speed) - this.speedScore(b.speed)) * 0.3
      )[0];
    } else if (complexity.level === 'moderate') {
      // 中等任务：平衡质量和成本
      primary = candidates.sort((a, b) => 
        (b.quality - a.quality) * 0.5 +
        (a.costPer1MTokens - b.costPer1MTokens) * 0.5
      )[0];
    } else {
      // 复杂任务：优先选择高质量模型
      primary = candidates.sort((a, b) => 
        (b.quality - a.quality) * 0.8 +
        (a.costPer1MTokens - b.costPer1MTokens) * 0.2
      )[0];
    }
    
    // 选择降级模型链
    const fallbacks = this.selectFallbacks(primary, candidates);
    
    // 估算成本（假设平均1000 tokens）
    const estimatedCost = (primary.costPer1MTokens / 1000) * 1;
    
    // 生成选择理由
    const reasoning = this.generateReasoning(
      primary, 
      complexity, 
      userPlan,
      preferences
    );
    
    return {
      primary,
      fallbacks,
      estimatedCost,
      reasoning
    };
  }
  
  /**
   * 选择降级模型
   */
  private selectFallbacks(
    primary: ModelConfig, 
    candidates: ModelConfig[]
  ): ModelConfig[] {
    return candidates
      .filter(m => 
        m.id !== primary.id &&
        m.costPer1MTokens <= primary.costPer1MTokens
      )
      .sort((a, b) => b.quality - a.quality)
      .slice(0, 2);
  }
  
  /**
   * 生成选择理由
   */
  private generateReasoning(
    model: ModelConfig,
    complexity: TaskComplexity,
    userPlan: string,
    preferences?: any
  ): string {
    const reasons = [];
    
    reasons.push(`基于您的${userPlan === 'free' ? '免费' : userPlan === 'pro' ? '专业' : '团队'}版权限`);
    reasons.push(`任务复杂度为${complexity.level === 'simple' ? '简单' : complexity.level === 'moderate' ? '中等' : '复杂'}（评分：${complexity.score}/100）`);
    reasons.push(`选择了${model.name}模型`);
    
    if (model.speed === 'fast') {
      reasons.push('该模型响应速度快');
    }
    
    if (model.costPer1MTokens < 1) {
      reasons.push('成本效益高');
    }
    
    if (model.quality >= 4) {
      reasons.push('输出质量优秀');
    }
    
    return reasons.join('，') + '。';
  }
  
  /**
   * 计算技术术语数量
   */
  private countTechnicalTerms(text: string): number {
    const technicalPatterns = [
      /API/gi, /SDK/gi, /框架/g, /算法/g, /数据库/g,
      /架构/g, /协议/g, /接口/g, /组件/g, /模块/g
    ];
    
    let count = 0;
    technicalPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) count += matches.length;
    });
    
    return count;
  }
  
  /**
   * 计算需求数量
   */
  private countRequirements(text: string): number {
    const requirementPatterns = [
      /需要/g, /必须/g, /应该/g, /要求/g, /包含/g,
      /实现/g, /支持/g, /提供/g, /确保/g, /保证/g
    ];
    
    let count = 0;
    requirementPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) count += matches.length;
    });
    
    return count;
  }
  
  /**
   * 评估创造性需求
   */
  private assessCreativity(text: string): number {
    const creativeKeywords = [
      '创意', '创新', '独特', '新颖', '原创',
      '想象', '灵感', '艺术', '设计', '构思'
    ];
    
    let score = 0;
    creativeKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 10;
    });
    
    return Math.min(100, score);
  }
  
  /**
   * 速度评分
   */
  private speedScore(speed: string): number {
    switch (speed) {
      case 'fast': return 3;
      case 'medium': return 2;
      case 'slow': return 1;
      default: return 0;
    }
  }
  
  /**
   * 获取模型统计信息
   */
  getModelStats(): {
    totalModels: number;
    byProvider: Record<string, number>;
    byTier: Record<string, number>;
    averageCost: number;
  } {
    const stats = {
      totalModels: this.modelConfigs.length,
      byProvider: {} as Record<string, number>,
      byTier: {} as Record<string, number>,
      averageCost: 0
    };
    
    let totalCost = 0;
    
    this.modelConfigs.forEach(model => {
      // 按提供商统计
      stats.byProvider[model.provider] = 
        (stats.byProvider[model.provider] || 0) + 1;
      
      // 按层级统计
      stats.byTier[model.tier] = 
        (stats.byTier[model.tier] || 0) + 1;
      
      // 累计成本
      totalCost += model.costPer1MTokens;
    });
    
    stats.averageCost = totalCost / this.modelConfigs.length;
    
    return stats;
  }
}

// 导出单例
export const modelSelector = new ModelSelector();