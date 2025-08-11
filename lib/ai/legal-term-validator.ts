/**
 * 法律术语验证器
 * 确保AI生成内容中法律术语的专业准确性
 * 
 * 核心功能：
 * 1. 法律术语准确性验证
 * 2. 引用格式检查（Bluebook, ALWD等）
 * 3. 司法管辖区特定术语验证
 * 4. 专业写作标准检查
 * 5. 术语一致性分析
 */

import { LegalPracticeArea } from './legal-ai-service';

// 术语验证结果
export interface TermValidationResult {
  accuracyScore: number; // 0-100
  issues: TermIssue[];
  suggestions: TermSuggestion[];
  citationFormat: 'correct' | 'needs_review' | 'incorrect';
  consistencyScore: number; // 术语使用一致性 0-100
  professionalismScore: number; // 专业写作标准 0-100
}

// 术语问题
export interface TermIssue {
  type: 'incorrect_term' | 'outdated_usage' | 'inconsistent_usage' | 'citation_error' | 'informal_language';
  term: string;
  context: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  explanation: string;
  suggestion: string;
  line?: number;
  position?: number;
}

// 术语建议
export interface TermSuggestion {
  type: 'alternative_term' | 'additional_citation' | 'style_improvement' | 'clarification';
  original: string;
  suggested: string;
  reason: string;
  practiceArea?: LegalPracticeArea;
}

/**
 * 法律术语验证器实现
 */
export class LegalTermValidator {
  private jurisdiction: string;
  private legalTermDatabase: Map<string, LegalTerm>;
  private citationPatterns: Map<string, RegExp>;
  private commonErrors: Map<string, string>;
  
  constructor(jurisdiction: string = 'US') {
    this.jurisdiction = jurisdiction;
    this.legalTermDatabase = new Map();
    this.citationPatterns = new Map();
    this.commonErrors = new Map();
    
    this.initializeLegalTerms();
    this.initializeCitationPatterns();
    this.initializeCommonErrors();
  }
  
  /**
   * 验证法律术语准确性
   */
  async validate(
    content: string,
    practiceArea: LegalPracticeArea,
    jurisdiction: string = this.jurisdiction
  ): Promise<TermValidationResult> {
    try {
      const issues: TermIssue[] = [];
      const suggestions: TermSuggestion[] = [];
      
      // 1. 术语准确性检查
      const termAccuracyResults = await this.checkTermAccuracy(content, practiceArea);
      issues.push(...termAccuracyResults.issues);
      suggestions.push(...termAccuracyResults.suggestions);
      
      // 2. 引用格式检查
      const citationResults = await this.checkCitationFormat(content);
      issues.push(...citationResults.issues);
      
      // 3. 术语一致性检查
      const consistencyResults = await this.checkConsistency(content);
      issues.push(...consistencyResults.issues);
      suggestions.push(...consistencyResults.suggestions);
      
      // 4. 专业写作标准检查
      const professionalismResults = await this.checkProfessionalism(content);
      issues.push(...professionalismResults.issues);
      suggestions.push(...professionalismResults.suggestions);
      
      // 5. 司法管辖区特定检查
      const jurisdictionResults = await this.checkJurisdictionSpecific(content, jurisdiction);
      issues.push(...jurisdictionResults.issues);
      
      // 计算总体评分
      const accuracyScore = this.calculateAccuracyScore(issues);
      const consistencyScore = this.calculateConsistencyScore(consistencyResults);
      const professionalismScore = this.calculateProfessionalismScore(professionalismResults);
      const citationFormat = this.determineCitationFormat(citationResults);
      
      return {
        accuracyScore,
        issues,
        suggestions,
        citationFormat,
        consistencyScore,
        professionalismScore
      };
      
    } catch (error: any) {
      console.error('[LegalTermValidator] 验证失败:', error);
      
      // 返回保守的验证结果
      return {
        accuracyScore: 50,
        issues: [{
          type: 'incorrect_term',
          term: 'validation_error',
          context: 'System validation error',
          severity: 'medium',
          explanation: '术语验证过程中发生错误，建议人工审核',
          suggestion: '请由执业律师进行人工验证'
        }],
        suggestions: [],
        citationFormat: 'needs_review',
        consistencyScore: 50,
        professionalismScore: 50
      };
    }
  }
  
