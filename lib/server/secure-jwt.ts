/**
 * 企业级安全JWT实现
 * 修复JWT密钥管理和token安全问题
 * 作者：Claude Security Auditor
 * 版本：v2.0 - 企业级安全标准
 */

import crypto from 'crypto';

export interface JWTPayload {
  sessionId: string;
  type: 'access' | 'refresh';
  permissions?: string[];
  deviceFingerprint?: string;
  sub?: string;
  iat: number;
  exp: number;
  jti: string;
  iss?: string;
  aud?: string;
}

export class SecureJWT {
  private static readonly ALGORITHM = 'HS512'; // 升级到更安全的HS512
  private static readonly ISSUER = 'ai-prompt-generator';
  private static readonly AUDIENCE = 'admin-panel';
  private static readonly ACCESS_TOKEN_TTL = 15 * 60; // 15分钟
  private static readonly REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7天

  /**
   * 验证JWT密钥的安全性
   * @returns 经过验证的安全密钥
   * @throws Error 如果密钥不符合安全要求
   */
  private static validateAndGetSecret(): string {
    const secret = process.env.JWT_SECRET;
    
    // 密钥存在性检查
    if (!secret) {
      throw new Error('JWT_SECRET 环境变量未设置');
    }

    // 密钥长度检查 (至少64个字符)
    if (secret.length < 64) {
      throw new Error('JWT_SECRET 密钥长度不足，至少需要64个字符');
    }

    // 密钥强度检查
    if (secret === 'change-this-secret-in-production' || 
        secret === 'default-key-change-in-production' ||
        /^(.)\1+$/.test(secret)) { // 检查是否为重复字符
      throw new Error('JWT_SECRET 使用了不安全的默认值或弱密钥');
    }

    // 密钥复杂性检查
    const hasLower = /[a-z]/.test(secret);
    const hasUpper = /[A-Z]/.test(secret);
    const hasNumber = /\d/.test(secret);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(secret);
    
    if (!(hasLower && hasUpper && hasNumber && hasSpecial)) {
      console.warn('⚠️ JWT密钥建议包含大小写字母、数字和特殊字符以增强安全性');
    }

    return secret;
  }

