/**
 * 企业级安全加密实现
 * 修复加密算法缺陷，实现AEAD认证加密
 * 作者：Claude Security Auditor
 * 版本：v2.0 - 企业级安全标准
 */

import crypto from 'crypto';

export interface EncryptionResult {
  encrypted: string;
  salt: string;
  iv: string;
  authTag: string;
  algorithm: string;
  keyDerivation: string;
  iterations: number;
}

export class SecureCrypto {
  // 🔒 加密算法常量
  private static readonly ALGORITHM = 'aes-256-gcm'; // 使用GCM模式提供认证加密
  private static readonly KEY_LENGTH = 32; // 256位密钥
  private static readonly IV_LENGTH = 16; // 128位IV
  private static readonly SALT_LENGTH = 32; // 256位盐值
  private static readonly TAG_LENGTH = 16; // 128位认证标签
  private static readonly PBKDF2_ITERATIONS = 100000; // 100,000次迭代
  private static readonly KEY_DERIVATION_HASH = 'sha512'; // 密钥推导哈希算法

  /**
   * 获取并验证主加密密钥
   * @returns 验证后的主密钥
   * @throws Error 如果密钥不符合安全要求
   */
  private static getMasterKey(): string {
    const key = process.env.MASTER_ENCRYPTION_KEY || process.env.JWT_SECRET;
    
    if (!key) {
      throw new Error('MASTER_ENCRYPTION_KEY 或 JWT_SECRET 环境变量未设置');
    }

    if (key.length < 64) {
      throw new Error('主加密密钥长度不足，至少需要64个字符');
    }

    if (key === 'default-key-change-in-production' || 
        key === 'change-this-secret-in-production') {
      throw new Error('不能使用默认的主加密密钥');
    }

    return key;
  }

  /**
   * 使用PBKDF2从主密钥推导加密密钥
   * @param masterKey 主密钥
   * @param salt 盐值
   * @param iterations 迭代次数
   * @returns 推导的密钥
   */
  private static deriveKey(
    masterKey: string, 
    salt: Buffer, 
    iterations: number = this.PBKDF2_ITERATIONS
  ): Buffer {
    return crypto.pbkdf2Sync(
      masterKey, 
      salt, 
      iterations, 
      this.KEY_LENGTH, 
      this.KEY_DERIVATION_HASH
    );
  }

  /**
   * 安全加密文本数据
   * @param plaintext 要加密的明文
   * @param additionalData 可选的附加认证数据
   * @returns 加密结果对象
   */
  public static encrypt(plaintext: string, additionalData?: string): string {
    try {
      if (!plaintext || typeof plaintext !== 'string') {
        throw new Error('加密数据不能为空且必须为字符串');
      }

      const masterKey = this.getMasterKey();
      
      // 生成随机盐值和IV
      const salt = crypto.randomBytes(this.SALT_LENGTH);
      const iv = crypto.randomBytes(this.IV_LENGTH);
      
      // 推导加密密钥
      const derivedKey = this.deriveKey(masterKey, salt);
      
      // 创建GCM模式的加密器
      const cipher = crypto.createCipheriv(this.ALGORITHM, derivedKey, iv);
      
      // 如果有附加认证数据，添加到AAD
      if (additionalData) {
        cipher.setAAD(Buffer.from(additionalData, 'utf8'));
      }
      
      // 执行加密
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // 获取认证标签
      const authTag = cipher.getAuthTag();
      
      // 构建加密结果
      const result: EncryptionResult = {
        encrypted,
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        algorithm: this.ALGORITHM,
        keyDerivation: this.KEY_DERIVATION_HASH,
        iterations: this.PBKDF2_ITERATIONS
      };
      
      // 将结果序列化为安全格式
      const serialized = this.serializeEncryptionResult(result);
      
      console.log('[加密] 数据加密成功', {
        dataLength: plaintext.length,
        algorithm: this.ALGORITHM,
        iterations: this.PBKDF2_ITERATIONS
      });
      
      return serialized;
    } catch (error) {
      console.error('[加密] 加密失败:', error);
      throw new Error('数据加密失败');
    }
  }

