/**
 * 法律合规检查器
 * 确保AI生成内容符合ABA Model Rules和律师职业道德标准
 * 
 * 核心功能：
 * 1. ABA Model Rules of Professional Conduct 合规性检查
 * 2. 各州律师协会规则验证
 * 3. 律师-客户特权保护检查
 * 4. 执业许可要求验证
 * 5. 法律建议边界检查
 * 6. 利益冲突风险评估
 */

import { LegalAIOptions, LegalPracticeArea } from './legal-ai-service';

// 合规检查结果
export interface ComplianceResult {
  abaCompliant: boolean;
  stateCompliant: boolean;
  requiresEthicsReview: boolean;
  violations: ComplianceViolation[];
  warnings: ComplianceWarning[];
  recommendations: ComplianceRecommendation[];
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
}

// 合规违规
export interface ComplianceViolation {
  rule: string; // ABA Rule number or state rule reference
  type: 'aba_rule' | 'state_rule' | 'ethical_requirement' | 'licensing_requirement';
  severity: 'minor' | 'major' | 'critical';
  description: string;
  content: string; // 违规的内容片段
  remediation: string; // 补救措施
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

// 合规警告
export interface ComplianceWarning {
  category: 'unauthorized_practice' | 'client_confidentiality' | 'conflict_of_interest' | 
           'advertising_solicitation' | 'competence' | 'supervision';
  message: string;
  context: string;
  recommendation: string;
}

// 合规建议
export interface ComplianceRecommendation {
  type: 'add_disclaimer' | 'limit_scope' | 'require_review' | 'additional_disclosure';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  implementation: string;
}

/**
 * 法律合规检查器实现
 */
export class LegalComplianceChecker {
  private abaRules: Map<string, ABARule>;
  private stateRules: Map<string, Map<string, StateRule>>;
  private prohibitedPhrases: string[];
  private requiresDisclosureKeywords: string[];
  
  constructor() {
    this.abaRules = new Map();
    this.stateRules = new Map();
    this.prohibitedPhrases = [];
    this.requiresDisclosureKeywords = [];
    
    this.initializeABARules();
    this.initializeStateRules();
    this.initializeProhibitedPhrases();
    this.initializeDisclosureKeywords();
  }
  
  /**
   * 主要合规检查入口
   */
  async checkCompliance(
    content: string,
    options: LegalAIOptions
  ): Promise<ComplianceResult> {
    try {
      const violations: ComplianceViolation[] = [];
      const warnings: ComplianceWarning[] = [];
      const recommendations: ComplianceRecommendation[] = [];
      
      // 1. ABA Model Rules 检查
      const abaResults = await this.checkABARules(content, options);
      violations.push(...abaResults.violations);
      warnings.push(...abaResults.warnings);
      
      // 2. 州规则检查
      const stateResults = await this.checkStateRules(content, options.jurisdiction);
      violations.push(...stateResults.violations);
      warnings.push(...stateResults.warnings);
      
      // 3. 无权执业检查
      const unauthorizedPracticeResults = await this.checkUnauthorizedPractice(content);
      violations.push(...unauthorizedPracticeResults.violations);
      warnings.push(...unauthorizedPracticeResults.warnings);
      
      // 4. 客户保密性检查
      const confidentialityResults = await this.checkConfidentiality(content, options);
      violations.push(...confidentialityResults.violations);
      warnings.push(...confidentialityResults.warnings);
      
      // 5. 利益冲突检查
      const conflictResults = await this.checkConflictOfInterest(content);
      warnings.push(...conflictResults.warnings);
      
      // 6. 广告和招揽检查
      const advertisingResults = await this.checkAdvertisingRules(content);
      violations.push(...advertisingResults.violations);
      warnings.push(...advertisingResults.warnings);
      
      // 7. 胜任能力检查
      const competenceResults = await this.checkCompetence(content, options);
      warnings.push(...competenceResults.warnings);
      
      // 8. 生成合规建议
      const complianceRecommendations = this.generateComplianceRecommendations(
        violations, warnings, options
      );
      recommendations.push(...complianceRecommendations);
      
      // 计算合规状态
      const abaCompliant = violations.filter(v => v.type === 'aba_rule').length === 0;
      const stateCompliant = violations.filter(v => v.type === 'state_rule').length === 0;
      const requiresEthicsReview = this.requiresEthicsReview(violations, warnings);
      const overallRisk = this.calculateOverallRisk(violations, warnings);
      
      return {
        abaCompliant,
        stateCompliant,
        requiresEthicsReview,
        violations,
        warnings,
        recommendations,
        overallRisk
      };
      
    } catch (error: any) {
      console.error('[LegalComplianceChecker] 合规检查失败:', error);
      
      // 返回保守的合规结果
      return {
        abaCompliant: false,
        stateCompliant: false,
        requiresEthicsReview: true,
        violations: [{
          rule: 'SYSTEM_ERROR',
          type: 'ethical_requirement',
          severity: 'major',
          description: '合规检查系统发生错误',
          content: 'System error during compliance check',
          remediation: '建议由执业律师进行人工合规审查',
          riskLevel: 'high'
        }],
        warnings: [],
        recommendations: [{
          type: 'require_review',
          priority: 'critical',
          description: '由于系统错误，强烈建议人工审查',
          implementation: '请执业律师审查所有AI生成内容的合规性'
        }],
        overallRisk: 'critical'
      };
    }
  }
  
