/**
 * JSON数据存储系统核心实现
 * 提供完整的用户管理、订阅管理、使用量追踪功能
 * 支持原子操作、缓存、备份等企业级特性
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import {
  User, Usage, OperationResult, BackupInfo, StorageStats, 
  MonthlyUsageSummary, JsonStoreError, ErrorCodes, 
  IJsonStore, JsonStoreConfig, UserPreferences, Subscription, UsageLimits
} from './types';
import {
  DEFAULT_CONFIG, atomicWrite, safeReadFile, generateUserId,
  generateFilePath, ensureDirectory, DataValidator, DataEncryption,
  LRUCache, performanceMonitor, formatFileSize, getCurrentTimestamp,
  getCurrentDateString, getCurrentMonthString, calculateFileHash
} from './utils';

/**
 * JSON存储系统主类
 */
export class JsonStore implements IJsonStore {
  private config: JsonStoreConfig;
  private userCache: LRUCache<string, User>;
  private usageCache: LRUCache<string, Usage>;
  private encryption?: DataEncryption;
  private initialized = false;

  constructor(config: Partial<JsonStoreConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.userCache = new LRUCache<string, User>(this.config.cacheSize);
    this.usageCache = new LRUCache<string, Usage>(this.config.cacheSize);
    
    if (this.config.encryptionKey) {
      this.encryption = new DataEncryption(this.config.encryptionKey);
    }
  }

  /**
   * 初始化存储系统
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const stopTimer = performanceMonitor.startTimer('initialize');
    
    try {
      // 创建必要的目录
      await ensureDirectory(this.config.dataPath);
      await ensureDirectory(join(this.config.dataPath, 'users'));
      await ensureDirectory(join(this.config.dataPath, 'usage'));
      await ensureDirectory(join(this.config.dataPath, 'locks'));
      await ensureDirectory(this.config.backupPath);
      
      this.initialized = true;
      console.log(`🚀 JSON存储系统初始化完成 - 数据路径: ${this.config.dataPath}`);
    } catch (error) {
      throw new JsonStoreError(
        `Failed to initialize storage: ${error}`,
        ErrorCodes.IO_ERROR,
        'initialize'
      );
    } finally {
      stopTimer();
    }
  }

  // ==================== 用户管理 ====================

  /**
   * 保存用户数据
   */
  async saveUser(user: User): Promise<OperationResult<User>> {
    await this.initialize();
    const stopTimer = performanceMonitor.startTimer('saveUser');

    try {
      // 数据验证
      const validation = DataValidator.validateUser(user);
      if (!validation.valid) {
        throw new JsonStoreError(
          `Invalid user data: ${validation.errors.join(', ')}`,
          ErrorCodes.VALIDATION_ERROR,
          'saveUser',
          user.id
        );
      }

      // 检查邮箱是否已存在
      const existingUser = await this.getUserByEmail(user.email);
      if (existingUser && existingUser.id !== user.id) {
        throw new JsonStoreError(
          `User with email ${user.email} already exists`,
          ErrorCodes.USER_ALREADY_EXISTS,
          'saveUser',
          user.id
        );
      }

      // 设置时间戳
      const now = new Date();
      if (!user.createdAt) {
        user.createdAt = now;
      }
      user.updatedAt = now;

      const filePath = generateFilePath(this.config, 'user', user.id);
      let data = JSON.stringify(user, null, 2);

      // 加密数据（如果启用）
      if (this.encryption) {
        data = this.encryption.encrypt(data);
      }

      await atomicWrite(filePath, data);

      // 更新缓存
      if (this.config.enableCache) {
        this.userCache.set(user.id, user);
      }

      return {
        success: true,
        data: user,
        timestamp: now
      };
    } catch (error: any) {
      if (error instanceof JsonStoreError) {
        throw error;
      }
      throw new JsonStoreError(
        `Failed to save user: ${error.message}`,
        ErrorCodes.IO_ERROR,
        'saveUser',
        user.id
      );
    } finally {
      stopTimer();
    }
  }