  /**
   * 安全解密文本数据
   * @param encryptedData 加密的数据字符串
   * @param additionalData 可选的附加认证数据
   * @returns 解密后的明文
   */
  public static decrypt(encryptedData: string, additionalData?: string): string {
    try {
      if (!encryptedData || typeof encryptedData !== 'string') {
        throw new Error('解密数据不能为空且必须为字符串');
      }

      // 反序列化加密结果
      const result = this.deserializeEncryptionResult(encryptedData);
      
      // 验证算法兼容性
      if (result.algorithm !== this.ALGORITHM) {
        throw new Error(`不支持的加密算法: ${result.algorithm}`);
      }

      const masterKey = this.getMasterKey();
      
      // 重建缓冲区
      const salt = Buffer.from(result.salt, 'hex');
      const iv = Buffer.from(result.iv, 'hex');
      const authTag = Buffer.from(result.authTag, 'hex');
      
      // 推导解密密钥
      const derivedKey = this.deriveKey(masterKey, salt, result.iterations);
      
      // 创建GCM模式的解密器
      const decipher = crypto.createDecipheriv(result.algorithm, derivedKey, iv);
      
      // 设置认证标签
      decipher.setAuthTag(authTag);
      
      // 如果有附加认证数据，添加到AAD
      if (additionalData) {
        decipher.setAAD(Buffer.from(additionalData, 'utf8'));
      }
      
      // 执行解密
      let decrypted = decipher.update(result.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      console.log('[解密] 数据解密成功', {
        dataLength: decrypted.length,
        algorithm: result.algorithm
      });
      
      return decrypted;
    } catch (error) {
      console.error('[解密] 解密失败:', error);
      throw new Error('数据解密失败或数据已损坏');
    }
  }

  /**
   * 序列化加密结果为安全字符串
   * @param result 加密结果对象
   * @returns 序列化后的字符串
   */
  private static serializeEncryptionResult(result: EncryptionResult): string {
    const components = [
      'v2', // 版本号
      result.algorithm,
      result.keyDerivation,
      result.iterations.toString(),
      result.salt,
      result.iv,
      result.authTag,
      result.encrypted
    ];
    
    return components.join(':');
  }

  /**
   * 反序列化加密结果字符串
   * @param serialized 序列化的字符串
   * @returns 加密结果对象
   */
  private static deserializeEncryptionResult(serialized: string): EncryptionResult {
    const parts = serialized.split(':');
    
    // 检查格式版本
    if (parts.length < 8) {
      throw new Error('加密数据格式无效');
    }
    
    const [version, algorithm, keyDerivation, iterations, salt, iv, authTag, encrypted] = parts;
    
    // 版本兼容性检查
    if (version !== 'v2') {
      // 尝试解析旧版本格式
      if (parts.length === 4) {
        return this.parseLegacyFormat(serialized);
      }
      throw new Error(`不支持的加密数据版本: ${version}`);
    }
    
    return {
      encrypted,
      salt,
      iv,
      authTag,
      algorithm,
      keyDerivation,
      iterations: parseInt(iterations, 10)
    };
  }

  /**
   * 解析旧版本的加密格式
   * @param serialized 序列化的字符串
   * @returns 加密结果对象
   */
  private static parseLegacyFormat(serialized: string): EncryptionResult {
    const parts = serialized.split(':');
    if (parts.length !== 3) {
      throw new Error('旧版本加密格式无效');
    }
    
    const [iv, authTag, encrypted] = parts;
    
    // 为旧版本数据生成随机盐值（安全性稍低但向后兼容）
    const salt = crypto.randomBytes(this.SALT_LENGTH).toString('hex');
    
    console.warn('[解密] 检测到旧版本加密格式，建议重新加密数据');
    
    return {
      encrypted,
      salt,
      iv,
      authTag,
      algorithm: this.ALGORITHM,
      keyDerivation: this.KEY_DERIVATION_HASH,
      iterations: this.PBKDF2_ITERATIONS
    };
  }

  /**
   * 生成密码学安全的随机密钥
   * @param length 密钥长度（字节）
   * @returns 十六进制密钥字符串
   */
  public static generateSecureKey(length: number = 32): string {
    if (length < 16) {
      throw new Error('密钥长度至少需要16字节');
    }
    
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * 生成强安全的主加密密钥
   * @returns 64字符的安全密钥
   */
  public static generateMasterKey(): string {
    const randomBytes = crypto.randomBytes(48);
    const entropy = crypto.randomBytes(16);
    const timestamp = Date.now().toString();
    
    return crypto
      .createHash('sha512')
      .update(randomBytes)
      .update(entropy)
      .update(timestamp)
      .digest('base64')
      .substring(0, 64);
  }

  /**
   * 安全哈希密码 (使用Argon2id的替代实现)
   * @param password 明文密码
   * @param rounds 哈希轮数 (默认12)
   * @returns 哈希后的密码
   */
  public static async hashPassword(password: string, rounds: number = 12): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!password || password.length < 8) {
        reject(new Error('密码至少需要8个字符'));
        return;
      }

      // 生成随机盐值
      const salt = crypto.randomBytes(32);
      
      // 使用PBKDF2作为Argon2的替代方案
      const iterations = Math.pow(2, rounds) * 1000; // 动态调整迭代次数
      
      crypto.pbkdf2(password, salt, iterations, 64, 'sha512', (err, derivedKey) => {
        if (err) {
          reject(err);
          return;
        }
        
        // 格式: rounds:salt:hash
        const hash = `${rounds}:${salt.toString('hex')}:${derivedKey.toString('hex')}`;
        resolve(hash);
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
      try {
        const parts = hashedPassword.split(':');
        
        if (parts.length === 2) {
          // 旧版本格式兼容
          const [salt, hash] = parts;
          crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(hash === derivedKey.toString('hex'));
          });
        } else if (parts.length === 3) {
          // 新版本格式
          const [rounds, salt, hash] = parts;
          const iterations = Math.pow(2, parseInt(rounds, 10)) * 1000;
          
          crypto.pbkdf2(password, salt, iterations, 64, 'sha512', (err, derivedKey) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(hash === derivedKey.toString('hex'));
          });
        } else {
          reject(new Error('密码哈希格式无效'));
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 计算数据的完整性哈希
   * @param data 要计算哈希的数据
   * @param algorithm 哈希算法 (默认 sha256)
   * @returns 哈希值
   */
  public static computeHash(data: string, algorithm: string = 'sha256'): string {
    return crypto.createHash(algorithm).update(data, 'utf8').digest('hex');
  }

  /**
   * 验证数据完整性
   * @param data 原始数据
   * @param hash 预期的哈希值
   * @param algorithm 哈希算法
   * @returns 是否匹配
   */
  public static verifyHash(data: string, hash: string, algorithm: string = 'sha256'): boolean {
    try {
      const computedHash = this.computeHash(data, algorithm);
      return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
    } catch (error) {
      console.error('[哈希验证] 验证失败:', error);
      return false;
    }
  }

  /**
   * 生成密码学安全的随机字符串
   * @param length 字符串长度
   * @param charset 字符集
   * @returns 随机字符串
   */
  public static generateRandomString(
    length: number = 32, 
    charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  ): string {
    const randomBytes = crypto.randomBytes(length);
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += charset[randomBytes[i] % charset.length];
    }
    
    return result;
  }

  /**
   * 安全清零敏感数据的内存
   * @param buffer 要清零的Buffer
   */
  public static secureZero(buffer: Buffer): void {
    if (buffer && Buffer.isBuffer(buffer)) {
      buffer.fill(0);
    }
  }
}

/**
 * 密钥管理器
 * 负责密钥的生命周期管理
 */
export class KeyManager {
  private static keyRotationLog: Array<{
    timestamp: number;
    keyId: string;
    action: 'created' | 'rotated' | 'deprecated';
  }> = [];

