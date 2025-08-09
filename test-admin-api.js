#!/usr/bin/env node

/**
 * 管理后台API测试脚本
 * 用于验证实时测试功能是否正常工作
 */

const https = require('https');
const http = require('http');

// 测试配置
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 10000
};

/**
 * 发送HTTP请求
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https:');
    const lib = isHttps ? https : http;
    
    const req = lib.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: TEST_CONFIG.timeout
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (error) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('请求超时')));

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * 测试API端点是否存在
 */
async function testApiEndpoints() {
  console.log('🔍 测试API端点可用性...\n');

  const endpoints = [
    { path: '/api/admin/test/config', method: 'POST' },
    { path: '/api/admin/test/health', method: 'GET' },
    { path: '/api/admin/auth/simple-verify', method: 'GET' }
  ];

  for (const endpoint of endpoints) {
    try {
      const url = `${TEST_CONFIG.baseUrl}${endpoint.path}`;
      console.log(`测试 ${endpoint.method} ${endpoint.path}...`);
      
      const result = await makeRequest(url, {
        method: endpoint.method,
        body: endpoint.method === 'POST' ? { testType: 'api_key' } : undefined
      });

      if (result.status === 401 || result.status === 403) {
        console.log(`  ✅ 端点存在（需要认证）- 状态码: ${result.status}`);
      } else if (result.status < 500) {
        console.log(`  ✅ 端点可访问 - 状态码: ${result.status}`);
      } else {
        console.log(`  ❌ 服务器错误 - 状态码: ${result.status}`);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`  ❌ 无法连接到服务器`);
        break;
      } else {
        console.log(`  ⚠️  连接错误: ${error.message}`);
      }
    }
    console.log('');
  }
}

/**
 * 测试环境变量配置
 */
async function testEnvironmentConfig() {
  console.log('🔧 检查环境变量配置...\n');

  const requiredEnvVars = [
    'OPENROUTER_API_KEY',
    'OPENROUTER_BASE_URL',
    'ANTHROPIC_API_KEY',
    'ANTHROPIC_BASE_URL'
  ];

  const envStatus = {};
  
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (value) {
      console.log(`  ✅ ${envVar}: 已配置 (${value.substring(0, 10)}...)`);
      envStatus[envVar] = true;
    } else {
      console.log(`  ❌ ${envVar}: 未配置`);
      envStatus[envVar] = false;
    }
  }

  console.log('');
  return envStatus;
}

/**
 * 生成测试报告
 */
function generateTestReport(results) {
  console.log('📋 测试报告\n');
  console.log('=' * 50);
  
  const issues = [];
  const recommendations = [];

  // 检查环境变量
  if (!results.envStatus?.OPENROUTER_API_KEY && !results.envStatus?.ANTHROPIC_API_KEY) {
    issues.push('缺少API密钥配置');
    recommendations.push('配置 OPENROUTER_API_KEY 或 ANTHROPIC_API_KEY');
  }

  // 检查API连接性
  if (results.hasConnectionIssues) {
    issues.push('无法连接到开发服务器');
    recommendations.push('请运行 npm run dev 启动开发服务器');
  }

  if (issues.length === 0) {
    console.log('✅ 所有基础检查通过！');
    console.log('💡 建议：在浏览器中访问 /admin 页面测试实时测试功能');
  } else {
    console.log('❌ 发现以下问题：');
    issues.forEach((issue, i) => console.log(`   ${i + 1}. ${issue}`));
    
    console.log('\n🔧 建议解决方案：');
    recommendations.forEach((rec, i) => console.log(`   ${i + 1}. ${rec}`));
  }
  
  console.log('\n' + '=' * 50);
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('🚀 开始管理后台API测试...\n');
  
  const results = {};
  
  try {
    // 测试环境配置
    results.envStatus = await testEnvironmentConfig();
    
    // 测试API端点
    await testApiEndpoints();
    
    // 生成报告
    generateTestReport(results);
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    results.hasConnectionIssues = true;
    generateTestReport(results);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testApiEndpoints, testEnvironmentConfig };