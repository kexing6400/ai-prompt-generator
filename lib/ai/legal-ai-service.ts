/**
 * 律师AI工作台核心服务
 * 专业法律AI工作流引擎 - 符合ABA标准和律师职业道德要求
 * 
 * 核心功能：
 * 1. 法律专业AI生成和质量控制
 * 2. 客户数据零保留策略
 * 3. 法律合规性验证
 * 4. 专业术语准确性检查
 * 5. 可审计的生成追踪
 */

import { OpenRouterClient } from '@/lib/openrouter-client';
import { LegalTermValidator } from './legal-term-validator';
import { LegalComplianceChecker } from './legal-compliance-checker';
import { LegalDocumentTemplateEngine } from './legal-document-template-engine';
import { LegalQualityScorer } from './legal-quality-scorer';
import { ClientDataProtectionManager } from './client-data-protection-manager';

// 法律AI生成选项
export interface LegalAIOptions {
  practiceArea: LegalPracticeArea;
  documentType: LegalDocumentType;
  jurisdiction: string;
  clientDataSensitivity: 'low' | 'medium' | 'high' | 'privileged';
  urgency: 'routine' | 'urgent' | 'emergency';
  reviewLevel: 'draft' | 'senior_review' | 'partner_approval';
  clientId?: string; // 可选：用于审计追踪，但不存储
}

// 法律执业领域
export type LegalPracticeArea = 
  | 'corporate_law'
  | 'contract_law' 
  | 'litigation'
  | 'real_estate'
  | 'intellectual_property'
  | 'employment_law'
  | 'criminal_defense'
  | 'family_law'
  | 'estate_planning'
  | 'immigration'
  | 'tax_law'
  | 'environmental_law'
  | 'healthcare_law'
  | 'securities_law'
  | 'banking_finance';

// 法律文书类型
export type LegalDocumentType =
  | 'contract_draft'
  | 'contract_review'
  | 'legal_memo'
  | 'motion_brief'
  | 'discovery_request'
  | 'settlement_agreement'
  | 'compliance_checklist'
  | 'client_letter'
  | 'court_filing'
  | 'due_diligence'
  | 'opinion_letter'
  | 'cease_desist'
  | 'privacy_policy'
  | 'terms_service'
  | 'regulatory_analysis';

// AI生成结果
export interface LegalAIResult {
  content: string;
  metadata: {
    // 质量指标
    qualityScore: number; // 0-100
    confidenceLevel: 'low' | 'medium' | 'high';
    riskAssessment: 'minimal' | 'moderate' | 'significant';
    
    // 合规性验证
    complianceStatus: {
      abaCompliant: boolean;
      stateRulesCompliant: boolean;
      ethicsReviewRequired: boolean;
      disclaimerRequired: boolean;
    };
    
    // 专业准确性
    legalAccuracy: {
      terminologyScore: number; // 0-100
      citationFormat: 'correct' | 'needs_review' | 'incorrect';
      legalLogic: 'sound' | 'questionable' | 'flawed';
    };
    
    // 生成信息
    model: string;
    practiceArea: LegalPracticeArea;
    documentType: LegalDocumentType;
    jurisdiction: string;
    
    // 审计信息（不包含客户敏感信息）
    generatedAt: string;
    processingTime: number;
    tokenUsage: number;
    cost: number;
    
    // 推荐的下一步操作
    recommendations: string[];
    reviewRequired: boolean;
    humanVerificationPoints: string[];
  };
  
  // 免责声明和法律提醒
  legalNotices: {
    disclaimer: string;
    confidentialityReminder: string;
    reviewReminder: string;
  };
}

/**
 * 专业律师AI服务核心类
 */
export class LegalAIService {
  private openRouterClient: OpenRouterClient;
  private termValidator: LegalTermValidator;
  private complianceChecker: LegalComplianceChecker;
  private templateEngine: LegalDocumentTemplateEngine;
  private qualityScorer: LegalQualityScorer;
  private dataProtectionManager: ClientDataProtectionManager;
  
  constructor(
    openRouterClient: OpenRouterClient,
    config: {
      jurisdiction?: string;
      firmName?: string;
      debugMode?: boolean;
    } = {}
  ) {
    this.openRouterClient = openRouterClient;
    this.termValidator = new LegalTermValidator(config.jurisdiction || 'US');
    this.complianceChecker = new LegalComplianceChecker();
    this.templateEngine = new LegalDocumentTemplateEngine();
    this.qualityScorer = new LegalQualityScorer();
    this.dataProtectionManager = new ClientDataProtectionManager();
  }
  
