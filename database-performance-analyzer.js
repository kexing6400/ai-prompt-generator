/**
 * 数据库性能深度分析器
 * 专门针对JSON文件存储系统进行性能分析和优化建议
 * 作者：Database Optimizer Team
 */

const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');

// 数据库性能分析配置
const DB_CONFIG = {
  dataPath: './data',
  maxTestUsers: 1000,        // 最大测试用户数
  maxFileSize: 1024 * 1024,  // 1MB文件大小警告
  maxQueryTime: 100,         // 100ms查询时间警告
  indexThreshold: 50,        // 超过50个文件建议索引
  concurrentOperations: [1, 5, 10, 20], // 并发操作测试级别
};

// 性能测试结果收集器
class DatabasePerformanceCollector {
  constructor() {
    this.results = {
      fileSystem: {
        userFiles: 0,
        usageFiles: 0,
        totalSize: 0,
        averageFileSize: 0,
        largeFiles: []
      },
      operationTimes: {
        singleRead: [],
        singleWrite: [],
        batchRead: [],
        batchWrite: [],
        search: [],
        indexScan: []
      },
      concurrencyTests: {},
      cacheAnalysis: {
        hitRate: 0,
        missRate: 0,
        avgHitTime: 0,
        avgMissTime: 0
      },
      bottlenecks: [],
      optimizations: [],
      indexRecommendations: [],
      startTime: Date.now(),
      endTime: null
    };
  }

  addOperationTime(operation, time, details = {}) {
    if (this.results.operationTimes[operation]) {
      this.results.operationTimes[operation].push({
        time,
        details,
        timestamp: Date.now()
      });
    }
  }

  addBottleneck(type, description, impact, solution) {
    this.results.bottlenecks.push({
      type,
      description,
      impact,
      solution,
      severity: this.calculateSeverity(impact)
    });
  }

  calculateSeverity(impact) {
    if (impact > 1000) return 'HIGH';
    if (impact > 500) return 'MEDIUM';
    return 'LOW';
  }

  finalize() {
    this.results.endTime = Date.now();
    this.generateOptimizations();
    this.generateIndexRecommendations();
  }

  generateOptimizations() {
    const optimizations = [];

    // 基于文件数量的优化建议
    if (this.results.fileSystem.userFiles > DB_CONFIG.indexThreshold) {
      optimizations.push({
        type: 'INDEXING',
        priority: 'HIGH',
        description: '用户文件数量过多，建议实施索引策略',
        implementation: '创建用户邮箱和ID的内存索引，避免全表扫描',
        estimatedImprovement: '查询性能提升80%'
      });
    }

    // 基于文件大小的优化建议
    if (this.results.fileSystem.largeFiles.length > 0) {
      optimizations.push({
        type: 'FILE_SPLITTING',
        priority: 'MEDIUM',
        description: `发现${this.results.fileSystem.largeFiles.length}个大文件`,
        implementation: '将大文件拆分为多个小文件，或使用流式读写',
        estimatedImprovement: '文件I/O性能提升50%'
      });
    }

    // 基于操作时间的缓存建议
    const avgSearchTime = this.getAverageTime('search');
    if (avgSearchTime > DB_CONFIG.maxQueryTime) {
      optimizations.push({
        type: 'CACHING',
        priority: 'HIGH',
        description: `搜索操作平均耗时${avgSearchTime.toFixed(1)}ms，超出阈值`,
        implementation: '实施查询结果缓存，LRU淘汰策略',
        estimatedImprovement: '搜索性能提升70%'
      });
    }

    this.results.optimizations = optimizations;
  }