  /**
   * 检查术语准确性
   */
  private async checkTermAccuracy(
    content: string,
    practiceArea: LegalPracticeArea
  ): Promise<{ issues: TermIssue[], suggestions: TermSuggestion[] }> {
    const issues: TermIssue[] = [];
    const suggestions: TermSuggestion[] = [];
    
    // 获取内容中的潜在法律术语
    const detectedTerms = this.extractLegalTerms(content);
    
    for (const term of detectedTerms) {
      const termInfo = this.legalTermDatabase.get(term.toLowerCase());
      
      if (termInfo) {
        // 检查术语是否适用于当前执业领域
        if (!termInfo.practiceAreas.includes(practiceArea)) {
          suggestions.push({
            type: 'alternative_term',
            original: term,
            suggested: this.getAlternativeTerm(term, practiceArea),
            reason: `术语"${term}"更常用于其他执业领域，建议使用更适合${practiceArea}的表述`,
            practiceArea
          });
        }
        
        // 检查术语是否过时
        if (termInfo.deprecated) {
          issues.push({
            type: 'outdated_usage',
            term,
            context: this.getTermContext(content, term),
            severity: 'medium',
            explanation: `术语"${term}"已过时或不再推荐使用`,
            suggestion: termInfo.modernAlternative || '建议使用现代法律术语'
          });
        }
        
        // 检查拼写和用法
        if (termInfo.commonMisspellings.includes(term)) {
          issues.push({
            type: 'incorrect_term',
            term,
            context: this.getTermContext(content, term),
            severity: 'high',
            explanation: `"${term}"可能是拼写错误`,
            suggestion: termInfo.correctSpelling
          });
        }
      } else {
        // 未知术语 - 检查是否为常见错误
        const correction = this.commonErrors.get(term.toLowerCase());
        if (correction) {
          issues.push({
            type: 'incorrect_term',
            term,
            context: this.getTermContext(content, term),
            severity: 'high',
            explanation: `"${term}"可能不是标准法律术语`,
            suggestion: correction
          });
        }
      }
    }
    
    return { issues, suggestions };
  }
  
  /**
   * 检查引用格式
   */
  private async checkCitationFormat(content: string): Promise<{
    issues: TermIssue[],
    format: 'correct' | 'needs_review' | 'incorrect',
    score: number
  }> {
    const issues: TermIssue[] = [];
    let correctCitations = 0;
    let totalCitations = 0;
    
    // 检测各种引用模式
    for (const [citationType, pattern] of this.citationPatterns) {
      const matches = content.match(new RegExp(pattern, 'g')) || [];
      
      for (const match of matches) {
        totalCitations++;
        
        if (this.isValidCitation(match, citationType)) {
          correctCitations++;
        } else {
          issues.push({
            type: 'citation_error',
            term: match,
            context: this.getTermContext(content, match),
            severity: 'medium',
            explanation: `${citationType}引用格式可能不正确`,
            suggestion: this.getSuggestedCitationFormat(match, citationType)
          });
        }
      }
    }
    
    const score = totalCitations > 0 ? (correctCitations / totalCitations) * 100 : 100;
    
    let format: 'correct' | 'needs_review' | 'incorrect';
    if (score >= 90) format = 'correct';
    else if (score >= 70) format = 'needs_review';
    else format = 'incorrect';
    
    return { issues, format, score };
  }
  
  /**
   * 检查术语一致性
   */
  private async checkConsistency(content: string): Promise<{
    issues: TermIssue[],
    suggestions: TermSuggestion[],
    score: number
  }> {
    const issues: TermIssue[] = [];
    const suggestions: TermSuggestion[] = [];
    
    // 查找同义词或变体的不一致使用
    const termVariations = this.findTermVariations(content);
    
    for (const [baseTerm, variations] of termVariations) {
      if (variations.length > 1) {
        // 选择最标准/常用的变体
        const preferredTerm = this.getPreferredTermVariation(variations);
        
        for (const variation of variations) {
          if (variation !== preferredTerm) {
            suggestions.push({
              type: 'alternative_term',
              original: variation,
              suggested: preferredTerm,
              reason: '为保持文档术语一致性，建议统一使用标准表述'
            });
          }
        }
        
        issues.push({
          type: 'inconsistent_usage',
          term: baseTerm,
          context: `发现${variations.length}种不同表述: ${variations.join(', ')}`,
          severity: 'low',
          explanation: '文档中存在术语使用不一致的情况',
          suggestion: `建议统一使用"${preferredTerm}"`
        });
      }
    }
    
    const consistencyScore = Math.max(0, 100 - (issues.length * 10));
    
    return { issues, suggestions, score: consistencyScore };
  }
  