  /**
   * 生成专业法律内容
   */
  async generateLegalContent(
    prompt: string,
    options: LegalAIOptions
  ): Promise<LegalAIResult> {
    const startTime = Date.now();
    
    try {
      // 第一步：客户数据保护检查和脱敏
      const sanitizedPrompt = await this.dataProtectionManager.sanitizeInput(
        prompt,
        options.clientDataSensitivity
      );
      
      if (options.clientDataSensitivity === 'privileged') {
        console.log('[LegalAI] 检测到特权信息，启用最高级别保护措施');
      }
      
      // 第二步：选择专业法律提示词模板
      const legalTemplate = await this.templateEngine.getTemplate(
        options.practiceArea,
        options.documentType,
        options.jurisdiction
      );
      
      // 第三步：构建专业系统提示词
      const systemPrompt = this.buildLegalSystemPrompt(options, legalTemplate);
      
      // 第四步：智能模型选择（基于法律复杂度）
      const modelSelection = this.selectLegalModel(options, sanitizedPrompt);
      
      // 第五步：生成法律内容
      const aiResult = await this.openRouterClient.generate(
        sanitizedPrompt,
        {
          systemPrompt,
          model: modelSelection.model,
          temperature: modelSelection.temperature,
          maxTokens: modelSelection.maxTokens,
          topP: 0.85 // 较低的randomness，确保专业性
        }
      );
      
      // 第六步：法律术语验证
      const terminologyValidation = await this.termValidator.validate(
        aiResult.content,
        options.practiceArea,
        options.jurisdiction
      );
      
      // 第七步：法律合规性检查
      const complianceResults = await this.complianceChecker.checkCompliance(
        aiResult.content,
        options
      );
      
      // 第八步：质量评分
      const qualityScore = await this.qualityScorer.scoreContent(
        aiResult.content,
        {
          practiceArea: options.practiceArea,
          documentType: options.documentType,
          expectedLength: this.getExpectedLength(options.documentType),
          complexity: modelSelection.complexity
        }
      );
      
      // 第九步：构建专业结果
      const result: LegalAIResult = {
        content: aiResult.content,
        metadata: {
          qualityScore: qualityScore.overallScore,
          confidenceLevel: this.determineConfidenceLevel(qualityScore, terminologyValidation),
          riskAssessment: this.assessRisk(complianceResults, qualityScore),
          
          complianceStatus: {
            abaCompliant: complianceResults.abaCompliant,
            stateRulesCompliant: complianceResults.stateCompliant,
            ethicsReviewRequired: complianceResults.requiresEthicsReview,
            disclaimerRequired: true
          },
          
          legalAccuracy: {
            terminologyScore: terminologyValidation.accuracyScore,
            citationFormat: terminologyValidation.citationFormat,
            legalLogic: qualityScore.logicScore > 80 ? 'sound' : 
                       qualityScore.logicScore > 60 ? 'questionable' : 'flawed'
          },
          
          model: aiResult.model,
          practiceArea: options.practiceArea,
          documentType: options.documentType,
          jurisdiction: options.jurisdiction,
          
          generatedAt: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          tokenUsage: aiResult.usage?.total_tokens || 0,
          cost: aiResult.cost || 0,
          
          recommendations: this.generateRecommendations(qualityScore, complianceResults),
          reviewRequired: this.requiresReview(options, qualityScore, complianceResults),
          humanVerificationPoints: this.getVerificationPoints(options.documentType)
        },
        
        legalNotices: this.generateLegalNotices(options)
      };
      
      // 第十步：审计日志（不包含客户敏感信息）
      await this.logGeneration(result, options);
      
      return result;
      
    } catch (error: any) {
      console.error('[LegalAI] 生成失败:', error);
      throw new Error(`法律AI生成失败: ${error.message}`);
    }
  }
  
  /**
   * 构建专业法律系统提示词
   */
  private buildLegalSystemPrompt(options: LegalAIOptions, template: any): string {
    return `您是一位资深${this.getPracticeAreaName(options.practiceArea)}律师，具有15年以上的执业经验。

【执业标准】
- 严格遵守ABA Model Rules of Professional Conduct
- 确保所有建议符合${options.jurisdiction}司法管辖区的法律要求
- 保持最高水准的专业性和准确性
- 所有法律术语必须准确使用
- 引用格式必须符合专业标准

【文书类型】${this.getDocumentTypeName(options.documentType)}

【质量要求】
1. 逻辑清晰，结构完整
2. 法律推理严谨
3. 术语使用准确
4. 格式规范专业
5. 包含必要的风险提醒

【特别注意】
- 不得提供具体的法律建议，仅提供一般性指导
- 必须建议当事人咨询执业律师
- 标明AI生成内容的局限性

${template.additionalInstructions || ''}`;
  }
  