  /**
   * 检查ABA Model Rules
   */
  private async checkABARules(
    content: string,
    options: LegalAIOptions
  ): Promise<{ violations: ComplianceViolation[], warnings: ComplianceWarning[] }> {
    const violations: ComplianceViolation[] = [];
    const warnings: ComplianceWarning[] = [];
    
    // Rule 1.1 - Competence
    if (this.containsComplexLegalAdvice(content, options.practiceArea)) {
      if (options.reviewLevel === 'draft') {
        warnings.push({
          category: 'competence',
          message: 'AI生成的复杂法律建议需要执业律师审查',
          context: 'ABA Rule 1.1 - Competence requirement',
          recommendation: '确保由具有相关执业经验的律师审查此内容'
        });
      }
    }
    
    // Rule 1.6 - Confidentiality of Information
    if (this.containsConfidentialInformation(content)) {
      violations.push({
        rule: 'ABA Rule 1.6',
        type: 'aba_rule',
        severity: 'critical',
        description: '可能包含客户保密信息',
        content: this.extractConfidentialSnippet(content),
        remediation: '立即移除所有可识别的客户信息，实施更严格的数据保护措施',
        riskLevel: 'critical'
      });
    }
    
    // Rule 5.5 - Unauthorized Practice of Law
    const unauthorizedAdvicePatterns = [
      /you should (file|sue|settle|agree)/gi,
      /i recommend that you/gi,
      /your case will/gi,
      /you will win\/lose/gi
    ];
    
    for (const pattern of unauthorizedAdvicePatterns) {
      if (pattern.test(content)) {
        violations.push({
          rule: 'ABA Rule 5.5',
          type: 'aba_rule',
          severity: 'major',
          description: '可能构成未授权的法律执业',
          content: this.extractMatchingSnippet(content, pattern),
          remediation: '将具体建议修改为一般性信息，添加免责声明',
          riskLevel: 'high'
        });
      }
    }
    
    // Rule 7.3 - Solicitation of Clients
    if (this.containsSolicitation(content)) {
      violations.push({
        rule: 'ABA Rule 7.3',
        type: 'aba_rule',
        severity: 'major',
        description: '可能包含不当的客户招揽内容',
        content: this.extractSolicitationSnippet(content),
        remediation: '移除任何直接招揽客户的语言',
        riskLevel: 'medium'
      });
    }
    
    // Rule 1.9 - Duties to Former Clients
    if (this.containsFormerClientInformation(content)) {
      warnings.push({
        category: 'conflict_of_interest',
        message: '内容可能涉及前客户信息',
        context: 'ABA Rule 1.9 - Duties to Former Clients',
        recommendation: '确认不存在利益冲突，必要时获得前客户同意'
      });
    }
    
    return { violations, warnings };
  }
  
