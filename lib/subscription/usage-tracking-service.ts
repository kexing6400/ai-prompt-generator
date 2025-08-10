/**
 * 高性能使用量追踪服务
 * 
 * 专门负责用户使用量的统计、缓存、批量更新等高性能操作
 * 支持原子性操作，防止并发竞态条件
 */

import { UsageTracking, UserUsageStatus, SubscriptionPlanType } from '@/types/subscription'
import { getPlanQuota } from './plans'

// ============ 使用量追踪仓库接口 ============

/**
 * 使用量数据访问层接口
 */
export interface UsageTrackingRepository {
  // 基础操作
  getUsageRecord(userEmail: string, yearMonth: string): Promise<UsageTracking | null>
  createUsageRecord(record: Omit<UsageTracking, 'id' | 'createdAt'>): Promise<UsageTracking>
  updateUsageRecord(id: string, updates: Partial<UsageTracking>): Promise<UsageTracking>
  
  // 原子性操作
  incrementUsageAtomic(userEmail: string, yearMonth: string): Promise<number>
  
  // 查询操作
  getUserUsageHistory(userEmail: string, months: number): Promise<UsageTracking[]>
  getBulkUsage(userEmails: string[], yearMonth: string): Promise<Map<string, number>>
  
  // 统计操作
  getTotalUsageStats(yearMonth: string): Promise<{
    totalUsers: number
    totalUsage: number
    averageUsage: number
  }>
}

// ============ 内存实现 (开发阶段) ============

/**
 * 内存使用量追踪仓库
 * 生产环境需要替换为Redis + PostgreSQL实现
 */
class InMemoryUsageTrackingRepository implements UsageTrackingRepository {
  private records: Map<string, UsageTracking> = new Map()
  private idCounter = 1

  private generateId(): string {
    return `usage_${this.idCounter++}`
  }

  private getRecordKey(userEmail: string, yearMonth: string): string {
    return `${userEmail}:${yearMonth}`
  }

  async getUsageRecord(userEmail: string, yearMonth: string): Promise<UsageTracking | null> {
    const key = this.getRecordKey(userEmail, yearMonth)
    const record = Array.from(this.records.values())
      .find(r => r.userEmail === userEmail && r.yearMonth === yearMonth)
    return record || null
  }

  async createUsageRecord(data: Omit<UsageTracking, 'id' | 'createdAt'>): Promise<UsageTracking> {
    const record: UsageTracking = {
      id: this.generateId(),
      ...data,
      createdAt: new Date(),
    }
    
    this.records.set(record.id, record)
    return record
  }

  async updateUsageRecord(id: string, updates: Partial<UsageTracking>): Promise<UsageTracking> {
    const existing = this.records.get(id)
    if (!existing) {
      throw new Error(`Usage record not found: ${id}`)
    }

    const updated: UsageTracking = {
      ...existing,
      ...updates,
    }

    this.records.set(id, updated)
    return updated
  }

  async incrementUsageAtomic(userEmail: string, yearMonth: string): Promise<number> {
    // 模拟原子性操作
    const existing = await this.getUsageRecord(userEmail, yearMonth)
    
    if (existing) {
      const newCount = existing.usageCount + 1
      await this.updateUsageRecord(existing.id, {
        usageCount: newCount,
        lastUsedAt: new Date(),
      })
      return newCount
    } else {
      const newRecord = await this.createUsageRecord({
        userEmail,
        yearMonth,
        usageCount: 1,
        lastUsedAt: new Date(),
      })
      return newRecord.usageCount
    }
  }

  async getUserUsageHistory(userEmail: string, months: number): Promise<UsageTracking[]> {
    const now = new Date()
    const targetMonths: string[] = []
    
    // 生成目标月份列表
    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      targetMonths.push(yearMonth)
    }

    // 查找用户在这些月份的记录
    const records = Array.from(this.records.values())
      .filter(r => r.userEmail === userEmail && targetMonths.includes(r.yearMonth))
      .sort((a, b) => b.yearMonth.localeCompare(a.yearMonth)) // 按月份倒序

    return records
  }

  async getBulkUsage(userEmails: string[], yearMonth: string): Promise<Map<string, number>> {
    const result = new Map<string, number>()
    
    for (const userEmail of userEmails) {
      const record = await this.getUsageRecord(userEmail, yearMonth)
      result.set(userEmail, record?.usageCount || 0)
    }
    
    return result
  }

  async getTotalUsageStats(yearMonth: string): Promise<{
    totalUsers: number
    totalUsage: number
    averageUsage: number
  }> {
    const monthRecords = Array.from(this.records.values())
      .filter(r => r.yearMonth === yearMonth)
    
    const totalUsers = monthRecords.length
    const totalUsage = monthRecords.reduce((sum, r) => sum + r.usageCount, 0)
    const averageUsage = totalUsers > 0 ? totalUsage / totalUsers : 0
    
    return { totalUsers, totalUsage, averageUsage }
  }
}

