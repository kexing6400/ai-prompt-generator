/**
 * AI Prompt Builder Pro - 缓存管理系统
 * 
 * 多层缓存架构：
 * 1. 内存缓存 - 热门数据快速访问
 * 2. 浏览器缓存 - 静态资源缓存
 * 3. 边缘缓存 - Vercel Edge Cache
 * 4. 数据库缓存 - Supabase查询缓存
 * 
 * @author Claude Code (后端架构师)
 * @version 2.0
 * @date 2025-01-10
 */

import { LRUCache } from 'lru-cache'

// =================================================================
// 核心类型定义
// =================================================================

export interface CacheConfig {
  maxSize: number
  ttl: number // 生存时间(毫秒)
  staleWhileRevalidate?: number // 过期后继续服务的时间
  updateAgeOnGet?: boolean
  allowStale?: boolean
}

export interface CacheItem<T> {
  data: T
  key: string
  createdAt: Date
  expiresAt: Date
  accessCount: number
  lastAccessed: Date
}

export interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  size: number
  memoryUsage: number
}

// 缓存键生成器
export type CacheKeyGenerator = (...args: any[]) => string

// 缓存值获取器  
export type CacheValueGetter<T> = () => Promise<T>

// =================================================================
// 多层缓存管理器
// =================================================================

export class MultiLevelCacheManager {
  private memoryCache: LRUCache<string, any>
  private stats: Map<string, CacheStats> = new Map()
  private keyGenerators: Map<string, CacheKeyGenerator> = new Map()

  constructor(private config: CacheConfig = {
    maxSize: 1000,
    ttl: 10 * 60 * 1000, // 10分钟
    staleWhileRevalidate: 5 * 60 * 1000, // 5分钟
    updateAgeOnGet: true,
    allowStale: true
  }) {
    this.memoryCache = new LRUCache({
      max: config.maxSize,
      ttl: config.ttl,
      staleWhileRevalidate: config.staleWhileRevalidate,
      updateAgeOnGet: config.updateAgeOnGet,
      allowStale: config.allowStale,
      fetchMethod: async (key: string) => {
        // 当缓存未命中时的后备获取逻辑
        return this.fetchFromDatabase(key)
      }
    })

    this.initializeKeyGenerators()
  }

  // =================================================================
  // 核心缓存操作
  // =================================================================

  /**
   * 获取缓存值 - 支持多级回退
   */
  public async get<T>(
    cacheKey: string,
    fallbackGetter?: CacheValueGetter<T>,
    options?: {
      skipMemory?: boolean
      skipEdge?: boolean  
      maxAge?: number
    }
  ): Promise<T | null> {
    const startTime = Date.now()

    try {
      // 1. 尝试内存缓存
      if (!options?.skipMemory) {
        const memoryValue = this.memoryCache.get(cacheKey)
        if (memoryValue !== undefined) {
          this.recordHit(cacheKey, Date.now() - startTime)
          return memoryValue as T
        }
      }

      // 2. 尝试边缘缓存 (Vercel Edge Cache)
      if (!options?.skipEdge && typeof window !== 'undefined') {
        const edgeValue = await this.getFromEdgeCache(cacheKey, options?.maxAge)
        if (edgeValue !== null) {
          // 回填内存缓存
          this.memoryCache.set(cacheKey, edgeValue)
          this.recordHit(cacheKey, Date.now() - startTime)
          return edgeValue as T
        }
      }

      // 3. 尝试从数据库获取
      if (fallbackGetter) {
        const dbValue = await fallbackGetter()
        if (dbValue !== null) {
          // 设置到所有缓存层级
          await this.setMultiLevel(cacheKey, dbValue)
          this.recordMiss(cacheKey, Date.now() - startTime)
          return dbValue
        }
      }

      this.recordMiss(cacheKey, Date.now() - startTime)
      return null
    } catch (error) {
      console.error('缓存获取失败:', { cacheKey, error })
      this.recordMiss(cacheKey, Date.now() - startTime)
      return fallbackGetter ? await fallbackGetter() : null
    }
  }

