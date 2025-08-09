/**
 * 企业级安全监控和审计日志系统
 * 提供实时威胁检测、事件记录和安全分析
 * 作者：Claude Security Auditor
 * 版本：v2.0 - 企业级安全标准
 */

import crypto from 'crypto';
import { SecureCrypto } from './secure-crypto';

export interface SecurityEvent {
  id: string;
  timestamp: number;
  category: 'authentication' | 'authorization' | 'input_validation' | 'rate_limiting' | 
            'csrf' | 'session' | 'data_access' | 'configuration' | 'system' | 'compliance';
  type: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  source: {
    ip: string;
    userAgent: string;
    sessionId?: string;
    userId?: string;
    endpoint?: string;
    method?: string;
  };
  target: {
    resource?: string;
    action?: string;
    data?: string;
  };
  outcome: 'success' | 'failure' | 'blocked' | 'warning';
  details: Record<string, any>;
  risk_score: number; // 0-100
  correlation_id?: string;
  geo_location?: {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
  };
  mitre_attack?: {
    tactic?: string;
    technique?: string;
    sub_technique?: string;
  };
}

export interface SecurityMetric {
  name: string;
  value: number;
  timestamp: number;
  tags: Record<string, string>;
}

export interface ThreatIndicator {
  id: string;
  type: 'ip' | 'user_agent' | 'pattern' | 'behavior';
  value: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  first_seen: number;
  last_seen: number;
  count: number;
  source: string;
  description: string;
  active: boolean;
}

export interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  condition: {
    event_type?: string;
    severity?: SecurityEvent['severity'][];
    threshold_count?: number;
    threshold_window?: number; // 毫秒
    risk_score_threshold?: number;
  };
  action: {
    type: 'log' | 'email' | 'webhook' | 'block_ip' | 'terminate_session';
    config: Record<string, any>;
  };
  created_at: number;
  updated_at: number;
}

/**
 * 安全事件监控器
 */
export class SecurityMonitor {
  private static events: SecurityEvent[] = [];
  private static metrics: SecurityMetric[] = [];
  private static threatIndicators: Map<string, ThreatIndicator> = new Map();
  private static alertRules: Map<string, AlertRule> = new Map();
  private static correlationGroups: Map<string, SecurityEvent[]> = new Map();
  
  private static readonly MAX_EVENTS = 10000;
  private static readonly MAX_METRICS = 5000;
  private static readonly CORRELATION_WINDOW = 5 * 60 * 1000; // 5分钟

  /**
   * 初始化安全监控系统
   */
  public static initialize(): void {
    // 创建默认的告警规则
    this.createDefaultAlertRules();
    
    // 启动定期清理任务
    this.startCleanupTasks();
    
    console.log('[安全监控] 安全监控系统已初始化');
  }