  generateIndexRecommendations() {
    const recommendations = [];

    // 用户邮箱索引
    if (this.results.fileSystem.userFiles > 20) {
      recommendations.push({
        field: 'user.email',
        type: 'HASH_INDEX',
        reason: '用户邮箱查询频繁，需要快速精确匹配',
        implementation: 'Map<email, filePath>'
      });
    }

    // 用户ID索引
    recommendations.push({
      field: 'user.id',
      type: 'HASH_INDEX',
      reason: '用户ID是主键，需要O(1)访问时间',
      implementation: 'Map<id, userData>'
    });

    // 使用量时间索引
    if (this.results.fileSystem.usageFiles > 10) {
      recommendations.push({
        field: 'usage.date',
        type: 'BTREE_INDEX',
        reason: '使用量按时间范围查询，需要有序索引',
        implementation: 'SortedMap<date, usageData>'
      });
    }

    this.results.indexRecommendations = recommendations;
  }

  getAverageTime(operation) {
    const times = this.results.operationTimes[operation];
    if (!times || times.length === 0) return 0;
    return times.reduce((sum, entry) => sum + entry.time, 0) / times.length;
  }
}

// 数据库性能分析器主类
class DatabasePerformanceAnalyzer {
  constructor() {
    this.collector = new DatabasePerformanceCollector();
    this.dataPath = path.resolve(DB_CONFIG.dataPath);
    
    // 模拟缓存
    this.mockCache = new Map();
    this.cacheStats = { hits: 0, misses: 0 };
  }

  // 分析文件系统状态
  async analyzeFileSystem() {
    console.log('📁 分析文件系统状态...');
    
    try {
      // 分析用户文件
      await this.analyzeUserFiles();
      
      // 分析使用量文件
      await this.analyzeUsageFiles();
      
      // 计算统计信息
      this.calculateFileSystemStats();
      
    } catch (error) {
      console.error('文件系统分析失败:', error);
    }
  }

  async analyzeUserFiles() {
    const usersDir = path.join(this.dataPath, 'users');
    
    try {
      const files = await fs.readdir(usersDir);
      const userFiles = files.filter(f => f.endsWith('.json'));
      
      this.collector.results.fileSystem.userFiles = userFiles.length;
      
      let totalSize = 0;
      for (const file of userFiles) {
        const filePath = path.join(usersDir, file);
        const stats = await fs.stat(filePath);
        
        totalSize += stats.size;
        
        // 检查大文件
        if (stats.size > DB_CONFIG.maxFileSize) {
          this.collector.results.fileSystem.largeFiles.push({
            path: filePath,
            size: stats.size,
            type: 'user'
          });
        }
      }
      
      this.collector.results.fileSystem.totalSize += totalSize;
      
    } catch (error) {
      console.warn('用户文件分析失败:', error.message);
    }
  }

  async analyzeUsageFiles() {
    const usageDir = path.join(this.dataPath, 'usage');
    
    try {
      const files = await fs.readdir(usageDir);
      const usageFiles = files.filter(f => f.endsWith('.json'));
      
      this.collector.results.fileSystem.usageFiles = usageFiles.length;
      
      let totalSize = 0;
      for (const file of usageFiles) {
        const filePath = path.join(usageDir, file);
        const stats = await fs.stat(filePath);
        
        totalSize += stats.size;
        
        if (stats.size > DB_CONFIG.maxFileSize) {
          this.collector.results.fileSystem.largeFiles.push({
            path: filePath,
            size: stats.size,
            type: 'usage'
          });
        }
      }
      
      this.collector.results.fileSystem.totalSize += totalSize;
      
    } catch (error) {
      console.warn('使用量文件分析失败:', error.message);
    }
  }

  calculateFileSystemStats() {
    const totalFiles = this.collector.results.fileSystem.userFiles + 
                      this.collector.results.fileSystem.usageFiles;
    
    if (totalFiles > 0) {
      this.collector.results.fileSystem.averageFileSize = 
        this.collector.results.fileSystem.totalSize / totalFiles;
    }
  }

