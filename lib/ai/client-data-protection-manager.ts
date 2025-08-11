/**
 * 客户数据保护管理器
 * 确保律师-客户特权和零数据保留策略
 * 
 * 核心功能：
 * 1. 客户敏感信息检测和脱敏
 * 2. 律师-客户特权保护
 * 3. 零数据保留策略实施
 * 4. 数据最小化原则
 * 5. 安全传输和处理
 * 6. 合规日志记录
 */

// 数据敏感性级别
export type DataSensitivityLevel = 'low' | 'medium' | 'high' | 'privileged';

// 数据脱敏结果
export interface SanitizationResult {
  sanitizedContent: string;
  detectionsLog: DetectionLog[];
  riskLevel: 'minimal' | 'moderate' | 'high' | 'critical';
  recommendedActions: string[];
  retentionPolicy: 'immediate_deletion' | 'session_only' | 'encrypted_temporary' | 'no_retention';
  complianceFlags: ComplianceFlag[];
}

// 检测日志
export interface DetectionLog {
  type: 'pii' | 'client_name' | 'case_number' | 'financial_info' | 'privileged_communication';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string; // 在内容中的位置描述
  action: 'redacted' | 'masked' | 'removed' | 'flagged';
  originalLength: number;
  replacementPattern: string;
}

// 合规标记
export interface ComplianceFlag {
  rule: 'attorney_client_privilege' | 'hipaa' | 'ferpa' | 'gdpr' | 'ccpa' | 'state_privacy';
  triggered: boolean;
  severity: 'notice' | 'warning' | 'violation';
  description: string;
  requiredAction: string;
}

// 数据保护配置
export interface DataProtectionConfig {
  enableZeroRetention: boolean;
  maxSessionDuration: number; // 毫秒
  encryptionRequired: boolean;
  auditLogging: boolean;
  autoRedaction: boolean;
  strictMode: boolean; // 最严格的保护模式
}

/**
 * 客户数据保护管理器实现
 */
export class ClientDataProtectionManager {
  private config: DataProtectionConfig;
  private sensitivityPatterns: Map<string, SensitivityPattern>;
  private redactionReplacements: Map<string, string>;
  private sessionData: Map<string, SessionDataEntry>;
  
  constructor(config: Partial<DataProtectionConfig> = {}) {
    this.config = {
      enableZeroRetention: true,
      maxSessionDuration: 3600000, // 1小时
      encryptionRequired: true,
      auditLogging: true,
      autoRedaction: true,
      strictMode: true,
      ...config
    };
    
    this.sensitivityPatterns = new Map();
    this.redactionReplacements = new Map();
    this.sessionData = new Map();
    
    this.initializeSensitivityPatterns();
    this.initializeRedactionReplacements();
    this.startSessionCleanup();
  }
  
  /**
   * 输入内容脱敏处理
   */
  async sanitizeInput(
    content: string,
    sensitivityLevel: DataSensitivityLevel,
    sessionId?: string
  ): Promise<string> {
    try {
      const result = await this.performSanitization(content, sensitivityLevel);
      
      // 记录处理会话（如果需要）
      if (sessionId && this.config.auditLogging) {
        await this.recordSession(sessionId, {
          originalLength: content.length,
          processedLength: result.sanitizedContent.length,
          sensitivityLevel,
          detectionsCount: result.detectionsLog.length,
          riskLevel: result.riskLevel,
          timestamp: new Date().toISOString()
        });
      }
      
      // 如果是特权信息且启用零保留，立即清理
      if (sensitivityLevel === 'privileged' && this.config.enableZeroRetention) {
        // 不保留任何处理痕迹
        this.scheduleImmedateCleanup();
      }
      
      return result.sanitizedContent;
      
    } catch (error: any) {
      console.error('[ClientDataProtection] 脱敏失败:', error);
      
      // 安全失败策略：如果脱敏失败，拒绝处理敏感内容
      if (sensitivityLevel === 'privileged' || sensitivityLevel === 'high') {
        throw new Error('敏感数据保护处理失败，无法继续处理特权或高敏感度内容');
      }
      
      // 对于低敏感度内容，返回通用警告替代
      return '[内容已替换 - 数据保护处理失败，建议人工审查]';
    }
  }
  
