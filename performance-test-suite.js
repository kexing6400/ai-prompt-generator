/**
 * 律师AI工作台性能测试套件
 * 全面测试API响应时间、并发性能、数据库操作、内存使用
 * 作者：Performance Engineer & Database Optimizer Team
 */

const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');
const fs = require('fs').promises;
const path = require('path');

// 测试配置
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  concurrencyLevels: [1, 10, 50, 100, 200, 500],
  testDuration: 30000, // 30秒
  warmupRequests: 10,
  timeout: 30000, // 30秒超时
  maxRetries: 3
};

// 性能阈值定义
const PERFORMANCE_THRESHOLDS = {
  api: {
    health: 100,           // 健康检查 < 100ms
    templates: 300,        // 模板获取 < 300ms
    generatePrompt: 5000,  // AI生成 < 5s
    settings: 200,         // 设置获取 < 200ms
    subscription: 300      // 订阅信息 < 300ms
  },
  database: {
    userRead: 50,          // 用户读取 < 50ms
    userWrite: 100,        // 用户写入 < 100ms
    userSearch: 200,       // 用户搜索 < 200ms
    usageUpdate: 80        // 使用量更新 < 80ms
  },
  memory: {
    maxHeapUsed: 512 * 1024 * 1024,  // 最大堆内存 512MB
    maxRSS: 1024 * 1024 * 1024       // 最大常驻内存 1GB
  }
};

// 测试结果收集器
class PerformanceCollector {
  constructor() {
    this.results = {
      apiTests: {},
      databaseTests: {},
      memoryTests: [],
      concurrencyTests: {},
      errors: [],
      startTime: Date.now(),
      endTime: null
    };
  }

  addApiResult(endpoint, method, responseTime, statusCode, error = null) {
    if (!this.results.apiTests[endpoint]) {
      this.results.apiTests[endpoint] = [];
    }
    
    this.results.apiTests[endpoint].push({
      method,
      responseTime,
      statusCode,
      error,
      timestamp: Date.now()
    });
  }

  addDatabaseResult(operation, responseTime, success, details = null) {
    if (!this.results.databaseTests[operation]) {
      this.results.databaseTests[operation] = [];
    }
    
    this.results.databaseTests[operation].push({
      responseTime,
      success,
      details,
      timestamp: Date.now()
    });
  }

  addMemorySnapshot() {
    const memUsage = process.memoryUsage();
    this.results.memoryTests.push({
      timestamp: Date.now(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss
    });
  }

  addConcurrencyResult(level, requests, successful, failed, averageTime) {
    this.results.concurrencyTests[level] = {
      requests,
      successful,
      failed,
      averageTime,
      successRate: (successful / requests) * 100
    };
  }

  finalize() {
    this.results.endTime = Date.now();
    this.results.totalTestTime = this.results.endTime - this.results.startTime;
  }

  generateReport() {
    return {
      ...this.results,
      summary: this.calculateSummary(),
      recommendations: this.generateRecommendations()
    };
  }

  calculateSummary() {
    const summary = {
      totalAPICalls: 0,
      avgResponseTime: 0,
      errorRate: 0,
      performanceScore: 100
    };

    // 计算API统计
    Object.values(this.results.apiTests).forEach(tests => {
      tests.forEach(test => {
        summary.totalAPICalls++;
        summary.avgResponseTime += test.responseTime;
        if (test.error || test.statusCode >= 400) {
          summary.errorRate++;
        }
      });
    });

    if (summary.totalAPICalls > 0) {
      summary.avgResponseTime /= summary.totalAPICalls;
      summary.errorRate = (summary.errorRate / summary.totalAPICalls) * 100;
    }

    // 性能评分计算
    summary.performanceScore = Math.max(0, 100 - summary.errorRate - 
      Math.max(0, (summary.avgResponseTime - 500) / 100 * 10));

    return summary;
  }

  generateRecommendations() {
    const recommendations = [];
    const summary = this.calculateSummary();

    if (summary.avgResponseTime > 1000) {
      recommendations.push({
        priority: 'HIGH',
        category: 'API Performance',
        issue: `平均响应时间过长 (${summary.avgResponseTime.toFixed(0)}ms)`,
        suggestion: '启用Redis缓存，优化数据库查询，实现API响应压缩'
      });
    }

    if (summary.errorRate > 5) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'Reliability',
        issue: `错误率过高 (${summary.errorRate.toFixed(1)}%)`,
        suggestion: '增强错误处理，实现重试机制，添加健康检查'
      });
    }

    // 内存分析
    const maxMemory = Math.max(...this.results.memoryTests.map(m => m.heapUsed));
    if (maxMemory > PERFORMANCE_THRESHOLDS.memory.maxHeapUsed) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Memory',
        issue: `堆内存使用过高 (${(maxMemory / 1024 / 1024).toFixed(0)}MB)`,
        suggestion: '优化缓存策略，实现数据分页，检查内存泄漏'
      });
    }

    return recommendations;
  }
}

