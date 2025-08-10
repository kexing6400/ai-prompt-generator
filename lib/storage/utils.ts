/**
 * JSON存储系统工具函数
 * 提供文件操作、数据验证、加密等通用功能
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { createHash, createCipher, createDecipher } from 'crypto';
import { User, Usage, JsonStoreError, ErrorCodes, JsonStoreConfig } from './types';

// 默认配置
export const DEFAULT_CONFIG: JsonStoreConfig = {
  dataPath: process.env.NODE_ENV === 'production' ? '/tmp/data' : './data',
  backupPath: process.env.NODE_ENV === 'production' ? '/tmp/backups' : './data/backups',
  maxBackups: 10,
  enableCache: true,
  cacheSize: 1000,
  lockTimeout: 5000, // 5秒
  autoBackup: true,
  backupInterval: 24, // 24小时
  compression: false
};

// 文件锁管理器
class FileLockManager {
  private locks = new Map<string, { locked: boolean; queue: Array<() => void> }>();

  async acquireLock(filePath: string, timeout: number = DEFAULT_CONFIG.lockTimeout): Promise<void> {
    const lockKey = filePath;
    
    if (!this.locks.has(lockKey)) {
      this.locks.set(lockKey, { locked: false, queue: [] });
    }

    const lockInfo = this.locks.get(lockKey)!;
    
    if (!lockInfo.locked) {
      lockInfo.locked = true;
      return;
    }

    // 如果已被锁定，加入等待队列
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const index = lockInfo.queue.findIndex(cb => cb === resolve);
        if (index > -1) {
          lockInfo.queue.splice(index, 1);
        }
        reject(new JsonStoreError(
          `Lock timeout for file: ${filePath}`,
          ErrorCodes.FILE_LOCK_TIMEOUT,
          'acquireLock'
        ));
      }, timeout);

      lockInfo.queue.push(() => {
        clearTimeout(timer);
        lockInfo.locked = true;
        resolve();
      });
    });
  }

  releaseLock(filePath: string): void {
    const lockKey = filePath;
    const lockInfo = this.locks.get(lockKey);
    
    if (!lockInfo) return;

    if (lockInfo.queue.length > 0) {
      const nextCallback = lockInfo.queue.shift()!;
      nextCallback();
    } else {
      lockInfo.locked = false;
    }
  }
}

export const fileLockManager = new FileLockManager();

/**
 * 确保目录存在
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch (error) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * 原子性写入文件
 */
export async function atomicWrite(filePath: string, data: string): Promise<void> {
  const tempPath = `${filePath}.tmp`;
  const lockPath = `${filePath}.lock`;
  
  try {
    await fileLockManager.acquireLock(lockPath);
    await ensureDirectory(dirname(filePath));
    
    // 写入临时文件
    await fs.writeFile(tempPath, data, 'utf8');
    
    // 原子性移动到目标文件
    await fs.rename(tempPath, filePath);
  } finally {
    fileLockManager.releaseLock(lockPath);
    
    // 清理临时文件
    try {
      await fs.unlink(tempPath);
    } catch (e) {
      // 忽略删除失败
    }
  }
}

/**
 * 安全读取文件
 */
export async function safeReadFile(filePath: string): Promise<string | null> {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return data;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return null; // 文件不存在
    }
    throw new JsonStoreError(
      `Failed to read file: ${filePath}`,
      ErrorCodes.IO_ERROR,
      'safeReadFile'
    );
  }
}

/**
 * 生成用户ID
 */
export function generateUserId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `user_${timestamp}_${random}`;
}

/**
 * 生成文件路径
 */
export function generateFilePath(config: JsonStoreConfig, type: 'user' | 'usage', id: string, suffix?: string): string {
  const base = config.dataPath;
  
  switch (type) {
    case 'user':
      return join(base, 'users', `${id}.json`);
    case 'usage':
      const month = suffix || new Date().toISOString().substring(0, 7); // YYYY-MM
      return join(base, 'usage', `${id}-${month}.json`);
    default:
      throw new Error(`Unknown file type: ${type}`);
  }
}

/**
 * 数据验证工具
 */