  /**
   * 智能法律模型选择
   */
  private selectLegalModel(options: LegalAIOptions, prompt: string): {
    model: string;
    temperature: number;
    maxTokens: number;
    complexity: 'simple' | 'moderate' | 'complex';
  } {
    // 分析法律复杂度
    const complexity = this.analyzeLegalComplexity(options, prompt);
    
    // 基于复杂度和紧急程度选择模型
    if (options.urgency === 'emergency' && complexity === 'simple') {
      return {
        model: 'anthropic/claude-3-haiku',
        temperature: 0.3,
        maxTokens: 2000,
        complexity: 'simple'
      };
    }
    
    if (complexity === 'complex' || options.reviewLevel === 'partner_approval') {
      return {
        model: 'anthropic/claude-3-opus',
        temperature: 0.2,
        maxTokens: 4000,
        complexity: 'complex'
      };
    }
    
    // 默认选择平衡型模型
    return {
      model: 'anthropic/claude-3-sonnet',
      temperature: 0.25,
      maxTokens: 3000,
      complexity: 'moderate'
    };
  }
  
  /**
   * 分析法律任务复杂度
   */
  private analyzeLegalComplexity(
    options: LegalAIOptions, 
    prompt: string
  ): 'simple' | 'moderate' | 'complex' {
    let complexityScore = 0;
    
    // 执业领域复杂度
    const complexPracticeAreas = [
      'securities_law', 'tax_law', 'intellectual_property', 
      'environmental_law', 'healthcare_law'
    ];
    if (complexPracticeAreas.includes(options.practiceArea)) {
      complexityScore += 3;
    }
    
    // 文书类型复杂度
    const complexDocumentTypes = [
      'motion_brief', 'due_diligence', 'regulatory_analysis',
      'securities_filing', 'complex_contract'
    ];
    if (complexDocumentTypes.includes(options.documentType)) {
      complexityScore += 3;
    }
    
    // 提示词长度和关键词分析
    if (prompt.length > 2000) complexityScore += 2;
    if (prompt.includes('multi-party') || prompt.includes('cross-border')) {
      complexityScore += 2;
    }
    if (prompt.includes('litigation') || prompt.includes('dispute')) {
      complexityScore += 2;
    }
    
    // 审查级别
    if (options.reviewLevel === 'partner_approval') {
      complexityScore += 2;
    }
    
    // 客户数据敏感性
    if (options.clientDataSensitivity === 'privileged') {
      complexityScore += 1;
    }
    
    if (complexityScore >= 7) return 'complex';
    if (complexityScore >= 4) return 'moderate';
    return 'simple';
  }
  
  /**
   * 确定置信度级别
   */
  private determineConfidenceLevel(
    qualityScore: any,
    terminologyValidation: any
  ): 'low' | 'medium' | 'high' {
    const overallScore = (qualityScore.overallScore + terminologyValidation.accuracyScore) / 2;
    
    if (overallScore >= 85) return 'high';
    if (overallScore >= 70) return 'medium';
    return 'low';
  }
  
  /**
   * 风险评估
   */
  private assessRisk(
    complianceResults: any,
    qualityScore: any
  ): 'minimal' | 'moderate' | 'significant' {
    if (!complianceResults.abaCompliant || !complianceResults.stateCompliant) {
      return 'significant';
    }
    
    if (qualityScore.overallScore < 70 || complianceResults.requiresEthicsReview) {
      return 'moderate';
    }
    
    return 'minimal';
  }
  
  /**
   * 生成专业建议
   */
  private generateRecommendations(qualityScore: any, complianceResults: any): string[] {
    const recommendations: string[] = [];
    
    if (qualityScore.overallScore < 80) {
      recommendations.push('建议由资深律师进行内容审查和完善');
    }
    
    if (!complianceResults.abaCompliant) {
      recommendations.push('需要进行ABA合规性审核');
    }
    
    if (complianceResults.requiresEthicsReview) {
      recommendations.push('建议进行律师职业道德审查');
    }
    
    recommendations.push('确保在使用前进行人工验证');
    recommendations.push('添加适当的免责声明');
    
    return recommendations;
  }
  
