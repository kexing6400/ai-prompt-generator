/**
 * 律师行业Prompt优化模板
 * 专门为法律专业人士优化的prompt模板
 */

const LawyerTemplate = {
  name: 'lawyer',
  displayName: '律师',
  description: '专为法律专业人士设计的prompt优化模板',
  
  /**
   * 优化prompt的主要函数
   */
  optimize: (originalText, settings = {}) => {
    let optimized = originalText.trim();
    
    // 1. 添加专业角色设定
    if (!optimized.toLowerCase().includes('律师') && 
        !optimized.toLowerCase().includes('法律专业') &&
        !optimized.toLowerCase().includes('作为')) {
      optimized = `作为一名专业律师，${optimized}`;
    }
    
    // 2. 确保包含法律依据要求
    const legalBasisKeywords = ['法律依据', '法条', '条文', '法规', '判例'];
    const hasLegalBasis = legalBasisKeywords.some(keyword => 
      optimized.toLowerCase().includes(keyword)
    );
    
    if (!hasLegalBasis) {
      optimized += '请提供相关的法律依据和具体条文。';
    }
    
    // 3. 添加风险提示要求
    const riskKeywords = ['风险', '注意事项', '法律后果', '责任'];
    const hasRiskMention = riskKeywords.some(keyword => 
      optimized.toLowerCase().includes(keyword)
    );
    
    if (!hasRiskMention) {
      optimized += '同时请说明相关的法律风险和注意事项。';
    }
    
    // 4. 添加准确性要求
    if (!optimized.includes('准确') && !optimized.includes('专业')) {
      optimized += '请确保答案专业、准确，符合当前法律法规。';
    }
    
    // 5. 特定法律场景优化
    optimized = LawyerTemplate.applyScenarioOptimization(optimized);
    
    // 6. 添加免责声明（如果需要）
    if (settings.includeDisclaimer !== false) {
      optimized += '\n\n注意：本回答仅供参考，具体情况请咨询当地执业律师。';
    }
    
    return optimized;
  },
  
  /**
   * 根据不同法律场景进行优化
   */
  applyScenarioOptimization: (text) => {
    const scenarios = [
      {
        keywords: ['合同', '协议', '条款'],
        addition: '请从合同条款的完整性、可执行性、风险防范等角度分析。'
      },
      {
        keywords: ['诉讼', '起诉', '法院', '案件'],
        addition: '请分析诉讼程序、证据要求、胜诉可能性和预期结果。'
      },
      {
        keywords: ['婚姻', '离婚', '财产', '抚养'],
        addition: '请考虑婚姻法相关规定，包括财产分割、子女抚养等具体操作。'
      },
      {
        keywords: ['劳动', '工伤', '解雇', '薪资'],
        addition: '请参考劳动法和劳动合同法的相关条款，分析劳动关系和权益保护。'
      },
      {
        keywords: ['刑事', '犯罪', '量刑', '辩护'],
        addition: '请分析罪名构成要件、量刑标准、辩护策略和程序要求。'
      },
      {
        keywords: ['知识产权', '专利', '商标', '版权'],
        addition: '请从知识产权法角度分析权利归属、侵权认定和救济措施。'
      },
      {
        keywords: ['房产', '不动产', '买卖', '租赁'],
        addition: '请结合物权法、合同法等相关规定，分析房地产交易的法律要点。'
      }
    ];
    
    for (const scenario of scenarios) {
      const hasKeyword = scenario.keywords.some(keyword => 
        text.toLowerCase().includes(keyword)
      );
      
      if (hasKeyword && !text.includes(scenario.addition)) {
        text += scenario.addition;
        break; // 只应用第一个匹配的场景
      }
    }
    
    return text;
  },
  
  /**
   * 获取常用的法律prompt模板
   */
  getTemplates: () => {
    return [
      {
        name: '合同审查',
        template: '请帮我审查这份合同，分析其中可能存在的法律风险和需要注意的条款，并提出修改建议。'
      },
      {
        name: '法律咨询',
        template: '我遇到了法律问题，请从专业律师的角度为我分析情况并提供解决方案。'
      },
      {
        name: '案例分析',
        template: '请分析这个案例，包括争议焦点、适用法条、可能的判决结果和类似案例。'
      },
      {
        name: '法律文书',
        template: '请帮我起草相关法律文书，确保格式规范、内容完整、逻辑清晰。'
      },
      {
        name: '风险评估',
        template: '请评估这种行为或决策可能面临的法律风险，并提出风险防范措施。'
      }
    ];
  },
  
  /**
   * 验证优化结果的质量
   */
  validateOptimization: (original, optimized) => {
    const checks = [
      {
        name: '包含专业角色',
        test: () => optimized.includes('律师') || optimized.includes('法律专业'),
        weight: 0.2
      },
      {
        name: '要求法律依据',
        test: () => /法律依据|法条|条文|法规/.test(optimized),
        weight: 0.3
      },
      {
        name: '提及风险',
        test: () => /风险|注意事项|法律后果/.test(optimized),
        weight: 0.2
      },
      {
        name: '专业性要求',
        test: () => /准确|专业|规范/.test(optimized),
        weight: 0.2
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
  module.exports = LawyerTemplate;
}

// 浏览器环境下的全局暴露
if (typeof window !== 'undefined') {
  window.LawyerTemplate = LawyerTemplate;
}