  /**
   * 检查专业写作标准
   */
  private async checkProfessionalism(content: string): Promise<{
    issues: TermIssue[],
    suggestions: TermSuggestion[],
    score: number
  }> {
    const issues: TermIssue[] = [];
    const suggestions: TermSuggestion[] = [];
    
    // 检查非正式语言
    const informalPatterns = [
      /\b(gonna|wanna|kinda|sorta)\b/gi,
      /\b(can't|won't|don't|isn't|aren't|wasn't|weren't)\b/gi, // 建议展开缩写
      /\b(really|very|quite|pretty)\s+/gi, // 避免不必要的修饰词
      /\!\!/g, // 避免多重标点
      /\?\?/g
    ];
    
    for (const pattern of informalPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          issues.push({
            type: 'informal_language',
            term: match,
            context: this.getTermContext(content, match),
            severity: 'low',
            explanation: '建议使用更正式的法律写作语言',
            suggestion: this.getFormalAlternative(match)
          });
        }
      }
    }
    
    // 检查被动语态过度使用
    const passiveVoiceMatches = content.match(/\b(is|are|was|were|been|being)\s+\w+ed\b/gi) || [];
    if (passiveVoiceMatches.length > content.split('.').length * 0.3) {
      suggestions.push({
        type: 'style_improvement',
        original: '过多使用被动语态',
        suggested: '适当使用主动语态',
        reason: '主动语态通常更清晰、更有力'
      });
    }
    
    const professionalismScore = Math.max(0, 100 - (issues.length * 5));
    