  // 测试单文件操作性能
  async testSingleFileOperations() {
    console.log('📄 测试单文件操作性能...');
    
    // 测试单文件读取
    await this.testSingleRead();
    
    // 测试单文件写入
    await this.testSingleWrite();
    
    // 测试文件搜索
    await this.testFileSearch();
  }

  async testSingleRead() {
    const usersDir = path.join(this.dataPath, 'users');
    
    try {
      const files = await fs.readdir(usersDir);
      const userFiles = files.filter(f => f.endsWith('.json')).slice(0, 10);
      
      for (const file of userFiles) {
        const startTime = performance.now();
        
        const filePath = path.join(usersDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const userData = JSON.parse(content);
        
        const endTime = performance.now();
        const operationTime = endTime - startTime;
        
        this.collector.addOperationTime('singleRead', operationTime, {
          fileSize: content.length,
          hasComplexData: userData.preferences && userData.subscription
        });
      }
      
    } catch (error) {
      console.warn('单文件读取测试失败:', error.message);
    }
  }

  async testSingleWrite() {
    const testData = {
      id: 'performance-test-user',
      email: 'performance.test@example.com',
      name: 'Performance Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
      preferences: {
        language: 'zh',
        theme: 'light',
        notifications: {
          email: true,
          browser: false
        }
      },
      subscription: {
        plan: 'free',
        status: 'active',
        limits: {
          dailyRequests: 50,
          monthlyRequests: 1000
        }
      }
    };
    
    try {
      const testFilePath = path.join(this.dataPath, 'users', 'performance-test.json');
      
      // 测试写入性能
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        
        const dataToWrite = { ...testData, id: `performance-test-${i}` };
        await fs.writeFile(testFilePath, JSON.stringify(dataToWrite, null, 2));
        
        const endTime = performance.now();
        const operationTime = endTime - startTime;
        
        this.collector.addOperationTime('singleWrite', operationTime, {
          dataSize: JSON.stringify(dataToWrite).length
        });
      }
      
      // 清理测试文件
      await fs.unlink(testFilePath).catch(() => {});
      
    } catch (error) {
      console.warn('单文件写入测试失败:', error.message);
    }
  }

  async testFileSearch() {
    console.log('🔍 测试文件搜索性能...');
    
    const usersDir = path.join(this.dataPath, 'users');
    const searchQueries = ['@gmail.com', '@qq.com', '@163.com', 'test', 'admin'];
    
    try {
      for (const query of searchQueries) {
        const startTime = performance.now();
        
        const files = await fs.readdir(usersDir);
        const userFiles = files.filter(f => f.endsWith('.json'));
        
        let matchCount = 0;
        let filesScanned = 0;
        
        for (const file of userFiles.slice(0, 50)) { // 限制扫描文件数量
          try {
            const filePath = path.join(usersDir, file);
            const content = await fs.readFile(filePath, 'utf8');
            const userData = JSON.parse(content);
            
            filesScanned++;
            
            if (userData.email && userData.email.includes(query)) {
              matchCount++;
            }
            
          } catch (parseError) {
            // 忽略解析错误
          }
        }
        
        const endTime = performance.now();
        const operationTime = endTime - startTime;
        
        this.collector.addOperationTime('search', operationTime, {
          query,
          filesScanned,
          matchCount,
          efficiency: matchCount / filesScanned
        });
      }
      
    } catch (error) {
      console.warn('文件搜索测试失败:', error.message);
    }
  }

  // 测试批量操作性能
  async testBatchOperations() {
    console.log('📦 测试批量操作性能...');
    
    await this.testBatchRead();
    await this.testBatchWrite();
  }

