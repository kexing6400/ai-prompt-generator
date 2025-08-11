/**
 * 法律文书模板引擎
 * 为不同执业领域和文书类型提供专业的AI生成模板
 * 
 * 核心功能：
 * 1. 执业领域专门化模板管理
 * 2. 文书类型特定的生成指令
 * 3. 司法管辖区定制化适配
 * 4. 专业写作风格和格式标准
 * 5. 动态模板组装和优化
 */

import { LegalPracticeArea, LegalDocumentType } from './legal-ai-service';

// 法律模板配置
export interface LegalTemplate {
  id: string;
  name: string;
  practiceArea: LegalPracticeArea;
  documentType: LegalDocumentType;
  jurisdiction: string[];
  systemPrompt: string;
  structureGuide: string[];
  styleRequirements: string[];
  requiredElements: string[];
  commonPitfalls: string[];
  qualityChecks: string[];
  estimatedTokens: number;
  complexity: 'simple' | 'moderate' | 'complex';
  lastUpdated: string;
}

// 模板组装选项
export interface TemplateAssemblyOptions {
  includeBoilerplate: boolean;
  addComplianceNotes: boolean;
  includeReviewChecklist: boolean;
  customInstructions?: string;
  targetAudience?: 'legal_professional' | 'general_counsel' | 'compliance_officer';
  formality?: 'formal' | 'business_formal' | 'professional';
}

/**
 * 法律文书模板引擎实现
 */
export class LegalDocumentTemplateEngine {
  private templates: Map<string, LegalTemplate>;
  private practiceAreaTemplates: Map<LegalPracticeArea, LegalTemplate[]>;
  private documentTypeTemplates: Map<LegalDocumentType, LegalTemplate[]>;
  
  constructor() {
    this.templates = new Map();
    this.practiceAreaTemplates = new Map();
    this.documentTypeTemplates = new Map();
    
    this.initializeTemplates();
    this.buildIndexes();
  }
  
  /**
   * 获取专业法律模板
   */
  async getTemplate(
    practiceArea: LegalPracticeArea,
    documentType: LegalDocumentType,
    jurisdiction: string,
    options: TemplateAssemblyOptions = {
      includeBoilerplate: true,
      addComplianceNotes: true,
      includeReviewChecklist: true
    }
  ): Promise<LegalTemplate> {
    try {
      // 1. 查找最匹配的模板
      const matchingTemplate = await this.findBestMatchingTemplate(
        practiceArea,
        documentType,
        jurisdiction
      );
      
      if (!matchingTemplate) {
        // 如果没有找到精确匹配，创建通用模板
        return this.createGenericTemplate(practiceArea, documentType, jurisdiction);
      }
      
      // 2. 根据选项定制模板
      const customizedTemplate = await this.customizeTemplate(
        matchingTemplate,
        options,
        jurisdiction
      );
      
      return customizedTemplate;
      
    } catch (error: any) {
      console.error('[LegalTemplateEngine] 获取模板失败:', error);
      
      // 返回基础安全模板
      return this.createSafetyTemplate(practiceArea, documentType);
    }
  }
  
  /**
   * 查找最佳匹配模板
   */
  private async findBestMatchingTemplate(
    practiceArea: LegalPracticeArea,
    documentType: LegalDocumentType,
    jurisdiction: string
  ): Promise<LegalTemplate | null> {
    // 生成模板键
    const exactMatchKey = `${practiceArea}_${documentType}`;
    let bestMatch = this.templates.get(exactMatchKey);
    
    if (bestMatch) {
      // 检查司法管辖区兼容性
      if (bestMatch.jurisdiction.includes(jurisdiction) || 
          bestMatch.jurisdiction.includes('US') || 
          bestMatch.jurisdiction.length === 0) {
        return bestMatch;
      }
    }
    
    // 如果没有精确匹配，查找执业领域匹配
    const practiceAreaTemplates = this.practiceAreaTemplates.get(practiceArea) || [];
    for (const template of practiceAreaTemplates) {
      if (template.jurisdiction.includes(jurisdiction) || 
          template.jurisdiction.includes('US')) {
        return template;
      }
    }
    
    // 如果仍然没有找到，查找文书类型匹配
    const documentTypeTemplates = this.documentTypeTemplates.get(documentType) || [];
    for (const template of documentTypeTemplates) {
      if (template.jurisdiction.includes(jurisdiction) || 
          template.jurisdiction.includes('US')) {
        return template;
      }
    }
    
    return null;
  }
  