    return { issues, suggestions, score: professionalismScore };
  }
  
  /**
   * 检查司法管辖区特定要求
   */
  private async checkJurisdictionSpecific(
    content: string,
    jurisdiction: string
  ): Promise<{ issues: TermIssue[] }> {
    const issues: TermIssue[] = [];
    
    // 检查特定司法管辖区的术语要求
    if (jurisdiction === 'CA') {
      // 加州特定检查
      if (content.includes('attorney') && !content.includes('counsel')) {
        // 在某些情况下，加州更倾向于使用"counsel"
        // 这里是示例逻辑
      }
    } else if (jurisdiction === 'NY') {
      // 纽约州特定检查
    }
    
    // 可以扩展为更复杂的司法管辖区特定验证
    
    return { issues };
  }
  
  /**
   * 提取内容中的法律术语
   */
  private extractLegalTerms(content: string): string[] {
    // 使用正则表达式和词库匹配法律术语
    const legalTermPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
    const potentialTerms = content.match(legalTermPattern) || [];
    
    // 过滤出真正的法律术语
    return potentialTerms.filter(term => 
      this.legalTermDatabase.has(term.toLowerCase()) ||
      this.isPotentialLegalTerm(term)
    );
  }
  
  /**
   * 判断是否为潜在法律术语
   */
  private isPotentialLegalTerm(term: string): boolean {
    const legalIndicators = [
      'contract', 'agreement', 'liability', 'damages', 'tort',
      'statute', 'regulation', 'precedent', 'jurisdiction', 'venue',
      'plaintiff', 'defendant', 'discovery', 'deposition', 'motion',
      'injunction', 'remedy', 'breach', 'clause', 'provision',
      'fiduciary', 'negligence', 'compliance', 'due process'
    ];
    
    return legalIndicators.some(indicator => 
      term.toLowerCase().includes(indicator.toLowerCase())
    );
  }
  
  /**
   * 获取术语上下文
   */
  private getTermContext(content: string, term: string, contextLength: number = 100): string {
    const index = content.toLowerCase().indexOf(term.toLowerCase());
    if (index === -1) return '';
    
    const start = Math.max(0, index - contextLength / 2);
    const end = Math.min(content.length, index + term.length + contextLength / 2);
    
    return content.substring(start, end).trim();
  }
  
  /**
   * 计算准确性评分
   */
  private calculateAccuracyScore(issues: TermIssue[]): number {
    let deduction = 0;
    
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical': deduction += 25; break;
        case 'high': deduction += 15; break;
        case 'medium': deduction += 10; break;
        case 'low': deduction += 5; break;
      }
    }
    
    return Math.max(0, 100 - deduction);
  }
  
  /**
   * 计算一致性评分
   */
  private calculateConsistencyScore(results: any): number {
    return results.score;
  }
  
  /**
   * 计算专业性评分
   */
  private calculateProfessionalismScore(results: any): number {
    return results.score;
  }
  
  /**
   * 确定引用格式状态
   */
  private determineCitationFormat(results: any): 'correct' | 'needs_review' | 'incorrect' {
    return results.format;
  }
  
  /**
   * 初始化法律术语数据库
   */
  private initializeLegalTerms(): void {
    const commonLegalTerms: LegalTerm[] = [
      {
        term: 'contract',
        practiceAreas: ['contract_law', 'corporate_law'],
        deprecated: false,
        correctSpelling: 'contract',
        commonMisspellings: ['contrct', 'contrat'],
        modernAlternative: ''
      },
      {
        term: 'tort',
        practiceAreas: ['litigation', 'personal_injury'],
        deprecated: false,
        correctSpelling: 'tort',
        commonMisspellings: ['torte'],
        modernAlternative: ''
      },
      {
        term: 'plaintiff',
        practiceAreas: ['litigation'],
        deprecated: false,
        correctSpelling: 'plaintiff',
        commonMisspellings: ['plantiff', 'plaintif'],
        modernAlternative: ''
      },
      {
        term: 'defendant',
        practiceAreas: ['litigation', 'criminal_defense'],
        deprecated: false,
        correctSpelling: 'defendant',
        commonMisspellings: ['defendaent', 'defendat'],
        modernAlternative: ''
      },
      // 可以扩展更多术语
    ];
    
    for (const term of commonLegalTerms) {
      this.legalTermDatabase.set(term.term.toLowerCase(), term);
    }
  }
  
  /**
   * 初始化引用格式模式
   */
  private initializeCitationPatterns(): void {
    // Bluebook citation patterns
    this.citationPatterns.set('case_citation', 
      /[A-Z][a-zA-Z\s&,\.]+v\.\s+[A-Z][a-zA-Z\s&,\.]+,\s*\d+\s+[A-Z][a-zA-Z]*\.?\s*\d+/
    );
    
    this.citationPatterns.set('statute_citation',
      /\d+\s+U\.S\.C\.?\s*§?\s*\d+/
    );
    
    this.citationPatterns.set('regulation_citation',
      /\d+\s+C\.F\.R\.?\s*§?\s*\d+/
    );
    
    // 可以添加更多引用格式
  }
  
  /**
   * 初始化常见错误映射
   */
  private initializeCommonErrors(): void {
    this.commonErrors.set('attorny', 'attorney');
    this.commonErrors.set('lible', 'liable');
    this.commonErrors.set('negligant', 'negligent');
    this.commonErrors.set('breech', 'breach');
    this.commonErrors.set('judgement', 'judgment'); // 美式拼写
    // 可以扩展更多常见错误
  }
  
  /**
   * 其他辅助方法的实现...
   */
  private getAlternativeTerm(term: string, practiceArea: LegalPracticeArea): string {
    // 根据执业领域返回更合适的术语
    const alternatives: Record<string, Record<LegalPracticeArea, string>> = {
      'agreement': {
        'contract_law': 'contract',
        'corporate_law': 'agreement',
        'real_estate': 'purchase agreement',
        'employment_law': 'employment agreement'
      }
    };
    
    return alternatives[term]?.[practiceArea] || term;
  }
  
  private isValidCitation(citation: string, type: string): boolean {
    // 实现具体的引用验证逻辑
    return true; // 简化实现
  }
  
  private getSuggestedCitationFormat(citation: string, type: string): string {
    // 返回建议的引用格式
    return `建议检查${type}引用格式`;
  }
  
  private findTermVariations(content: string): Map<string, string[]> {
    // 查找术语变体
    return new Map();
  }
  
  private getPreferredTermVariation(variations: string[]): string {
    // 返回首选术语变体
    return variations[0];
  }
  
  private getFormalAlternative(informalTerm: string): string {
    const formalAlternatives: Record<string, string> = {
      "can't": 'cannot',
      "won't": 'will not',
      "don't": 'do not',
      'really': '', // 建议删除
      'very': '', // 建议删除
    };
    
    return formalAlternatives[informalTerm.toLowerCase()] || informalTerm;
  }
  
  /**
   * 健康检查
   */
  async isHealthy(): Promise<boolean> {
    try {
      return (
        this.legalTermDatabase.size > 0 &&
        this.citationPatterns.size > 0 &&
        this.commonErrors.size > 0
      );
    } catch (error) {
      return false;
    }
  }
}

// 法律术语接口
interface LegalTerm {
  term: string;
  practiceAreas: LegalPracticeArea[];
  deprecated: boolean;
  correctSpelling: string;
  commonMisspellings: string[];
  modernAlternative: string;
}

export default LegalTermValidator;