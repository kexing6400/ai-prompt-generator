/**
 * 加密工具类
 * 用于管理后台敏感配置的加密/解密
 * 作者：Claude Code (后端架构师)
 */

import crypto from 'crypto';

export class ConfigCrypto {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly TAG_LENGTH = 16;

  /**
   * 获取加密密钥
   */
  private static getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'default-key-change-in-production';
    return crypto.scryptSync(key, 'admin-config-salt', this.KEY_LENGTH);
  }

  /**
   * 加密文本
   * @param text 要加密的文本
   * @returns 加密后的文本（包含IV和tag）
   */
  public static encrypt(text: string): string {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipher(this.ALGORITHM, key);
      cipher.setAutoPadding(true);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      // 将IV、tag和加密内容组合
      return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('加密失败:', error);
      throw new Error('配置加密失败');
    }
  }

  /**
   * 解密文本
   * @param encryptedText 加密的文本
   * @returns 解密后的原文本
   */
  public static decrypt(encryptedText: string): string {
    try {
      const key = this.getEncryptionKey();
      const parts = encryptedText.split(':');
      
      if (parts.length !== 3) {
        throw new Error('加密格式无效');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const tag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = crypto.createDecipher(this.ALGORITHM, key);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('解密失败:', error);
      throw new Error('配置解密失败');
    }
  }

  /**
   * 生成安全的随机密钥
   * @param length 密钥长度
   * @returns 十六进制密钥字符串
   */
  public static generateSecureKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * 生成JWT密钥
   */
  public static generateJwtSecret(): string {
    return this.generateSecureKey(64);
  }

  /**
   * 哈希密码
   * @param password 明文密码
   * @returns 哈希后的密码
   */
  public static async hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const salt = crypto.randomBytes(16).toString('hex');
      crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        resolve(`${salt}:${derivedKey.toString('hex')}`);
      });
    });
  }

  /**
   * 验证密码
   * @param password 明文密码
   * @param hashedPassword 哈希后的密码
   * @returns 是否匹配
   */
  public static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const [salt, hash] = hashedPassword.split(':');
      crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        resolve(hash === derivedKey.toString('hex'));
      });
    });
  }
}

/**
 * JWT工具类
 */
export class JwtUtils {
  private static getJwtSecret(): string {
    return process.env.JWT_SECRET || 'change-this-secret-in-production';
  }

  /**
   * 生成JWT token
   * @param payload 载荷数据
   * @param expiresIn 过期时间
   * @returns JWT字符串
   */
  public static generateToken(payload: any, expiresIn: string = '24h'): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    
    // 解析过期时间
    const expires = this.parseTimeToSeconds(expiresIn);
    const exp = now + expires;
    
    const jwtPayload = {
      ...payload,
      iat: now,
      exp: exp
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(jwtPayload)).toString('base64url');
    
    const signature = crypto
      .createHmac('sha256', this.getJwtSecret())
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * 验证并解析JWT token
   * @param token JWT字符串
   * @returns 解析后的载荷或null
   */
  public static verifyToken(token: string): any | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [encodedHeader, encodedPayload, signature] = parts;
      
      // 验证签名
      const expectedSignature = crypto
        .createHmac('sha256', this.getJwtSecret())
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64url');

      if (signature !== expectedSignature) return null;

      // 解析载荷
      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());
      
      // 检查过期时间
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) return null;

      return payload;
    } catch (error) {
      console.error('JWT验证失败:', error);
      return null;
    }
  }

  /**
   * 解析时间字符串到秒数
   * @param timeStr 时间字符串 (如: '24h', '7d', '30m')
   * @returns 秒数
   */
  private static parseTimeToSeconds(timeStr: string): number {
    const match = timeStr.match(/^(\d+)([smhd])$/);
    if (!match) return 24 * 60 * 60; // 默认24小时

    const [, amount, unit] = match;
    const num = parseInt(amount);

    switch (unit) {
      case 's': return num;
      case 'm': return num * 60;
      case 'h': return num * 60 * 60;
      case 'd': return num * 24 * 60 * 60;
      default: return 24 * 60 * 60;
    }
  }
}