  /**
   * 执行内容脱敏
   */
  private async performSanitization(
    content: string,
    sensitivityLevel: DataSensitivityLevel
  ): Promise<SanitizationResult> {
    const detectionsLog: DetectionLog[] = [];
    const complianceFlags: ComplianceFlag[] = [];
    let sanitizedContent = content;
    let riskLevel: 'minimal' | 'moderate' | 'high' | 'critical' = 'minimal';
    
    // 1. 个人身份信息 (PII) 检测和处理
    const piiResult = await this.detectAndHandlePII(sanitizedContent);
    sanitizedContent = piiResult.content;
    detectionsLog.push(...piiResult.detections);
    
    if (piiResult.detections.length > 0) {
      riskLevel = this.escalateRiskLevel(riskLevel, 'moderate');
      
      complianceFlags.push({
        rule: 'attorney_client_privilege',
        triggered: true,
        severity: 'warning',
        description: '检测到个人身份信息',
        requiredAction: '确保数据脱敏完整，考虑律师-客户特权保护'
      });
    }
    
    // 2. 客户名称检测
    const clientNameResult = await this.detectAndHandleClientNames(sanitizedContent);
    sanitizedContent = clientNameResult.content;
    detectionsLog.push(...clientNameResult.detections);
    
    // 3. 案件信息检测
    const caseInfoResult = await this.detectAndHandleCaseInfo(sanitizedContent);
    sanitizedContent = caseInfoResult.content;
    detectionsLog.push(...caseInfoResult.detections);
    
    // 4. 金融信息检测
    const financialResult = await this.detectAndHandleFinancialInfo(sanitizedContent);
    sanitizedContent = financialResult.content;
    detectionsLog.push(...financialResult.detections);
    
    if (financialResult.detections.length > 0) {
      riskLevel = this.escalateRiskLevel(riskLevel, 'high');
    }
    
    // 5. 特权通信检测
    const privilegedResult = await this.detectPrivilegedCommunication(sanitizedContent);
    if (privilegedResult.isPrivileged) {
      riskLevel = 'critical';
      
      complianceFlags.push({
        rule: 'attorney_client_privilege',
        triggered: true,
        severity: 'violation',
        description: '检测到可能的律师-客户特权通信',
        requiredAction: '立即停止处理，启用最高级别保护措施'
      });
      
      if (this.config.strictMode) {
        // 严格模式下，特权通信不允许任何处理
        throw new Error('检测到律师-客户特权通信，严格模式下禁止处理');
      }
    }
    
    // 6. 基于敏感度级别的额外保护
    const additionalProtection = await this.applySensitivityLevelProtection(
      sanitizedContent,
      sensitivityLevel
    );
    sanitizedContent = additionalProtection.content;
    detectionsLog.push(...additionalProtection.detections);
    complianceFlags.push(...additionalProtection.flags);
    
    // 7. 确定保留政策
    const retentionPolicy = this.determineRetentionPolicy(
      sensitivityLevel,
      riskLevel,
      detectionsLog
    );
    
    // 8. 生成建议行动
    const recommendedActions = this.generateRecommendedActions(
      sensitivityLevel,
      riskLevel,
      detectionsLog,
      complianceFlags
    );
    
    return {
      sanitizedContent,
      detectionsLog,
      riskLevel,
      recommendedActions,
      retentionPolicy,
      complianceFlags
    };
  }
  
