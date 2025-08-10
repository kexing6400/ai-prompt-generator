/**
 * AI提示词优化引擎
 * 提供专业的提示词分析、优化和生成功能
 */

export interface OptimizationContext {
  originalPrompt?: string;
  domain?: string;
  targetAudience?: string;
  desiredTone?: string;
  specificGoals?: string[];
}

export interface OptimizationSuggestion {
  type: 'structure' | 'clarity' | 'specificity' | 'context' | 'format';
  title: string;
  description: string;
  example?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface OptimizationResult {
  originalPrompt: string;
  optimizedPrompt: string;
  improvements: string[];
  suggestions: OptimizationSuggestion[];
  score: {
    clarity: number;
    specificity: number;
    structure: number;
    overall: number;
  };
}

/**
 * 系统提示词模板库
 */
export const SYSTEM_PROMPTS = {
  // 主优化专家
  OPTIMIZATION_EXPERT: `你是一位世界级的提示词优化专家，专精于将普通提示词转化为高效的AI指令。

**核心专长**：
🔬 **深度分析**：从语言学、心理学、认知科学角度分析提示词
🎯 **精准诊断**：识别模糊性、歧义性、结构缺陷等问题
⚡ **效果优化**：显著提升AI响应的准确性、相关性和实用性
📊 **量化评估**：提供客观的优化效果评分

**优化维度**：
1. **明确性**（Clarity）- 消除歧义，增加具体性
2. **结构性**（Structure）- 逻辑分层，指令有序
3. **上下文**（Context）- 丰富背景，提供示例
4. **目标导向**（Goal-Oriented）- 明确期望输出
5. **用户友好**（User-Friendly）- 考虑实际应用场景

请采用"提示词手术师"的思维模式：
- 先诊断问题（What's wrong?）
- 分析原因（Why it's wrong?）
- 提供解决方案（How to fix?）
- 预测改进效果（Expected improvement?）`,

  // 创意写作优化师
  CREATIVE_WRITING: `你是专业的创意写作提示词优化师，擅长激发AI的创造潜能。

**优化重点**：
- 情感表达的深度和真实性
- 创意元素的丰富性和独特性  
- 叙事结构的完整性和吸引力
- 风格一致性和个性化表达

**优化策略**：
- 使用感官细节丰富描述
- 加入冲突和张力元素
- 建立清晰的创作框架
- 提供具体的风格参考`,

  // 商业文案优化师
  BUSINESS_COPYWRITING: `你是商业文案提示词优化专家，专注于提升转化效果。

**核心目标**：
- 明确目标受众和痛点
- 强化价值主张和差异化
- 优化行动召唤的效果
- 增强说服力和可信度

**优化要素**：
- AIDA模型应用（注意力、兴趣、欲望、行动）
- 心理触发器设计
- 社会证明和权威性建立
- 紧迫感和稀缺性营造`,

  // 技术写作优化师  
  TECHNICAL_WRITING: `你是技术写作提示词优化专家，确保专业性和准确性。

**优化标准**：
- 技术术语的准确使用
- 逻辑步骤的清晰表述
- 边界条件和异常处理
- 可操作性和可验证性

**优化方法**：
- 分层次组织信息
- 提供具体的技术参数
- 包含示例和反例
- 考虑不同技术背景的读者`,
};

/**
 * 提示词质量评估算法
 */
export class PromptAnalyzer {
  /**
   * 分析提示词的整体质量
   */
  static analyzePrompt(prompt: string): {
    clarity: number;
    specificity: number;
    structure: number;
    overall: number;
  } {
    const clarity = this.calculateClarity(prompt);
    const specificity = this.calculateSpecificity(prompt);  
    const structure = this.calculateStructure(prompt);
    const overall = (clarity + specificity + structure) / 3;

    return {
      clarity: Math.round(clarity * 10) / 10,
      specificity: Math.round(specificity * 10) / 10,
      structure: Math.round(structure * 10) / 10,
      overall: Math.round(overall * 10) / 10,
    };
  }