  /**
   * 设置缓存值 - 写入所有层级
   */
  public async set<T>(
    cacheKey: string,
    value: T,
    options?: {
      ttl?: number
      skipMemory?: boolean
      skipEdge?: boolean
    }
  ): Promise<void> {
    try {
      await this.setMultiLevel(cacheKey, value, options)
    } catch (error) {
      console.error('缓存设置失败:', { cacheKey, error })
    }
  }

  /**
   * 删除缓存 - 从所有层级移除
   */
  public async delete(cacheKey: string): Promise<void> {
    try {
      // 从内存缓存删除
      this.memoryCache.delete(cacheKey)

      // 从边缘缓存删除 (通过设置过期的值)
      if (typeof window !== 'undefined') {
        await this.deleteFromEdgeCache(cacheKey)
      }

      // 从数据库缓存删除
      await this.deleteFromDatabase(cacheKey)
    } catch (error) {
      console.error('缓存删除失败:', { cacheKey, error })
    }
  }

  /**
   * 批量获取缓存
   */
  public async getBatch<T>(
    keys: string[],
    fallbackGetter?: (keys: string[]) => Promise<Map<string, T>>
  ): Promise<Map<string, T>> {
    const results = new Map<string, T>()
    const missingKeys: string[] = []

    // 1. 从内存缓存批量获取
    for (const key of keys) {
      const value = this.memoryCache.get(key)
      if (value !== undefined) {
        results.set(key, value as T)
        this.recordHit(key, 0)
      } else {
        missingKeys.push(key)
      }
    }

    // 2. 对缺失的键使用fallback
    if (missingKeys.length > 0 && fallbackGetter) {
      try {
        const fallbackResults = await fallbackGetter(missingKeys)
        
        for (const [key, value] of fallbackResults) {
          results.set(key, value)
          // 回填缓存
          this.memoryCache.set(key, value)
          this.recordMiss(key, 0)
        }
      } catch (error) {
        console.error('批量缓存fallback失败:', error)
      }
    }

    return results
  }

  // =================================================================
  // 专用缓存方法 - 针对特定业务场景优化
  // =================================================================

  /**
   * 模板缓存 - 带有智能预热
   */
  public async getTemplate(
    templateId: string,
    fallback?: () => Promise<any>
  ): Promise<any> {
    const key = this.generateKey('template', templateId)
    
    const result = await this.get(key, fallback, { maxAge: 10 * 60 * 1000 })
    
    // 智能预热相关模板
    if (result) {
      this.preloadRelatedTemplates(templateId).catch(console.error)
    }
    
    return result
  }

  /**
   * 用户权限缓存 - 短期缓存，高频访问
   */
  public async getUserPermissions(
    userId: string,
    fallback?: () => Promise<any>
  ): Promise<any> {
    const key = this.generateKey('user-permissions', userId)
    return this.get(key, fallback, { maxAge: 5 * 60 * 1000 })
  }

  /**
   * 行业场景缓存 - 长期缓存，变更较少
   */
  public async getIndustryScenarios(
    industryCode: string,
    fallback?: () => Promise<any>
  ): Promise<any> {
    const key = this.generateKey('industry-scenarios', industryCode)
    return this.get(key, fallback, { maxAge: 60 * 60 * 1000 }) // 1小时
  }