  /**
   * 检测和处理PII
   */
  private async detectAndHandlePII(content: string): Promise<{
    content: string;
    detections: DetectionLog[];
  }> {
    const detections: DetectionLog[] = [];
    let processedContent = content;
    
    // 社会保障号码
    const ssnPattern = /\\b\\d{3}-?\\d{2}-?\\d{4}\\b/g;
    processedContent = processedContent.replace(ssnPattern, (match, offset) => {
      detections.push({
        type: 'pii',
        severity: 'critical',
        location: `Position ${offset}`,
        action: 'masked',
        originalLength: match.length,
        replacementPattern: '[SSN-REDACTED]'
      });
      return '[SSN-REDACTED]';
    });
    
    // 电话号码
    const phonePattern = /\b(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})\b/g;
    processedContent = processedContent.replace(phonePattern, (match, offset) => {
      detections.push({
        type: 'pii',
        severity: 'medium',
        location: `Position ${offset}`,
        action: 'masked',
        originalLength: match.length,
        replacementPattern: '[PHONE-REDACTED]'
      });
      return '[PHONE-REDACTED]';
    });
    
    // 电子邮件地址
    const emailPattern = /\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b/g;
    processedContent = processedContent.replace(emailPattern, (match, offset) => {
      detections.push({
        type: 'pii',
        severity: 'medium',
        location: `Position ${offset}`,
        action: 'masked',
        originalLength: match.length,
        replacementPattern: '[EMAIL-REDACTED]'
      });
      return '[EMAIL-REDACTED]';
    });
    
