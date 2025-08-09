/**
 * 企业级安全会话管理系统
 * 实现多层会话安全控制和设备绑定
 * 作者：Claude Security Auditor
 * 版本：v2.0 - 企业级安全标准
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { SecureJWT, JWTBlacklist, JWTPayload } from './secure-jwt';
import { SecureCrypto } from './secure-crypto';

export interface AdminSession {
  sessionId: string;
  userId: string; // 管理员ID
  loginTime: number;
  lastActivity: number;
  ip: string;
  userAgent: string;
  deviceFingerprint: string;
  multiFactorVerified: boolean;
  permissions: string[];
  maxInactivity: number; // 最大非活动时间（毫秒）
  maxSessionDuration: number; // 最大会话持续时间（毫秒）
  loginMethod: 'password' | 'mfa' | 'sso';
  riskScore: number; // 会话风险评分 (0-100)
  metadata: {
    browser?: string;
    os?: string;
    location?: string;
    timezone?: string;
  };
}

export interface SessionSecurityEvent {
  sessionId: string;
  type: 'login' | 'logout' | 'activity' | 'risk' | 'violation';
  timestamp: number;
  ip: string;
  details: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * 企业级安全会话管理器
 */
export class SecureSessionManager {
  private static sessions: Map<string, AdminSession> = new Map();
  private static securityEvents: SessionSecurityEvent[] = [];
  private static readonly MAX_EVENTS = 1000;
  private static readonly MAX_CONCURRENT_SESSIONS = 3;
  private static readonly DEFAULT_SESSION_TIMEOUT = 30 * 60 * 1000; // 30分钟
  private static readonly MAX_SESSION_DURATION = 8 * 60 * 60 * 1000; // 8小时

  /**
   * 创建安全会话
   * @param request 请求对象
   * @param userId 管理员ID
   * @param loginMethod 登录方式
   * @returns 会话信息和token
   */
  public static async createSecureSession(
    request: NextRequest,
    userId: string = 'admin',
    loginMethod: 'password' | 'mfa' | 'sso' = 'password'
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    session: AdminSession;
  }> {
    try {
      const sessionId = crypto.randomUUID();
      const deviceFingerprint = this.generateDeviceFingerprint(request);
      const ip = this.getClientIP(request);
      const userAgent = request.headers.get('user-agent') || '';
      const now = Date.now();

      // 检查并限制并发会话数
      await this.limitConcurrentSessions(userId, ip);

      // 分析用户设备信息
      const metadata = this.analyzeUserAgent(userAgent);

      // 计算初始风险评分
      const riskScore = this.calculateInitialRiskScore(request, loginMethod);

      // 创建会话对象
      const session: AdminSession = {
        sessionId,
        userId,
        loginTime: now,
        lastActivity: now,
        ip,
        userAgent,
        deviceFingerprint,
        multiFactorVerified: loginMethod === 'mfa',
        permissions: await this.getUserPermissions(userId),
        maxInactivity: this.DEFAULT_SESSION_TIMEOUT,
        maxSessionDuration: this.MAX_SESSION_DURATION,
        loginMethod,
        riskScore,
        metadata
      };

      // 存储会话
      this.sessions.set(sessionId, session);

      // 生成访问和刷新token
      const accessTokenPayload: Partial<JWTPayload> = {
        sessionId,
        permissions: session.permissions,
        deviceFingerprint
      };

      const refreshTokenPayload: Partial<JWTPayload> = {
        sessionId,
        deviceFingerprint
      };

      const accessToken = SecureJWT.generateSecureToken(accessTokenPayload, 'access');
      const refreshToken = SecureJWT.generateSecureToken(refreshTokenPayload, 'refresh');

      // 记录安全事件
      this.logSecurityEvent({
        sessionId,
        type: 'login',
        timestamp: now,
        ip,
        details: {
          userId,
          loginMethod,
          deviceFingerprint,
          userAgent,
          riskScore
        },
        riskLevel: riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low'
      });

      console.log(`[会话管理] 创建会话成功`, {
        sessionId,
        userId,
        ip,
        riskScore,
        loginMethod
      });

      return { accessToken, refreshToken, session };
    } catch (error) {
      console.error('[会话管理] 创建会话失败:', error);
      throw new Error('会话创建失败');
    }
  }