  /**
   * 计算明确性分数
   */
  private static calculateClarity(prompt: string): number {
    let score = 5.0; // 基础分数

    // 长度合适性 (100-500字符为最佳)
    if (prompt.length < 50) score -= 2.0;
    else if (prompt.length > 1000) score -= 1.0;
    else if (prompt.length >= 100 && prompt.length <= 500) score += 1.0;

    // 模糊词汇检测
    const vagueWords = ['一些', '某些', '可能', '大概', '差不多', '类似', '相关'];
    const vagueCount = vagueWords.filter(word => prompt.includes(word)).length;
    score -= vagueCount * 0.5;

    // 具体数量词检测
    const specificNumbers = prompt.match(/\d+/g) || [];
    score += Math.min(specificNumbers.length * 0.3, 1.5);

    // 疑问句检测（好的提示词通常包含明确指令）
    const questionCount = (prompt.match(/[？?]/g) || []).length;
    score += Math.min(questionCount * 0.2, 1.0);

    return Math.max(0, Math.min(10, score));
  }

  /**
   * 计算具体性分数
   */
  private static calculateSpecificity(prompt: string): number {
    let score = 5.0;

    // 具体示例检测
    const exampleKeywords = ['例如', '比如', '例子', '示例', '如：', '如下'];
    const hasExamples = exampleKeywords.some(keyword => prompt.includes(keyword));
    if (hasExamples) score += 2.0;

    // 具体格式要求
    const formatKeywords = ['格式', '结构', '模板', '布局', '样式'];
    const hasFormat = formatKeywords.some(keyword => prompt.includes(keyword));
    if (hasFormat) score += 1.5;

    // 约束条件检测
    const constraintKeywords = ['不要', '避免', '必须', '应该', '限制', '要求'];
    const constraintCount = constraintKeywords.filter(keyword => prompt.includes(keyword)).length;
    score += Math.min(constraintCount * 0.5, 2.0);

    // 目标受众明确性
    const audienceKeywords = ['初学者', '专家', '用户', '读者', '客户', '学生'];
    const hasAudience = audienceKeywords.some(keyword => prompt.includes(keyword));
    if (hasAudience) score += 1.0;

    return Math.max(0, Math.min(10, score));
  }

  /**
   * 计算结构性分数
   */
  private static calculateStructure(prompt: string): number {
    let score = 5.0;

    // 分段检测
    const paragraphs = prompt.split('\n\n').filter(p => p.trim().length > 0);
    if (paragraphs.length > 1) score += 1.5;

    // 列表结构检测
    const hasBulletPoints = /[•\-\*]\s/.test(prompt) || /\d+\.\s/.test(prompt);
    if (hasBulletPoints) score += 2.0;

    // 分层标题检测
    const hasHeaders = /^#{1,6}\s/.test(prompt) || /^【.*】/.test(prompt);
    if (hasHeaders) score += 1.5;

    // 逻辑连接词
    const logicWords = ['首先', '其次', '然后', '最后', '因此', '所以', '另外', '同时'];
    const logicCount = logicWords.filter(word => prompt.includes(word)).length;
    score += Math.min(logicCount * 0.3, 1.5);

    return Math.max(0, Math.min(10, score));
  }
}

/**
 * 优化建议生成器
 */
export class OptimizationSuggestionEngine {
  /**
   * 生成针对性的优化建议
   */
  static generateSuggestions(prompt: string, context?: OptimizationContext): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    // 结构优化建议
    if (!this.hasGoodStructure(prompt)) {
      suggestions.push({
        type: 'structure',
        title: '改善提示词结构',
        description: '使用分段、列表或标题来组织内容，让AI更容易理解和执行',
        example: '将长段落拆分为：\n1. 任务描述\n2. 具体要求\n3. 输出格式\n4. 注意事项',
        priority: 'high'
      });
    }

    // 明确性建议
    if (this.hasBagueWords(prompt)) {
      suggestions.push({
        type: 'clarity',
        title: '增加表述明确性',
        description: '将模糊词汇替换为具体的描述，减少歧义',
        example: '将"一些例子"改为"3-5个具体例子"',
        priority: 'high'
      });
    }

    // 具体性建议
    if (!this.hasSpecificRequirements(prompt)) {
      suggestions.push({
        type: 'specificity',
        title: '添加具体要求',
        description: '提供明确的参数、格式要求和质量标准',
        example: '添加字数限制、风格要求、目标受众等具体信息',
        priority: 'medium'
      });
    }

