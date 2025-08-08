/**
 * 产品经理行业Prompt优化模板
 * 专门为产品管理专业人士优化的prompt模板
 */

const PMTemplate = {
  name: 'pm',
  displayName: '产品经理',
  description: '专为产品管理专业人士设计的prompt优化模板',
  
  /**
   * 优化prompt的主要函数
   */
  optimize: (originalText, settings = {}) => {
    let optimized = originalText.trim();
    
    // 1. 添加专业角色设定
    if (!optimized.toLowerCase().includes('产品经理') && 
        !optimized.toLowerCase().includes('产品管理') &&
        !optimized.toLowerCase().includes('作为')) {
      optimized = `作为一名资深产品经理，${optimized}`;
    }
    
    // 2. 确保考虑用户维度
    const userKeywords = ['用户', '用户体验', 'UX', '用户场景', '用户需求'];
    const hasUserFocus = userKeywords.some(keyword => 
      optimized.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (!hasUserFocus) {
      optimized += '请从用户体验和用户价值的角度进行分析。';
    }
    
    // 3. 添加数据驱动要求
    const dataKeywords = ['数据', '指标', 'KPI', 'ROI', '转化率', 'DAU', 'MAU'];
    const hasDataMention = dataKeywords.some(keyword => 
      optimized.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (!hasDataMention) {
      optimized += '如果可能，请提供相关的数据指标和量化分析方法。';
    }
    
    // 4. 确保包含多维度分析
    const dimensionKeywords = ['商业价值', '技术可行性', '市场竞争', '成本效益'];
    const hasDimensionAnalysis = dimensionKeywords.some(keyword => 
      optimized.includes(keyword)
    );
    
    if (!hasDimensionAnalysis) {
      optimized += '请从产品策略、商业价值、技术可行性等多个维度进行综合分析。';
    }
    
    // 5. 特定产品场景优化
    optimized = PMTemplate.applyScenarioOptimization(optimized);
    
    // 6. 添加结构化输出要求
    if (!optimized.includes('分点') && !optimized.includes('条理') && !optimized.includes('结构')) {
      optimized += '请以结构化的方式组织回答，便于理解和执行。';
    }
    
    return optimized;
  },
  
  /**
   * 根据不同产品场景进行优化
   */
  applyScenarioOptimization: (text) => {
    const scenarios = [
      {
        keywords: ['需求分析', 'PRD', '产品需求'],
        addition: '请包含用户故事、验收标准、优先级评估和风险评估。'
      },
      {
        keywords: ['竞品分析', '竞争对手', '市场分析'],
        addition: '请从功能对比、商业模式、用户定位、市场策略等角度进行深入分析。'
      },
      {
        keywords: ['用户研究', '用户调研', '用户画像'],
        addition: '请提供用户画像、使用场景、痛点分析和解决方案建议。'
      },
      {
        keywords: ['产品规划', '路线图', 'Roadmap'],
        addition: '请考虑时间节点、资源分配、依赖关系和里程碑设定。'
      },
      {
        keywords: ['功能设计', 'UI', 'UX', '交互设计'],
        addition: '请从用户体验、技术实现、维护成本等角度评估设计方案。'
      },
      {
        keywords: ['数据分析', '用户行为', '漏斗分析'],
        addition: '请提供数据收集方案、分析维度、关键指标和优化建议。'
      },
      {
        keywords: ['增长策略', '用户增长', '获客'],
        addition: '请分析增长渠道、获客成本、留存策略和病毒传播机制。'
      },
      {
        keywords: ['商业模式', '变现', '盈利模式'],
        addition: '请分析收入来源、成本结构、盈利能力和可持续性。'
      }
    ];
    
    for (const scenario of scenarios) {
      const hasKeyword = scenario.keywords.some(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (hasKeyword && !text.includes(scenario.addition)) {
        text += scenario.addition;
        break; // 只应用第一个匹配的场景
      }
    }
    
    return text;
  },
  
  /**
   * 获取常用的产品经理prompt模板
   */
  getTemplates: () => {
    return [
      {
        name: 'PRD撰写',
        template: '请帮我撰写产品需求文档（PRD），包括背景、目标、功能描述、验收标准等完整内容。'
      },
      {
        name: '竞品分析',
        template: '请深入分析这些竞品，从功能、用户体验、商业模式、市场定位等维度进行对比。'
      },
      {
        name: '用户研究',
        template: '请帮我设计用户研究方案，包括研究目标、方法选择、问题设计和结果分析框架。'
      },
      {
        name: '数据分析',
        template: '请分析这些产品数据，识别关键趋势和问题，并提出数据驱动的改进建议。'
      },
      {
        name: '功能设计',
        template: '请设计这个功能的完整方案，包括用户场景、交互流程、技术实现和效果预期。'
      },
      {
        name: '增长策略',
        template: '请制定用户增长策略，包括获客渠道、留存机制、激活策略和增长指标。'
      },
      {
        name: '产品规划',
        template: '请制定产品发展规划，包括阶段目标、功能路线图、资源需求和时间安排。'
      }
    ];
  },
  
  /**
   * 产品经理常用框架和方法
   */
  getFrameworks: () => {
    return [
      {
        name: 'RICE优先级模型',
        description: 'Reach, Impact, Confidence, Effort - 功能优先级评估'
      },
      {
        name: 'KANO模型',
        description: '基础型需求、期望型需求、兴奋型需求分析'
      },
      {
        name: 'AARRR海盗模型',
        description: 'Acquisition, Activation, Retention, Revenue, Referral'
      },
      {
        name: 'Jobs-to-be-Done',
        description: '用户雇佣产品完成的任务分析框架'
      },
      {
        name: 'OKR目标管理',
        description: 'Objectives and Key Results - 目标与关键结果'
      },
      {
        name: 'MVP最小可行产品',
        description: '最小功能集合的产品验证方法'
      }
    ];
  },
  
  /**
   * 验证优化结果的质量
   */
  validateOptimization: (original, optimized) => {
    const checks = [
      {
        name: '包含产品角色',
        test: () => /产品经理|产品管理|PM/.test(optimized),
        weight: 0.15
      },
      {
        name: '用户导向',
        test: () => /用户|用户体验|UX|用户价值/.test(optimized),
        weight: 0.25
      },
      {
        name: '数据驱动',
        test: () => /数据|指标|KPI|量化|分析/.test(optimized),
        weight: 0.2
      },
      {
        name: '多维度分析',
        test: () => /商业|技术|市场|策略/.test(optimized),
        weight: 0.2
      },
      {
        name: '结构化要求',
        test: () => /结构|分点|条理|框架/.test(optimized),
        weight: 0.1
      },
      {
        name: '长度适中',
        test: () => optimized.length > original.length && optimized.length < original.length * 3,
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
  module.exports = PMTemplate;
}

// 浏览器环境下的全局暴露
if (typeof window !== 'undefined') {
  window.PMTemplate = PMTemplate;
}