  /**
   * 验证会话安全性
   * @param request 请求对象
   * @param tokenType 期望的token类型
   * @returns 验证后的会话信息或null
   */
  public static async verifySecureSession(
    request: NextRequest,
    tokenType: 'access' | 'refresh' = 'access'
  ): Promise<AdminSession | null> {
    try {
      // 提取token
      const token = this.extractToken(request);
      if (!token) {
        return null;
      }

      // 检查token黑名单
      if (JWTBlacklist.isTokenBlacklisted(token)) {
        console.warn('[会话管理] Token已被黑名单');
        return null;
      }

      // 验证JWT token
      const payload = SecureJWT.verifyAndParseToken(token, tokenType);
      if (!payload) {
        return null;
      }

      // 获取会话信息
      const session = this.sessions.get(payload.sessionId);
      if (!session) {
        console.warn('[会话管理] 会话不存在');
        return null;
      }

      const now = Date.now();
      const currentIp = this.getClientIP(request);
      const currentFingerprint = this.generateDeviceFingerprint(request);

      // 会话有效性检查
      const validationResult = this.validateSession(session, request, now);
      if (!validationResult.valid) {
        console.warn(`[会话管理] 会话验证失败: ${validationResult.reason}`);
        await this.invalidateSession(payload.sessionId, validationResult.reason);
        return null;
      }

      // 设备指纹验证
      if (session.deviceFingerprint !== currentFingerprint) {
        console.warn('[会话管理] 设备指纹不匹配，可能存在会话劫持');
        await this.invalidateSession(payload.sessionId, 'device_fingerprint_mismatch');
        
        this.logSecurityEvent({
          sessionId: payload.sessionId,
          type: 'violation',
          timestamp: now,
          ip: currentIp,
          details: {
            reason: 'device_fingerprint_mismatch',
            expected: session.deviceFingerprint,
            actual: currentFingerprint
          },
          riskLevel: 'critical'
        });
        
        return null;
      }

      // IP地址变化检查
      if (session.ip !== currentIp) {
        const riskIncrease = this.assessIPChangeRisk(session.ip, currentIp);
        session.riskScore = Math.min(100, session.riskScore + riskIncrease);
        
        if (session.riskScore > 80) {
          console.warn('[会话管理] IP变化风险过高');
          await this.invalidateSession(payload.sessionId, 'high_risk_ip_change');
          return null;
        }
        
        // 记录IP变化
        this.logSecurityEvent({
          sessionId: payload.sessionId,
          type: 'risk',
          timestamp: now,
          ip: currentIp,
          details: {
            previousIP: session.ip,
            newIP: currentIp,
            riskIncrease,
            newRiskScore: session.riskScore
          },
          riskLevel: riskIncrease > 30 ? 'high' : 'medium'
        });
        
        // 更新会话IP
        session.ip = currentIp;
      }

      // 更新会话活动时间
      session.lastActivity = now;
      this.sessions.set(payload.sessionId, session);

      // 记录活动事件 (采样记录，避免日志过多)
      if (Math.random() < 0.1) { // 10%的概率记录
        this.logSecurityEvent({
          sessionId: payload.sessionId,
          type: 'activity',
          timestamp: now,
          ip: currentIp,
          details: {
            endpoint: request.url,
            method: request.method
          },
          riskLevel: 'low'
        });
      }

      return session;
    } catch (error) {
      console.error('[会话管理] 会话验证失败:', error);
      return null;
    }
  }