  /**
   * 定制化模板
   */
  private async customizeTemplate(
    baseTemplate: LegalTemplate,
    options: TemplateAssemblyOptions,
    jurisdiction: string
  ): Promise<LegalTemplate> {
    let systemPrompt = baseTemplate.systemPrompt;
    let structureGuide = [...baseTemplate.structureGuide];
    let requiredElements = [...baseTemplate.requiredElements];
    
    // 添加司法管辖区特定要求
    const jurisdictionRequirements = this.getJurisdictionRequirements(
      jurisdiction,
      baseTemplate.documentType
    );
    if (jurisdictionRequirements) {
      systemPrompt += `\\n\\n【司法管辖区要求 - ${jurisdiction}】\\n${jurisdictionRequirements}`;
    }
    
    // 根据目标受众调整
    if (options.targetAudience) {
      const audienceInstructions = this.getAudienceInstructions(options.targetAudience);
      systemPrompt += `\\n\\n【目标受众】${audienceInstructions}`;
    }
    
    // 根据正式程度调整
    if (options.formality) {
      const formalityInstructions = this.getFormalityInstructions(options.formality);
      systemPrompt += `\\n\\n【写作风格】${formalityInstructions}`;
    }
    
    // 添加样板文字
    if (options.includeBoilerplate) {
      const boilerplate = this.getBoilerplateText(
        baseTemplate.practiceArea,
        baseTemplate.documentType
      );
      if (boilerplate) {
        structureGuide.push(`包含标准样板文字：${boilerplate}`);
      }
    }
    
    // 添加合规说明
    if (options.addComplianceNotes) {
      const complianceNotes = this.getComplianceNotes(
        baseTemplate.practiceArea,
        jurisdiction
      );
      systemPrompt += `\\n\\n【合规要求】\\n${complianceNotes}`;
    }
    
    // 添加审查清单
    if (options.includeReviewChecklist) {
      const reviewChecklist = this.getReviewChecklist(
        baseTemplate.documentType,
        baseTemplate.practiceArea
      );
      requiredElements.push(`生成后附加审查清单：${reviewChecklist.join(', ')}`);
    }
    
    // 添加自定义指令
    if (options.customInstructions) {
      systemPrompt += `\\n\\n【特别指令】\\n${options.customInstructions}`;
    }
    
    // 返回定制化模板
    return {
      ...baseTemplate,
      systemPrompt,
      structureGuide,
      requiredElements,
      additionalInstructions: this.generateAdditionalInstructions(baseTemplate, options)
    };
  }
  
  /**
   * 创建通用模板
   */
  private createGenericTemplate(
    practiceArea: LegalPracticeArea,
    documentType: LegalDocumentType,
    jurisdiction: string
  ): LegalTemplate {
    const practiceAreaName = this.getPracticeAreaDisplayName(practiceArea);
    const documentTypeName = this.getDocumentTypeDisplayName(documentType);
    
    return {
      id: `generic_${practiceArea}_${documentType}`,
      name: `通用${practiceAreaName}${documentTypeName}模板`,
      practiceArea,
      documentType,
      jurisdiction: [jurisdiction, 'US'],
      systemPrompt: this.buildGenericSystemPrompt(practiceArea, documentType, jurisdiction),
      structureGuide: this.getGenericStructureGuide(documentType),
      styleRequirements: this.getGenericStyleRequirements(),
      requiredElements: this.getGenericRequiredElements(documentType),
      commonPitfalls: this.getGenericCommonPitfalls(practiceArea),
      qualityChecks: this.getGenericQualityChecks(),
      estimatedTokens: 2000,
      complexity: 'moderate',
      lastUpdated: new Date().toISOString()
    };
  }
  
  /**
   * 创建安全模板（出错时使用）
   */
  private createSafetyTemplate(
    practiceArea: LegalPracticeArea,
    documentType: LegalDocumentType
  ): LegalTemplate {
    return {
      id: 'safety_template',
      name: '安全模式法律文书模板',
      practiceArea,
      documentType,
      jurisdiction: ['US'],
      systemPrompt: `您是一位谨慎的法律AI助手。请生成一般性的法律信息，而非具体法律建议。

【重要提醒】
- 本内容仅供一般性参考，不构成法律建议
- 请咨询具有执业资格的律师获得专业建议
- 不建立律师-客户关系
- 内容需要人工审查和验证

【写作要求】
1. 使用清晰、专业的语言
2. 避免给出具体的行动建议
3. 强调咨询专业律师的重要性
4. 包含适当的免责声明`,
      structureGuide: [
        '开头：免责声明',
        '主体：一般性法律信息',
        '结尾：建议咨询专业律师'
      ],
      styleRequirements: ['专业但谨慎', '避免具体建议'],
      requiredElements: ['免责声明', '专业律师咨询提醒'],
      commonPitfalls: ['避免提供具体法律建议'],
      qualityChecks: ['检查是否包含免责声明', '确认无具体建议'],
      estimatedTokens: 1000,
      complexity: 'simple',
      lastUpdated: new Date().toISOString()
    };
  }
  