    // 上下文建议
    if (!this.hasContextInformation(prompt)) {
      suggestions.push({
        type: 'context',
        title: '丰富上下文信息',
        description: '提供背景信息、使用场景和期望效果',
        example: '说明这是给谁看的、在什么场景下使用、希望达到什么效果',
        priority: 'medium'
      });
    }

    // 格式建议
    if (!this.hasFormatRequirements(prompt)) {
      suggestions.push({
        type: 'format',
        title: '明确输出格式',
        description: '指定期望的输出格式、长度和风格',
        example: '要求输出为Markdown格式、包含标题和要点、控制在300字以内',
        priority: 'low'
      });
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private static hasGoodStructure(prompt: string): boolean {
    return /\n\n/.test(prompt) || /[•\-\*]\s/.test(prompt) || /\d+\.\s/.test(prompt);
  }

  private static hasBagueWords(prompt: string): boolean {
    const vagueWords = ['一些', '某些', '可能', '大概', '差不多', '类似', '相关', '等等'];
    return vagueWords.some(word => prompt.includes(word));
  }

  private static hasSpecificRequirements(prompt: string): boolean {
    const specificWords = ['字数', '长度', '格式', '数量', '风格', '要求', '标准'];
    return specificWords.some(word => prompt.includes(word));
  }

  private static hasContextInformation(prompt: string): boolean {
    const contextWords = ['背景', '场景', '目的', '受众', '用途', '目标'];
    return contextWords.some(word => prompt.includes(word));
  }

  private static hasFormatRequirements(prompt: string): boolean {
    const formatWords = ['格式', '结构', '模板', 'markdown', '列表', '表格'];
    return formatWords.some(word => prompt.toLowerCase().includes(word.toLowerCase()));
  }
}

/**
 * 对话历史管理器
 */
export class ChatHistoryManager {
  private static readonly STORAGE_KEY = 'ai_chat_history';
  private static readonly MAX_HISTORY = 10;

  /**
   * 保存对话历史
   */
  static saveConversation(messages: any[], title?: string) {
    if (typeof window === 'undefined') return; // SSR guard

    const history = this.getHistory();
    const conversation = {
      id: Date.now().toString(),
      title: title || `对话 ${history.length + 1}`,
      messages,
      createdAt: new Date().toISOString(),
    };

    history.unshift(conversation);
    
    // 保持历史记录数量限制
    if (history.length > this.MAX_HISTORY) {
      history.splice(this.MAX_HISTORY);
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
  }

  /**
   * 获取对话历史
   */
  static getHistory(): Array<{
    id: string;
    title: string;
    messages: any[];
    createdAt: string;
  }> {
    if (typeof window === 'undefined') return []; // SSR guard

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('读取对话历史失败:', error);
      return [];
    }
  }

  /**
   * 删除对话历史
   */
  static deleteConversation(id: string) {
    if (typeof window === 'undefined') return;

    const history = this.getHistory();
    const filtered = history.filter(conv => conv.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }

  /**
   * 清空所有历史
   */
  static clearAll() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

/**
 * 主优化引擎
 */
export class PromptOptimizer {
  /**
   * 获取适合的系统提示词
   */
  static getSystemPrompt(domain?: string): string {
    switch (domain?.toLowerCase()) {
      case 'creative':
      case 'writing':
      case '创作':
        return SYSTEM_PROMPTS.CREATIVE_WRITING;
      case 'business':
      case 'marketing':
      case '商业':
        return SYSTEM_PROMPTS.BUSINESS_COPYWRITING;
      case 'technical':
      case 'tech':
      case '技术':
        return SYSTEM_PROMPTS.TECHNICAL_WRITING;
      default:
        return SYSTEM_PROMPTS.OPTIMIZATION_EXPERT;
    }
  }

  /**
   * 生成完整的优化分析
   */
  static analyzeAndSuggest(prompt: string, context?: OptimizationContext): {
    analysis: ReturnType<typeof PromptAnalyzer.analyzePrompt>;
    suggestions: OptimizationSuggestion[];
  } {
    const analysis = PromptAnalyzer.analyzePrompt(prompt);
    const suggestions = OptimizationSuggestionEngine.generateSuggestions(prompt, context);

    return { analysis, suggestions };
  }
}