export class DataValidator {
  static validateUser(user: Partial<User>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!user.email || !this.isValidEmail(user.email)) {
      errors.push('Invalid email address');
    }
    
    if (user.id && !this.isValidUserId(user.id)) {
      errors.push('Invalid user ID format');
    }
    
    if (user.subscription) {
      const subErrors = this.validateSubscription(user.subscription);
      errors.push(...subErrors);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  static validateUsage(usage: Partial<Usage>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!usage.userId || !this.isValidUserId(usage.userId)) {
      errors.push('Invalid user ID');
    }
    
    if (usage.date && !this.isValidDate(usage.date)) {
      errors.push('Invalid date format (expected YYYY-MM-DD)');
    }
    
    if (usage.requests !== undefined && (usage.requests < 0 || !Number.isInteger(usage.requests))) {
      errors.push('Invalid requests count');
    }
    
    if (usage.tokens !== undefined && (usage.tokens < 0 || !Number.isInteger(usage.tokens))) {
      errors.push('Invalid tokens count');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  private static validateSubscription(subscription: any): string[] {
    const errors: string[] = [];
    
    const validPlans = ['free', 'pro', 'enterprise'];
    if (!validPlans.includes(subscription.plan)) {
      errors.push('Invalid subscription plan');
    }
    
    const validStatuses = ['active', 'cancelled', 'expired', 'pending'];
    if (!validStatuses.includes(subscription.status)) {
      errors.push('Invalid subscription status');
    }
    
    return errors;
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidUserId(id: string): boolean {
    // 修复：允许匿名用户ID以anon_开头
    return typeof id === 'string' && id.length > 0 && (id.startsWith('user_') || id.startsWith('anon_'));
  }

  private static isValidDate(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    
    const parsed = new Date(date);
    return parsed.toISOString().substring(0, 10) === date;
  }
}

/**
 * 数据加密工具
 */
export class DataEncryption {
  private key: string;

  constructor(key: string = 'default-key-change-in-production') {
    this.key = key;
  }

  encrypt(data: string): string {
    try {
      const cipher = createCipher('aes-256-cbc', this.key);
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch (error) {
      throw new JsonStoreError(
        'Failed to encrypt data',
        ErrorCodes.IO_ERROR,
        'encrypt'
      );
    }
  }

  decrypt(encryptedData: string): string {
    try {
      const decipher = createDecipher('aes-256-cbc', this.key);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      throw new JsonStoreError(
        'Failed to decrypt data',
        ErrorCodes.IO_ERROR,
        'decrypt'
      );
    }
  }
}

/**
 * LRU缓存实现
 */
export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // 重新设置以更新顺序
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // 删除最旧的项目
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * 性能监控工具
 */
export class PerformanceMonitor {
  private metrics = new Map<string, { count: number; totalTime: number; avgTime: number }>();

  startTimer(operation: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      this.recordMetric(operation, duration);
    };
  }

  private recordMetric(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, { count: 0, totalTime: 0, avgTime: 0 });
    }
    
    const metric = this.metrics.get(operation)!;
    metric.count++;
    metric.totalTime += duration;
    metric.avgTime = metric.totalTime / metric.count;
  }

  getMetrics(): Record<string, { count: number; totalTime: number; avgTime: number }> {
    const result: Record<string, any> = {};
    for (const [key, value] of this.metrics) {
      result[key] = { ...value };
    }
    return result;
  }

  reset(): void {
    this.metrics.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * 生成当前时间戳
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * 生成日期字符串
 */
export function getCurrentDateString(): string {
  return new Date().toISOString().substring(0, 10); // YYYY-MM-DD
}

/**
 * 生成月份字符串
 */
export function getCurrentMonthString(): string {
  return new Date().toISOString().substring(0, 7); // YYYY-MM
}

/**
 * 计算文件哈希
 */
export async function calculateFileHash(filePath: string): Promise<string> {
  try {
    const data = await fs.readFile(filePath);
    return createHash('md5').update(data).digest('hex');
  } catch (error) {
    throw new JsonStoreError(
      `Failed to calculate hash for file: ${filePath}`,
      ErrorCodes.IO_ERROR,
      'calculateFileHash'
    );
  }
}