  /**
   * 构建通用系统提示词
   */
  private buildGenericSystemPrompt(
    practiceArea: LegalPracticeArea,
    documentType: LegalDocumentType,
    jurisdiction: string
  ): string {
    const practiceAreaName = this.getPracticeAreaDisplayName(practiceArea);
    const documentTypeName = this.getDocumentTypeDisplayName(documentType);
    
    return `您是一位专精于${practiceAreaName}的资深律师，具有丰富的${documentTypeName}经验。

【执业标准】
- 严格遵守${jurisdiction}司法管辖区的法律要求
- 符合ABA Model Rules of Professional Conduct
- 确保所有内容准确、专业、合规

【文书要求】
- 类型：${documentTypeName}
- 领域：${practiceAreaName}
- 管辖：${jurisdiction}

【生成指令】
1. 使用标准法律写作格式
2. 包含必要的法律术语和引用
3. 确保逻辑清晰、结构完整
4. 添加适当的风险提醒和建议
5. 包含免责声明

【质量标准】
- 专业术语使用准确
- 法律逻辑严谨
- 格式规范标准
- 内容完整可用

【特别注意】
- 这是AI生成内容，需要人工审查
- 不构成具体的法律建议
- 建议咨询执业律师进行最终确认`;
  }
  
  /**
   * 获取司法管辖区特定要求
   */
  private getJurisdictionRequirements(
    jurisdiction: string,
    documentType: LegalDocumentType
  ): string {
    const requirements: Record<string, Record<LegalDocumentType, string>> = {
      'CA': {
        'contract_draft': '符合加州合同法要求，注意unconscionability标准',
        'privacy_policy': '遵守CCPA/CPRA隐私保护要求',
        'employment_agreement': '符合加州劳动法，注意non-compete限制'
      },
      'NY': {
        'contract_draft': '遵守纽约州合同法，注意good faith requirement',
        'real_estate_contract': '符合纽约州房地产法要求'
      },
      'TX': {
        'business_formation': '遵循德州商业组织法',
        'oil_gas_lease': '符合德州石油天然气法规'
      }
    };
    
    return requirements[jurisdiction]?.[documentType] || 
           `遵守${jurisdiction}州的相关法律法规要求`;
  }
  
  /**
   * 获取目标受众指令
   */
  private getAudienceInstructions(audience: string): string {
    const instructions = {
      'legal_professional': '面向执业律师，可使用专业法律术语，深度分析法律问题',
      'general_counsel': '面向企业法务，注重商业实用性，平衡法律风险和商业目标',
      'compliance_officer': '面向合规专员，强调监管要求，提供清晰的操作指引'
    };
    
    return instructions[audience as keyof typeof instructions] || 
           '面向一般法律从业者，使用清晰专业的语言';
  }
  
  /**
   * 获取正式程度指令
   */
  private getFormalityInstructions(formality: string): string {
    const instructions = {
      'formal': '使用最正式的法律写作风格，严格遵循传统法律文书格式',
      'business_formal': '使用商务正式风格，在专业性和可读性间取得平衡',
      'professional': '使用专业但相对简洁的风格，确保内容易于理解'
    };
    
    return instructions[formality as keyof typeof instructions] || 
           '使用专业正式的写作风格';
  }
  
  /**
   * 获取样板文字
   */
  private getBoilerplateText(
    practiceArea: LegalPracticeArea,
    documentType: LegalDocumentType
  ): string {
    const boilerplateLibrary: Record<string, Record<string, string>> = {
      'contract_law': {
        'contract_draft': '标准合同条款：不可抗力、争议解决、管辖法律',
        'settlement_agreement': '标准和解条款：保密性、不承认责任、最终性'
      },
      'corporate_law': {
        'bylaws': '标准公司章程样板：董事会权力、股东权利、会议程序',
        'board_resolution': '董事会决议格式：whereas条款、resolved条款、生效日期'
      }
    };
    
    return boilerplateLibrary[practiceArea]?.[documentType] || '';
  }
  