  async testBatchRead() {
    const usersDir = path.join(this.dataPath, 'users');
    
    try {
      const files = await fs.readdir(usersDir);
      const userFiles = files.filter(f => f.endsWith('.json')).slice(0, 20);
      
      const startTime = performance.now();
      
      // 并行读取多个文件
      const readPromises = userFiles.map(async (file) => {
        const filePath = path.join(usersDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        return JSON.parse(content);
      });
      
      const results = await Promise.all(readPromises);
      
      const endTime = performance.now();
      const operationTime = endTime - startTime;
      
      this.collector.addOperationTime('batchRead', operationTime, {
        fileCount: userFiles.length,
        averageTimePerFile: operationTime / userFiles.length,
        successCount: results.length
      });
      
    } catch (error) {
      console.warn('批量读取测试失败:', error.message);
    }
  }

  async testBatchWrite() {
    const testUsers = Array.from({ length: 10 }, (_, i) => ({
      id: `batch-test-user-${i}`,
      email: `batch.test.${i}@example.com`,
      name: `Batch Test User ${i}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    try {
      const startTime = performance.now();
      
      // 并行写入多个文件
      const writePromises = testUsers.map(async (user) => {
        const filePath = path.join(this.dataPath, 'users', `${user.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(user, null, 2));
        return filePath;
      });
      
      const filePaths = await Promise.all(writePromises);
      
      const endTime = performance.now();
      const operationTime = endTime - startTime;
      
      this.collector.addOperationTime('batchWrite', operationTime, {
        fileCount: testUsers.length,
        averageTimePerFile: operationTime / testUsers.length
      });
      
      // 清理测试文件
      await Promise.all(filePaths.map(path => fs.unlink(path).catch(() => {})));
      
    } catch (error) {
      console.warn('批量写入测试失败:', error.message);
    }
  }

  // 测试并发操作性能
  async testConcurrentOperations() {
    console.log('🔥 测试并发操作性能...');
    
    for (const concurrentLevel of DB_CONFIG.concurrentOperations) {
      await this.testConcurrentReads(concurrentLevel);
      await this.testConcurrentWrites(concurrentLevel);
    }
  }

  async testConcurrentReads(concurrentLevel) {
    const usersDir = path.join(this.dataPath, 'users');
    
    try {
      const files = await fs.readdir(usersDir);
      const userFiles = files.filter(f => f.endsWith('.json'));
      
      if (userFiles.length === 0) {
        console.warn(`跳过并发读取测试：没有找到用户文件`);
        return;
      }
      
      const startTime = performance.now();
      
      // 创建并发读取任务
      const readTasks = Array.from({ length: concurrentLevel }, async () => {
        const randomFile = userFiles[Math.floor(Math.random() * userFiles.length)];
        const filePath = path.join(usersDir, randomFile);
        
        const content = await fs.readFile(filePath, 'utf8');
        return JSON.parse(content);
      });
      
      const results = await Promise.allSettled(readTasks);
      
      const endTime = performance.now();
      const operationTime = endTime - startTime;
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      
      if (!this.collector.results.concurrencyTests.reads) {
        this.collector.results.concurrencyTests.reads = [];
      }
      
      this.collector.results.concurrencyTests.reads.push({
        concurrentLevel,
        totalTime: operationTime,
        averageTime: operationTime / concurrentLevel,
        successRate: (successCount / concurrentLevel) * 100,
        throughput: concurrentLevel / (operationTime / 1000) // operations per second
      });
      
    } catch (error) {
      console.warn(`并发读取测试失败 (level: ${concurrentLevel}):`, error.message);
    }
  }

  async testConcurrentWrites(concurrentLevel) {
    try {
      const startTime = performance.now();
      
      // 创建并发写入任务
      const writeTasks = Array.from({ length: concurrentLevel }, async (_, i) => {
        const testUser = {
          id: `concurrent-test-${concurrentLevel}-${i}`,
          email: `concurrent.test.${i}@example.com`,
          name: `Concurrent Test User ${i}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const filePath = path.join(this.dataPath, 'users', `${testUser.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(testUser, null, 2));
        
        return filePath;
      });
      
      const results = await Promise.allSettled(writeTasks);
      
      const endTime = performance.now();
      const operationTime = endTime - startTime;
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      
      if (!this.collector.results.concurrencyTests.writes) {
        this.collector.results.concurrencyTests.writes = [];
      }
      
      this.collector.results.concurrencyTests.writes.push({
        concurrentLevel,
        totalTime: operationTime,
        averageTime: operationTime / concurrentLevel,
        successRate: (successCount / concurrentLevel) * 100,
        throughput: concurrentLevel / (operationTime / 1000)
      });
      
      // 清理测试文件
      const filePaths = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);
      
      await Promise.all(filePaths.map(path => fs.unlink(path).catch(() => {})));
      
    } catch (error) {
      console.warn(`并发写入测试失败 (level: ${concurrentLevel}):`, error.message);
    }
  }

  // 模拟缓存性能测试
  async testCachePerformance() {
    console.log('💾 测试缓存性能...');
    
    const testKeys = Array.from({ length: 100 }, (_, i) => `test-key-${i}`);
    const testData = { message: 'This is test cache data', timestamp: Date.now() };
    
    // 测试缓存写入
    for (const key of testKeys) {
      this.mockCache.set(key, testData);
    }
    
    // 测试缓存读取 (命中)
    let hitTimeTotal = 0;
    for (const key of testKeys) {
      const startTime = performance.now();
      const data = this.mockCache.get(key);
      const endTime = performance.now();
      
      if (data) {
        this.cacheStats.hits++;
        hitTimeTotal += (endTime - startTime);
      }
    }
    
    // 测试缓存读取 (未命中)
    let missTimeTotal = 0;
    const missKeys = Array.from({ length: 50 }, (_, i) => `miss-key-${i}`);
    for (const key of missKeys) {
      const startTime = performance.now();
      const data = this.mockCache.get(key);
      const endTime = performance.now();
      
      if (!data) {
        this.cacheStats.misses++;
        missTimeTotal += (endTime - startTime);
      }
    }
    
    // 计算缓存统计
    this.collector.results.cacheAnalysis = {
      hitRate: (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses)) * 100,
      missRate: (this.cacheStats.misses / (this.cacheStats.hits + this.cacheStats.misses)) * 100,
      avgHitTime: hitTimeTotal / this.cacheStats.hits,
      avgMissTime: missTimeTotal / this.cacheStats.misses
    };
  }