  /**
   * 检查州特定规则
   */
  private async checkStateRules(
    content: string,
    jurisdiction: string
  ): Promise<{ violations: ComplianceViolation[], warnings: ComplianceWarning[] }> {
    const violations: ComplianceViolation[] = [];
    const warnings: ComplianceWarning[] = [];
    
    const stateRules = this.stateRules.get(jurisdiction);
    if (!stateRules) {
      warnings.push({
        category: 'licensing_requirement',
        message: `未找到${jurisdiction}州的特定规则配置`,
        context: '州规则合规性检查',
        recommendation: '建议咨询当地律师协会的最新规则要求'
      });
      return { violations, warnings };
    }
    
    // 检查州特定的禁止语言
    const stateProhibitions = stateRules.get('prohibited_language');
    if (stateProhibitions?.patterns) {
      for (const pattern of stateProhibitions.patterns) {
        if (new RegExp(pattern, 'gi').test(content)) {
          violations.push({
            rule: `${jurisdiction} State Rule`,
            type: 'state_rule',
            severity: 'major',
            description: `违反${jurisdiction}州特定规则`,
            content: this.extractMatchingSnippet(content, new RegExp(pattern, 'gi')),
            remediation: stateProhibitions.remediation || '修改内容以符合州规则要求',
            riskLevel: 'high'
          });
        }
      }
    }
    
    // 检查州特定的披露要求
    const disclosureReqs = stateRules.get('disclosure_requirements');
    if (disclosureReqs && this.requiresStateDisclosure(content, jurisdiction)) {
      warnings.push({
        category: 'advertising_solicitation',
        message: `${jurisdiction}州要求特定披露声明`,
        context: '州披露要求',
        recommendation: disclosureReqs.requirement
      });
    }
    
    return { violations, warnings };
  }
  
  /**
   * 检查无权执业
   */
  private async checkUnauthorizedPractice(
    content: string
  ): Promise<{ violations: ComplianceViolation[], warnings: ComplianceWarning[] }> {
    const violations: ComplianceViolation[] = [];
    const warnings: ComplianceWarning[] = [];
    
    // 检查是否包含具体的法律建议
    if (this.containsSpecificLegalAdvice(content)) {
      violations.push({
        rule: 'Unauthorized Practice',
        type: 'licensing_requirement',
        severity: 'critical',
        description: 'AI系统不得提供具体的法律建议',
        content: this.extractSpecificAdviceSnippet(content),
        remediation: '将内容修改为一般性法律信息，添加\"非法律建议\"免责声明',
        riskLevel: 'critical'
      });
    }
    
    // 检查是否暗示建立律师-客户关系
    if (this.impliesAttorneyClientRelationship(content)) {
      violations.push({
        rule: 'Attorney-Client Relationship',
        type: 'ethical_requirement',
        severity: 'major',
        description: '内容可能暗示建立了律师-客户关系',
        content: this.extractRelationshipImplication(content),
        remediation: '明确声明未建立律师-客户关系',
        riskLevel: 'high'
      });
    }
    
    return { violations, warnings };
  }
  
  /**
   * 检查保密性
   */
  private async checkConfidentiality(
    content: string,
    options: LegalAIOptions
  ): Promise<{ violations: ComplianceViolation[], warnings: ComplianceWarning[] }> {
    const violations: ComplianceViolation[] = [];
    const warnings: ComplianceWarning[] = [];
    
    // 检查是否包含可识别信息
    if (this.containsIdentifiableInformation(content)) {
      violations.push({
        rule: 'Confidentiality',
        type: 'ethical_requirement',
        severity: 'critical',
        description: '内容包含可能识别客户身份的信息',
        content: '[已隐私处理]',
        remediation: '立即移除所有可识别信息，实施数据脱敏',
        riskLevel: 'critical'
      });
    }
    
    // 检查特权信息处理
    if (options.clientDataSensitivity === 'privileged') {
      warnings.push({
        category: 'client_confidentiality',
        message: '处理特权信息需要最高级别的保护措施',
        context: '律师-客户特权保护',
        recommendation: '确保零数据保留策略，考虑使用本地处理'
      });
    }
    
    return { violations, warnings };
  }
  
