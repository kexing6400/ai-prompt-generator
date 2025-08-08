#!/usr/bin/env node

/**
 * 🚀 性能压力测试脚本
 * 用于测试AI Prompt Generator的性能和承载能力
 */

const https = require('https');
const http = require('http');
const { performance } = require('perf_hooks');

// 配置参数
const CONFIG = {
  // 测试目标（本地或生产）
  targets: {
    local: 'http://localhost:3000',
    production: 'https://ai-prompt-generator.vercel.app'
  },
  // 并发配置
  concurrency: {
    users: 100,        // 并发用户数
    duration: 60000,   // 测试持续时间（毫秒）
    rampUp: 10000     // 渐进增加用户时间（毫秒）
  },
  // 性能阈值
  thresholds: {
    pageLoadTime: 2000,      // 页面加载时间（毫秒）
    apiResponseTime: 200,    // API响应时间（毫秒）
    errorRate: 0.01,         // 错误率（1%）
    successRate: 0.99        // 成功率（99%）
  }
};

// 测试场景
const TEST_SCENARIOS = [
  {
    name: '首页加载',
    path: '/',
    method: 'GET',
    weight: 20
  },
  {
    name: '律师页面',
    path: '/ai-prompts-for-lawyers',
    method: 'GET',
    weight: 15
  },
  {
    name: '会计师页面',
    path: '/ai-prompts-for-accountants',
    method: 'GET',
    weight: 15
  },
  {
    name: '教师页面',
    path: '/ai-prompts-for-teachers',
    method: 'GET',
    weight: 15
  },
  {
    name: 'API调用-生成提示词',
    path: '/api/generate-prompt',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      industry: 'lawyer',
      scenario: '合同审查',
      prompt: '帮我审查这份销售合同',
      useAI: false
    }),
    weight: 35
  }
];

// 测试结果收集器
class TestResults {
  constructor() {
    this.requests = [];
    this.errors = [];
    this.startTime = null;
    this.endTime = null;
  }

  addRequest(scenario, responseTime, statusCode, error = null) {
    this.requests.push({
      scenario: scenario.name,
      responseTime,
      statusCode,
      error,
      timestamp: Date.now()
    });

    if (error) {
      this.errors.push({
        scenario: scenario.name,
        error,
        timestamp: Date.now()
      });
    }
  }

  generateReport() {
    const totalRequests = this.requests.length;
    const successfulRequests = this.requests.filter(r => !r.error).length;
    const failedRequests = this.errors.length;
    const successRate = successfulRequests / totalRequests;
    const errorRate = failedRequests / totalRequests;

    // 计算响应时间统计
    const responseTimes = this.requests
      .filter(r => r.responseTime)
      .map(r => r.responseTime);
    
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    
    // 计算百分位数
    responseTimes.sort((a, b) => a - b);
    const p50 = responseTimes[Math.floor(responseTimes.length * 0.5)];
    const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
    const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)];

    // 按场景分组统计
    const scenarioStats = {};
    TEST_SCENARIOS.forEach(scenario => {
      const scenarioRequests = this.requests.filter(r => r.scenario === scenario.name);
      if (scenarioRequests.length > 0) {
        const scenarioTimes = scenarioRequests
          .filter(r => r.responseTime)
          .map(r => r.responseTime);
        
        scenarioStats[scenario.name] = {
          total: scenarioRequests.length,
          successful: scenarioRequests.filter(r => !r.error).length,
          failed: scenarioRequests.filter(r => r.error).length,
          avgTime: scenarioTimes.reduce((a, b) => a + b, 0) / scenarioTimes.length || 0,
          minTime: Math.min(...scenarioTimes) || 0,
          maxTime: Math.max(...scenarioTimes) || 0
        };
      }
    });

    return {
      summary: {
        totalRequests,
        successfulRequests,
        failedRequests,
        successRate,
        errorRate,
        duration: this.endTime - this.startTime,
        requestsPerSecond: totalRequests / ((this.endTime - this.startTime) / 1000)
      },
      responseTime: {
        avg: avgResponseTime,
        min: minResponseTime,
        max: maxResponseTime,
        p50,
        p95,
        p99
      },
      scenarios: scenarioStats,
      errors: this.errors
    };
  }
}

// HTTP请求执行器
function executeRequest(url, scenario) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const urlObj = new URL(url + scenario.path);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: scenario.method,
      headers: scenario.headers || {},
      timeout: 30000
    };

    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const responseTime = performance.now() - startTime;
        resolve({
          scenario,
          responseTime,
          statusCode: res.statusCode,
          error: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : null
        });
      });
    });

    req.on('error', (error) => {
      const responseTime = performance.now() - startTime;
      resolve({
        scenario,
        responseTime,
        statusCode: null,
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const responseTime = performance.now() - startTime;
      resolve({
        scenario,
        responseTime,
        statusCode: null,
        error: 'Request timeout'
      });
    });

    if (scenario.body) {
      req.write(scenario.body);
    }

    req.end();
  });
}

// 场景选择器（基于权重）
function selectScenario() {
  const totalWeight = TEST_SCENARIOS.reduce((sum, s) => sum + s.weight, 0);
  const random = Math.random() * totalWeight;
  
  let weightSum = 0;
  for (const scenario of TEST_SCENARIOS) {
    weightSum += scenario.weight;
    if (random < weightSum) {
      return scenario;
    }
  }
  
  return TEST_SCENARIOS[0];
}

// 虚拟用户模拟器
async function virtualUser(id, targetUrl, results, duration) {
  const startTime = Date.now();
  let requestCount = 0;

  console.log(`👤 虚拟用户 #${id} 开始测试`);

  while (Date.now() - startTime < duration) {
    const scenario = selectScenario();
    const result = await executeRequest(targetUrl, scenario);
    results.addRequest(scenario, result.responseTime, result.statusCode, result.error);
    requestCount++;

    // 模拟用户思考时间（1-3秒）
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  }

  console.log(`✅ 虚拟用户 #${id} 完成测试，发送了 ${requestCount} 个请求`);
}

