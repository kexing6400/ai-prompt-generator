/**
 * 通用Prompt优化模板
 * 适用于所有行业和场景的基础prompt优化模板
 */

const GeneralTemplate = {
  name: 'general',
  displayName: '通用',
  description: '适用于所有场景的通用prompt优化模板',
  
  /**
   * 优化prompt的主要函数
   */
  optimize: (originalText, settings = {}) => {
    let optimized = originalText.trim();
    
    // 1. 基础语法和礼貌用语优化
    optimized = GeneralTemplate.improveGrammarAndPoliteness(optimized);
    
    // 2. 确保请求明确性
    optimized = GeneralTemplate.ensureClarity(optimized);
    
    // 3. 添加结构化要求
    optimized = GeneralTemplate.addStructuralRequirements(optimized);
    
    // 4. 增强详细程度要求
    optimized = GeneralTemplate.enhanceDetailRequirements(optimized);
    
    // 5. 添加实用性要求
    optimized = GeneralTemplate.addPracticalRequirements(optimized);
    
    return optimized;
  },
  
  /**
   * 改进语法和礼貌用语
   */
  improveGrammarAndPoliteness: (text) => {
    let improved = text;
    
    // 确保以礼貌用语开始
    const politeStarters = ['请', '帮', '能否', '可以', '麻烦'];
    const hasPoliteStart = politeStarters.some(starter => 
      improved.startsWith(starter)
    );
    
    if (!hasPoliteStart) {
      improved = '请' + improved;
    }
    
    // 添加感谢用语
    if (!improved.includes('谢谢') && !improved.includes('感谢')) {
      improved += '，谢谢！';
    }
    
    // 清理多余空格
    improved = improved.replace(/\s+/g, ' ').trim();
    
    return improved;
  },
  
  /**
   * 确保请求明确性
   */
  ensureClarity: (text) => {
    let clarified = text;
    
    // 如果请求过于模糊，添加明确性要求
    const vagueIndicators = ['怎么办', '如何', '什么', '哪些'];
    const hasVagueRequest = vagueIndicators.some(indicator => 
      clarified.includes(indicator)
    );
    
    if (hasVagueRequest && !clarified.includes('具体') && !clarified.includes('详细')) {
      clarified += '请提供具体详细的回答。';
    }
    
    return clarified;
  },
  
  /**
   * 添加结构化要求
   */
  addStructuralRequirements: (text) => {
    let structured = text;
    
    // 添加结构化输出要求
    const structureKeywords = ['步骤', '分点', '列出', '分类', '条理'];
    const hasStructureRequest = structureKeywords.some(keyword => 
      structured.includes(keyword)
    );
    
    if (!hasStructureRequest && this.shouldBeStructured(structured)) {
      structured += '如果内容较多，请分点或分步骤说明，保持条理清晰。';
    }
    
    return structured;
  },
  
  /**
   * 判断是否应该结构化输出
   */
  shouldBeStructured: (text) => {
    const structuralIndicators = [
      '方法', '步骤', '流程', '过程', '要点', '因素',
      '原因', '建议', '方案', '策略', '技巧', '注意事项'
    ];
    
    return structuralIndicators.some(indicator => 
      text.includes(indicator)
    );
  },
  
  /**
   * 增强详细程度要求
   */
  enhanceDetailRequirements: (text) => {
    let detailed = text;
    
    // 如果没有明确要求详细程度，添加相关要求
    const detailKeywords = ['详细', '具体', '深入', '全面', '完整'];
    const hasDetailRequest = detailKeywords.some(keyword => 
      detailed.includes(keyword)
    );
    
    if (!hasDetailRequest) {
      detailed += '请尽可能提供全面而深入的信息。';
    }
    
    return detailed;
  },
  
  /**
   * 添加实用性要求
   */
  addPracticalRequirements: (text) => {
    let practical = text;
    
    // 添加实用性和可操作性要求
    const practicalKeywords = ['实用', '可行', '操作', '实施', '执行'];
    const hasPracticalFocus = practicalKeywords.some(keyword => 
      practical.includes(keyword)
    );
    
    if (!hasPracticalFocus && this.requiresPracticalAdvice(practical)) {
      practical += '请重点关注实用性和可操作性。';
    }
    
    // 添加示例要求
    if (!practical.includes('示例') && !practical.includes('例子') && this.benefitsFromExamples(practical)) {
      practical += '如果可能，请提供相关示例说明。';
    }
    
    return practical;
  },
  
  /**
   * 判断是否需要实用建议
   */
  requiresPracticalAdvice: (text) => {
    const practicalIndicators = [
      '怎么做', '如何实现', '方法', '技巧', '建议',
      '解决', '改善', '提高', '优化', '实施'
    ];
    
    return practicalIndicators.some(indicator => 
      text.includes(indicator)
    );
  },
  
  /**
   * 判断是否从示例中受益
   */
  benefitsFromExamples: (text) => {
    const exampleIndicators = [
      '理解', '学习', '掌握', '应用', '使用',
      '概念', '原理', '方法', '技术', '工具'
    ];
    
    return exampleIndicators.some(indicator => 
      text.includes(indicator)
    );
  },
  
  /**
   * 获取常用的通用prompt模板
   */
  getTemplates: () => {
    return [
      {
        name: '学习指导',
        template: '请详细解释这个概念/技能，包括基本原理、学习步骤、实践方法和注意事项。'
      },
      {
        name: '问题解决',
        template: '请分析这个问题，提供系统的解决方案，包括原因分析、解决步骤和预防措施。'
      },
      {
        name: '方案制定',
        template: '请制定详细的实施方案，包括目标设定、执行步骤、资源需求和风险评估。'
      },
      {
        name: '对比分析',
        template: '请全面对比分析这些选项，从多个维度评估优缺点，并给出选择建议。'
      },
      {
        name: '总结梳理',
        template: '请系统梳理和总结相关内容，突出重点，形成结构化的知识框架。'
      },
      {
        name: '创意建议',
        template: '请提供创新的想法和建议，包括具体的实施思路和可行性分析。'
      }
    ];
  },
  
  /**
   * 通用优化规则集
   */
  getOptimizationRules: () => {
    return [
      {
        name: '明确性规则',
        description: '确保请求清晰明确，避免歧义',
        keywords: ['具体', '明确', '清晰', '详细']
      },
      {
        name: '结构化规则',
        description: '要求有条理的回答结构',
        keywords: ['分点', '步骤', '条理', '结构']
      },
      {
        name: '实用性规则',
        description: '强调实用性和可操作性',
        keywords: ['实用', '可行', '操作', '实施']
      },
      {
        name: '完整性规则',
        description: '要求全面完整的信息',
        keywords: ['全面', '完整', '深入', '系统']
      },
      {
        name: '示例性规则',
        description: '请求提供具体示例',
        keywords: ['示例', '例子', '案例', '实例']
      }
    ];
  },
  
  /**
   * 验证优化结果的质量
   */
  validateOptimization: (original, optimized) => {
    const checks = [
      {
        name: '礼貌用语',
        test: () => /请|帮|能否|可以|谢谢|感谢/.test(optimized),
        weight: 0.2
      },
      {
        name: '明确性要求',
        test: () => /具体|详细|明确|清晰/.test(optimized),
        weight: 0.2
      },
      {
        name: '结构化要求',
        test: () => /分点|步骤|条理|结构/.test(optimized),
        weight: 0.2
      },
      {
        name: '实用性关注',
        test: () => /实用|可行|操作|实施/.test(optimized),
        weight: 0.2
      },
      {
        name: '完整性要求',
        test: () => /全面|完整|深入|系统/.test(optimized),
        weight: 0.1
      },
      {
        name: '长度合理',
        test: () => optimized.length > original.length && optimized.length < original.length * 2.5,
        weight: 0.1
      }
    ];
    
    let score = 0;
    const results = checks.map(check => {
      const passed = check.test();
      if (passed) score += check.weight;
      return {
        name: check.name,
        passed,
        weight: check.weight
      };
    });
    
    return {
      score: Math.round(score * 100),
      checks: results,
      quality: score >= 0.7 ? 'excellent' : score >= 0.5 ? 'good' : 'needs_improvement'
    };
  }
};

// 导出模板（在实际使用中会通过动态导入加载）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GeneralTemplate;
}

// 浏览器环境下的全局暴露
if (typeof window !== 'undefined') {
  window.GeneralTemplate = GeneralTemplate;
}