  /**
   * 记录安全事件
   * @param event 安全事件（部分信息）
   */
  public static logEvent(event: Partial<SecurityEvent>): void {
    try {
      const fullEvent: SecurityEvent = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        category: event.category || 'system',
        type: event.type || 'unknown',
        severity: event.severity || 'info',
        source: {
          ip: '127.0.0.1',
          userAgent: '',
          ...event.source
        },
        target: event.target || {},
        outcome: event.outcome || 'success',
        details: event.details || {},
        risk_score: event.risk_score || this.calculateRiskScore(event),
        correlation_id: event.correlation_id || this.generateCorrelationId(event),
        geo_location: event.geo_location,
        mitre_attack: event.mitre_attack
      };

      // 添加到事件列表
      this.events.unshift(fullEvent);
      
      // 保持事件数量限制
      if (this.events.length > this.MAX_EVENTS) {
        this.events = this.events.slice(0, this.MAX_EVENTS);
      }

      // 更新威胁指标
      this.updateThreatIndicators(fullEvent);
      
      // 事件关联分析
      this.correlateEvents(fullEvent);
      
      // 检查告警规则
      this.checkAlertRules(fullEvent);
      
      // 记录指标
      this.recordMetrics(fullEvent);

      // 输出日志
      const logLevel = this.getLogLevel(fullEvent.severity);
      console[logLevel](
        `[安全监控] ${fullEvent.category}:${fullEvent.type}`,
        {
          severity: fullEvent.severity,
          outcome: fullEvent.outcome,
          risk_score: fullEvent.risk_score,
          source_ip: fullEvent.source.ip,
          details: fullEvent.details
        }
      );

    } catch (error) {
      console.error('[安全监控] 事件记录失败:', error);
    }
  }

  /**
   * 计算事件风险评分
   * @param event 事件信息
   * @returns 风险评分 (0-100)
   */
  private static calculateRiskScore(event: Partial<SecurityEvent>): number {
    let score = 0;

    // 基于严重性的评分
    switch (event.severity) {
      case 'critical': score += 80; break;
      case 'high': score += 60; break;
      case 'medium': score += 40; break;
      case 'low': score += 20; break;
      case 'info': score += 10; break;
    }

    // 基于结果的评分
    switch (event.outcome) {
      case 'failure': score += 20; break;
      case 'blocked': score += 15; break;
      case 'warning': score += 10; break;
      case 'success': score += 0; break;
    }

    // 基于类别的评分
    switch (event.category) {
      case 'authentication': score += 15; break;
      case 'authorization': score += 15; break;
      case 'data_access': score += 10; break;
      case 'session': score += 10; break;
      case 'input_validation': score += 5; break;
    }

    // IP地址风险评估
    if (event.source?.ip && !this.isInternalIP(event.source.ip)) {
      score += 10; // 外部IP增加风险
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * 生成事件关联ID
   * @param event 事件信息
   * @returns 关联ID
   */
  private static generateCorrelationId(event: Partial<SecurityEvent>): string {
    const components = [
      event.source?.ip || '',
      event.source?.sessionId || '',
      event.source?.userId || '',
      event.category || '',
      event.type || ''
    ];
    
    return crypto
      .createHash('md5')
      .update(components.join('|'))
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * 事件关联分析
   * @param event 新事件
   */
  private static correlateEvents(event: SecurityEvent): void {
    const correlationId = event.correlation_id;
    if (!correlationId) return;

    // 获取或创建关联组
    const group = this.correlationGroups.get(correlationId) || [];
    
    // 过滤时间窗口内的事件
    const now = Date.now();
    const recentEvents = group.filter(e => now - e.timestamp < this.CORRELATION_WINDOW);
    
    // 添加新事件
    recentEvents.push(event);
    this.correlationGroups.set(correlationId, recentEvents);

    // 分析关联模式
    if (recentEvents.length >= 3) {
      this.analyzeCorrelationPattern(correlationId, recentEvents);
    }
  }

  /**
   * 分析关联模式
   * @param correlationId 关联ID
   * @param events 关联事件
   */
  private static analyzeCorrelationPattern(correlationId: string, events: SecurityEvent[]): void {
    const patterns = [
      this.detectBruteForcePattern(events),
      this.detectEscalationPattern(events),
      this.detectReconnaissancePattern(events)
    ].filter(Boolean);

    if (patterns.length > 0) {
      this.logEvent({
        category: 'system',
        type: 'correlation_detected',
        severity: 'high',
        source: events[0].source,
        outcome: 'warning',
        details: {
          correlation_id: correlationId,
          pattern_count: patterns.length,
          patterns: patterns,
          event_count: events.length,
          time_span: events[events.length - 1].timestamp - events[0].timestamp
        },
        risk_score: 70
      });
    }
  }

  /**
   * 检测暴力破解模式
   * @param events 事件列表
   * @returns 检测结果
   */
  private static detectBruteForcePattern(events: SecurityEvent[]): string | null {
    const authEvents = events.filter(e => 
      e.category === 'authentication' && e.outcome === 'failure'
    );
    
    if (authEvents.length >= 5) {
      return 'brute_force_attempt';
    }
    
    return null;
  }

  /**
   * 检测权限提升模式
   * @param events 事件列表
   * @returns 检测结果
   */
  private static detectEscalationPattern(events: SecurityEvent[]): string | null {
    const authSuccess = events.some(e => 
      e.category === 'authentication' && e.outcome === 'success'
    );
    const authzFailures = events.filter(e => 
      e.category === 'authorization' && e.outcome === 'failure'
    );
    
    if (authSuccess && authzFailures.length >= 3) {
      return 'privilege_escalation_attempt';
    }
    
    return null;
  }

  /**
   * 检测侦察模式
   * @param events 事件列表
   * @returns 检测结果
   */
  private static detectReconnaissancePattern(events: SecurityEvent[]): string | null {
    const uniqueEndpoints = new Set(
      events.map(e => e.source.endpoint).filter(Boolean)
    );
    
    if (uniqueEndpoints.size >= 10) {
      return 'reconnaissance_activity';
    }
    
    return null;
  }

  /**
   * 更新威胁指标
   * @param event 安全事件
   */
  private static updateThreatIndicators(event: SecurityEvent): void {
    const indicators: Array<{type: ThreatIndicator['type']; value: string; severity: ThreatIndicator['severity']}> = [];

    // IP地址指标
    if (event.source.ip && event.severity !== 'info') {
      indicators.push({
        type: 'ip',
        value: event.source.ip,
        severity: event.severity === 'critical' ? 'critical' : 
                 event.severity === 'high' ? 'high' : 'medium'
      });
    }

    // User-Agent指标
    if (event.source.userAgent && this.isSuspiciousUserAgent(event.source.userAgent)) {
      indicators.push({
        type: 'user_agent',
        value: event.source.userAgent,
        severity: 'medium'
      });
    }

    // 更新或创建指标
    indicators.forEach(indicator => {
      const key = `${indicator.type}:${indicator.value}`;
      const existing = this.threatIndicators.get(key);

      if (existing) {
        existing.count++;
        existing.last_seen = event.timestamp;
        existing.severity = this.escalateSeverity(existing.severity, indicator.severity);
      } else {
        this.threatIndicators.set(key, {
          id: crypto.randomUUID(),
          type: indicator.type,
          value: indicator.value,
          severity: indicator.severity,
          first_seen: event.timestamp,
          last_seen: event.timestamp,
          count: 1,
          source: 'security_monitor',
          description: `Detected from security event: ${event.type}`,
          active: true
        });
      }
    });
  }

  /**
   * 严重性等级提升
   * @param current 当前严重性
   * @param new_severity 新严重性
   * @returns 更高的严重性
   */
  private static escalateSeverity(
    current: ThreatIndicator['severity'], 
    new_severity: ThreatIndicator['severity']
  ): ThreatIndicator['severity'] {
    const levels = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
    const currentLevel = levels[current];
    const newLevel = levels[new_severity];
    
    return currentLevel >= newLevel ? current : new_severity;
  }

  /**
   * 检查是否为可疑User-Agent
   * @param userAgent User-Agent字符串
   * @returns 是否可疑
   */
  private static isSuspiciousUserAgent(userAgent: string): boolean {
    const suspicious = [
      'sqlmap', 'nikto', 'nmap', 'burpsuite', 'wget', 'curl',
      'python-requests', 'postman', 'insomnia'
    ];
    
    return suspicious.some(pattern => 
      userAgent.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * 检查告警规则
   * @param event 安全事件
   */
  private static checkAlertRules(event: SecurityEvent): void {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;

      if (this.matchesRule(event, rule)) {
        this.executeAlert(rule, event);
      }
    }
  }

  /**
   * 检查事件是否匹配告警规则
   * @param event 安全事件
   * @param rule 告警规则
   * @returns 是否匹配
   */
  private static matchesRule(event: SecurityEvent, rule: AlertRule): boolean {
    const condition = rule.condition;

    // 事件类型匹配
    if (condition.event_type && event.type !== condition.event_type) {
      return false;
    }

    // 严重性匹配
    if (condition.severity && !condition.severity.includes(event.severity)) {
      return false;
    }

    // 风险评分阈值
    if (condition.risk_score_threshold && event.risk_score < condition.risk_score_threshold) {
      return false;
    }

    // 时间窗口内的事件数量阈值
    if (condition.threshold_count && condition.threshold_window) {
      const windowStart = Date.now() - condition.threshold_window;
      const recentEvents = this.events.filter(e => 
        e.timestamp > windowStart &&
        e.type === event.type &&
        e.source.ip === event.source.ip
      );

      if (recentEvents.length < condition.threshold_count) {
        return false;
      }
    }

    return true;
  }

  /**
   * 执行告警动作
   * @param rule 告警规则
   * @param event 触发事件
   */
  private static executeAlert(rule: AlertRule, event: SecurityEvent): void {
    try {
      switch (rule.action.type) {
        case 'log':
          console.error(`🚨 [安全告警] ${rule.name}`, {
            event_id: event.id,
            severity: event.severity,
            details: event.details
          });
          break;

        case 'email':
          // 实现邮件告警
          this.sendEmailAlert(rule, event);
          break;

        case 'webhook':
          // 实现Webhook告警
          this.sendWebhookAlert(rule, event);
          break;

        case 'block_ip':
          // 实现IP封禁（需要与防火墙集成）
          this.blockIP(event.source.ip, rule.action.config);
          break;

        case 'terminate_session':
          // 终止会话
          if (event.source.sessionId) {
            this.terminateSession(event.source.sessionId);
          }
          break;
      }

      // 记录告警执行
      this.logEvent({
        category: 'system',
        type: 'alert_executed',
        severity: 'info',
        source: event.source,
        outcome: 'success',
        details: {
          rule_id: rule.id,
          rule_name: rule.name,
          action_type: rule.action.type,
          trigger_event_id: event.id
        }
      });

    } catch (error) {
      console.error('[安全监控] 告警执行失败:', error);
    }
  }

  /**
   * 发送邮件告警
   * @param rule 告警规则
   * @param event 事件
   */
  private static async sendEmailAlert(rule: AlertRule, event: SecurityEvent): Promise<void> {
    // 实现邮件告警逻辑
    console.log(`📧 邮件告警: ${rule.name}`, event);
  }

  /**
   * 发送Webhook告警
   * @param rule 告警规则
   * @param event 事件
   */
  private static async sendWebhookAlert(rule: AlertRule, event: SecurityEvent): Promise<void> {
    // 实现Webhook告警逻辑
    console.log(`🔗 Webhook告警: ${rule.name}`, event);
  }

  /**
   * 封禁IP地址
   * @param ip IP地址
   * @param config 配置
   */
  private static blockIP(ip: string, config: Record<string, any>): void {
    console.warn(`🚫 IP封禁: ${ip}`, config);
    // 实际实现需要与防火墙或WAF集成
  }

  /**
   * 终止会话
   * @param sessionId 会话ID
   */
  private static terminateSession(sessionId: string): void {
    console.warn(`⛔ 会话终止: ${sessionId}`);
    // 实际实现需要与会话管理器集成
  }

  /**
   * 记录指标
   * @param event 安全事件
   */
  private static recordMetrics(event: SecurityEvent): void {
    const metrics: SecurityMetric[] = [
      {
        name: 'security_events_total',
        value: 1,
        timestamp: Date.now(),
        tags: {
          category: event.category,
          type: event.type,
          severity: event.severity,
          outcome: event.outcome
        }
      },
      {
        name: 'security_risk_score',
        value: event.risk_score,
        timestamp: Date.now(),
        tags: {
          source_ip: event.source.ip,
          category: event.category
        }
      }
    ];

    this.metrics.push(...metrics);

    // 保持指标数量限制
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(0, this.MAX_METRICS);
    }
  }

  /**
   * 创建默认告警规则
   */
  private static createDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high_risk_events',
        name: '高风险事件告警',
        enabled: true,
        condition: {
          severity: ['high', 'critical'],
          risk_score_threshold: 70
        },
        action: {
          type: 'log',
          config: {}
        },
        created_at: Date.now(),
        updated_at: Date.now()
      },
      {
        id: 'auth_failures',
        name: '认证失败告警',
        enabled: true,
        condition: {
          event_type: 'login_failed',
          threshold_count: 5,
          threshold_window: 5 * 60 * 1000 // 5分钟
        },
        action: {
          type: 'block_ip',
          config: { duration: 3600000 } // 1小时
        },
        created_at: Date.now(),
        updated_at: Date.now()
      }
    ];

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule);
    });
  }

  /**
   * 启动清理任务
   */
  private static startCleanupTasks(): void {
    // 每小时清理一次过期数据
    setInterval(() => {
      this.cleanupExpiredData();
    }, 60 * 60 * 1000);

    // 每天生成安全摘要报告
    setInterval(() => {
      this.generateDailySummary();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * 清理过期数据
   */
  private static cleanupExpiredData(): void {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    // 清理过期的关联组
    for (const [id, events] of this.correlationGroups.entries()) {
      const validEvents = events.filter(e => e.timestamp > oneDayAgo);
      if (validEvents.length === 0) {
        this.correlationGroups.delete(id);
      } else {
        this.correlationGroups.set(id, validEvents);
      }
    }

    // 清理非活跃的威胁指标
    for (const [key, indicator] of this.threatIndicators.entries()) {
      if (now - indicator.last_seen > 7 * 24 * 60 * 60 * 1000) { // 7天未见
        indicator.active = false;
      }
    }

    console.log('[安全监控] 过期数据清理完成');
  }

  /**
   * 生成每日安全摘要
   */
  private static generateDailySummary(): void {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    const recentEvents = this.events.filter(e => e.timestamp > oneDayAgo);
    const summary = {
      total_events: recentEvents.length,
      by_severity: this.groupBy(recentEvents, 'severity'),
      by_category: this.groupBy(recentEvents, 'category'),
      by_outcome: this.groupBy(recentEvents, 'outcome'),
      top_source_ips: this.getTopSourceIPs(recentEvents),
      average_risk_score: this.calculateAverageRiskScore(recentEvents),
      threat_indicators: this.threatIndicators.size,
      active_correlations: this.correlationGroups.size
    };

    console.log('📊 [安全监控] 每日安全摘要', summary);
  }

  /**
   * 按字段分组统计
   * @param events 事件列表
   * @param field 字段名
   * @returns 分组统计结果
   */
  private static groupBy(events: SecurityEvent[], field: keyof SecurityEvent): Record<string, number> {
    return events.reduce((acc, event) => {
      const value = String(event[field]);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * 获取访问量最多的源IP
   * @param events 事件列表
   * @returns 源IP统计
   */
  private static getTopSourceIPs(events: SecurityEvent[]): Array<{ip: string; count: number}> {
    const ipCounts = events.reduce((acc, event) => {
      const ip = event.source.ip;
      acc[ip] = (acc[ip] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(ipCounts)
      .map(([ip, count]) => ({ip, count}))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * 计算平均风险评分
   * @param events 事件列表
   * @returns 平均风险评分
   */
  private static calculateAverageRiskScore(events: SecurityEvent[]): number {
    if (events.length === 0) return 0;
    
    const totalScore = events.reduce((sum, event) => sum + event.risk_score, 0);
    return Math.round(totalScore / events.length);
  }

  /**
   * 获取日志级别
   * @param severity 严重性
   * @returns 日志级别
   */
  private static getLogLevel(severity: SecurityEvent['severity']): 'log' | 'info' | 'warn' | 'error' {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warn';
      case 'low': return 'info';
      case 'info': return 'log';
    }
  }

  /**
   * 检查是否为内网IP
   * @param ip IP地址
   * @returns 是否为内网IP
   */
  private static isInternalIP(ip: string): boolean {
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
      return true;
    }

    const internalRanges = [
      /^10\./, // 10.0.0.0/8
      /^172\.(1[6-9]|2[0-9]|3[01])\./, // 172.16.0.0/12
      /^192\.168\./, // 192.168.0.0/16
      /^169\.254\./ // 169.254.0.0/16 (链路本地)
    ];

    return internalRanges.some(range => range.test(ip));
  }

  /**
   * 获取安全事件
   * @param filters 过滤条件
   * @returns 安全事件列表
   */
  public static getSecurityEvents(filters?: {
    category?: SecurityEvent['category'];
    severity?: SecurityEvent['severity'];
    outcome?: SecurityEvent['outcome'];
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): SecurityEvent[] {
    let events = this.events;

    if (filters) {
      events = events.filter(event => {
        if (filters.category && event.category !== filters.category) return false;
        if (filters.severity && event.severity !== filters.severity) return false;
        if (filters.outcome && event.outcome !== filters.outcome) return false;
        if (filters.startTime && event.timestamp < filters.startTime) return false;
        if (filters.endTime && event.timestamp > filters.endTime) return false;
        return true;
      });
    }

    if (filters?.limit) {
      events = events.slice(0, filters.limit);
    }

    return events;
  }

  /**
   * 获取威胁指标
   * @param filters 过滤条件
   * @returns 威胁指标列表
   */
  public static getThreatIndicators(filters?: {
    type?: ThreatIndicator['type'];
    severity?: ThreatIndicator['severity'];
    active?: boolean;
  }): ThreatIndicator[] {
    const indicators = Array.from(this.threatIndicators.values());

    if (!filters) return indicators;

    return indicators.filter(indicator => {
      if (filters.type && indicator.type !== filters.type) return false;
      if (filters.severity && indicator.severity !== filters.severity) return false;
      if (filters.active !== undefined && indicator.active !== filters.active) return false;
      return true;
    });
  }

  /**
   * 获取安全指标
   * @param filters 过滤条件
   * @returns 安全指标列表
   */
  public static getSecurityMetrics(filters?: {
    name?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): SecurityMetric[] {
    let metrics = this.metrics;

    if (filters) {
      metrics = metrics.filter(metric => {
        if (filters.name && metric.name !== filters.name) return false;
        if (filters.startTime && metric.timestamp < filters.startTime) return false;
        if (filters.endTime && metric.timestamp > filters.endTime) return false;
        return true;
      });
    }

    if (filters?.limit) {
      metrics = metrics.slice(0, filters.limit);
    }

    return metrics;
  }

  /**
   * 获取系统健康状态
   * @returns 健康状态报告
   */
  public static getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    metrics: {
      total_events: number;
      high_risk_events: number;
      active_threats: number;
      average_risk_score: number;
    };
    uptime: number;
  } {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    const recentEvents = this.events.filter(e => e.timestamp > oneHourAgo);
    const highRiskEvents = recentEvents.filter(e => e.risk_score > 70);
    const activeThreats = Array.from(this.threatIndicators.values()).filter(t => t.active);
    const averageRiskScore = this.calculateAverageRiskScore(recentEvents);

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (highRiskEvents.length > 10 || averageRiskScore > 60) {
      status = 'warning';
    }
    if (highRiskEvents.length > 50 || averageRiskScore > 80 || activeThreats.length > 10) {
      status = 'critical';
    }

    return {
      status,
      metrics: {
        total_events: recentEvents.length,
        high_risk_events: highRiskEvents.length,
        active_threats: activeThreats.length,
        average_risk_score: averageRiskScore
      },
      uptime: process.uptime() * 1000
    };
  }
}