// ============ 使用量追踪服务 ============

/**
 * 使用量追踪服务配置
 */
export interface UsageTrackingConfig {
  // 缓存配置
  enableCaching: boolean
  cacheExpiry: number // 缓存过期时间(秒)
  
  // 批量更新配置
  batchSize: number
  batchInterval: number // 批量更新间隔(毫秒)
  
  // 性能监控
  enableMetrics: boolean
  slowQueryThreshold: number // 慢查询阈值(毫秒)
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: UsageTrackingConfig = {
  enableCaching: true,
  cacheExpiry: 300, // 5分钟
  batchSize: 100,
  batchInterval: 5000, // 5秒
  enableMetrics: true,
  slowQueryThreshold: 100, // 100ms
}

/**
 * 使用量追踪服务类
 */
export class UsageTrackingService {
  private repository: UsageTrackingRepository
  private config: UsageTrackingConfig
  private cache: Map<string, { value: number; timestamp: number }> = new Map()
  private batchQueue: Array<{ userEmail: string; operation: string; timestamp: number }> = []
  private batchTimer?: NodeJS.Timeout

  constructor(
    repository?: UsageTrackingRepository,
    config?: Partial<UsageTrackingConfig>
  ) {
    this.repository = repository || new InMemoryUsageTrackingRepository()
    this.config = { ...DEFAULT_CONFIG, ...config }
    
    // 启动批量处理定时器
    if (this.config.batchInterval > 0) {
      this.startBatchProcessor()
    }
  }

  // ============ 核心使用量操作 ============

  /**
   * 获取用户当前月份使用量
   */
  async getCurrentUsage(userEmail: string): Promise<number> {
    const yearMonth = this.getCurrentYearMonth()
    const cacheKey = `${userEmail}:${yearMonth}`
    
    // 尝试从缓存获取
    if (this.config.enableCaching) {
      const cached = this.getCachedValue(cacheKey)
      if (cached !== null) {
        return cached
      }
    }
    
    const startTime = Date.now()
    const record = await this.repository.getUsageRecord(userEmail, yearMonth)
    const usage = record?.usageCount || 0
    
    // 记录性能指标
    this.recordMetrics('getCurrentUsage', Date.now() - startTime)
    
    // 更新缓存
    if (this.config.enableCaching) {
      this.setCachedValue(cacheKey, usage)
    }
    
    return usage
  }

  /**
   * 原子性增加使用量
   */
  async incrementUsage(userEmail: string, operation = 'prompt_generation'): Promise<number> {
    const yearMonth = this.getCurrentYearMonth()
    const startTime = Date.now()
    
    try {
      const newCount = await this.repository.incrementUsageAtomic(userEmail, yearMonth)
      
      // 更新缓存
      const cacheKey = `${userEmail}:${yearMonth}`
      if (this.config.enableCaching) {
        this.setCachedValue(cacheKey, newCount)
      }
      
      // 记录到批量队列 (用于分析)
      this.batchQueue.push({
        userEmail,
        operation,
        timestamp: Date.now(),
      })
      
      this.recordMetrics('incrementUsage', Date.now() - startTime)
      return newCount
      
    } catch (error) {
      console.error('Failed to increment usage:', error)
      throw error
    }
  }

  /**
   * 批量获取多个用户的使用量
   */
  async getBulkUsage(userEmails: string[]): Promise<Map<string, number>> {
    const yearMonth = this.getCurrentYearMonth()
    const startTime = Date.now()
    
    const result = await this.repository.getBulkUsage(userEmails, yearMonth)
    
    // 更新缓存
    if (this.config.enableCaching) {
      for (const [userEmail, usage] of Array.from(result)) {
        const cacheKey = `${userEmail}:${yearMonth}`
        this.setCachedValue(cacheKey, usage)
      }
    }
    
    this.recordMetrics('getBulkUsage', Date.now() - startTime, userEmails.length)
    return result
  }

  /**
   * 获取用户使用量历史
   */
  async getUserUsageHistory(userEmail: string, months = 6) {
    const startTime = Date.now()
    const records = await this.repository.getUserUsageHistory(userEmail, months)
    
    // 填充缺失月份的数据
    const now = new Date()
    const completeHistory = []
    
    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      const record = records.find(r => r.yearMonth === yearMonth)
      completeHistory.push({
        month: yearMonth,
        usage: record?.usageCount || 0,
        lastUsedAt: record?.lastUsedAt,
      })
    }
    
