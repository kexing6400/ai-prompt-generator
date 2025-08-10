/**
 * JSON存储系统的类型定义
 * 支持用户管理、订阅状态、使用量追踪等核心功能
 */

// 用户偏好设置
export interface UserPreferences {
  language: 'zh' | 'en' | 'ja' | 'ko'; // 界面语言
  theme: 'light' | 'dark' | 'auto'; // 主题设置
  defaultModel: string; // 默认AI模型
  autoSave: boolean; // 自动保存设置
  notifications: {
    email: boolean;
    browser: boolean;
    quotaWarning: boolean; // 配额警告
  };
}

// 使用量限制
export interface UsageLimits {
  dailyRequests: number; // 每日请求数限制
  monthlyRequests: number; // 每月请求数限制
  maxTokensPerRequest: number; // 单次请求最大token数
  maxPromptsPerDay: number; // 每日生成提示词数限制
  maxDocumentSize: number; // 文档大小限制(MB)
}

// 订阅信息
export interface Subscription {
  plan: 'free' | 'pro' | 'enterprise'; // 订阅计划
  status: 'active' | 'cancelled' | 'expired' | 'pending'; // 订阅状态
  startDate: Date; // 开始日期
  endDate?: Date; // 结束日期(可选)
  limits: UsageLimits; // 使用限制
  billingCycle?: 'monthly' | 'yearly'; // 计费周期
  autoRenew: boolean; // 自动续费
  paymentMethod?: string; // 支付方式
}

// 用户核心信息
export interface User {
  id: string; // 用户唯一标识
  email: string; // 邮箱地址
  name?: string; // 用户姓名(可选)
  avatar?: string; // 头像URL(可选)
  createdAt: Date; // 创建时间
  updatedAt: Date; // 最后更新时间
  lastLoginAt?: Date; // 最后登录时间(可选)
  subscription: Subscription; // 订阅信息
  preferences: UserPreferences; // 用户偏好
  isActive: boolean; // 账户是否激活
  emailVerified: boolean; // 邮箱是否验证
}

// 使用量统计
export interface Usage {
  userId: string; // 用户ID
  date: string; // 日期 (YYYY-MM-DD 格式)
  month: string; // 月份 (YYYY-MM 格式)
  requests: number; // 请求次数
  tokens: number; // 使用的token数量
  generatedPrompts: number; // 生成的提示词数量
  documentsProcessed: number; // 处理的文档数量
  apiCalls: Record<string, number>; // 各API调用次数统计
  errors: number; // 错误次数
  avgResponseTime: number; // 平均响应时间(ms)
}

// 月度使用统计汇总
export interface MonthlyUsageSummary {
  userId: string;
  month: string; // YYYY-MM
  totalRequests: number;
  totalTokens: number;
  totalPrompts: number;
  totalDocuments: number;
  totalErrors: number;
  avgDailyUsage: number;
  peakDayUsage: number;
  remainingQuota: UsageLimits;
}

// 存储操作结果
export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

// 备份信息
export interface BackupInfo {
  id: string;
  createdAt: Date;
  path: string;
  size: number; // 字节数
  userCount: number;
  description?: string;
}

// 存储统计信息
export interface StorageStats {
  totalUsers: number;
  activeUsers: number; // 过去30天内活跃用户
  totalUsageRecords: number;
  storageSize: number; // 总存储大小(字节)
  lastBackup?: Date;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

// JSON存储接口定义
export interface IJsonStore {
  // === 用户管理 ===
  saveUser(user: User): Promise<OperationResult<User>>;
  getUser(id: string): Promise<User | null>;
  updateUser(id: string, updates: Partial<User>): Promise<OperationResult<User>>;
  deleteUser(id: string): Promise<OperationResult<void>>;
  getUserByEmail(email: string): Promise<User | null>;
  listUsers(page?: number, limit?: number): Promise<{ users: User[]; total: number }>;
  searchUsers(query: string): Promise<User[]>;

  // === 使用量管理 ===
  updateUsage(userId: string, usage: Partial<Usage>): Promise<OperationResult<Usage>>;
  getUsage(userId: string, date?: string): Promise<Usage | null>;
  getUsageByMonth(userId: string, month?: string): Promise<Usage[]>;
  getMonthlyUsageSummary(userId: string, month?: string): Promise<MonthlyUsageSummary | null>;
  
  // === 订阅管理 ===
  updateSubscription(userId: string, subscription: Partial<Subscription>): Promise<OperationResult<User>>;
  getActiveSubscriptions(): Promise<User[]>;
  getExpiringSubscriptions(days?: number): Promise<User[]>;

  // === 系统管理 ===
  backup(description?: string): Promise<OperationResult<BackupInfo>>;
  restore(backupId: string): Promise<OperationResult<void>>;
  listBackups(): Promise<BackupInfo[]>;
  getStorageStats(): Promise<StorageStats>;
  cleanupOldData(days?: number): Promise<OperationResult<{ deleted: number }>>;
  
  // === 健康检查 ===
  healthCheck(): Promise<{ healthy: boolean; issues: string[] }>;
  validateData(): Promise<{ valid: boolean; errors: string[] }>;
}

// 自定义错误类型
export class JsonStoreError extends Error {
  constructor(
    message: string,
    public code: string,
    public operation: string,
    public userId?: string
  ) {
    super(message);
    this.name = 'JsonStoreError';
  }
}

// 错误代码枚举
export enum ErrorCodes {
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  INVALID_DATA = 'INVALID_DATA',
  FILE_LOCK_TIMEOUT = 'FILE_LOCK_TIMEOUT',
  STORAGE_FULL = 'STORAGE_FULL',
  BACKUP_FAILED = 'BACKUP_FAILED',
  RESTORE_FAILED = 'RESTORE_FAILED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  IO_ERROR = 'IO_ERROR',
  CONCURRENT_ACCESS = 'CONCURRENT_ACCESS'
}

// 配置选项
export interface JsonStoreConfig {
  dataPath: string; // 数据存储路径
  backupPath: string; // 备份路径
  maxBackups: number; // 最大备份数量
  enableCache: boolean; // 启用内存缓存
  cacheSize: number; // 缓存大小
  lockTimeout: number; // 文件锁超时时间(ms)
  autoBackup: boolean; // 自动备份
  backupInterval: number; // 备份间隔(小时)
  encryptionKey?: string; // 加密密钥(可选)
  compression: boolean; // 数据压缩
}