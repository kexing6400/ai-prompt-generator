/**
 * JSON存储系统入口文件
 * 统一导出所有类型、类和工具函数
 */

// 核心存储类
export {
  JsonStore,
  getDefaultStore,
  createStore,
  createNewUser,
  createDefaultUserPreferences,
  createFreePlanLimits,
  createProPlanLimits
} from './json-store';

// 类型定义
export type {
  User,
  Usage,
  UserPreferences,
  Subscription,
  UsageLimits,
  OperationResult,
  BackupInfo,
  StorageStats,
  MonthlyUsageSummary,
  IJsonStore,
  JsonStoreConfig
} from './types';

// 错误类和枚举
export {
  JsonStoreError,
  ErrorCodes
} from './types';

// 工具函数和类
export {
  DEFAULT_CONFIG,
  fileLockManager,
  ensureDirectory,
  atomicWrite,
  safeReadFile,
  generateUserId,
  generateFilePath,
  DataValidator,
  DataEncryption,
  LRUCache,
  PerformanceMonitor,
  performanceMonitor,
  formatFileSize,
  getCurrentTimestamp,
  getCurrentDateString,
  getCurrentMonthString,
  calculateFileHash
} from './utils';

// 示例和测试函数
export {
  basicUsageExample,
  advancedFeaturesExample,
  performanceTestExample,
  errorHandlingExample,
  runAllExamples
} from './example';

// 默认导出主类
export { JsonStore as default } from './json-store';