  /**
   * 确定是否需要审查
   */
  private requiresReview(
    options: LegalAIOptions,
    qualityScore: any,
    complianceResults: any
  ): boolean {
    return (
      options.clientDataSensitivity === 'privileged' ||
      options.reviewLevel === 'partner_approval' ||
      qualityScore.overallScore < 75 ||
      !complianceResults.abaCompliant ||
      complianceResults.requiresEthicsReview
    );
  }
  
  /**
   * 获取人工验证要点
   */
  private getVerificationPoints(documentType: LegalDocumentType): string[] {
    const commonPoints = [
      '核实法律条文引用的准确性',
      '检查关键日期和期限',
      '确认术语使用的一致性',
      '验证格式符合专业标准'
    ];
    
    const specificPoints: Record<string, string[]> = {
      'contract_draft': ['核实合同条款的法律有效性', '确认双方权利义务平衡'],
      'legal_memo': ['验证法律分析的逻辑性', '确认建议的可操作性'],
      'motion_brief': ['检查程序性要求', '核实法庭规则符合性'],
      'compliance_checklist': ['验证监管要求的完整性', '确认最新法规更新']
    };
    
    return [...commonPoints, ...(specificPoints[documentType] || [])];
  }
  
  /**
   * 生成法律声明
   */
  private generateLegalNotices(options: LegalAIOptions): any {
    return {
      disclaimer: `本内容由AI生成，仅供参考。不构成具体法律建议。在采取任何法律行动前，请咨询具有执业资格的律师。`,
      confidentialityReminder: `请确保在处理客户信息时严格遵守律师-客户特权保密原则。`,
      reviewReminder: `本AI生成内容需要具有相关执业经验的律师审核后方可正式使用。`
    };
  }
  
  /**
   * 获取执业领域名称
   */
  private getPracticeAreaName(area: LegalPracticeArea): string {
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
   * 获取文书类型名称
   */
  private getDocumentTypeName(type: LegalDocumentType): string {
    const names: Record<LegalDocumentType, string> = {
      'contract_draft': '合同起草',
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
   * 获取预期长度
   */
  private getExpectedLength(type: LegalDocumentType): number {
    const lengths: Record<LegalDocumentType, number> = {
      'contract_draft': 2000,
      'legal_memo': 1500,
      'motion_brief': 3000,
      'opinion_letter': 2500,
      'compliance_checklist': 1000,
      'regulatory_analysis': 3500
    };
    
    return lengths[type] || 1500;
  }
  
  /**
   * 审计日志记录
   */
  private async logGeneration(result: LegalAIResult, options: LegalAIOptions): Promise<void> {
    // 记录审计信息（不包含客户敏感内容）
    const auditLog = {
      timestamp: result.metadata.generatedAt,
      practiceArea: options.practiceArea,
      documentType: options.documentType,
      jurisdiction: options.jurisdiction,
      qualityScore: result.metadata.qualityScore,
      confidenceLevel: result.metadata.confidenceLevel,
      riskAssessment: result.metadata.riskAssessment,
      complianceStatus: result.metadata.complianceStatus,
      processingTime: result.metadata.processingTime,
      tokenUsage: result.metadata.tokenUsage,
      cost: result.metadata.cost,
      reviewRequired: result.metadata.reviewRequired
    };
    
    console.log('[LegalAI] 审计日志:', auditLog);
    
    // 在生产环境中，这里应该写入安全的审计日志系统
    // await auditLogger.log(auditLog);
  }
  
  /**
   * 健康检查
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: Record<string, boolean>;
    timestamp: string;
  }> {
    const components = {
      openRouterClient: false,
      termValidator: false,
      complianceChecker: false,
      templateEngine: false,
      qualityScorer: false,
      dataProtectionManager: false
    };
    
    try {
      // 检查OpenRouter连接
      const health = await this.openRouterClient.healthCheck();
      components.openRouterClient = health.connected;
      
      // 检查其他组件
      components.termValidator = await this.termValidator.isHealthy();
      components.complianceChecker = await this.complianceChecker.isHealthy();
      components.templateEngine = await this.templateEngine.isHealthy();
      components.qualityScorer = await this.qualityScorer.isHealthy();
      components.dataProtectionManager = await this.dataProtectionManager.isHealthy();
      
      const healthyComponents = Object.values(components).filter(Boolean).length;
      const totalComponents = Object.keys(components).length;
      
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (healthyComponents === totalComponents) {
        status = 'healthy';
      } else if (healthyComponents >= totalComponents / 2) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }
      
      return {
        status,
        components,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('[LegalAI] 健康检查失败:', error);
      
      return {
        status: 'unhealthy',
        components,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default LegalAIService;