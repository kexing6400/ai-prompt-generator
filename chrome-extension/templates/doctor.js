/**
 * 医生行业Prompt优化模板
 * 专门为医疗专业人士优化的prompt模板
 */

const DoctorTemplate = {
  name: 'doctor',
  displayName: '医生',
  description: '专为医疗专业人士设计的prompt优化模板',
  
  /**
   * 优化prompt的主要函数
   */
  optimize: (originalText, settings = {}) => {
    let optimized = originalText.trim();
    
    // 1. 添加专业角色设定
    if (!optimized.toLowerCase().includes('医生') && 
        !optimized.toLowerCase().includes('医疗专业') &&
        !optimized.toLowerCase().includes('作为')) {
      optimized = `作为一名专业医生，${optimized}`;
    }
    
    // 2. 强制添加医疗免责声明
    const hasDisclaimer = optimized.includes('仅供参考') || 
                         optimized.includes('不能替代') ||
                         optimized.includes('请就医');
    
    if (!hasDisclaimer) {
      optimized += '请注意：这仅供参考，不能替代专业医疗诊断和治疗，具体情况请及时就医。';
    }
    
    // 3. 确保包含症状和病史考虑
    const clinicalKeywords = ['症状', '病史', '检查', '诊断', '体征'];
    const hasClinicalFocus = clinicalKeywords.some(keyword => 
      optimized.includes(keyword)
    );
    
    if (!hasClinicalFocus && this.isClinicallRelated(optimized)) {
      optimized += '如果涉及诊断，请考虑相关症状、既往病史、体格检查和辅助检查结果。';
    }
    
    // 4. 添加科学性和准确性要求
    if (!optimized.includes('科学') && !optimized.includes('准确') && !optimized.includes('循证')) {
      optimized += '请提供科学、准确、基于循证医学的建议。';
    }
    
    // 5. 特定医疗场景优化
    optimized = DoctorTemplate.applyScenarioOptimization(optimized);
    
    // 6. 添加安全性考虑
    if (this.requiresSafetyWarning(optimized)) {
      optimized += '如有紧急情况，请立即就医或拨打急救电话。';
    }
    
    return optimized;
  },
  
  /**
   * 判断是否与临床相关
   */
  isClinicallRelated: (text) => {
    const clinicalTerms = [
      '疾病', '疼痛', '发热', '咳嗽', '头痛', '腹痛', '呼吸困难',
      '高血压', '糖尿病', '心脏病', '肿瘤', '癌症', '感染',
      '治疗', '药物', '手术', '康复', '预防'
    ];
    
    return clinicalTerms.some(term => text.includes(term));
  },
  
  /**
   * 判断是否需要安全警告
   */
  requiresSafetyWarning: (text) => {
    const urgentTerms = [
      '胸痛', '呼吸困难', '意识障碍', '昏迷', '出血', '外伤',
      '中毒', '过敏', '休克', '急性', '紧急', '危重'
    ];
    
    return urgentTerms.some(term => text.includes(term));
  },
  
  /**
   * 根据不同医疗场景进行优化
   */
  applyScenarioOptimization: (text) => {
    const scenarios = [
      {
        keywords: ['诊断', '鉴别诊断', '疾病'],
        addition: '请提供详细的诊断思路、鉴别诊断要点和推荐的检查项目。'
      },
      {
        keywords: ['治疗', '治疗方案', '用药'],
        addition: '请说明治疗原理、用药指征、剂量选择、注意事项和可能的副作用。'
      },
      {
        keywords: ['药物', '用药', '处方'],
        addition: '请提供用药指导，包括适应症、禁忌症、用法用量和药物相互作用。'
      },
      {
        keywords: ['手术', '术前', '术后'],
        addition: '请说明手术指征、风险评估、术前准备和术后护理要点。'
      },
      {
        keywords: ['检查', '化验', '影像'],
        addition: '请解释检查目的、正常值范围、异常结果的临床意义和后续处理。'
      },
      {
        keywords: ['预防', '保健', '健康管理'],
        addition: '请提供基于循证医学的预防策略和健康管理建议。'
      },
      {
        keywords: ['急救', '急诊', '紧急'],
        addition: '请提供紧急处理步骤、评估要点和何时需要立即就医的指征。'
      },
      {
        keywords: ['康复', '恢复', '护理'],
        addition: '请制定康复计划，包括功能评估、训练方法和预期效果。'
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
   * 获取常用的医疗prompt模板
   */
  getTemplates: () => {
    return [
      {
        name: '病例分析',
        template: '请分析这个病例，包括病史采集要点、体格检查重点、诊断思路和治疗建议。'
      },
      {
        name: '症状评估',
        template: '请评估这些症状的可能原因，建议需要完善的检查和初步处理方案。'
      },
      {
        name: '用药指导',
        template: '请提供详细的用药指导，包括适应症、用法用量、注意事项和可能的不良反应。'
      },
      {
        name: '检查解读',
        template: '请解读这些检查结果，说明临床意义、可能的诊断和后续处理建议。'
      },
      {
        name: '治疗方案',
        template: '请制定综合治疗方案，包括药物治疗、非药物治疗和生活方式指导。'
      },
      {
        name: '健康教育',
        template: '请提供健康教育内容，包括疾病认知、预防措施和自我管理方法。'
      },
      {
        name: '急救处理',
        template: '请提供紧急情况的处理步骤和注意事项，强调何时需要立即就医。'
      }
    ];
  },
  
  /**
   * 医疗专业常用分类系统
   */
  getMedicalSystems: () => {
    return [
      {
        name: 'ICD-11疾病分类',
        description: '世界卫生组织国际疾病分类第11版'
      },
      {
        name: 'SOAP病历格式',
        description: 'Subjective, Objective, Assessment, Plan'
      },
      {
        name: '循证医学等级',
        description: '证据质量分级：A级、B级、C级、D级'
      },
      {
        name: '药物分类系统',
        description: 'ATC解剖治疗化学分类系统'
      },
      {
        name: '临床诊断标准',
        description: '各专科疾病的诊断标准和指南'
      },
      {
        name: '风险评估工具',
        description: '各种疾病风险评估量表和工具'
      }
    ];
  },
  
  /**
   * 验证优化结果的质量
   */
  validateOptimization: (original, optimized) => {
    const checks = [
      {
        name: '包含医生角色',
        test: () => /医生|医疗专业|医师/.test(optimized),
        weight: 0.15
      },
      {
        name: '有免责声明',
        test: () => /仅供参考|不能替代|请就医|及时就医/.test(optimized),
        weight: 0.3
      },
      {
        name: '考虑临床要素',
        test: () => /症状|病史|检查|诊断|体征/.test(optimized),
        weight: 0.2
      },
      {
        name: '强调科学性',
        test: () => /科学|准确|循证|专业/.test(optimized),
        weight: 0.2
      },
      {
        name: '安全性考虑',
        test: () => /安全|注意|禁忌|副作用|不良反应/.test(optimized),
        weight: 0.1
      },
      {
        name: '长度适中',
        test: () => optimized.length > original.length && optimized.length < original.length * 3,
        weight: 0.05
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
      quality: score >= 0.8 ? 'excellent' : score >= 0.6 ? 'good' : 'needs_improvement'
    };
  }
};

// 导出模板（在实际使用中会通过动态导入加载）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DoctorTemplate;
}

// 浏览器环境下的全局暴露
if (typeof window !== 'undefined') {
  window.DoctorTemplate = DoctorTemplate;
}