  /**
   * 生成历史缓存 - 用户专属，中等时长
   */
  public async getUserHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
    fallback?: () => Promise<any>
  ): Promise<any> {
    const key = this.generateKey('user-history', userId, page, limit)
    return this.get(key, fallback, { maxAge: 15 * 60 * 1000 }) // 15分钟
  }

  // =================================================================
  // 缓存键管理
  // =================================================================

  /**
   * 初始化键生成器
   */
  private initializeKeyGenerators(): void {
    this.keyGenerators.set('template', (id: string) => `tmpl:${id}`)
    this.keyGenerators.set('user-permissions', (userId: string) => `perm:${userId}`)
    this.keyGenerators.set('industry-scenarios', (industryCode: string) => `ind:${industryCode}`)
    this.keyGenerators.set('user-history', (userId: string, page: number, limit: number) => 
      `hist:${userId}:${page}:${limit}`)
    this.keyGenerators.set('template-stats', (templateId: string) => `stats:${templateId}`)
    this.keyGenerators.set('usage-tracking', (userId: string, date: string) => 
      `usage:${userId}:${date}`)
  }

  /**
   * 生成缓存键
   */
  public generateKey(type: string, ...args: any[]): string {
    const generator = this.keyGenerators.get(type)
    if (generator) {
      return generator(...args)
    }
    
    // 默认键生成逻辑
    return `${type}:${args.join(':')}`
  }

  /**
   * 注册自定义键生成器
   */
  public registerKeyGenerator(type: string, generator: CacheKeyGenerator): void {
    this.keyGenerators.set(type, generator)
  }

  // =================================================================
  // 内部缓存层实现
  // =================================================================

  /**
   * 多层级设置
   */
  private async setMultiLevel<T>(
    key: string,
    value: T,
    options?: { ttl?: number; skipMemory?: boolean; skipEdge?: boolean }
  ): Promise<void> {
    const ttl = options?.ttl || this.config.ttl

    // 设置内存缓存
    if (!options?.skipMemory) {
      this.memoryCache.set(key, value, { ttl })
    }

    // 设置边缘缓存
    if (!options?.skipEdge && typeof window !== 'undefined') {
      await this.setEdgeCache(key, value, ttl)
    }

    // 设置数据库缓存（如果适用）
    await this.setDatabaseCache(key, value, ttl)
  }

  /**
   * 边缘缓存操作 - 使用浏览器缓存API
   */
  private async getFromEdgeCache(key: string, maxAge?: number): Promise<any> {
    if (typeof caches === 'undefined') return null

    try {
      const cache = await caches.open('prompt-templates-v1')
      const response = await cache.match(key)
      
      if (!response) return null

      // 检查缓存时效性
      const cacheDate = response.headers.get('date')
      if (cacheDate && maxAge) {
        const cacheTime = new Date(cacheDate).getTime()
        if (Date.now() - cacheTime > maxAge) {
          await cache.delete(key)
          return null
        }
      }

      return await response.json()
    } catch (error) {
      console.error('边缘缓存读取失败:', error)
      return null
    }
  }

  private async setEdgeCache(key: string, value: any, ttl: number): Promise<void> {
    if (typeof caches === 'undefined') return

    try {
      const cache = await caches.open('prompt-templates-v1')
      const response = new Response(JSON.stringify(value), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `max-age=${Math.floor(ttl / 1000)}`,
          'Date': new Date().toISOString()
        }
      })
      
      await cache.put(key, response)
    } catch (error) {
      console.error('边缘缓存写入失败:', error)
    }
  }

  private async deleteFromEdgeCache(key: string): Promise<void> {
    if (typeof caches === 'undefined') return

    try {
      const cache = await caches.open('prompt-templates-v1')
      await cache.delete(key)
    } catch (error) {
      console.error('边缘缓存删除失败:', error)
    }
  }

  /**
   * 数据库缓存操作 - 与Supabase集成
   */
  private async fetchFromDatabase(key: string): Promise<any> {
    // 这里集成实际的数据库查询逻辑
    // 根据缓存键类型路由到相应的数据获取函数
    return null
  }

  private async setDatabaseCache(key: string, value: any, ttl: number): Promise<void> {
    // 实现数据库级别的缓存设置（可选）
    // 例如：使用Redis或数据库表存储缓存
  }

  private async deleteFromDatabase(key: string): Promise<void> {
    // 实现数据库级别的缓存删除
  }

  // =================================================================
  // 智能预加载和优化
  // =================================================================

  /**
   * 预加载相关模板
   */
  private async preloadRelatedTemplates(templateId: string): Promise<void> {
    // 基于使用模式预加载相关模板
    // 这里可以实现机器学习算法来预测用户接下来可能需要的模板
  }

  /**
   * 缓存预热 - 在系统启动时预加载热门数据
   */
  public async warmupCache(): Promise<void> {
    try {
      // 预加载热门行业和场景
      const popularIndustries = ['lawyer', 'realtor', 'insurance', 'teacher', 'accountant']
      for (const industry of popularIndustries) {
        this.getIndustryScenarios(industry).catch(console.error)
      }

      // 预加载热门模板（基于使用统计）
      const popularTemplates = await this.getPopularTemplateIds()
      for (const templateId of popularTemplates) {
        this.getTemplate(templateId).catch(console.error)
      }
    } catch (error) {
      console.error('缓存预热失败:', error)
    }
  }

  private async getPopularTemplateIds(): Promise<string[]> {
    // 从数据库获取热门模板ID列表
    return []
  }

  // =================================================================
  // 统计和监控
  // =================================================================

  /**
   * 记录缓存命中
   */
  private recordHit(key: string, responseTime: number): void {
    const stats = this.getOrCreateStats(key)
    stats.hits++
    this.updateHitRate(stats)
  }

  /**
   * 记录缓存未命中
   */
  private recordMiss(key: string, responseTime: number): void {
    const stats = this.getOrCreateStats(key)
    stats.misses++
    this.updateHitRate(stats)
  }

  private getOrCreateStats(key: string): CacheStats {
    const cacheType = key.split(':')[0]
    if (!this.stats.has(cacheType)) {
      this.stats.set(cacheType, {
        hits: 0,
        misses: 0,
        hitRate: 0,
        size: 0,
        memoryUsage: 0
      })
    }
    return this.stats.get(cacheType)!
  }

  private updateHitRate(stats: CacheStats): void {
    const total = stats.hits + stats.misses
    stats.hitRate = total > 0 ? stats.hits / total : 0
  }

  /**
   * 获取缓存统计信息
   */
  public getStats(): Map<string, CacheStats> {
    // 更新当前大小信息
    for (const [type, stats] of this.stats) {
      stats.size = this.memoryCache.size
      stats.memoryUsage = this.memoryCache.calculatedSize || 0
    }
    
    return new Map(this.stats)
  }

  /**
   * 获取缓存健康状态
   */
  public getHealthStatus(): {
    healthy: boolean
    memoryUsage: number
    hitRate: number
    issues: string[]
  } {
    const stats = Array.from(this.stats.values())
    const avgHitRate = stats.reduce((sum, s) => sum + s.hitRate, 0) / stats.length
    const memoryUsage = this.memoryCache.calculatedSize || 0
    const maxMemory = this.config.maxSize * 1024 // 估算值
    
    const issues: string[] = []
    
    if (avgHitRate < 0.7) {
      issues.push('缓存命中率过低')
    }
    
    if (memoryUsage / maxMemory > 0.9) {
      issues.push('内存使用率过高')
    }
    
    return {
      healthy: issues.length === 0,
      memoryUsage: memoryUsage / maxMemory,
      hitRate: avgHitRate,
      issues
    }
  }

  /**
   * 清理缓存 - 移除过期和不常用的数据
   */
  public cleanup(): void {
    // LRU缓存会自动清理，这里可以添加额外的清理逻辑
    this.memoryCache.purgeStale()
    
    // 清理统计数据
    for (const [type, stats] of this.stats) {
      if (stats.hits + stats.misses === 0) {
        this.stats.delete(type)
      }
    }
  }

  /**
   * 重置所有缓存
   */
  public reset(): void {
    this.memoryCache.clear()
    this.stats.clear()
    
    // 清理边缘缓存
    if (typeof caches !== 'undefined') {
      caches.delete('prompt-templates-v1').catch(console.error)
    }
  }
}

// =================================================================
// 全局缓存实例
// =================================================================

let globalCacheManager: MultiLevelCacheManager | null = null

/**
 * 获取全局缓存管理器实例
 */
export function getCacheManager(config?: Partial<CacheConfig>): MultiLevelCacheManager {
  if (!globalCacheManager) {
    globalCacheManager = new MultiLevelCacheManager(config)
  }
  return globalCacheManager
}

/**
 * 缓存装饰器 - 用于方法级缓存
 */
export function Cacheable(
  keyGenerator: CacheKeyGenerator,
  ttl?: number
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const cacheManager = getCacheManager()
      const key = keyGenerator(...args)
      
      let result = await cacheManager.get(key)
      if (result === null) {
        result = await method.apply(this, args)
        if (result !== null) {
          await cacheManager.set(key, result, { ttl })
        }
      }
      
      return result
    }
  }
}

export default MultiLevelCacheManager