  /**
   * 验证会话有效性
   * @param session 会话对象
   * @param request 请求对象
   * @param currentTime 当前时间戳
   * @returns 验证结果
   */
  private static validateSession(
    session: AdminSession,
    request: NextRequest,
    currentTime: number
  ): { valid: boolean; reason?: string } {
    // 检查会话是否过期
    if (currentTime - session.lastActivity > session.maxInactivity) {
      return { valid: false, reason: 'session_timeout' };
    }

    // 检查会话总持续时间
    if (currentTime - session.loginTime > session.maxSessionDuration) {
      return { valid: false, reason: 'max_duration_exceeded' };
    }

    // 检查风险评分
    if (session.riskScore > 90) {
      return { valid: false, reason: 'high_risk_score' };
    }

    return { valid: true };
  }

  /**
   * 失效会话
   * @param sessionId 会话ID
   * @param reason 失效原因
   */
  public static async invalidateSession(sessionId: string, reason: string = 'manual'): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      
      if (session) {
        // 记录登出事件
        this.logSecurityEvent({
          sessionId,
          type: 'logout',
          timestamp: Date.now(),
          ip: session.ip,
          details: {
            reason,
            sessionDuration: Date.now() - session.loginTime
          },
          riskLevel: reason.includes('violation') || reason.includes('risk') ? 'high' : 'low'
        });

        // 移除会话
        this.sessions.delete(sessionId);
        
        // 将会话相关的token加入黑名单
        JWTBlacklist.blacklistSession(sessionId);
        
        console.log(`[会话管理] 会话已失效: ${sessionId}, 原因: ${reason}`);
      }
    } catch (error) {
      console.error('[会话管理] 会话失效失败:', error);
    }
  }

  /**
   * 刷新访问token
   * @param request 请求对象
   * @returns 新的访问token或null
   */
  public static async refreshAccessToken(request: NextRequest): Promise<string | null> {
    try {
      const session = await this.verifySecureSession(request, 'refresh');
      if (!session) {
        return null;
      }

      // 生成新的访问token
      const accessTokenPayload: Partial<JWTPayload> = {
        sessionId: session.sessionId,
        permissions: session.permissions,
        deviceFingerprint: session.deviceFingerprint
      };

      const newAccessToken = SecureJWT.generateSecureToken(accessTokenPayload, 'access');
      
      console.log(`[会话管理] 访问token已刷新: ${session.sessionId}`);
      
      return newAccessToken;
    } catch (error) {
      console.error('[会话管理] Token刷新失败:', error);
      return null;
    }
  }

  /**
   * 限制并发会话数
   * @param userId 用户ID
   * @param currentIp 当前IP
   */
  private static async limitConcurrentSessions(userId: string, currentIp: string): Promise<void> {
    const userSessions = Array.from(this.sessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => b.lastActivity - a.lastActivity);

    if (userSessions.length >= this.MAX_CONCURRENT_SESSIONS) {
      // 移除最旧的会话
      const oldestSession = userSessions[userSessions.length - 1];
      await this.invalidateSession(oldestSession.sessionId, 'concurrent_session_limit');
    }
  }

  /**
   * 生成设备指纹
   * @param request 请求对象
   * @returns 设备指纹字符串
   */
  private static generateDeviceFingerprint(request: NextRequest): string {
    const components = [
      request.headers.get('user-agent') || '',
      request.headers.get('accept-language') || '',
      request.headers.get('accept-encoding') || '',
      request.headers.get('accept') || '',
      this.getClientIP(request),
      // 添加更多指纹组件以提高唯一性
      request.headers.get('sec-ch-ua') || '',
      request.headers.get('sec-ch-ua-platform') || '',
    ].filter(Boolean);

    return crypto
      .createHash('sha256')
      .update(components.join('|'))
      .digest('hex')
      .substring(0, 32);
  }

  /**
   * 获取客户端IP地址
   * @param request 请求对象
   * @returns IP地址
   */
  private static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) return realIp;

    const clientIp = request.headers.get('x-client-ip');
    if (clientIp) return clientIp;

    return request.ip || '127.0.0.1';
  }

  /**
   * 分析用户代理字符串
   * @param userAgent 用户代理字符串
   * @returns 设备信息
   */
  private static analyzeUserAgent(userAgent: string): AdminSession['metadata'] {
    const metadata: AdminSession['metadata'] = {};

    // 简单的浏览器检测
    if (userAgent.includes('Chrome')) {
      metadata.browser = 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      metadata.browser = 'Firefox';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      metadata.browser = 'Safari';
    } else if (userAgent.includes('Edge')) {
      metadata.browser = 'Edge';
    }

    // 简单的操作系统检测
    if (userAgent.includes('Windows')) {
      metadata.os = 'Windows';
    } else if (userAgent.includes('Mac')) {
      metadata.os = 'macOS';
    } else if (userAgent.includes('Linux')) {
      metadata.os = 'Linux';
    } else if (userAgent.includes('Android')) {
      metadata.os = 'Android';
    } else if (userAgent.includes('iOS')) {
      metadata.os = 'iOS';
    }

    return metadata;
  }

  /**
   * 计算初始风险评分
   * @param request 请求对象
   * @param loginMethod 登录方式
   * @returns 风险评分 (0-100)
   */
  private static calculateInitialRiskScore(
    request: NextRequest,
    loginMethod: 'password' | 'mfa' | 'sso'
  ): number {
    let riskScore = 0;

    // 基础风险评分
    switch (loginMethod) {
      case 'password':
        riskScore += 30; // 仅密码登录有一定风险
        break;
      case 'mfa':
        riskScore += 10; // MFA登录风险较低
        break;
      case 'sso':
        riskScore += 15; // SSO登录中等风险
        break;
    }

    // IP地址风险评估
    const ip = this.getClientIP(request);
    if (this.isPrivateIP(ip)) {
      riskScore -= 10; // 内网IP风险较低
    } else {
      riskScore += 20; // 公网IP风险较高
    }

    // 用户代理风险评估
    const userAgent = request.headers.get('user-agent') || '';
    if (!userAgent || userAgent.length < 50) {
      riskScore += 25; // 异常或缺失的用户代理
    }

    return Math.min(100, Math.max(0, riskScore));
  }

  /**
   * 评估IP变化风险
   * @param oldIP 原IP地址
   * @param newIP 新IP地址
   * @returns 风险增加值
   */
  private static assessIPChangeRisk(oldIP: string, newIP: string): number {
    // 如果都是内网IP，风险较低
    if (this.isPrivateIP(oldIP) && this.isPrivateIP(newIP)) {
      return 5;
    }

    // 如果从内网切换到外网，风险中等
    if (this.isPrivateIP(oldIP) && !this.isPrivateIP(newIP)) {
      return 20;
    }

    // 如果从外网切换到内网，风险较低
    if (!this.isPrivateIP(oldIP) && this.isPrivateIP(newIP)) {
      return 10;
    }

    // 都是外网IP的切换，风险较高
    return 30;
  }

  /**
   * 检查是否为私有IP地址
   * @param ip IP地址
   * @returns 是否为私有IP
   */
  private static isPrivateIP(ip: string): boolean {
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
      return true;
    }

    // IPv4私有地址范围
    const ipv4Private = [
      /^10\./, // 10.0.0.0/8
      /^172\.(1[6-9]|2[0-9]|3[01])\./, // 172.16.0.0/12
      /^192\.168\./ // 192.168.0.0/16
    ];

    return ipv4Private.some(pattern => pattern.test(ip));
  }

  /**
   * 获取用户权限
   * @param userId 用户ID
   * @returns 权限列表
   */
  private static async getUserPermissions(userId: string): Promise<string[]> {
    // 简单的权限实现，实际应用中应从数据库获取
    const defaultPermissions = [
      'admin:read',
      'admin:config',
      'admin:templates',
      'admin:users'
    ];

    // 超级管理员权限
    if (userId === 'admin' || userId === 'superadmin') {
      return [
        ...defaultPermissions,
        'admin:write',
        'admin:delete',
        'admin:security',
        'admin:system'
      ];
    }

    return defaultPermissions;
  }

  /**
   * 提取请求中的token
   * @param request 请求对象
   * @returns Token字符串或null
   */
  private static extractToken(request: NextRequest): string | null {
    // 1. 尝试从Cookie获取
    const cookieToken = request.cookies.get('admin-session')?.value;
    if (cookieToken) return cookieToken;

    // 2. 尝试从Authorization header获取
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  /**
   * 记录安全事件
   * @param event 安全事件
   */
  private static logSecurityEvent(event: SessionSecurityEvent): void {
    this.securityEvents.unshift(event);

    // 保持事件列表大小
    if (this.securityEvents.length > this.MAX_EVENTS) {
      this.securityEvents = this.securityEvents.slice(0, this.MAX_EVENTS);
    }

    // 高风险事件立即告警
    if (event.riskLevel === 'critical' || event.riskLevel === 'high') {
      console.warn(`🚨 [会话安全] ${event.type}: ${event.riskLevel}`, event.details);
    }
  }

  /**
   * 获取安全事件
   * @param filters 过滤条件
   * @returns 安全事件列表
   */
  public static getSecurityEvents(filters?: {
    sessionId?: string;
    type?: SessionSecurityEvent['type'];
    riskLevel?: SessionSecurityEvent['riskLevel'];
    startTime?: number;
    endTime?: number;
  }): SessionSecurityEvent[] {
    let events = this.securityEvents;

    if (filters) {
      events = events.filter(event => {
        if (filters.sessionId && event.sessionId !== filters.sessionId) return false;
        if (filters.type && event.type !== filters.type) return false;
        if (filters.riskLevel && event.riskLevel !== filters.riskLevel) return false;
        if (filters.startTime && event.timestamp < filters.startTime) return false;
        if (filters.endTime && event.timestamp > filters.endTime) return false;
        return true;
      });
    }

    return events;
  }

  /**
   * 获取活跃会话统计
   * @returns 会话统计信息
   */
  public static getSessionStats(): {
    totalSessions: number;
    activeUsers: number;
    averageRiskScore: number;
    highRiskSessions: number;
    recentLogins: number;
  } {
    const sessions = Array.from(this.sessions.values());
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    const totalSessions = sessions.length;
    const activeUsers = new Set(sessions.map(s => s.userId)).size;
    const averageRiskScore = sessions.reduce((sum, s) => sum + s.riskScore, 0) / totalSessions || 0;
    const highRiskSessions = sessions.filter(s => s.riskScore > 70).length;
    const recentLogins = sessions.filter(s => s.loginTime > oneHourAgo).length;

    return {
      totalSessions,
      activeUsers,
      averageRiskScore: Math.round(averageRiskScore),
      highRiskSessions,
      recentLogins
    };
  }

  /**
   * 清理过期会话
   */
  public static cleanupExpiredSessions(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      const isExpired = (now - session.lastActivity) > session.maxInactivity;
      const isOverDuration = (now - session.loginTime) > session.maxSessionDuration;

      if (isExpired || isOverDuration) {
        this.invalidateSession(sessionId, isExpired ? 'timeout' : 'max_duration');
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[会话管理] 清理了 ${cleanedCount} 个过期会话`);
    }

    return cleanedCount;
  }
}

/**
 * 会话中间件工厂
 */
export function createSessionMiddleware() {
  return async function sessionMiddleware(
    request: NextRequest,
    handler: (request: NextRequest, session: AdminSession) => Promise<NextResponse>
  ): Promise<NextResponse> {
    try {
      // 验证会话
      const session = await SecureSessionManager.verifySecureSession(request);
      
      if (!session) {
        return NextResponse.json(
          {
            success: false,
            error: '会话无效或已过期',
            code: 'SESSION_INVALID',
            timestamp: new Date().toISOString()
          },
          { status: 401 }
        );
      }

      // 调用业务处理器
      return await handler(request, session);
    } catch (error) {
      console.error('[会话中间件] 处理失败:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: '会话处理失败',
          code: 'SESSION_ERROR',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  };
}