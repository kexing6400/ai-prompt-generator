/**
 * 管理后台认证中间件
 * 处理JWT认证、权限验证等
 * 作者：Claude Code (后端架构师)
 */

import { NextRequest, NextResponse } from 'next/server';
import { JwtUtils, ConfigCrypto } from './crypto';
import { ConfigManager } from './config-manager';

export interface AdminSession {
  sessionId: string;
  loginTime: number;
  ip: string;
  userAgent: string;
}

/**
 * 管理员认证类
 */
export class AdminAuth {
  private static readonly COOKIE_NAME = 'admin-session';
  private static readonly CSRF_HEADER = 'x-admin-csrf-token';
  
  /**
   * 验证管理员密码
   */
  public static async verifyAdminPassword(password: string): Promise<boolean> {
    try {
      const configManager = ConfigManager.getInstance();
      const hashedPassword = await configManager.getConfig('admin_password_hash');
      
      if (!hashedPassword) {
        console.warn('管理员密码未设置');
        return false;
      }
      
      return await ConfigCrypto.verifyPassword(password, hashedPassword);
    } catch (error) {
      console.error('密码验证失败:', error);
      return false;
    }
  }

  /**
   * 设置管理员密码
   */
  public static async setAdminPassword(password: string): Promise<boolean> {
    try {
      const hashedPassword = await ConfigCrypto.hashPassword(password);
      const configManager = ConfigManager.getInstance();
      
      return await configManager.updateConfig('admin_password_hash', hashedPassword, true);
    } catch (error) {
      console.error('设置密码失败:', error);
      return false;
    }
  }

  /**
   * 生成管理员会话
   */
  public static async createAdminSession(request: NextRequest): Promise<{
    token: string;
    session: AdminSession;
  }> {
    const sessionId = ConfigCrypto.generateSecureKey(16);
    const ip = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    
    const session: AdminSession = {
      sessionId,
      loginTime: Date.now(),
      ip,
      userAgent
    };

    // 获取会话持续时间
    const configManager = ConfigManager.getInstance();
    const sessionDuration = await configManager.getConfig('session_duration') || '86400';
    const durationSeconds = parseInt(sessionDuration);

    const token = JwtUtils.generateToken(session, `${durationSeconds}s`);
    
    return { token, session };
  }

  /**
   * 验证管理员会话
   */
  public static async verifyAdminSession(request: NextRequest): Promise<AdminSession | null> {
    try {
      const token = this.extractTokenFromRequest(request);
      if (!token) return null;

      const payload = JwtUtils.verifyToken(token);
      if (!payload) return null;

      // 验证IP地址（可选的额外安全检查）
      const currentIp = this.getClientIP(request);
      if (payload.ip !== currentIp) {
        console.warn('IP地址不匹配，可能存在安全风险');
        // 在生产环境中可能需要更严格的处理
      }

      return payload as AdminSession;
    } catch (error) {
      console.error('会话验证失败:', error);
      return null;
    }
  }

  /**
   * 从请求中提取token
   */
  private static extractTokenFromRequest(request: NextRequest): string | null {
    // 1. 尝试从Cookie中获取
    const cookieToken = request.cookies.get(this.COOKIE_NAME)?.value;
    if (cookieToken) return cookieToken;

    // 2. 尝试从Authorization header获取
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  /**
   * 获取客户端IP地址
   */
  private static getClientIP(request: NextRequest): string {
    // 检查各种可能的IP头部
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
   * 生成CSRF token
   */
  public static generateCSRFToken(sessionId: string): string {
    const timestamp = Date.now().toString();
    return ConfigCrypto.encrypt(`${sessionId}:${timestamp}`);
  }

  /**
   * 验证CSRF token
   */
  public static verifyCSRFToken(token: string, sessionId: string): boolean {
    try {
      const decrypted = ConfigCrypto.decrypt(token);
      const [tokenSessionId, timestamp] = decrypted.split(':');
      
      // 验证session ID匹配
      if (tokenSessionId !== sessionId) return false;
      
      // 验证时间戳（防止重放攻击）
      const tokenTime = parseInt(timestamp);
      const now = Date.now();
      const maxAge = 30 * 60 * 1000; // 30分钟
      
      return (now - tokenTime) < maxAge;
    } catch (error) {
      return false;
    }
  }

  /**
   * 创建认证响应
   */
  public static createAuthenticatedResponse(
    response: NextResponse,
    token: string,
    session: AdminSession
  ): NextResponse {
    // 设置HttpOnly cookie
    response.cookies.set(this.COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24小时
      path: '/admin'
    });

    // 设置CSRF token header
    const csrfToken = this.generateCSRFToken(session.sessionId);
    response.headers.set(this.CSRF_HEADER, csrfToken);

    return response;
  }

  /**
   * 清除认证信息
   */
  public static clearAuthentication(response: NextResponse): NextResponse {
    response.cookies.delete(this.COOKIE_NAME);
    response.headers.delete(this.CSRF_HEADER);
    return response;
  }

  /**
   * 检查是否为管理员路由
   */
  public static isAdminRoute(pathname: string): boolean {
    return pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  }

  /**
   * 创建认证错误响应
   */
  public static createAuthErrorResponse(message: string = '未授权访问', status: number = 401): NextResponse {
    return NextResponse.json(
      {
        success: false,
        error: message,
        code: 'UNAUTHORIZED',
        timestamp: new Date().toISOString()
      },
      { status }
    );
  }
}

/**
 * 管理员路由保护中间件
 */
export function withAdminAuth(handler: (request: NextRequest, session: AdminSession) => Promise<NextResponse>) {
  return async function protectedHandler(request: NextRequest): Promise<NextResponse> {
    try {
      // 验证会话
      const session = await AdminAuth.verifyAdminSession(request);
      if (!session) {
        return AdminAuth.createAuthErrorResponse();
      }

      // 对于非GET请求，验证CSRF token
      if (request.method !== 'GET') {
        const csrfToken = request.headers.get(AdminAuth['CSRF_HEADER']);
        if (!csrfToken || !AdminAuth.verifyCSRFToken(csrfToken, session.sessionId)) {
          return AdminAuth.createAuthErrorResponse('CSRF验证失败', 403);
        }
      }

      // 调用受保护的处理器
      return await handler(request, session);
    } catch (error) {
      console.error('管理员认证中间件错误:', error);
      return AdminAuth.createAuthErrorResponse('认证系统错误', 500);
    }
  };
}

/**
 * 速率限制
 */
export class RateLimiter {
  private static attempts: Map<string, number[]> = new Map();
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly WINDOW_MS = 15 * 60 * 1000; // 15分钟

  public static checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(ip) || [];
    
    // 清理过期的尝试
    const validAttempts = attempts.filter(time => now - time < this.WINDOW_MS);
    
    if (validAttempts.length >= this.MAX_ATTEMPTS) {
      return false; // 超过限制
    }

    validAttempts.push(now);
    this.attempts.set(ip, validAttempts);
    
    return true; // 允许访问
  }

  public static getRemainingAttempts(ip: string): number {
    const attempts = this.attempts.get(ip) || [];
    const now = Date.now();
    const validAttempts = attempts.filter(time => now - time < this.WINDOW_MS);
    
    return Math.max(0, this.MAX_ATTEMPTS - validAttempts.length);
  }
}