  /**
   * 检查利益冲突
   */
  private async checkConflictOfInterest(
    content: string
  ): Promise<{ warnings: ComplianceWarning[] }> {
    const warnings: ComplianceWarning[] = [];
    
    // 检查是否涉及多个当事方
    if (this.involvesMultipleParties(content)) {
      warnings.push({
        category: 'conflict_of_interest',
        message: '内容涉及多个当事方，需要检查潜在利益冲突',
        context: '多方利益冲突检查',
        recommendation: '进行详细的利益冲突分析，必要时获得各方书面同意'
      });
    }
    
    return { warnings };
  }
  
  /**
   * 检查广告和招揽规则
   */
  private async checkAdvertisingRules(
    content: string
  ): Promise<{ violations: ComplianceViolation[], warnings: ComplianceWarning[] }> {
    const violations: ComplianceViolation[] = [];
    const warnings: ComplianceWarning[] = [];
    
    // 检查夸大性语言
    const exaggerationPatterns = [
      /best lawyer/gi,
      /guaranteed (win|success|result)/gi,
      /never lost a case/gi,
      /100% success rate/gi
    ];
    
    for (const pattern of exaggerationPatterns) {
      if (pattern.test(content)) {
        violations.push({
          rule: 'Advertising Rules',
          type: 'ethical_requirement',
          severity: 'major',
          description: '包含不当的夸大性宣传语言',
          content: this.extractMatchingSnippet(content, pattern),
          remediation: '移除夸大性声明，使用客观准确的描述',
          riskLevel: 'medium'
        });
      }
    }
    
    return { violations, warnings };
  }
  
  /**
   * 检查胜任能力
   */
  private async checkCompetence(
    content: string,
    options: LegalAIOptions
  ): Promise<{ warnings: ComplianceWarning[] }> {
    const warnings: ComplianceWarning[] = [];
    
    // 检查复杂领域的建议
    const complexAreas: LegalPracticeArea[] = [
      'securities_law', 'tax_law', 'intellectual_property',
      'environmental_law', 'healthcare_law'
    ];
    
    if (complexAreas.includes(options.practiceArea)) {
      warnings.push({
        category: 'competence',
        message: '复杂执业领域需要专业律师审查',
        context: 'ABA Rule 1.1 - Competence in specialized areas',
        recommendation: '确保由该领域专业律师审查和验证内容'
      });
    }
    
    return { warnings };
  }
  
  /**
   * 生成合规建议
   */
  private generateComplianceRecommendations(
    violations: ComplianceViolation[],
    warnings: ComplianceWarning[],
    options: LegalAIOptions
  ): ComplianceRecommendation[] {
    const recommendations: ComplianceRecommendation[] = [];
    
    // 基于违规生成建议
    if (violations.length > 0) {
      recommendations.push({
        type: 'require_review',
        priority: 'critical',
        description: '存在合规违规，需要立即人工审查',
        implementation: '由执业律师审查并修正所有违规内容'
      });
    }
    
    // 总是建议添加免责声明
    recommendations.push({
      type: 'add_disclaimer',
      priority: 'high',
      description: '添加标准AI生成内容免责声明',
      implementation: '在内容开头或结尾添加\"本内容由AI生成，不构成法律建议\"声明'
    });
    
    // 对于特权信息，建议额外保护
    if (options.clientDataSensitivity === 'privileged') {
      recommendations.push({
        type: 'additional_disclosure',
        priority: 'critical',
        description: '特权信息需要额外保护措施',
        implementation: '实施零数据保留，考虑本地处理，加强访问控制'
      });
    }
    
    // 基于警告生成建议
    if (warnings.some(w => w.category === 'competence')) {
      recommendations.push({
        type: 'limit_scope',
        priority: 'high',
        description: '限制AI建议的范围和深度',
        implementation: '仅提供一般性指导，明确标注需要专业律师详细建议的事项'
      });
    }
    
    return recommendations;
  }
  