// 主测试函数
async function runPerformanceTest(target = 'local') {
  console.log('=== 🚀 性能压力测试开始 ===\n');
  
  const targetUrl = CONFIG.targets[target];
  console.log(`📍 测试目标: ${targetUrl}`);
  console.log(`👥 并发用户: ${CONFIG.concurrency.users}`);
  console.log(`⏱️ 测试时长: ${CONFIG.concurrency.duration / 1000} 秒`);
  console.log(`📈 渐进时间: ${CONFIG.concurrency.rampUp / 1000} 秒\n`);

  const results = new TestResults();
  results.startTime = Date.now();

  // 创建虚拟用户池
  const userPromises = [];
  const usersPerSecond = CONFIG.concurrency.users / (CONFIG.concurrency.rampUp / 1000);

  for (let i = 0; i < CONFIG.concurrency.users; i++) {
    const delay = (i / usersPerSecond) * 1000;
    
    const userPromise = new Promise((resolve) => {
      setTimeout(async () => {
        await virtualUser(i + 1, targetUrl, results, CONFIG.concurrency.duration);
        resolve();
      }, delay);
    });
    
    userPromises.push(userPromise);
  }

  // 等待所有用户完成
  await Promise.all(userPromises);
  results.endTime = Date.now();

  // 生成测试报告
  console.log('\n=== 📊 测试报告 ===\n');
  const report = results.generateReport();

  // 打印摘要
  console.log('📈 总体统计:');
  console.log(`   总请求数: ${report.summary.totalRequests}`);
  console.log(`   成功请求: ${report.summary.successfulRequests}`);
  console.log(`   失败请求: ${report.summary.failedRequests}`);
  console.log(`   成功率: ${(report.summary.successRate * 100).toFixed(2)}%`);
  console.log(`   错误率: ${(report.summary.errorRate * 100).toFixed(2)}%`);
  console.log(`   RPS: ${report.summary.requestsPerSecond.toFixed(2)}`);

  // 打印响应时间统计
  console.log('\n⏱️ 响应时间统计 (毫秒):');
  console.log(`   平均: ${report.responseTime.avg.toFixed(2)}`);
  console.log(`   最小: ${report.responseTime.min.toFixed(2)}`);
  console.log(`   最大: ${report.responseTime.max.toFixed(2)}`);
  console.log(`   P50: ${report.responseTime.p50.toFixed(2)}`);
  console.log(`   P95: ${report.responseTime.p95.toFixed(2)}`);
  console.log(`   P99: ${report.responseTime.p99.toFixed(2)}`);

  // 打印场景统计
  console.log('\n🎯 场景统计:');
  for (const [name, stats] of Object.entries(report.scenarios)) {
    console.log(`\n   ${name}:`);
    console.log(`      请求数: ${stats.total}`);
    console.log(`      成功: ${stats.successful}`);
    console.log(`      失败: ${stats.failed}`);
    console.log(`      平均响应: ${stats.avgTime.toFixed(2)} ms`);
  }

  // 性能评估
  console.log('\n=== 🎯 性能评估 ===\n');
  const passed = [];
  const failed = [];

  // 检查成功率
  if (report.summary.successRate >= CONFIG.thresholds.successRate) {
    passed.push(`✅ 成功率 (${(report.summary.successRate * 100).toFixed(2)}%) 达标`);
  } else {
    failed.push(`❌ 成功率 (${(report.summary.successRate * 100).toFixed(2)}%) 未达标`);
  }

  // 检查响应时间
  if (report.responseTime.p95 <= CONFIG.thresholds.apiResponseTime) {
    passed.push(`✅ P95响应时间 (${report.responseTime.p95.toFixed(2)}ms) 达标`);
  } else {
    failed.push(`❌ P95响应时间 (${report.responseTime.p95.toFixed(2)}ms) 超标`);
  }

  // 打印评估结果
  passed.forEach(p => console.log(p));
  failed.forEach(f => console.log(f));

  // 错误详情
  if (report.errors.length > 0) {
    console.log('\n⚠️ 错误详情:');
    const errorSummary = {};
    report.errors.forEach(e => {
      const key = `${e.scenario}: ${e.error}`;
      errorSummary[key] = (errorSummary[key] || 0) + 1;
    });
    
    for (const [error, count] of Object.entries(errorSummary)) {
      console.log(`   ${error} (发生 ${count} 次)`);
    }
  }

  // 最终结论
  console.log('\n=== 📋 测试结论 ===\n');
  if (failed.length === 0) {
    console.log('🎉 所有性能指标均达标！系统性能良好。');
  } else {
    console.log('⚠️ 部分性能指标未达标，需要优化：');
    failed.forEach(f => console.log(`   - ${f.replace(/[✅❌]/g, '')}`));
  }

  // 保存详细报告
  const fs = require('fs');
  const reportPath = `./performance-report-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 详细报告已保存至: ${reportPath}`);

  return report;
}

// 命令行参数处理
const args = process.argv.slice(2);
const target = args[0] || 'local';

// 自定义配置
if (args.includes('--users')) {
  const usersIndex = args.indexOf('--users');
  CONFIG.concurrency.users = parseInt(args[usersIndex + 1]);
}

if (args.includes('--duration')) {
  const durationIndex = args.indexOf('--duration');
  CONFIG.concurrency.duration = parseInt(args[durationIndex + 1]) * 1000;
}

// 运行测试
runPerformanceTest(target).catch(console.error);