    this.recordMetrics('getUserUsageHistory', Date.now() - startTime)
    return completeHistory
  }

  // ============ 配额检查 ============

  /**
   * 检查用户是否超出配额
   */
  async checkQuotaExceeded(userEmail: string, planType: SubscriptionPlanType): Promise<{
    exceeded: boolean
    current: number
    limit: number
    remaining: number
  }> {
    const current = await this.getCurrentUsage(userEmail)
    const limit = getPlanQuota(planType)
    
    // -1 表示无限制
    if (limit === -1) {
      return {
        exceeded: false,
        current,
        limit: -1,
        remaining: -1,
      }
    }
    
    const remaining = Math.max(0, limit - current)
    const exceeded = current >= limit
    
    return {
      exceeded,
      current,
      limit,
      remaining,
    }
  }

  /**
   * 获取用户完整使用量状态
   */
  async getUserUsageStatus(
    userEmail: string, 
    planType: SubscriptionPlanType
  ): Promise<UserUsageStatus> {
    const quota = await this.checkQuotaExceeded(userEmail, planType)
    const now = new Date()
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    
    return {
      userEmail,
      currentPeriod: {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: nextMonth,
      },
      quota: {
        limit: quota.limit,
        used: quota.current,
        remaining: quota.remaining,
      },
      subscriptionType: planType,
      canGenerate: !quota.exceeded,
      resetDate: nextMonth,
    }
  }

  // ============ 分析和报表 ============

  /**
   * 获取月度使用量统计
   */
  async getMonthlyStats(yearMonth?: string) {
    const targetMonth = yearMonth || this.getCurrentYearMonth()
    return this.repository.getTotalUsageStats(targetMonth)
  }

  /**
   * 获取使用量趋势分析
   */
  async getUsageTrends(months = 6) {
    const now = new Date()
    const trends = []
    
    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const stats = await this.repository.getTotalUsageStats(yearMonth)
      
      trends.push({
        month: yearMonth,
        ...stats,
      })
    }
    
    return trends.reverse() // 按时间正序
  }

  // ============ 私有工具方法 ============

  private getCurrentYearMonth(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  private getCachedValue(key: string): number | null {
    if (!this.config.enableCaching) return null
    
    const cached = this.cache.get(key)
    if (!cached) return null
    
    const isExpired = Date.now() - cached.timestamp > this.config.cacheExpiry * 1000
    if (isExpired) {
      this.cache.delete(key)
      return null
    }
    
    return cached.value
  }

  private setCachedValue(key: string, value: number): void {
    if (!this.config.enableCaching) return
    
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    })
  }

  private recordMetrics(operation: string, duration: number, batchSize?: number): void {
    if (!this.config.enableMetrics) return
    
    if (duration > this.config.slowQueryThreshold) {
      console.warn(`Slow usage tracking query: ${operation} took ${duration}ms` + 
                  (batchSize ? ` for ${batchSize} items` : ''))
    }
    
    // TODO: 集成到真实的监控系统 (如Prometheus, DataDog等)
    // metrics.histogram('usage_tracking_duration', duration, { operation })
  }

  private startBatchProcessor(): void {
    this.batchTimer = setInterval(() => {
      this.processBatchQueue()
    }, this.config.batchInterval)
  }

  private async processBatchQueue(): Promise<void> {
    if (this.batchQueue.length === 0) return
    
    const batch = this.batchQueue.splice(0, this.config.batchSize)
    
    try {
      // TODO: 实现批量分析处理 (用户行为分析、热点检测等)
      console.log(`Processing batch of ${batch.length} usage events`)
      
      // 这里可以进行：
      // 1. 用户行为分析
      // 2. 使用模式检测
      // 3. 异常使用检测
      // 4. 推荐升级时机分析
      
    } catch (error) {
      console.error('Failed to process batch queue:', error)
      // 将失败的批次重新加入队列
      this.batchQueue.unshift(...batch)
    }
  }

  // ============ 清理和销毁 ============

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * 销毁服务 (清理定时器)
   */
  destroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer)
      this.batchTimer = undefined
    }
    this.clearCache()
    this.batchQueue = []
  }
}

// ============ 单例导出 ============

/**
 * 默认使用量追踪服务实例
 */
export const usageTrackingService = new UsageTrackingService()

/**
 * 创建自定义使用量追踪服务 (用于测试或特殊配置)
 */
export function createUsageTrackingService(
  repository?: UsageTrackingRepository,
  config?: Partial<UsageTrackingConfig>
): UsageTrackingService {
  return new UsageTrackingService(repository, config)
}