    // 地址信息（简化版）
    const addressPattern = /\\b\\d{1,5}\\s+[A-Za-z0-9\\s]+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd|Lane|Ln)\\b/gi;
    processedContent = processedContent.replace(addressPattern, (match, offset) => {
      detections.push({
        type: 'pii',
        severity: 'medium',
        location: `Position ${offset}`,
        action: 'redacted',
        originalLength: match.length,
        replacementPattern: '[ADDRESS-REDACTED]'
      });
      return '[ADDRESS-REDACTED]';
    });
    
    return {
      content: processedContent,
      detections
    };
  }
  
  /**
   * 检测和处理客户名称
   */
  private async detectAndHandleClientNames(content: string): Promise<{
    content: string;
    detections: DetectionLog[];
  }> {
    const detections: DetectionLog[] = [];
    let processedContent = content;
    
    // 检测可能的客户名称模式
    // 这是一个简化的实现，实际应用中需要更复杂的NER
    const clientNamePatterns = [
      /\\bClient:\\s*([A-Z][a-z]+\\s+[A-Z][a-z]+)/g,
      /\\b([A-Z][a-z]+\\s+[A-Z][a-z]+)\\s+v\\.\\s+/g, // 案件名称中的原告
      /\\bMr\\.\\s+([A-Z][a-z]+)|Ms\\.\\s+([A-Z][a-z]+)|Mrs\\.\\s+([A-Z][a-z]+)/g
    ];
    
    for (const pattern of clientNamePatterns) {
      processedContent = processedContent.replace(pattern, (match, ...groups) => {
        const name = groups.find(group => group !== undefined) || 'UNKNOWN';
        detections.push({
          type: 'client_name',
          severity: 'high',
          location: `Client name reference`,
          action: 'redacted',
          originalLength: match.length,
          replacementPattern: '[CLIENT-NAME-REDACTED]'
        });
        return match.replace(name, '[CLIENT-NAME-REDACTED]');
      });
    }
    
    return {
      content: processedContent,
      detections
    };
  }
  
  /**
   * 检测和处理案件信息
   */
  private async detectAndHandleCaseInfo(content: string): Promise<{
    content: string;
    detections: DetectionLog[];
  }> {
    const detections: DetectionLog[] = [];
    let processedContent = content;
    
    // 案件号码
    const caseNumberPattern = /\\b(?:Case|Docket)\\s*(?:No\\.?|Number)?\\s*:?\\s*([A-Z0-9-]+)\\b/gi;
    processedContent = processedContent.replace(caseNumberPattern, (match, caseNum) => {
      detections.push({
        type: 'case_number',
        severity: 'high',
        location: 'Case number reference',
        action: 'redacted',
        originalLength: caseNum.length,
        replacementPattern: '[CASE-NUM-REDACTED]'
      });
      return match.replace(caseNum, '[CASE-NUM-REDACTED]');
    });
    
    // 法庭名称和案件标题
    const courtCasePattern = /\\b([A-Z][a-zA-Z\\s]+)\\s+v\\.\\s+([A-Z][a-zA-Z\\s]+)\\b/g;
    processedContent = processedContent.replace(courtCasePattern, (match) => {
      detections.push({
        type: 'case_number',
        severity: 'medium',
        location: 'Court case reference',
        action: 'redacted',
        originalLength: match.length,
        replacementPattern: '[CASE-TITLE-REDACTED]'
      });
      return '[CASE-TITLE-REDACTED]';
    });
    
    return {
      content: processedContent,
      detections
    };
  }
  
  /**
   * 检测和处理金融信息
   */
  private async detectAndHandleFinancialInfo(content: string): Promise<{
    content: string;
    detections: DetectionLog[];
  }> {
    const detections: DetectionLog[] = [];
    let processedContent = content;
    
    // 银行账户信息
    const accountPattern = /\\b(?:Account|Acct)\\s*(?:No\\.?|Number)?\\s*:?\\s*([0-9-]{8,})\\b/gi;
    processedContent = processedContent.replace(accountPattern, (match, account) => {
      detections.push({
        type: 'financial_info',
        severity: 'critical',
        location: 'Bank account reference',
        action: 'redacted',
        originalLength: account.length,
        replacementPattern: '[ACCOUNT-REDACTED]'
      });
      return match.replace(account, '[ACCOUNT-REDACTED]');
    });
    
    // 信用卡信息
    const creditCardPattern = /\\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\\b/g;
    processedContent = processedContent.replace(creditCardPattern, (match) => {
      detections.push({
        type: 'financial_info',
        severity: 'critical',
        location: 'Credit card number',
        action: 'redacted',
        originalLength: match.length,
        replacementPattern: '[CARD-REDACTED]'
      });
      return '[CARD-REDACTED]';
    });
    
    // 金额信息（大额）
    const largeAmountPattern = /\\$[0-9]{1,3}(?:,[0-9]{3})*(?:\\.[0-9]{2})?/g;
    const amounts = content.match(largeAmountPattern) || [];
    for (const amount of amounts) {
      const numericValue = parseFloat(amount.replace(/[$,]/g, ''));
      if (numericValue >= 10000) { // 只处理大额金钱
        processedContent = processedContent.replace(amount, '[AMOUNT-REDACTED]');
        detections.push({
          type: 'financial_info',
          severity: 'medium',
          location: 'Large monetary amount',
          action: 'redacted',
          originalLength: amount.length,
          replacementPattern: '[AMOUNT-REDACTED]'
        });
      }
    }
    
    return {
      content: processedContent,
      detections
    };
  }
  
  /**
   * 检测特权通信
   */
  private async detectPrivilegedCommunication(content: string): Promise<{
    isPrivileged: boolean;
    confidence: number;
    indicators: string[];
  }> {
    const privilegedIndicators = [
      'attorney-client privilege',
      'confidential communication',
      'legal advice',
      'privileged and confidential',
      'work product',
      'attorney work product',
      'in confidence',
      'legal counsel',
      'privileged communication'
    ];
    
    const foundIndicators: string[] = [];
    let confidenceScore = 0;
    
    for (const indicator of privilegedIndicators) {
      const regex = new RegExp(indicator, 'gi');
      if (regex.test(content)) {
        foundIndicators.push(indicator);
        confidenceScore += 10;
      }
    }
    
    // 额外的上下文检查
    if (/\\bconfidential\\b.*\\battorney\\b|\\battorney\\b.*\\bconfidential\\b/gi.test(content)) {
      confidenceScore += 20;
    }
    
    if (/\\blegal advice\\b/gi.test(content)) {
      confidenceScore += 15;
    }
    
    return {
      isPrivileged: confidenceScore >= 20,
      confidence: Math.min(100, confidenceScore),
      indicators: foundIndicators
    };
  }
  
  /**
   * 应用敏感度级别保护
   */
  private async applySensitivityLevelProtection(
    content: string,
    sensitivityLevel: DataSensitivityLevel
  ): Promise<{
    content: string;
    detections: DetectionLog[];
    flags: ComplianceFlag[];
  }> {
    const detections: DetectionLog[] = [];
    const flags: ComplianceFlag[] = [];
    let processedContent = content;
    
    switch (sensitivityLevel) {
      case 'privileged':
        // 最高级别保护
        flags.push({
          rule: 'attorney_client_privilege',
          triggered: true,
          severity: 'warning',
          description: '处理特权级别内容',
          requiredAction: '确保零数据保留，加密所有传输'
        });
        
        // 额外的保护措施
        processedContent = this.applyStrictRedaction(processedContent);
        break;
        
      case 'high':
        // 高敏感度保护
        flags.push({
          rule: 'state_privacy',
          triggered: true,
          severity: 'notice',
          description: '处理高敏感度内容',
          requiredAction: '实施增强的数据保护措施'
        });
        break;
        
      case 'medium':
      case 'low':
        // 标准保护
        break;
    }
    
    return {
      content: processedContent,
      detections,
      flags
    };
  }
  
  /**
   * 应用严格脱敏
   */
  private applyStrictRedaction(content: string): string {
    // 在严格模式下，采用更保守的脱敏策略
    let processed = content;
    
    // 脱敏所有人名（简化版）
    processed = processed.replace(/\\b[A-Z][a-z]+\\s+[A-Z][a-z]+\\b/g, '[NAME-REDACTED]');
    
    // 脱敏所有数字序列
    processed = processed.replace(/\\b\\d{4,}\\b/g, '[NUMBER-REDACTED]');
    
    // 脱敏日期
    processed = processed.replace(/\\b\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4}\\b/g, '[DATE-REDACTED]');
    
    return processed;
  }
  
  /**
   * 确定保留政策
   */
  private determineRetentionPolicy(
    sensitivityLevel: DataSensitivityLevel,
    riskLevel: string,
    detections: DetectionLog[]
  ): 'immediate_deletion' | 'session_only' | 'encrypted_temporary' | 'no_retention' {
    if (sensitivityLevel === 'privileged' || riskLevel === 'critical') {
      return 'no_retention';
    }
    
    if (sensitivityLevel === 'high' || riskLevel === 'high') {
      return 'immediate_deletion';
    }
    
    if (detections.some(d => d.severity === 'critical')) {
      return 'session_only';
    }
    
    return 'encrypted_temporary';
  }
  
  /**
   * 生成推荐行动
   */
  private generateRecommendedActions(
    sensitivityLevel: DataSensitivityLevel,
    riskLevel: string,
    detections: DetectionLog[],
    flags: ComplianceFlag[]
  ): string[] {
    const actions: string[] = [];
    
    if (sensitivityLevel === 'privileged') {
      actions.push('确保启用零数据保留政策');
      actions.push('使用端到端加密处理');
      actions.push('限制访问权限至最小必要人员');
      actions.push('启用详细审计日志');
    }
    
    if (riskLevel === 'critical') {
      actions.push('立即启动数据保护应急程序');
      actions.push('通知合规官员');
      actions.push('考虑停止自动处理，转为人工审查');
    }
    
    if (detections.some(d => d.type === 'pii' && d.severity === 'critical')) {
      actions.push('验证PII脱敏完整性');
      actions.push('检查是否需要隐私法合规通知');
    }
    
    if (flags.some(f => f.rule === 'attorney_client_privilege')) {
      actions.push('确认律师-客户特权保护措施');
      actions.push('考虑获得客户明确同意');
    }
    
    // 通用建议
    actions.push('由执业律师审查数据处理合规性');
    actions.push('定期审查数据保护政策的有效性');
    
    return actions;
  }
  
  /**
   * 记录处理会话
   */
  private async recordSession(
    sessionId: string,
    sessionData: SessionDataEntry
  ): Promise<void> {
    if (!this.config.auditLogging) return;
    
    this.sessionData.set(sessionId, {
      ...sessionData,
      expiresAt: Date.now() + this.config.maxSessionDuration
    });
  }
  
  /**
   * 立即清理调度
   */
  private scheduleImmedateCleanup(): void {
    // 清理所有临时数据
    setTimeout(() => {
      this.sessionData.clear();
      // 请求垃圾回收（如果可用）
      if (global.gc) {
        global.gc();
      }
    }, 1000);
  }
  
  /**
   * 会话清理任务
   */
  private startSessionCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [sessionId, data] of this.sessionData.entries()) {
        if (data.expiresAt && data.expiresAt < now) {
          this.sessionData.delete(sessionId);
        }
      }
    }, 60000); // 每分钟清理一次
  }
  
  /**
   * 风险等级升级
   */
  private escalateRiskLevel(
    current: 'minimal' | 'moderate' | 'high' | 'critical',
    newLevel: 'minimal' | 'moderate' | 'high' | 'critical'
  ): 'minimal' | 'moderate' | 'high' | 'critical' {
    const levels = ['minimal', 'moderate', 'high', 'critical'];
    const currentIndex = levels.indexOf(current);
    const newIndex = levels.indexOf(newLevel);
    
    return levels[Math.max(currentIndex, newIndex)] as any;
  }
  
  /**
   * 初始化敏感性模式
   */
  private initializeSensitivityPatterns(): void {
    // 可以扩展为更复杂的模式库
  }
  
  /**
   * 初始化脱敏替换
   */
  private initializeRedactionReplacements(): void {
    this.redactionReplacements.set('ssn', '[SSN-REDACTED]');
    this.redactionReplacements.set('phone', '[PHONE-REDACTED]');
    this.redactionReplacements.set('email', '[EMAIL-REDACTED]');
    this.redactionReplacements.set('address', '[ADDRESS-REDACTED]');
    this.redactionReplacements.set('name', '[NAME-REDACTED]');
    this.redactionReplacements.set('account', '[ACCOUNT-REDACTED]');
  }
  
  /**
   * 获取数据保护统计
   */
  async getProtectionStatistics(): Promise<{
    totalSessions: number;
    activeSessions: number;
    totalDetections: number;
    riskDistribution: Record<string, number>;
  }> {
    const now = Date.now();
    const activeSessions = Array.from(this.sessionData.values())
      .filter(session => !session.expiresAt || session.expiresAt > now);
    
    const riskDistribution = activeSessions.reduce((dist, session) => {
      dist[session.riskLevel] = (dist[session.riskLevel] || 0) + 1;
      return dist;
    }, {} as Record<string, number>);
    
    const totalDetections = activeSessions.reduce(
      (total, session) => total + (session.detectionsCount || 0),
      0
    );
    
    return {
      totalSessions: this.sessionData.size,
      activeSessions: activeSessions.length,
      totalDetections,
      riskDistribution
    };
  }
  
  /**
   * 健康检查
   */
  async isHealthy(): Promise<boolean> {
    try {
      return (
        this.config.enableZeroRetention !== undefined &&
        this.sensitivityPatterns !== undefined &&
        this.redactionReplacements.size > 0
      );
    } catch (error) {
      return false;
    }
  }
}

// 接口定义
interface SensitivityPattern {
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  action: 'flag' | 'redact' | 'remove' | 'encrypt';
}

interface SessionDataEntry {
  originalLength: number;
  processedLength: number;
  sensitivityLevel: DataSensitivityLevel;
  detectionsCount: number;
  riskLevel: string;
  timestamp: string;
  expiresAt?: number;
}

export default ClientDataProtectionManager;