  // 识别性能瓶颈
  identifyBottlenecks() {
    console.log('🔍 识别性能瓶颈...');
    
    // 文件数量瓶颈
    if (this.collector.results.fileSystem.userFiles > DB_CONFIG.indexThreshold) {
      this.collector.addBottleneck(
        'FILE_COUNT',
        `用户文件数量过多 (${this.collector.results.fileSystem.userFiles} 个)`,
        this.collector.getAverageTime('search'),
        '实施索引策略，避免全文件扫描'
      );
    }
    
    // 大文件瓶颈
    if (this.collector.results.fileSystem.largeFiles.length > 0) {
      const avgLargeFileSize = this.collector.results.fileSystem.largeFiles
        .reduce((sum, file) => sum + file.size, 0) / this.collector.results.fileSystem.largeFiles.length;
      
      this.collector.addBottleneck(
        'FILE_SIZE',
        `存在 ${this.collector.results.fileSystem.largeFiles.length} 个大文件`,
        avgLargeFileSize / 1000, // 转换为影响评分
        '文件分割或流式处理'
      );
    }
    
    // 搜索性能瓶颈
    const avgSearchTime = this.collector.getAverageTime('search');
    if (avgSearchTime > DB_CONFIG.maxQueryTime) {
      this.collector.addBottleneck(
        'SEARCH_PERFORMANCE',
        `搜索操作耗时过长 (${avgSearchTime.toFixed(1)}ms)`,
        avgSearchTime,
        '实施查询缓存和索引优化'
      );
    }
    
    // 并发性能瓶颈
    const concurrentReads = this.collector.results.concurrencyTests.reads || [];
    const highConcurrencyTest = concurrentReads.find(test => test.concurrentLevel >= 20);
    
    if (highConcurrencyTest && highConcurrencyTest.successRate < 95) {
      this.collector.addBottleneck(
        'CONCURRENCY',
        `高并发场景性能不佳 (成功率: ${highConcurrencyTest.successRate.toFixed(1)}%)`,
        (100 - highConcurrencyTest.successRate) * 10,
        '实施连接池和请求队列管理'
      );
    }
  }