  /**
   * 获取用户数据
   */
  async getUser(id: string): Promise<User | null> {
    await this.initialize();
    const stopTimer = performanceMonitor.startTimer('getUser');

    try {
      // 检查缓存
      if (this.config.enableCache) {
        const cached = this.userCache.get(id);
        if (cached) {
          return cached;
        }
      }

      const filePath = generateFilePath(this.config, 'user', id);
      let data = await safeReadFile(filePath);
      
      if (!data) {
        return null;
      }

      // 解密数据（如果启用）
      if (this.encryption) {
        data = this.encryption.decrypt(data);
      }

      const user = JSON.parse(data) as User;
      
      // 转换日期字段
      user.createdAt = new Date(user.createdAt);
      user.updatedAt = new Date(user.updatedAt);
      if (user.lastLoginAt) {
        user.lastLoginAt = new Date(user.lastLoginAt);
      }

      // 更新缓存
      if (this.config.enableCache) {
        this.userCache.set(id, user);
      }

      return user;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw new JsonStoreError(
        `Failed to get user: ${error.message}`,
        ErrorCodes.IO_ERROR,
        'getUser',
        id
      );
    } finally {
      stopTimer();
    }
  }

  /**
   * 更新用户数据
   */
  async updateUser(id: string, updates: Partial<User>): Promise<OperationResult<User>> {
    await this.initialize();
    const stopTimer = performanceMonitor.startTimer('updateUser');

    try {
      const existingUser = await this.getUser(id);
      if (!existingUser) {
        throw new JsonStoreError(
          `User not found: ${id}`,
          ErrorCodes.USER_NOT_FOUND,
          'updateUser',
          id
        );
      }

      // 合并更新数据
      const updatedUser: User = {
        ...existingUser,
        ...updates,
        id: existingUser.id, // 不允许修改ID
        createdAt: existingUser.createdAt, // 不允许修改创建时间
        updatedAt: new Date()
      };

      return await this.saveUser(updatedUser);
    } catch (error: any) {
      if (error instanceof JsonStoreError) {
        throw error;
      }
      throw new JsonStoreError(
        `Failed to update user: ${error.message}`,
        ErrorCodes.IO_ERROR,
        'updateUser',
        id
      );
    } finally {
      stopTimer();
    }
  }

  /**
   * 删除用户
   */
  async deleteUser(id: string): Promise<OperationResult<void>> {
    await this.initialize();
    const stopTimer = performanceMonitor.startTimer('deleteUser');

    try {
      const user = await this.getUser(id);
      if (!user) {
        throw new JsonStoreError(
          `User not found: ${id}`,
          ErrorCodes.USER_NOT_FOUND,
          'deleteUser',
          id
        );
      }

      const filePath = generateFilePath(this.config, 'user', id);
      await fs.unlink(filePath);

      // 清除缓存
      if (this.config.enableCache) {
        this.userCache.delete(id);
      }

      // TODO: 删除相关的使用量数据

      return {
        success: true,
        timestamp: new Date()
      };
    } catch (error: any) {
      if (error instanceof JsonStoreError) {
        throw error;
      }
      throw new JsonStoreError(
        `Failed to delete user: ${error.message}`,
        ErrorCodes.IO_ERROR,
        'deleteUser',
        id
      );
    } finally {
      stopTimer();
    }
  }