  /**
   * 获取合规说明
   */
  private getComplianceNotes(practiceArea: LegalPracticeArea, jurisdiction: string): string {
    return `
1. 确保符合ABA Model Rules相关要求
2. 遵守${jurisdiction}州律师协会的执业规则
3. 注意客户保密义务和利益冲突规则
4. 包含适当的免责声明
5. 标明AI生成内容需要人工审查`;
  }
  
  /**
   * 获取审查清单
   */
  private getReviewChecklist(
    documentType: LegalDocumentType,
    practiceArea: LegalPracticeArea
  ): string[] {
    const commonChecklist = [
      '法律术语使用准确性',
      '引用格式正确性',
      '逻辑结构完整性',
      '合规性审查',
      '免责声明完备性'
    ];
    
    const specificChecklists: Record<LegalDocumentType, string[]> = {
      'contract_draft': [
        ...commonChecklist,
        '合同要素完整性（当事人、标的、价格等）',
        '风险分配合理性',
        '履行条件明确性',
        '违约责任设定'
      ],
      'legal_memo': [
        ...commonChecklist,
        '法律问题识别准确',
        '适用法律分析正确',
        '结论和建议合理',
        '风险评估充分'
      ],
      'motion_brief': [
        ...commonChecklist,
        '程序性要求符合',
        '事实陈述准确',
        '法律论证有力',
        '救济请求明确'
      ]
    };
    
    return specificChecklists[documentType] || commonChecklist;
  }
  
  /**
   * 获取通用结构指南
   */
  private getGenericStructureGuide(documentType: LegalDocumentType): string[] {
    const structureGuides: Record<LegalDocumentType, string[]> = {
      'contract_draft': [
        '1. 合同标题和当事人信息',
        '2. 背景和前提条件（Recitals）',
        '3. 定义条款（Definitions）',
        '4. 主要条款和义务',
        '5. 支付条款',
        '6. 履行期限和条件',
        '7. 违约和救济',
        '8. 一般条款（管辖法律、争议解决等）',
        '9. 签名页'
      ],
      'legal_memo': [
        '1. 备忘录标题和基本信息',
        '2. 执行摘要',
        '3. 问题陈述',
        '4. 简要答案',
        '5. 事实背景',
        '6. 法律分析',
        '7. 结论和建议',
        '8. 风险评估'
      ],
      'motion_brief': [
        '1. 标题页和案件信息',
        '2. 当事人目录',
        '3. 动议性质和救济请求',
        '4. 事实陈述',
        '5. 争议问题',
        '6. 法律论证',
        '7. 结论',
        '8. 附件清单'
      ]
    };
    
    return structureGuides[documentType] || [
      '1. 文档标题和基本信息',
      '2. 主要内容',
      '3. 结论或总结',
      '4. 免责声明'
    ];
  }
  
  /**
   * 获取通用风格要求
   */
  private getGenericStyleRequirements(): string[] {
    return [
      '使用正式的法律写作语言',
      '避免口语化表达',
      '使用主动语态（适当时）',
      '确保段落逻辑清晰',
      '使用标准法律术语',
      '保持一致的引用格式',
      '避免歧义表达'
    ];
  }
  
  /**
   * 获取通用必需要素
   */
  private getGenericRequiredElements(documentType: LegalDocumentType): string[] {
    const commonElements = [
      'AI生成内容免责声明',
      '建议专业律师审查的提醒',
      '适当的法律术语使用',
      '逻辑清晰的结构'
    ];
    
    const specificElements: Record<LegalDocumentType, string[]> = {
      'contract_draft': [
        ...commonElements,
        '当事人识别信息',
        '合同标的明确描述',
        '价格或对价条款',
        '履行期限',
        '签名要求'
      ],
      'legal_memo': [
        ...commonElements,
        '法律问题陈述',
        '适用法律引用',
        '分析过程',
        '明确结论'
      ]
    };
    
    return specificElements[documentType] || commonElements;
  }
  