  // 运行完整的数据库性能测试
  async runCompleteAnalysis() {
    console.log('🎯 开始数据库性能完整分析...');
    console.log('='.repeat(50));
    
    try {
      // 1. 分析文件系统状态
      await this.analyzeFileSystem();
      
      // 2. 测试单文件操作
      await this.testSingleFileOperations();
      
      // 3. 测试批量操作
      await this.testBatchOperations();
      
      // 4. 测试并发操作
      await this.testConcurrentOperations();
      
      // 5. 测试缓存性能
      await this.testCachePerformance();
      
      // 6. 识别瓶颈
      this.identifyBottlenecks();
      
      // 7. 完成分析
      this.collector.finalize();
      
      console.log('='.repeat(50));
      console.log('✅ 数据库性能分析完成');
      
      return this.collector.results;
      
    } catch (error) {
      console.error('❌ 数据库性能分析失败:', error);
      throw error;
    }
  }
}

// 报告生成器
class DatabaseReportGenerator {
  async generateReport(results) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>数据库性能分析报告</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            color: #333;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.8rem;
            font-weight: 300;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            padding: 40px;
            background: #f8f9fa;
        }
        .stat-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            border-left: 5px solid #667eea;
        }
        .stat-value {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 10px;
            color: #667eea;
        }
        .stat-label {
            color: #666;
            font-size: 1rem;
            font-weight: 500;
        }
        .section {
            padding: 40px;
            border-bottom: 1px solid #e9ecef;
        }
        .section h2 {
            margin: 0 0 25px 0;
            color: #333;
            font-size: 2rem;
            border-bottom: 3px solid #667eea;
            padding-bottom: 15px;
        }
        .performance-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .performance-table th,
        .performance-table td {
            text-align: left;
            padding: 15px;
            border-bottom: 1px solid #e9ecef;
        }
        .performance-table th {
            background: #667eea;
            color: white;
            font-weight: 600;
        }
        .bottleneck {
            background: #fff5f5;
            border: 1px solid #fed7d7;
            border-left: 5px solid #e53e3e;
            padding: 20px;
            margin: 15px 0;
            border-radius: 8px;
        }
        .bottleneck.high {
            border-left-color: #e53e3e;
            background: #fff5f5;
        }
        .bottleneck.medium {
            border-left-color: #ed8936;
            background: #fffaf0;
        }
        .bottleneck.low {
            border-left-color: #38a169;
            background: #f0fff4;
        }
        .optimization {
            background: #edf2f7;
            border-left: 5px solid #4299e1;
            padding: 20px;
            margin: 15px 0;
            border-radius: 8px;
        }
        .chart-container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💾 数据库性能分析报告</h1>
            <p style="margin: 15px 0 0 0; opacity: 0.9; font-size: 1.2rem;">JSON文件存储系统深度分析</p>
            <p style="margin: 10px 0 0 0; font-size: 0.9rem;">
                分析时间: ${new Date(results.startTime).toLocaleString()} - ${new Date(results.endTime).toLocaleString()}
            </p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${results.fileSystem.userFiles}</div>
                <div class="stat-label">用户文件数量</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${results.fileSystem.usageFiles}</div>
                <div class="stat-label">使用量文件数量</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${(results.fileSystem.totalSize / 1024 / 1024).toFixed(1)} MB</div>
                <div class="stat-label">总存储大小</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${(results.fileSystem.averageFileSize / 1024).toFixed(1)} KB</div>
                <div class="stat-label">平均文件大小</div>
            </div>
        </div>

        <div class="section">
            <h2>⚡ 操作性能统计</h2>
            <table class="performance-table">
                <thead>
                    <tr>
                        <th>操作类型</th>
                        <th>测试次数</th>
                        <th>平均耗时 (ms)</th>
                        <th>最快耗时 (ms)</th>
                        <th>最慢耗时 (ms)</th>
                        <th>性能评级</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.generateOperationRows(results.operationTimes)}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>🔥 并发性能测试</h2>
            ${this.generateConcurrencySection(results.concurrencyTests)}
        </div>

        <div class="section">
            <h2>💾 缓存性能分析</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                <div class="stat-card">
                    <div class="stat-value">${results.cacheAnalysis.hitRate.toFixed(1)}%</div>
                    <div class="stat-label">缓存命中率</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${results.cacheAnalysis.avgHitTime.toFixed(2)}ms</div>
                    <div class="stat-label">命中平均耗时</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${results.cacheAnalysis.avgMissTime.toFixed(2)}ms</div>
                    <div class="stat-label">未命中平均耗时</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>⚠️ 性能瓶颈分析</h2>
            ${results.bottlenecks.map(bottleneck => `
                <div class="bottleneck ${bottleneck.severity.toLowerCase()}">
                    <h4>【${bottleneck.severity}】${bottleneck.type}</h4>
                    <p><strong>问题描述:</strong> ${bottleneck.description}</p>
                    <p><strong>性能影响:</strong> ${bottleneck.impact.toFixed(1)}ms</p>
                    <p><strong>解决方案:</strong> ${bottleneck.solution}</p>
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h2>🚀 优化建议</h2>
            ${results.optimizations.map(opt => `
                <div class="optimization">
                    <h4>【${opt.priority}】${opt.type}</h4>
                    <p><strong>问题:</strong> ${opt.description}</p>
                    <p><strong>实施方案:</strong> ${opt.implementation}</p>
                    <p><strong>预期收益:</strong> ${opt.estimatedImprovement}</p>
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h2>📊 索引推荐</h2>
            <table class="performance-table">
                <thead>
                    <tr>
                        <th>字段</th>
                        <th>索引类型</th>
                        <th>推荐原因</th>
                        <th>实现方式</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.indexRecommendations.map(rec => `
                        <tr>
                            <td>${rec.field}</td>
                            <td>${rec.type}</td>
                            <td>${rec.reason}</td>
                            <td><code>${rec.implementation}</code></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div style="text-align: center; padding: 30px; color: #666; background: #f8f9fa;">
            <p style="margin: 0; font-size: 1.1rem;">数据库性能分析报告</p>
            <p style="margin: 5px 0 0 0;">生成时间: ${new Date().toLocaleString()}</p>
            <p style="margin: 5px 0 0 0; font-size: 0.9rem;">Database Optimizer Team</p>
        </div>
    </div>
</body>
</html>`;

    const reportPath = path.join(process.cwd(), 'database-performance-report.html');
    await fs.writeFile(reportPath, htmlContent);
    
    return reportPath;
  }

  generateOperationRows(operationTimes) {
    return Object.entries(operationTimes)
      .filter(([operation, times]) => times.length > 0)
      .map(([operation, times]) => {
        const avgTime = times.reduce((sum, t) => sum + t.time, 0) / times.length;
        const minTime = Math.min(...times.map(t => t.time));
        const maxTime = Math.max(...times.map(t => t.time));
        
        let rating = '优秀';
        if (avgTime > 100) rating = '需要优化';
        else if (avgTime > 50) rating = '良好';
        
        return `
          <tr>
            <td>${this.getOperationDisplayName(operation)}</td>
            <td>${times.length}</td>
            <td>${avgTime.toFixed(1)}</td>
            <td>${minTime.toFixed(1)}</td>
            <td>${maxTime.toFixed(1)}</td>
            <td style="color: ${this.getRatingColor(avgTime)}">${rating}</td>
          </tr>
        `;
      }).join('');
  }

  generateConcurrencySection(concurrencyTests) {
    if (!concurrencyTests.reads || concurrencyTests.reads.length === 0) {
      return '<p>暂无并发测试数据</p>';
    }

    return `
      <table class="performance-table">
        <thead>
          <tr>
            <th>并发级别</th>
            <th>操作类型</th>
            <th>总耗时 (ms)</th>
            <th>平均耗时 (ms)</th>
            <th>成功率 (%)</th>
            <th>吞吐量 (ops/s)</th>
          </tr>
        </thead>
        <tbody>
          ${concurrencyTests.reads.map(test => `
            <tr>
              <td>${test.concurrentLevel}</td>
              <td>读取</td>
              <td>${test.totalTime.toFixed(1)}</td>
              <td>${test.averageTime.toFixed(1)}</td>
              <td style="color: ${test.successRate > 95 ? '#28a745' : '#dc3545'}">${test.successRate.toFixed(1)}</td>
              <td>${test.throughput.toFixed(1)}</td>
            </tr>
          `).join('')}
          ${(concurrencyTests.writes || []).map(test => `
            <tr>
              <td>${test.concurrentLevel}</td>
              <td>写入</td>
              <td>${test.totalTime.toFixed(1)}</td>
              <td>${test.averageTime.toFixed(1)}</td>
              <td style="color: ${test.successRate > 95 ? '#28a745' : '#dc3545'}">${test.successRate.toFixed(1)}</td>
              <td>${test.throughput.toFixed(1)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  getOperationDisplayName(operation) {
    const names = {
      'singleRead': '单文件读取',
      'singleWrite': '单文件写入',
      'batchRead': '批量读取',
      'batchWrite': '批量写入',
      'search': '文件搜索',
      'indexScan': '索引扫描'
    };
    
    return names[operation] || operation;
  }

  getRatingColor(avgTime) {
    if (avgTime <= 50) return '#28a745';
    if (avgTime <= 100) return '#ffc107';
    return '#dc3545';
  }
}

// 主函数
async function analyzeDatabasePerformance() {
  console.log('🎯 开始数据库性能深度分析...');
  
  try {
    const analyzer = new DatabasePerformanceAnalyzer();
    const reportGenerator = new DatabaseReportGenerator();
    
    // 运行完整分析
    const results = await analyzer.runCompleteAnalysis();
    
    // 生成报告
    const reportPath = await reportGenerator.generateReport(results);
    
    // 保存JSON结果
    const jsonPath = path.join(process.cwd(), 'database-performance-results.json');
    await fs.writeFile(jsonPath, JSON.stringify(results, null, 2));
    
    console.log('\n🎯 数据库性能分析结果摘要:');
    console.log(`📁 用户文件: ${results.fileSystem.userFiles} 个`);
    console.log(`📈 使用量文件: ${results.fileSystem.usageFiles} 个`);
    console.log(`💾 总存储大小: ${(results.fileSystem.totalSize / 1024 / 1024).toFixed(1)} MB`);
    console.log(`⚠️  性能瓶颈: ${results.bottlenecks.length} 个`);
    console.log(`🚀 优化建议: ${results.optimizations.length} 项`);
    
    console.log(`\n📊 报告已生成: ${reportPath}`);
    console.log(`📄 JSON结果: ${jsonPath}`);
    
    return results;
    
  } catch (error) {
    console.error('❌ 数据库性能分析失败:', error);
    throw error;
  }
}

// 如果直接运行
if (require.main === module) {
  analyzeDatabasePerformance()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = {
  DatabasePerformanceAnalyzer,
  DatabasePerformanceCollector,
  DatabaseReportGenerator,
  analyzeDatabasePerformance,
  DB_CONFIG
};