// HTTP请求工具
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const reqOptions = {
      timeout: TEST_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Performance-Test-Suite/1.0',
        ...options.headers
      },
      ...options
    };

    const req = client.request(url, reqOptions, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        try {
          const parsedData = res.headers['content-type']?.includes('json') 
            ? JSON.parse(data) 
            : data;
            
          resolve({
            statusCode: res.statusCode,
            responseTime,
            data: parsedData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            responseTime,
            data,
            headers: res.headers,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      const endTime = performance.now();
      reject({
        error: error.message,
        responseTime: endTime - startTime
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({
        error: 'Request timeout',
        responseTime: TEST_CONFIG.timeout
      });
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// API端点测试
class APITester {
  constructor(collector) {
    this.collector = collector;
    this.endpoints = [
      { path: '/api/health', method: 'GET', name: 'health' },
      { path: '/api/templates/list', method: 'GET', name: 'templates' },
      { path: '/api/settings', method: 'GET', name: 'settings' },
      { path: '/api/subscription/current', method: 'GET', name: 'subscription' },
      { path: '/api/generate-prompt-v4', method: 'POST', name: 'generatePrompt', 
        body: {
          industry: '律师',
          scenario: '合同审查',
          goal: '审查商业合同的法律风险',
          requirements: '重点关注条款完整性和法律合规性'
        }
      }
    ];
  }

  async testSingleEndpoint(endpoint, retries = 0) {
    try {
      const url = `${TEST_CONFIG.baseUrl}${endpoint.path}`;
      const options = {
        method: endpoint.method,
        headers: endpoint.headers || {}
      };
      
      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
        options.headers['Content-Type'] = 'application/json';
      }

      const result = await makeRequest(url, options);
      
      this.collector.addApiResult(
        endpoint.name,
        endpoint.method,
        result.responseTime,
        result.statusCode,
        result.parseError || null
      );

      return {
        success: result.statusCode < 400,
        responseTime: result.responseTime,
        statusCode: result.statusCode
      };
    } catch (error) {
      this.collector.addApiResult(
        endpoint.name,
        endpoint.method,
        error.responseTime || TEST_CONFIG.timeout,
        0,
        error.error
      );

      if (retries < TEST_CONFIG.maxRetries) {
        console.log(`重试 ${endpoint.name} (${retries + 1}/${TEST_CONFIG.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.testSingleEndpoint(endpoint, retries + 1);
      }

      return {
        success: false,
        responseTime: error.responseTime || TEST_CONFIG.timeout,
        error: error.error
      };
    }
  }

  async runBasicTests() {
    console.log('🚀 开始API基础性能测试...');
    
    for (const endpoint of this.endpoints) {
      console.log(`测试 ${endpoint.method} ${endpoint.path}`);
      await this.testSingleEndpoint(endpoint);
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms间隔
    }
  }

  async runConcurrencyTests() {
    console.log('🔥 开始并发性能测试...');
    
    for (const level of TEST_CONFIG.concurrencyLevels) {
      console.log(`测试并发级别: ${level}`);
      
      const promises = [];
      const startTime = Date.now();
      
      for (let i = 0; i < level; i++) {
        // 随机选择一个端点测试
        const randomEndpoint = this.endpoints[Math.floor(Math.random() * this.endpoints.length)];
        promises.push(this.testSingleEndpoint(randomEndpoint));
      }
      
      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;
      const avgTime = results
        .filter(r => r.status === 'fulfilled')
        .reduce((sum, r) => sum + r.value.responseTime, 0) / results.length;
      
      this.collector.addConcurrencyResult(level, results.length, successful, failed, avgTime);
      
      console.log(`  - 成功: ${successful}, 失败: ${failed}, 平均响应时间: ${avgTime.toFixed(0)}ms`);
      
      // 给服务器一些恢复时间
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// 数据库性能测试（针对JSON存储）
class DatabaseTester {
  constructor(collector) {
    this.collector = collector;
    this.dataPath = path.join(process.cwd(), 'data');
  }

  async testUserOperations() {
    console.log('💾 开始数据库性能测试...');
    
    // 测试用户读取性能
    await this.testUserRead();
    
    // 测试用户写入性能
    await this.testUserWrite();
    
    // 测试用户搜索性能
    await this.testUserSearch();
    
    // 测试使用量更新性能
    await this.testUsageUpdate();
  }

  async testUserRead() {
    try {
      const usersDir = path.join(this.dataPath, 'users');
      const startTime = performance.now();
      
      // 读取用户目录
      const files = await fs.readdir(usersDir);
      const userFiles = files.filter(f => f.endsWith('.json'));
      
      // 读取前10个用户文件
      for (let i = 0; i < Math.min(10, userFiles.length); i++) {
        const userFile = path.join(usersDir, userFiles[i]);
        await fs.readFile(userFile, 'utf8');
      }
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      this.collector.addDatabaseResult('userRead', responseTime, true, {
        filesRead: Math.min(10, userFiles.length),
        totalFiles: userFiles.length
      });
      
      console.log(`  - 用户读取测试: ${responseTime.toFixed(1)}ms (${Math.min(10, userFiles.length)} files)`);
    } catch (error) {
      this.collector.addDatabaseResult('userRead', 0, false, error.message);
      console.log(`  - 用户读取测试失败: ${error.message}`);
    }
  }

  async testUserWrite() {
    try {
      const testUser = {
        id: 'test-performance-user',
        email: 'performance@test.com',
        name: 'Performance Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };
      
      const startTime = performance.now();
      const filePath = path.join(this.dataPath, 'users', `${testUser.id}.json`);
      
      await fs.writeFile(filePath, JSON.stringify(testUser, null, 2));
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      this.collector.addDatabaseResult('userWrite', responseTime, true);
      
      // 清理测试文件
      await fs.unlink(filePath).catch(() => {});
      
      console.log(`  - 用户写入测试: ${responseTime.toFixed(1)}ms`);
    } catch (error) {
      this.collector.addDatabaseResult('userWrite', 0, false, error.message);
      console.log(`  - 用户写入测试失败: ${error.message}`);
    }
  }

  async testUserSearch() {
    try {
      const usersDir = path.join(this.dataPath, 'users');
      const startTime = performance.now();
      
      const files = await fs.readdir(usersDir);
      const userFiles = files.filter(f => f.endsWith('.json'));
      
      // 模拟邮箱搜索 - 读取所有用户文件
      let foundUsers = 0;
      for (const file of userFiles.slice(0, 50)) { // 限制搜索前50个文件
        try {
          const userFile = path.join(usersDir, file);
          const userData = await fs.readFile(userFile, 'utf8');
          const user = JSON.parse(userData);
          
          if (user.email && user.email.includes('@')) {
            foundUsers++;
          }
        } catch (error) {
          // 忽略解析错误
        }
      }
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      this.collector.addDatabaseResult('userSearch', responseTime, true, {
        filesSearched: Math.min(50, userFiles.length),
        foundUsers
      });
      
      console.log(`  - 用户搜索测试: ${responseTime.toFixed(1)}ms (搜索了 ${Math.min(50, userFiles.length)} 个文件)`);
    } catch (error) {
      this.collector.addDatabaseResult('userSearch', 0, false, error.message);
      console.log(`  - 用户搜索测试失败: ${error.message}`);
    }
  }

  async testUsageUpdate() {
    try {
      const testUsage = {
        userId: 'test-performance-user',
        date: new Date().toISOString().split('T')[0],
        month: new Date().toISOString().substring(0, 7),
        requests: 1,
        tokens: 100,
        generatedPrompts: 1,
        documentsProcessed: 0,
        apiCalls: { 'generate-prompt': 1 },
        errors: 0,
        avgResponseTime: 500
      };
      
      const startTime = performance.now();
      const filePath = path.join(this.dataPath, 'usage', `${testUsage.userId}-${testUsage.month}.json`);
      
      // 确保目录存在
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      
      await fs.writeFile(filePath, JSON.stringify(testUsage, null, 2));
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      this.collector.addDatabaseResult('usageUpdate', responseTime, true);
      
      // 清理测试文件
      await fs.unlink(filePath).catch(() => {});
      
      console.log(`  - 使用量更新测试: ${responseTime.toFixed(1)}ms`);
    } catch (error) {
      this.collector.addDatabaseResult('usageUpdate', 0, false, error.message);
      console.log(`  - 使用量更新测试失败: ${error.message}`);
    }
  }
}

// 内存监控器
class MemoryMonitor {
  constructor(collector) {
    this.collector = collector;
    this.monitoring = false;
    this.interval = null;
  }

  start() {
    this.monitoring = true;
    this.collector.addMemorySnapshot();
    
    this.interval = setInterval(() => {
      if (this.monitoring) {
        this.collector.addMemorySnapshot();
      }
    }, 5000); // 每5秒记录一次
    
    console.log('📊 开始内存监控...');
  }

  stop() {
    this.monitoring = false;
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.collector.addMemorySnapshot();
    console.log('📊 停止内存监控');
  }
}

// 主测试运行器
class PerformanceTestRunner {
  constructor() {
    this.collector = new PerformanceCollector();
    this.apiTester = new APITester(this.collector);
    this.databaseTester = new DatabaseTester(this.collector);
    this.memoryMonitor = new MemoryMonitor(this.collector);
  }

  async runAllTests() {
    console.log('🎯 律师AI工作台性能测试开始');
    console.log('='.repeat(50));
    
    // 开始内存监控
    this.memoryMonitor.start();
    
    try {
      // 预热请求
      console.log('🔥 预热阶段...');
      for (let i = 0; i < TEST_CONFIG.warmupRequests; i++) {
        try {
          await makeRequest(`${TEST_CONFIG.baseUrl}/api/health`);
        } catch (error) {
          // 忽略预热错误
        }
      }
      
      // API基础测试
      await this.apiTester.runBasicTests();
      
      // 数据库测试
      await this.databaseTester.testUserOperations();
      
      // 并发测试
      await this.apiTester.runConcurrencyTests();
      
    } catch (error) {
      console.error('测试运行错误:', error);
      this.collector.errors.push({
        timestamp: Date.now(),
        error: error.message,
        stack: error.stack
      });
    } finally {
      // 停止内存监控
      this.memoryMonitor.stop();
      
      // 完成测试
      this.collector.finalize();
    }
    
    console.log('='.repeat(50));
    console.log('✅ 性能测试完成');
    
    return this.collector.generateReport();
  }

  async generateHTMLReport(results) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>律师AI工作台 - 性能测试报告</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5rem;
            font-weight: 300;
        }
        .header .subtitle {
            margin-top: 10px;
            opacity: 0.9;
            font-size: 1.1rem;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }
        .metric-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #667eea;
        }
        .metric-value {
            font-size: 2rem;
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
        }
        .metric-label {
            color: #666;
            font-size: 0.9rem;
        }
        .section {
            padding: 30px;
            border-bottom: 1px solid #e9ecef;
        }
        .section h2 {
            margin: 0 0 20px 0;
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        .test-results {
            display: grid;
            gap: 20px;
        }
        .endpoint-result {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #28a745;
        }
        .endpoint-result.error {
            border-left-color: #dc3545;
        }
        .endpoint-result.warning {
            border-left-color: #ffc107;
        }
        .recommendations {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 20px;
            margin-top: 20px;
        }
        .recommendation {
            background: white;
            padding: 15px;
            margin: 10px 0;
            border-radius: 6px;
            border-left: 4px solid #17a2b8;
        }
        .recommendation.high {
            border-left-color: #dc3545;
        }
        .recommendation.critical {
            border-left-color: #fd7e14;
        }
        .chart-container {
            width: 100%;
            height: 300px;
            margin: 20px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        th, td {
            text-align: left;
            padding: 12px;
            border-bottom: 1px solid #e9ecef;
        }
        th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #495057;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 0.9rem;
        }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>律师AI工作台</h1>
            <div class="subtitle">性能测试报告</div>
            <div style="margin-top: 15px; font-size: 0.9rem;">
                测试时间: ${new Date(results.startTime).toLocaleString()} - ${new Date(results.endTime).toLocaleString()}
            </div>
        </div>

        <div class="summary">
            <div class="metric-card">
                <div class="metric-value">${Math.round(results.summary.performanceScore)}</div>
                <div class="metric-label">性能评分</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Math.round(results.summary.avgResponseTime)}ms</div>
                <div class="metric-label">平均响应时间</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${results.summary.totalAPICalls}</div>
                <div class="metric-label">总API调用次数</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${results.summary.errorRate.toFixed(1)}%</div>
                <div class="metric-label">错误率</div>
            </div>
        </div>

        <div class="section">
            <h2>API端点性能测试</h2>
            <div class="test-results">
                ${Object.entries(results.apiTests).map(([endpoint, tests]) => {
                  const avgTime = tests.reduce((sum, t) => sum + t.responseTime, 0) / tests.length;
                  const errorCount = tests.filter(t => t.error || t.statusCode >= 400).length;
                  const successRate = ((tests.length - errorCount) / tests.length) * 100;
                  
                  let className = 'endpoint-result';
                  if (errorCount > 0) className += ' error';
                  else if (avgTime > 1000) className += ' warning';
                  
                  return `
                    <div class="${className}">
                        <h4>${endpoint}</h4>
                        <p>平均响应时间: ${Math.round(avgTime)}ms | 成功率: ${successRate.toFixed(1)}% | 总请求: ${tests.length}</p>
                    </div>
                  `;
                }).join('')}
            </div>
        </div>

        <div class="section">
            <h2>并发性能测试</h2>
            <table>
                <thead>
                    <tr>
                        <th>并发级别</th>
                        <th>总请求</th>
                        <th>成功请求</th>
                        <th>失败请求</th>
                        <th>成功率</th>
                        <th>平均响应时间</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(results.concurrencyTests).map(([level, data]) => `
                        <tr>
                            <td>${level}</td>
                            <td>${data.requests}</td>
                            <td>${data.successful}</td>
                            <td>${data.failed}</td>
                            <td>${data.successRate.toFixed(1)}%</td>
                            <td>${Math.round(data.averageTime)}ms</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>数据库性能测试</h2>
            <div class="test-results">
                ${Object.entries(results.databaseTests).map(([operation, tests]) => {
                  const avgTime = tests.reduce((sum, t) => sum + t.responseTime, 0) / tests.length;
                  const successRate = (tests.filter(t => t.success).length / tests.length) * 100;
                  
                  return `
                    <div class="endpoint-result">
                        <h4>${operation}</h4>
                        <p>平均响应时间: ${Math.round(avgTime)}ms | 成功率: ${successRate.toFixed(1)}%</p>
                    </div>
                  `;
                }).join('')}
            </div>
        </div>

        <div class="section">
            <h2>性能优化建议</h2>
            <div class="recommendations">
                ${results.recommendations.map(rec => `
                    <div class="recommendation ${rec.priority.toLowerCase()}">
                        <h4>【${rec.priority}】${rec.category}</h4>
                        <p><strong>问题:</strong> ${rec.issue}</p>
                        <p><strong>建议:</strong> ${rec.suggestion}</p>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="footer">
            <p>性能测试报告生成于 ${new Date().toLocaleString()}</p>
            <p>由 Performance Engineer & Database Optimizer Team 生成</p>
        </div>
    </div>
</body>
</html>`;

    const reportPath = path.join(process.cwd(), 'performance-test-report.html');
    await fs.writeFile(reportPath, htmlContent);
    console.log(`📊 性能测试报告已生成: ${reportPath}`);
    
    return reportPath;
  }
}

// 启动测试
async function main() {
  const runner = new PerformanceTestRunner();
  
  try {
    const results = await runner.runAllTests();
    
    // 生成JSON报告
    const jsonReportPath = path.join(process.cwd(), 'performance-test-results.json');
    await fs.writeFile(jsonReportPath, JSON.stringify(results, null, 2));
    
    // 生成HTML报告
    await runner.generateHTMLReport(results);
    
    // 控制台输出摘要
    console.log('\n🎯 性能测试结果摘要:');
    console.log(`📊 性能评分: ${Math.round(results.summary.performanceScore)}/100`);
    console.log(`⏱️  平均响应时间: ${Math.round(results.summary.avgResponseTime)}ms`);
    console.log(`📈 总API调用: ${results.summary.totalAPICalls}`);
    console.log(`❌ 错误率: ${results.summary.errorRate.toFixed(1)}%`);
    
    console.log('\n💡 主要建议:');
    results.recommendations.slice(0, 3).forEach((rec, index) => {
      console.log(`${index + 1}. [${rec.priority}] ${rec.issue}`);
      console.log(`   建议: ${rec.suggestion}\n`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 性能测试失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  PerformanceTestRunner,
  TEST_CONFIG,
  PERFORMANCE_THRESHOLDS
};