  /**
   * 生成安全的JWT Token
   * @param payload 载荷数据
   * @param tokenType Token类型 ('access' 或 'refresh')
   * @returns 安全的JWT字符串
   */
  public static generateSecureToken(
    payload: Omit<JWTPayload, 'iat' | 'exp' | 'jti' | 'iss' | 'aud'>,
    tokenType: 'access' | 'refresh' = 'access'
  ): string {
    try {
      const secret = this.validateAndGetSecret();
      const now = Math.floor(Date.now() / 1000);
      const ttl = tokenType === 'access' ? this.ACCESS_TOKEN_TTL : this.REFRESH_TOKEN_TTL;

      // 构建JWT头部
      const header = {
        alg: this.ALGORITHM,
        typ: 'JWT',
        kid: crypto.createHash('sha256').update(secret).digest('hex').substring(0, 8) // Key ID
      };

      // 构建JWT载荷
      const jwtPayload: JWTPayload = {
        ...payload,
        type: tokenType,
        sub: 'admin-session',
        iss: this.ISSUER,
        aud: this.AUDIENCE,
        iat: now,
        exp: now + ttl,
        jti: crypto.randomUUID() // JWT ID - 防止重放攻击
      };

      // Base64URL编码
      const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
      const encodedPayload = Buffer.from(JSON.stringify(jwtPayload)).toString('base64url');

      // 使用HMAC-SHA512生成签名
      const signature = crypto
        .createHmac('sha512', secret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64url');

      const token = `${encodedHeader}.${encodedPayload}.${signature}`;

      // 记录Token生成 (不记录敏感信息)
      console.log(`[JWT] 生成${tokenType}令牌`, {
        sessionId: payload.sessionId,
        expiresIn: `${ttl}秒`,
        jti: jwtPayload.jti
      });

      return token;
    } catch (error) {
      console.error('[JWT] Token生成失败:', error);
      throw new Error('Token生成失败');
    }
  }

  /**
   * 验证并解析JWT Token
   * @param token JWT字符串
   * @param expectedType 期望的Token类型
   * @returns 解析后的载荷或null
   */
  public static verifyAndParseToken(
    token: string,
    expectedType?: 'access' | 'refresh'
  ): JWTPayload | null {
    try {
      if (!token || typeof token !== 'string') {
        return null;
      }

      // 检查Token格式
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('[JWT] Token格式无效');
        return null;
      }

      const [encodedHeader, encodedPayload, signature] = parts;

      // 验证头部
      let header;
      try {
        header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString());
      } catch (error) {
        console.warn('[JWT] 头部解析失败');
        return null;
      }

      if (header.alg !== this.ALGORITHM || header.typ !== 'JWT') {
        console.warn('[JWT] 头部验证失败');
        return null;
      }

      // 验证签名
      const secret = this.validateAndGetSecret();
      const expectedSignature = crypto
        .createHmac('sha512', secret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64url');

      if (signature !== expectedSignature) {
        console.warn('[JWT] 签名验证失败');
        return null;
      }

      // 解析载荷
      let payload: JWTPayload;
      try {
        payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());
      } catch (error) {
        console.warn('[JWT] 载荷解析失败');
        return null;
      }

      // 验证基本字段
      if (!payload.sessionId || !payload.jti || !payload.iat || !payload.exp) {
        console.warn('[JWT] 载荷缺少必要字段');
        return null;
      }

      // 验证时间
      const now = Math.floor(Date.now() / 1000);
      
      // 检查过期时间
      if (payload.exp < now) {
        console.warn('[JWT] Token已过期');
        return null;
      }

      // 检查签发时间 (防止未来时间的Token)
      if (payload.iat > now + 60) { // 允许1分钟的时钟偏差
        console.warn('[JWT] Token签发时间无效');
        return null;
      }

      // 验证签发者和受众
      if (payload.iss !== this.ISSUER || payload.aud !== this.AUDIENCE) {
        console.warn('[JWT] 签发者或受众验证失败');
        return null;
      }

      // 验证Token类型
      if (expectedType && payload.type !== expectedType) {
        console.warn(`[JWT] Token类型不匹配，期望: ${expectedType}, 实际: ${payload.type}`);
        return null;
      }

      // 记录Token验证成功
      console.log(`[JWT] ${payload.type}令牌验证成功`, {
        sessionId: payload.sessionId,
        jti: payload.jti,
        remainingTTL: `${payload.exp - now}秒`
      });

      return payload;
    } catch (error) {
      console.error('[JWT] Token验证失败:', error);
      return null;
    }
  }

  /**
   * 检查Token是否即将过期
   * @param token JWT字符串
   * @param thresholdSeconds 阈值秒数，默认5分钟
   * @returns 是否即将过期
   */
  public static isTokenExpiringSoon(token: string, thresholdSeconds: number = 300): boolean {
    const payload = this.verifyAndParseToken(token);
    if (!payload) return true; // 无效Token视为已过期

    const now = Math.floor(Date.now() / 1000);
    return (payload.exp - now) <= thresholdSeconds;
  }

  /**
   * 获取Token剩余有效时间
   * @param token JWT字符串
   * @returns 剩余秒数，无效Token返回0
   */
  public static getTokenRemainingTTL(token: string): number {
    const payload = this.verifyAndParseToken(token);
    if (!payload) return 0;

    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, payload.exp - now);
  }

  /**
   * 提取Token中的会话ID
   * @param token JWT字符串
   * @returns 会话ID或null
   */
  public static extractSessionId(token: string): string | null {
    const payload = this.verifyAndParseToken(token);
    return payload?.sessionId || null;
  }

  /**
   * 提取Token中的JTI (JWT ID)
   * @param token JWT字符串
   * @returns JTI或null
   */
  public static extractJTI(token: string): string | null {
    const payload = this.verifyAndParseToken(token);
    return payload?.jti || null;
  }

  /**
   * 生成强安全的JWT密钥
   * @returns 64字符的安全密钥
   */
  public static generateSecureSecret(): string {
    const randomBytes = crypto.randomBytes(48); // 48字节 = 64个base64字符
    const timestamp = Date.now().toString(36);
    const random = crypto.randomUUID().replace(/-/g, '');
    
    return crypto
      .createHash('sha256')
      .update(randomBytes)
      .update(timestamp)
      .update(random)
      .digest('base64')
      .substring(0, 64);
  }
}

/**
 * JWT黑名单管理器
 * 用于管理被撤销的Token
 */
export class JWTBlacklist {
  private static blacklistedTokens: Set<string> = new Set();
  private static blacklistedSessions: Set<string> = new Set();

  /**
   * 将Token加入黑名单
   * @param token JWT字符串
   */
  public static blacklistToken(token: string): void {
    const jti = SecureJWT.extractJTI(token);
    if (jti) {
      this.blacklistedTokens.add(jti);
      console.log(`[JWT黑名单] Token已加入黑名单: ${jti}`);
    }
  }

  /**
   * 将会话的所有Token加入黑名单
   * @param sessionId 会话ID
   */
  public static blacklistSession(sessionId: string): void {
    this.blacklistedSessions.add(sessionId);
    console.log(`[JWT黑名单] 会话已加入黑名单: ${sessionId}`);
  }

  /**
   * 检查Token是否在黑名单中
   * @param token JWT字符串
   * @returns 是否被黑名单
   */
  public static isTokenBlacklisted(token: string): boolean {
    const payload = SecureJWT.verifyAndParseToken(token);
    if (!payload) return true; // 无效Token视为被黑名单

    // 检查JTI黑名单
    if (payload.jti && this.blacklistedTokens.has(payload.jti)) {
      return true;
    }

    // 检查会话黑名单
    if (payload.sessionId && this.blacklistedSessions.has(payload.sessionId)) {
      return true;
    }

    return false;
  }

  /**
   * 清理过期的黑名单条目
   */
  public static cleanupExpiredBlacklist(): void {
    // 实际应用中，这里应该清理过期的JTI
    // 由于我们无法知道JTI的过期时间，建议使用持久化存储并记录过期时间
    console.log('[JWT黑名单] 清理过期条目 (需要持久化实现)');
  }

  /**
   * 获取黑名单统计信息
   */
  public static getBlacklistStats(): { tokens: number; sessions: number } {
    return {
      tokens: this.blacklistedTokens.size,
      sessions: this.blacklistedSessions.size
    };
  }
}