  /**
   * 获取通用常见陷阱
   */
  private getGenericCommonPitfalls(practiceArea: LegalPracticeArea): string[] {
    const commonPitfalls = [
      '避免提供具体的法律建议',
      '避免保证特定结果',
      '避免建立律师-客户关系',
      '避免违反保密义务'
    ];
    
    const practiceSpecificPitfalls: Record<LegalPracticeArea, string[]> = {
      'contract_law': [
        ...commonPitfalls,
        '避免模糊的合同条款',
        '注意风险分配的公平性',
        '避免不可执行的条款'
      ],
      'litigation': [
        ...commonPitfalls,
        '避免遗漏程序性要求',
        '注意诉讼时效限制',
        '避免过度承诺诉讼结果'
      ],
      'corporate_law': [
        ...commonPitfalls,
        '注意公司治理要求',
        '避免违反信义义务',
        '注意监管合规要求'
      ]
    };
    
    return practiceSpecificPitfalls[practiceArea] || commonPitfalls;
  }
  
  /**
   * 获取通用质量检查要点
   */
  private getGenericQualityChecks(): string[] {
    return [
      '检查法律术语准确性',
      '验证引用格式正确性',
      '确认逻辑结构完整',
      '检查是否包含必需免责声明',
      '验证合规性要求',
      '确认无具体法律建议',
      '检查是否需要人工审查提醒'
    ];
  }
  
  /**
   * 生成附加指令
   */
  private generateAdditionalInstructions(
    template: LegalTemplate,
    options: TemplateAssemblyOptions
  ): string {
    let instructions = '';
    
    if (template.complexity === 'complex') {
      instructions += '注意：这是一个复杂的法律文书，需要特别仔细的审查。\\n';
    }
    
    if (options.targetAudience === 'general_counsel') {
      instructions += '重点关注商业风险和实用性。\\n';
    }
    
    instructions += '请确保所有生成的内容都标明为AI生成，需要专业律师审查。';
    
    return instructions;
  }
  
  /**
   * 获取执业领域显示名称
   */
  private getPracticeAreaDisplayName(area: LegalPracticeArea): string {
    const names: Record<LegalPracticeArea, string> = {
      'corporate_law': '公司法',
      'contract_law': '合同法',
      'litigation': '诉讼',
      'real_estate': '房地产法',
      'intellectual_property': '知识产权',
      'employment_law': '劳动法',
      'criminal_defense': '刑事辩护',
      'family_law': '家庭法',
      'estate_planning': '遗产规划',
      'immigration': '移民法',
      'tax_law': '税法',
      'environmental_law': '环境法',
      'healthcare_law': '医疗法',
      'securities_law': '证券法',
      'banking_finance': '银行金融法'
    };
    
    return names[area] || '法律';
  }
  
  /**
   * 获取文书类型显示名称
   */
  private getDocumentTypeDisplayName(type: LegalDocumentType): string {
    const names: Record<LegalDocumentType, string> = {
      'contract_draft': '合同草案',
      'contract_review': '合同审查',
      'legal_memo': '法律备忘录',
      'motion_brief': '动议书',
      'discovery_request': '证据开示请求',
      'settlement_agreement': '和解协议',
      'compliance_checklist': '合规检查表',
      'client_letter': '客户函件',
      'court_filing': '法庭文件',
      'due_diligence': '尽职调查',
      'opinion_letter': '法律意见书',
      'cease_desist': '停止侵权函',
      'privacy_policy': '隐私政策',
      'terms_service': '服务条款',
      'regulatory_analysis': '监管分析'
    };
    
    return names[type] || '法律文书';
  }
  