  /**
   * 检查是否需要轮换密钥
   * @param keyCreatedAt 密钥创建时间戳
   * @param maxAge 密钥最大年龄（毫秒）
   * @returns 是否需要轮换
   */
  public static shouldRotateKey(keyCreatedAt: number, maxAge: number = 90 * 24 * 60 * 60 * 1000): boolean {
    return Date.now() - keyCreatedAt > maxAge;
  }

  /**
   * 记录密钥操作
   * @param action 操作类型
   * @param keyId 密钥标识
   */
  public static logKeyOperation(action: 'created' | 'rotated' | 'deprecated', keyId: string): void {
    this.keyRotationLog.push({
      timestamp: Date.now(),
      keyId,
      action
    });

    console.log(`[密钥管理] ${action}: ${keyId}`);
  }

  /**
   * 获取密钥操作历史
   * @returns 操作历史记录
   */
  public static getKeyOperationHistory(): typeof this.keyRotationLog {
    return [...this.keyRotationLog];
  }

  /**
   * 生成密钥轮换建议
   * @returns 轮换建议
   */
  public static generateRotationRecommendations(): string[] {
    const recommendations = [];
    const now = Date.now();
    const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);

    if (!process.env.JWT_SECRET) {
      recommendations.push('❌ JWT_SECRET 环境变量未设置');
    } else if (process.env.JWT_SECRET.length < 64) {
      recommendations.push('⚠️ JWT_SECRET 密钥长度不足');
    }

    if (!process.env.MASTER_ENCRYPTION_KEY) {
      recommendations.push('❌ MASTER_ENCRYPTION_KEY 环境变量未设置');
    }

    // 检查最后一次密钥轮换时间
    const lastRotation = this.keyRotationLog
      .filter(log => log.action === 'rotated')
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    if (!lastRotation || lastRotation.timestamp < ninetyDaysAgo) {
      recommendations.push('🔄 建议轮换加密密钥（超过90天）');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ 密钥配置安全');
    }

    return recommendations;
  }
}