  /**
   * 计算整体风险等级
   */
  private calculateOverallRisk(
    violations: ComplianceViolation[],
    warnings: ComplianceWarning[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    // 如果有critical级别的违规，整体风险为critical
    if (violations.some(v => v.riskLevel === 'critical')) {
      return 'critical';
    }
    
    // 计算风险分数
    let riskScore = 0;
    
    for (const violation of violations) {
      switch (violation.riskLevel) {
        case 'high': riskScore += 3; break;
        case 'medium': riskScore += 2; break;
        case 'low': riskScore += 1; break;
      }
    }
    
    // 警告也增加风险分数（权重较低）
    riskScore += warnings.length * 0.5;
    
    if (riskScore >= 5) return 'high';
    if (riskScore >= 3) return 'medium';
    if (riskScore >= 1) return 'low';
    return 'low';
  }
  
  /**
   * 判断是否需要伦理审查
   */
  private requiresEthicsReview(
    violations: ComplianceViolation[],
    warnings: ComplianceWarning[]
  ): boolean {
    // 任何critical或major违规都需要伦理审查
    if (violations.some(v => v.severity === 'critical' || v.severity === 'major')) {
      return true;
    }
    
    // 特定类别的警告需要伦理审查
    const ethicsReviewWarnings = [
      'client_confidentiality',
      'conflict_of_interest',
      'unauthorized_practice'
    ];
    
    return warnings.some(w => ethicsReviewWarnings.includes(w.category));
  }
  
  // 辅助检查方法的实现
  private containsComplexLegalAdvice(content: string, practiceArea: LegalPracticeArea): boolean {
    const complexIndicators = [
      'specific recommendation', 'should file', 'must comply with',
      'legal strategy', 'course of action', 'recommended approach'
    ];
    
    return complexIndicators.some(indicator => 
      content.toLowerCase().includes(indicator.toLowerCase())
    );
  }
  
  private containsConfidentialInformation(content: string): boolean {
    // 检查常见的保密信息模式
    const confidentialPatterns = [
      /client name:\s*\w+/gi,
      /\b[A-Z][a-z]+ v\. [A-Z][a-z]+\b/g, // 案件名称
      /case number:\s*[\w-]+/gi,
      /social security number/gi,
      /confidential.*information/gi
    ];
    
    return confidentialPatterns.some(pattern => pattern.test(content));
  }
  
  private containsSpecificLegalAdvice(content: string): boolean {
    const advicePatterns = [
      /you should (definitely|immediately|certainly)/gi,
      /i advise you to/gi,
      /my recommendation is/gi,
      /you must (file|respond|comply)/gi
    ];
    
    return advicePatterns.some(pattern => pattern.test(content));
  }
  
  private containsSolicitation(content: string): boolean {
    const solicitationPatterns = [
      /contact (me|us) for representation/gi,
      /hire (me|us) for your case/gi,
      /free consultation/gi,
      /no fee unless we win/gi
    ];
    
    return solicitationPatterns.some(pattern => pattern.test(content));
  }
  
  private containsFormerClientInformation(content: string): boolean {
    // 检查可能涉及前客户信息的模式
    return content.toLowerCase().includes('former client') ||
           content.toLowerCase().includes('previous case');
  }
  
  private containsIdentifiableInformation(content: string): boolean {
    const identifierPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{10}\b/, // Phone number
      /\b\d{3}-\d{3}-\d{4}\b/ // Phone number with dashes
    ];
    
    return identifierPatterns.some(pattern => pattern.test(content));
  }
  