  /**
   * 初始化模板库
   */
  private initializeTemplates(): void {
    // 合同法模板
    this.addTemplate({
      id: 'contract_law_contract_draft',
      name: '标准合同起草模板',
      practiceArea: 'contract_law',
      documentType: 'contract_draft',
      jurisdiction: ['US', 'CA', 'NY', 'TX'],
      systemPrompt: `您是一位资深合同法律师，专精于商业合同起草。

【核心职责】
- 起草清晰、可执行的合同条款
- 平衡双方权利和义务
- 识别和分配合同风险
- 确保合同条款的法律有效性

【起草标准】
1. 使用准确的法律术语
2. 避免歧义和漏洞
3. 包含必要的保护条款
4. 遵循标准合同结构
5. 考虑可执行性

【特别注意】
- 确保合同要素完整（当事人、标的、对价、期限）
- 包含适当的风险分配条款
- 添加标准的争议解决机制
- 考虑管辖法律的选择`,
      structureGuide: [
        '合同标题和当事人',
        '背景条款（Recitals）',
        '定义条款',
        '主要权利义务',
        '支付条款',
        '履行条件和期限',
        '违约和救济',
        '一般条款',
        '签名页'
      ],
      styleRequirements: [
        '使用准确的合同术语',
        '避免歧义表达',
        '保持条款间的一致性',
        '使用标准合同格式'
      ],
      requiredElements: [
        '当事人完整信息',
        '合同标的描述',
        '对价条款',
        '履行期限',
        '违约责任',
        '争议解决条款',
        '管辖法律条款',
        '签名要求'
      ],
      commonPitfalls: [
        '避免过于宽泛的条款',
        '避免不可执行的违约责任',
        '注意免责条款的限制',
        '避免违反公序良俗'
      ],
      qualityChecks: [
        '合同要素完整性',
        '条款一致性',
        '风险分配合理性',
        '可执行性评估',
        '合规性检查'
      ],
      estimatedTokens: 3000,
      complexity: 'moderate',
      lastUpdated: new Date().toISOString()
    });
    
    // 诉讼模板
    this.addTemplate({
      id: 'litigation_motion_brief',
      name: '动议书模板',
      practiceArea: 'litigation',
      documentType: 'motion_brief',
      jurisdiction: ['US'],
      systemPrompt: `您是一位经验丰富的诉讼律师，专精于法庭文书撰写。

【核心职责】
- 撰写有说服力的法律论证
- 准确陈述事实和程序背景
- 引用相关法律和先例
- 提出明确的救济请求

【写作标准】
1. 逻辑清晰，论证有力
2. 事实陈述客观准确
3. 法律引用格式正确
4. 符合法庭规则要求
5. 语言专业有力

【程序要求】
- 遵守法庭的格式要求
- 注意页数和时限限制
- 包含必要的证据支持
- 符合当地法庭规则`,
      structureGuide: [
        '标题页和案件信息',
        '当事人目录',
        '动议性质和请求',
        '程序背景',
        '事实陈述',
        '争议问题',
        '法律论证',
        '结论和救济请求'
      ],
      styleRequirements: [
        '使用有力的论证语言',
        '保持客观的事实陈述',
        '使用标准的法庭格式',
        '确保引用格式正确'
      ],
      requiredElements: [
        '案件基本信息',
        '明确的救济请求',
        '支持性事实',
        '法律依据',
        '结论',
        '律师签名'
      ],
      commonPitfalls: [
        '避免情绪化语言',
        '避免错误的事实陈述',
        '避免不相关的论证',
        '注意程序性要求'
      ],
      qualityChecks: [
        '事实陈述准确性',
        '法律论证逻辑性',
        '引用格式正确性',
        '程序规则符合性',
        '救济请求明确性'
      ],
      estimatedTokens: 3500,
      complexity: 'complex',
      lastUpdated: new Date().toISOString()
    });
    
    // 可以继续添加更多专业模板...
  }
  
  /**
   * 添加模板到库中
   */
  private addTemplate(template: LegalTemplate): void {
    this.templates.set(template.id, template);
  }
  
  /**
   * 构建索引
   */
  private buildIndexes(): void {
    for (const template of this.templates.values()) {
      // 按执业领域索引
      if (!this.practiceAreaTemplates.has(template.practiceArea)) {
        this.practiceAreaTemplates.set(template.practiceArea, []);
      }
      this.practiceAreaTemplates.get(template.practiceArea)!.push(template);
      
      // 按文书类型索引
      if (!this.documentTypeTemplates.has(template.documentType)) {
        this.documentTypeTemplates.set(template.documentType, []);
      }
      this.documentTypeTemplates.get(template.documentType)!.push(template);
    }
  }
  
  /**
   * 获取所有可用模板
   */
  async getAllTemplates(): Promise<LegalTemplate[]> {
    return Array.from(this.templates.values());
  }
  
  /**
   * 按执业领域获取模板
   */
  async getTemplatesByPracticeArea(practiceArea: LegalPracticeArea): Promise<LegalTemplate[]> {
    return this.practiceAreaTemplates.get(practiceArea) || [];
  }
  
  /**
   * 按文书类型获取模板
   */
  async getTemplatesByDocumentType(documentType: LegalDocumentType): Promise<LegalTemplate[]> {
    return this.documentTypeTemplates.get(documentType) || [];
  }
  
  /**
   * 健康检查
   */
  async isHealthy(): Promise<boolean> {
    try {
      return this.templates.size > 0;
    } catch (error) {
      return false;
    }
  }
}

export default LegalDocumentTemplateEngine;