  /**
   * 通过邮箱查找用户
   */
  async getUserByEmail(email: string): Promise<User | null> {
    await this.initialize();
    const stopTimer = performanceMonitor.startTimer('getUserByEmail');

    try {
      const usersDir = join(this.config.dataPath, 'users');
      const files = await fs.readdir(usersDir);

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const userId = file.replace('.json', '');
        const user = await this.getUser(userId);
        
        if (user && user.email === email) {
          return user;
        }
      }

      return null;
    } catch (error: any) {
      throw new JsonStoreError(
        `Failed to get user by email: ${error.message}`,
        ErrorCodes.IO_ERROR,
        'getUserByEmail'
      );
    } finally {
      stopTimer();
    }
  }

  /**
   * 获取用户列表
   */
  async listUsers(page = 1, limit = 50): Promise<{ users: User[]; total: number }> {
    await this.initialize();
    const stopTimer = performanceMonitor.startTimer('listUsers');

    try {
      const usersDir = join(this.config.dataPath, 'users');
      const files = await fs.readdir(usersDir);
      const userFiles = files.filter(file => file.endsWith('.json'));

      const total = userFiles.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const pageFiles = userFiles.slice(startIndex, endIndex);

      const users: User[] = [];
      for (const file of pageFiles) {
        const userId = file.replace('.json', '');
        const user = await this.getUser(userId);
        if (user) {
          users.push(user);
        }
      }

      return { users, total };
    } catch (error: any) {
      throw new JsonStoreError(
        `Failed to list users: ${error.message}`,
        ErrorCodes.IO_ERROR,
        'listUsers'
      );
    } finally {
      stopTimer();
    }
  }

  /**
   * 搜索用户
   */
  async searchUsers(query: string): Promise<User[]> {
    await this.initialize();
    const stopTimer = performanceMonitor.startTimer('searchUsers');

    try {
      const { users } = await this.listUsers(1, 1000); // 简单实现，实际应该优化
      const lowerQuery = query.toLowerCase();

      return users.filter(user => 
        user.email.toLowerCase().includes(lowerQuery) ||
        (user.name && user.name.toLowerCase().includes(lowerQuery))
      );
    } catch (error: any) {
      throw new JsonStoreError(
        `Failed to search users: ${error.message}`,
        ErrorCodes.IO_ERROR,
        'searchUsers'
      );
    } finally {
      stopTimer();
    }
  }

  // ==================== 使用量管理 ====================

  /**
   * 更新使用量
   */
  async updateUsage(userId: string, usage: Partial<Usage>): Promise<OperationResult<Usage>> {
    await this.initialize();
    const stopTimer = performanceMonitor.startTimer('updateUsage');

    try {
      const date = usage.date || getCurrentDateString();
      const month = date.substring(0, 7); // YYYY-MM

      // 验证用户存在
      const user = await this.getUser(userId);
      if (!user) {
        throw new JsonStoreError(
          `User not found: ${userId}`,
          ErrorCodes.USER_NOT_FOUND,
          'updateUsage',
          userId
        );
      }

      // 获取现有使用量或创建新记录
      let existingUsage = await this.getUsage(userId, date);
      if (!existingUsage) {
        existingUsage = {
          userId,
          date,
          month,
          requests: 0,
          tokens: 0,
          generatedPrompts: 0,
          documentsProcessed: 0,
          apiCalls: {},
          errors: 0,
          avgResponseTime: 0
        };
      }

      // 合并使用量数据
      const updatedUsage: Usage = {
        ...existingUsage,
        ...usage,
        userId, // 不允许修改
        date,   // 不允许修改
        month   // 不允许修改
      };

      // 数据验证
      const validation = DataValidator.validateUsage(updatedUsage);
      if (!validation.valid) {
        throw new JsonStoreError(
          `Invalid usage data: ${validation.errors.join(', ')}`,
          ErrorCodes.VALIDATION_ERROR,
          'updateUsage',
          userId
        );
      }

      const filePath = generateFilePath(this.config, 'usage', userId, month);
      let data = JSON.stringify(updatedUsage, null, 2);

      if (this.encryption) {
        data = this.encryption.encrypt(data);
      }

      await atomicWrite(filePath, data);

      // 更新缓存
      if (this.config.enableCache) {
        this.usageCache.set(`${userId}-${date}`, updatedUsage);
      }

      return {
        success: true,
        data: updatedUsage,
        timestamp: new Date()
      };
    } catch (error: any) {
      if (error instanceof JsonStoreError) {
        throw error;
      }
      throw new JsonStoreError(
        `Failed to update usage: ${error.message}`,
        ErrorCodes.IO_ERROR,
        'updateUsage',
        userId
      );
    } finally {
      stopTimer();
    }
  }

  /**
   * 获取使用量
   */
  async getUsage(userId: string, date?: string): Promise<Usage | null> {
    await this.initialize();
    const stopTimer = performanceMonitor.startTimer('getUsage');

    try {
      const targetDate = date || getCurrentDateString();
      const month = targetDate.substring(0, 7);
      const cacheKey = `${userId}-${targetDate}`;

      // 检查缓存
      if (this.config.enableCache) {
        const cached = this.usageCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const filePath = generateFilePath(this.config, 'usage', userId, month);
      let data = await safeReadFile(filePath);
      
      if (!data) {
        return null;
      }

      if (this.encryption) {
        data = this.encryption.decrypt(data);
      }

      const usage = JSON.parse(data) as Usage;

      // 更新缓存
      if (this.config.enableCache) {
        this.usageCache.set(cacheKey, usage);
      }

      return usage;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw new JsonStoreError(
        `Failed to get usage: ${error.message}`,
        ErrorCodes.IO_ERROR,
        'getUsage',
        userId
      );
    } finally {
      stopTimer();
    }
  }

  /**
   * 获取月度使用量
   */
  async getUsageByMonth(userId: string, month?: string): Promise<Usage[]> {
    // 简化实现：返回单个使用量记录
    const targetMonth = month || getCurrentMonthString();
    const usage = await this.getUsage(userId, `${targetMonth}-01`);
    return usage ? [usage] : [];
  }

  /**
   * 获取月度使用量摘要
   */
  async getMonthlyUsageSummary(userId: string, month?: string): Promise<MonthlyUsageSummary | null> {
    const targetMonth = month || getCurrentMonthString();
    const usageRecords = await this.getUsageByMonth(userId, targetMonth);
    
    if (usageRecords.length === 0) {
      return null;
    }

    const user = await this.getUser(userId);
    if (!user) return null;

    // 计算汇总数据
    const totalRequests = usageRecords.reduce((sum, usage) => sum + usage.requests, 0);
    const totalTokens = usageRecords.reduce((sum, usage) => sum + usage.tokens, 0);
    const totalPrompts = usageRecords.reduce((sum, usage) => sum + usage.generatedPrompts, 0);
    const totalDocuments = usageRecords.reduce((sum, usage) => sum + usage.documentsProcessed, 0);
    const totalErrors = usageRecords.reduce((sum, usage) => sum + usage.errors, 0);

    return {
      userId,
      month: targetMonth,
      totalRequests,
      totalTokens,
      totalPrompts,
      totalDocuments,
      totalErrors,
      avgDailyUsage: totalRequests / usageRecords.length,
      peakDayUsage: Math.max(...usageRecords.map(usage => usage.requests)),
      remainingQuota: {
        ...user.subscription.limits,
        dailyRequests: Math.max(0, user.subscription.limits.dailyRequests - totalRequests),
        monthlyRequests: Math.max(0, user.subscription.limits.monthlyRequests - totalRequests)
      }
    };
  }

  // ==================== 订阅管理 ====================

  /**
   * 更新订阅信息
   */
  async updateSubscription(userId: string, subscription: Partial<Subscription>): Promise<OperationResult<User>> {
    return await this.updateUser(userId, { subscription } as Partial<User>);
  }

  /**
   * 获取活跃订阅用户
   */
  async getActiveSubscriptions(): Promise<User[]> {
    const { users } = await this.listUsers(1, 1000);
    return users.filter(user => user.subscription.status === 'active');
  }

  /**
   * 获取即将过期的订阅
   */
  async getExpiringSubscriptions(days = 7): Promise<User[]> {
    const { users } = await this.listUsers(1, 1000);
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    return users.filter(user => 
      user.subscription.status === 'active' &&
      user.subscription.endDate &&
      new Date(user.subscription.endDate) <= targetDate
    );
  }

  // ==================== 系统管理 ====================

  /**
   * 备份数据
   */
  async backup(description?: string): Promise<OperationResult<BackupInfo>> {
    await this.initialize();
    const stopTimer = performanceMonitor.startTimer('backup');

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupId = `backup-${timestamp}`;
      const backupDir = join(this.config.backupPath, backupId);
      
      await ensureDirectory(backupDir);

      // 复制用户数据
      const usersDir = join(this.config.dataPath, 'users');
      const usageDir = join(this.config.dataPath, 'usage');
      
      await this.copyDirectory(usersDir, join(backupDir, 'users'));
      await this.copyDirectory(usageDir, join(backupDir, 'usage'));

      // 创建备份信息
      const { users } = await this.listUsers(1, 10000);
      const backupInfo: BackupInfo = {
        id: backupId,
        createdAt: new Date(),
        path: backupDir,
        size: await this.getDirectorySize(backupDir),
        userCount: users.length,
        description: description || `Automatic backup at ${new Date().toISOString()}`
      };

      // 保存备份信息
      await atomicWrite(
        join(backupDir, 'backup-info.json'),
        JSON.stringify(backupInfo, null, 2)
      );

      return {
        success: true,
        data: backupInfo,
        timestamp: new Date()
      };
    } catch (error: any) {
      throw new JsonStoreError(
        `Backup failed: ${error.message}`,
        ErrorCodes.BACKUP_FAILED,
        'backup'
      );
    } finally {
      stopTimer();
    }
  }

  /**
   * 恢复数据
   */
  async restore(backupId: string): Promise<OperationResult<void>> {
    await this.initialize();
    const stopTimer = performanceMonitor.startTimer('restore');

    try {
      const backupDir = join(this.config.backupPath, backupId);
      const backupInfoPath = join(backupDir, 'backup-info.json');
      
      // 验证备份存在
      const backupInfoData = await safeReadFile(backupInfoPath);
      if (!backupInfoData) {
        throw new JsonStoreError(
          `Backup not found: ${backupId}`,
          ErrorCodes.RESTORE_FAILED,
          'restore'
        );
      }

      // 清空当前数据
      await this.clearAllData();

      // 恢复数据
      await this.copyDirectory(join(backupDir, 'users'), join(this.config.dataPath, 'users'));
      await this.copyDirectory(join(backupDir, 'usage'), join(this.config.dataPath, 'usage'));

      // 清除缓存
      this.userCache.clear();
      this.usageCache.clear();

      return {
        success: true,
        timestamp: new Date()
      };
    } catch (error: any) {
      if (error instanceof JsonStoreError) {
        throw error;
      }
      throw new JsonStoreError(
        `Restore failed: ${error.message}`,
        ErrorCodes.RESTORE_FAILED,
        'restore'
      );
    } finally {
      stopTimer();
    }
  }

  /**
   * 获取备份列表
   */
  async listBackups(): Promise<BackupInfo[]> {
    await this.initialize();

    try {
      const backups: BackupInfo[] = [];
      const backupDirs = await fs.readdir(this.config.backupPath);

      for (const dir of backupDirs) {
        const backupInfoPath = join(this.config.backupPath, dir, 'backup-info.json');
        const data = await safeReadFile(backupInfoPath);
        
        if (data) {
          const backupInfo = JSON.parse(data) as BackupInfo;
          backupInfo.createdAt = new Date(backupInfo.createdAt);
          backups.push(backupInfo);
        }
      }

      // 按创建时间倒序排列
      return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error: any) {
      throw new JsonStoreError(
        `Failed to list backups: ${error.message}`,
        ErrorCodes.IO_ERROR,
        'listBackups'
      );
    }
  }

  /**
   * 获取统计信息（API兼容方法）
   */
  async getStatistics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalRequests: number;
  }> {
    const stats = await this.getStorageStats();
    return {
      totalUsers: stats.totalUsers,
      activeUsers: stats.activeUsers,
      totalRequests: 0 // 简化实现
    };
  }

  /**
   * 获取存储统计信息
   */
  async getStorageStats(): Promise<StorageStats> {
    await this.initialize();

    try {
      const { users, total } = await this.listUsers(1, 10000);
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const activeUsers = users.filter(user => 
        user.lastLoginAt && new Date(user.lastLoginAt) > thirtyDaysAgo
      ).length;

      const totalUsageRecords = 0; // TODO: 实现使用量记录统计
      const storageSize = await this.getDirectorySize(this.config.dataPath);
      
      const backups = await this.listBackups();
      const lastBackup = backups.length > 0 ? backups[0].createdAt : undefined;

      return {
        totalUsers: total,
        activeUsers,
        totalUsageRecords,
        storageSize,
        lastBackup,
        systemHealth: total > 0 ? 'healthy' : 'warning'
      };
    } catch (error: any) {
      throw new JsonStoreError(
        `Failed to get storage stats: ${error.message}`,
        ErrorCodes.IO_ERROR,
        'getStorageStats'
      );
    }
  }

  /**
   * 清理旧数据
   */
  async cleanupOldData(days = 90): Promise<OperationResult<{ deleted: number }>> {
    await this.initialize();

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      // TODO: 实现清理逻辑
      
      return {
        success: true,
        data: { deleted: 0 },
        timestamp: new Date()
      };
    } catch (error: any) {
      throw new JsonStoreError(
        `Failed to cleanup old data: ${error.message}`,
        ErrorCodes.IO_ERROR,
        'cleanupOldData'
      );
    }
  }

  // ==================== 健康检查 ====================

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ healthy: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // 检查目录是否存在
      await fs.access(this.config.dataPath);
      await fs.access(this.config.backupPath);
    } catch (error) {
      issues.push('Storage directories not accessible');
    }

    // 检查权限
    try {
      const testFile = join(this.config.dataPath, '.health-check');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
    } catch (error) {
      issues.push('No write permissions to data directory');
    }

    return {
      healthy: issues.length === 0,
      issues
    };
  }

  /**
   * 验证数据完整性
   */
  async validateData(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      const { users } = await this.listUsers(1, 10000);
      
      for (const user of users) {
        const validation = DataValidator.validateUser(user);
        if (!validation.valid) {
          errors.push(`Invalid user ${user.id}: ${validation.errors.join(', ')}`);
        }
      }
    } catch (error: any) {
      errors.push(`Failed to validate data: ${error.message}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // ==================== 私有辅助方法 ====================

  private async copyDirectory(src: string, dest: string): Promise<void> {
    await ensureDirectory(dest);
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = join(src, entry.name);
      const destPath = join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  private async getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          totalSize += await this.getDirectorySize(fullPath);
        } else {
          const stats = await fs.stat(fullPath);
          totalSize += stats.size;
        }
      }
    } catch (error) {
      // 忽略访问错误
    }

    return totalSize;
  }

  private async clearAllData(): Promise<void> {
    const usersDir = join(this.config.dataPath, 'users');
    const usageDir = join(this.config.dataPath, 'usage');
    
    await this.clearDirectory(usersDir);
    await this.clearDirectory(usageDir);
  }

  private async clearDirectory(dirPath: string): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath);
      
      for (const entry of entries) {
        const fullPath = join(dirPath, entry);
        const stats = await fs.stat(fullPath);
        
        if (stats.isDirectory()) {
          await this.clearDirectory(fullPath);
          await fs.rmdir(fullPath);
        } else {
          await fs.unlink(fullPath);
        }
      }
    } catch (error) {
      // 忽略清理错误
    }
  }
  
  /**
   * 获取存储统计信息
   */
  async getStatistics(): Promise<StorageStats> {
    await this.initialize();
    
    try {
      const usersDir = join(this.config.dataPath, 'users');
      const usageDir = join(this.config.dataPath, 'usage');
      
      let totalUsers = 0;
      let activeUsers = 0;
      let totalRequests = 0;
      
      try {
        const userFiles = await fs.readdir(usersDir);
        totalUsers = userFiles.filter(file => file.endsWith('.json')).length;
        
        // 统计活跃用户（最近30天有活动）
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        for (const file of userFiles) {
          if (file.endsWith('.json')) {
            const userId = file.replace('.json', '');
            const usage = await this.getUsage(userId);
            
            if (usage && usage.lastActivity && new Date(usage.lastActivity) > thirtyDaysAgo) {
              activeUsers++;
            }
            
            if (usage?.daily) {
              totalRequests += Object.values(usage.daily).reduce((sum, daily) => sum + daily.requests, 0);
            }
          }
        }
      } catch (error) {
        console.warn('[Storage] 无法读取用户目录:', error);
      }
      
      return {
        totalUsers,
        activeUsers,
        totalRequests,
        cacheHitRate: this.userCache.getStats?.() || 0,
        storageSize: '计算中...',
        lastBackup: '暂无备份'
      };
    } catch (error) {
      console.error('[Storage] 获取统计信息失败:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalRequests: 0,
        cacheHitRate: 0,
        storageSize: '未知',
        lastBackup: '未知'
      };
    }
  }
}

// ==================== 默认实例和工厂函数 ====================

let defaultStoreInstance: JsonStore | null = null;

/**
 * 获取默认存储实例（单例模式）
 */
export function getDefaultStore(config?: Partial<JsonStoreConfig>): JsonStore {
  if (!defaultStoreInstance) {
    defaultStoreInstance = new JsonStore(config);
  }
  return defaultStoreInstance;
}

/**
 * 创建新的存储实例
 */
export function createStore(config?: Partial<JsonStoreConfig>): JsonStore {
  return new JsonStore(config);
}

/**
 * 创建默认用户偏好
 */
export function createDefaultUserPreferences(): UserPreferences {
  return {
    language: 'zh',
    theme: 'auto',
    defaultModel: 'gpt-4',
    autoSave: true,
    notifications: {
      email: true,
      browser: true,
      quotaWarning: true
    }
  };
}

/**
 * 创建免费套餐限制
 */
export function createFreePlanLimits(): UsageLimits {
  return {
    dailyRequests: 50,
    monthlyRequests: 1000,
    maxTokensPerRequest: 4000,
    maxPromptsPerDay: 20,
    maxDocumentSize: 5 // 5MB
  };
}

/**
 * 创建专业套餐限制
 */
export function createProPlanLimits(): UsageLimits {
  return {
    dailyRequests: 1000,
    monthlyRequests: 30000,
    maxTokensPerRequest: 8000,
    maxPromptsPerDay: 500,
    maxDocumentSize: 50 // 50MB
  };
}

/**
 * 创建新用户
 */
export function createNewUser(
  email: string, 
  name?: string, 
  plan: 'free' | 'pro' | 'enterprise' = 'free'
): User {
  const now = new Date();
  
  return {
    id: generateUserId(),
    email,
    name,
    createdAt: now,
    updatedAt: now,
    isActive: true,
    emailVerified: false,
    preferences: createDefaultUserPreferences(),
    subscription: {
      plan,
      status: 'active',
      startDate: now,
      limits: plan === 'free' ? createFreePlanLimits() : createProPlanLimits(),
      autoRenew: false
    }
  };
}

export default JsonStore;