  private impliesAttorneyClientRelationship(content: string): boolean {
    const relationshipPatterns = [
      /as your attorney/gi,
      /our client relationship/gi,
      /representing you in/gi,
      /on your behalf/gi
    ];
    
    return relationshipPatterns.some(pattern => pattern.test(content));
  }
  
  private involvesMultipleParties(content: string): boolean {
    const multiPartyIndicators = [
      /plaintiff.*defendant/gi,
      /party a.*party b/gi,
      /multiple parties/gi,
      /all parties involved/gi
    ];
    
    return multiPartyIndicators.some(pattern => pattern.test(content));
  }
  
  private requiresStateDisclosure(content: string, jurisdiction: string): boolean {
    // 基于内容和司法管辖区判断是否需要州特定披露
    return this.containsAdvertisingLanguage(content) && jurisdiction !== '';
  }
  
  private containsAdvertisingLanguage(content: string): boolean {
    const advertisingKeywords = [
      'experienced attorney', 'successful track record',
      'proven results', 'aggressive representation'
    ];
    
    return advertisingKeywords.some(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase())
    );
  }
  
  // 内容提取方法
  private extractConfidentialSnippet(content: string): string {
    return '[保密信息已隐藏]';
  }
  
  private extractMatchingSnippet(content: string, pattern: RegExp): string {
    const match = content.match(pattern);
    return match ? match[0] : '[未找到匹配内容]';
  }
  
  private extractSolicitationSnippet(content: string): string {
    return '[招揽内容已隐藏]';
  }
  
  private extractSpecificAdviceSnippet(content: string): string {
    return '[具体法律建议已隐藏]';
  }
  
  private extractRelationshipImplication(content: string): string {
    return '[律师-客户关系暗示已隐藏]';
  }
  
  /**
   * 初始化ABA规则数据库
   */
  private initializeABARules(): void {
    // 这里可以扩展为完整的ABA规则数据库
    this.abaRules.set('1.1', {
      title: 'Competence',
      description: 'A lawyer shall provide competent representation',
      categories: ['competence', 'professional_standards']
    });
    
    this.abaRules.set('1.6', {
      title: 'Confidentiality of Information',
      description: 'A lawyer shall not reveal information relating to the representation of a client',
      categories: ['confidentiality', 'client_protection']
    });
    
    this.abaRules.set('5.5', {
      title: 'Unauthorized Practice of Law',
      description: 'A lawyer shall not practice law in violation of the regulation of the legal profession',
      categories: ['unauthorized_practice', 'licensing']
    });
  }
  
  /**
   * 初始化州规则数据库
   */
  private initializeStateRules(): void {
    // 加州规则示例
    const californiaRules = new Map<string, StateRule>();
    californiaRules.set('prohibited_language', {
      patterns: ['guaranteed victory', 'certain win'],
      remediation: '加州禁止在法律广告中使用结果保证语言'
    });
    
    this.stateRules.set('CA', californiaRules);
    
    // 可以继续添加其他州的规则
  }
  
  /**
   * 初始化禁止短语
   */
  private initializeProhibitedPhrases(): void {
    this.prohibitedPhrases = [
      'guaranteed results',
      'we never lose',
      'certain victory',
      '100% success rate',
      'best lawyer in town'
    ];
  }
  
  /**
   * 初始化需要披露的关键词
   */
  private initializeDisclosureKeywords(): void {
    this.requiresDisclosureKeywords = [
      'advertising',
      'attorney referral',
      'legal services',
      'consultation',
      'representation'
    ];
  }
  
  /**
   * 健康检查
   */
  async isHealthy(): Promise<boolean> {
    try {
      return (
        this.abaRules.size > 0 &&
        this.prohibitedPhrases.length > 0 &&
        this.requiresDisclosureKeywords.length > 0
      );
    } catch (error) {
      return false;
    }
  }
}

// 接口定义
interface ABARule {
  title: string;
  description: string;
  categories: string[];
}

interface StateRule {
  patterns?: string[];
  remediation?: string;
  requirement?: string;
}

export default LegalComplianceChecker;