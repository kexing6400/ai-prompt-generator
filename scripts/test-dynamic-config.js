/**
 * 动态配置集成测试脚本
 * 验证配置动态生效功能
 * 作者：Claude Code (后端架构师)
 */

const https = require('https');
const http = require('http');

// 测试配置
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  testCases: [
    {
      name: '法律专业合同审查',
      data: {
        industry: 'lawyer',
        scenario: '合同审查',
        goal: '审查商务合同的关键条款',
        requirements: '重点关注风险条款和违约责任'
      }
    },
    {
      name: '房产市场分析',
      data: {
        industry: 'realtor',
        scenario: '市场分析',
        goal: '分析当前房产市场趋势',
        requirements: '提供投资建议和价格预测'
      }
    },
    {
      name: '指定模型测试',
      data: {
        industry: 'teacher',
        scenario: '教学设计',
        goal: '设计高中数学课程',
        preferredModel: 'anthropic/claude-3-haiku'
      }
    }
  ]
};

/**
 * 发送HTTP请求
 */
function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.request(url, options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * 测试API健康检查
 */
async function testHealthCheck() {
  console.log('\n🏥 测试API健康检查...');
  
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/generate-prompt`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200) {
      console.log('✅ 健康检查通过');
      console.log(`   配置状态: ${response.data.configuration?.valid ? '有效' : '无效'}`);
      console.log(`   可用模型: ${response.data.configuration?.availableModels || 0}个`);
      console.log(`   缓存大小: ${response.data.cache?.size || 0}`);
      console.log(`   API调用统计: ${response.data.metrics?.totalCalls || 0}次调用`);
      
      return response.data;
    } else {
      console.log('❌ 健康检查失败:', response.status);
      return null;
    }
  } catch (error) {
    console.log('❌ 健康检查异常:', error.message);
    return null;
  }
}

/**
 * 测试提示词生成
 */
async function testPromptGeneration(testCase) {
  console.log(`\n🧪 测试: ${testCase.name}`);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/generate-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, testCase.data);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (response.status === 200 && response.data.success) {
      console.log('✅ 生成成功');
      console.log(`   生成源: ${response.data.source}`);
      console.log(`   使用模型: ${response.data.modelUsed || '未知'}`);
      console.log(`   响应时间: ${responseTime}ms`);
      console.log(`   API响应时间: ${response.data.responseTime || 'N/A'}`);
      console.log(`   缓存状态: ${response.data.fromCache ? '命中' : '未命中'}`);
      console.log(`   提示词长度: ${response.data.prompt?.length || 0}字符`);
      
      if (response.data.notice) {
        console.log(`   注意: ${response.data.notice}`);
      }

      return {
        success: true,
        responseTime,
        source: response.data.source,
        modelUsed: response.data.modelUsed,
        fromCache: response.data.fromCache
      };
    } else {
      console.log('❌ 生成失败:', response.data.error || '未知错误');
      console.log('   响应状态:', response.status);
      
      return {
        success: false,
        error: response.data.error,
        status: response.status
      };
    }
  } catch (error) {
    console.log('❌ 请求异常:', error.message);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 测试缓存机制
 */
async function testCaching() {
  console.log('\n💾 测试缓存机制...');
  
  const testData = {
    industry: 'accountant',
    scenario: '财务分析',
    goal: '缓存测试专用提示词'
  };

  // 第一次请求
  const result1 = await testPromptGeneration({ name: '缓存测试-首次', data: testData });
  
  if (!result1.success) {
    console.log('❌ 缓存测试失败：首次请求失败');
    return false;
  }

  // 第二次相同请求（应使用缓存）
  const result2 = await testPromptGeneration({ name: '缓存测试-重复', data: testData });
  
  if (!result2.success) {
    console.log('❌ 缓存测试失败：重复请求失败');
    return false;
  }

  if (result2.fromCache) {
    console.log('✅ 缓存机制正常工作');
    return true;
  } else {
    console.log('⚠️  缓存可能未生效（也可能缓存已过期）');
    return false;
  }
}

/**
 * 性能测试
 */
async function performanceTest() {
  console.log('\n⚡ 性能测试...');
  
  const testData = {
    industry: 'teacher',
    scenario: '教学设计',
    goal: `性能测试-${Date.now()}`
  };

  const concurrency = 5;
  const promises = [];

  const startTime = Date.now();
  
  for (let i = 0; i < concurrency; i++) {
    promises.push(testPromptGeneration({
      name: `性能测试-${i + 1}`,
      data: { ...testData, goal: `${testData.goal}-${i}` }
    }));
  }

  const results = await Promise.all(promises);
  const endTime = Date.now();
  
  const totalTime = endTime - startTime;
  const successCount = results.filter(r => r.success).length;
  const avgResponseTime = results
    .filter(r => r.success && r.responseTime)
    .reduce((sum, r) => sum + r.responseTime, 0) / successCount || 0;

  console.log(`   并发请求: ${concurrency}个`);
  console.log(`   成功率: ${successCount}/${concurrency} (${(successCount/concurrency*100).toFixed(1)}%)`);
  console.log(`   总耗时: ${totalTime}ms`);
  console.log(`   平均响应时间: ${avgResponseTime.toFixed(1)}ms`);
  
  return {
    totalTime,
    avgResponseTime,
    successRate: successCount / concurrency
  };
}

/**
 * 主测试流程
 */
async function runTests() {
  console.log('🚀 开始动态配置集成测试\n');
  console.log(`测试目标: ${TEST_CONFIG.baseUrl}`);
  console.log(`测试时间: ${new Date().toISOString()}`);
  
  const testResults = {
    healthCheck: false,
    promptGeneration: [],
    caching: false,
    performance: null,
    startTime: Date.now()
  };

  try {
    // 1. 健康检查
    const healthData = await testHealthCheck();
    testResults.healthCheck = !!healthData;

    // 2. 提示词生成测试
    console.log('\n📝 测试提示词生成功能...');
    for (const testCase of TEST_CONFIG.testCases) {
      const result = await testPromptGeneration(testCase);
      testResults.promptGeneration.push({
        name: testCase.name,
        ...result
      });
    }

    // 3. 缓存测试
    testResults.caching = await testCaching();

    // 4. 性能测试
    testResults.performance = await performanceTest();

  } catch (error) {
    console.error('\n❌ 测试过程中发生异常:', error);
  }

  // 5. 测试总结
  const endTime = Date.now();
  const totalTime = endTime - testResults.startTime;
  
  console.log('\n📊 测试总结');
  console.log('='.repeat(50));
  console.log(`测试耗时: ${totalTime}ms`);
  console.log(`健康检查: ${testResults.healthCheck ? '✅ 通过' : '❌ 失败'}`);
  
  const successCount = testResults.promptGeneration.filter(r => r.success).length;
  console.log(`提示词生成: ${successCount}/${testResults.promptGeneration.length} 成功`);
  
  console.log(`缓存机制: ${testResults.caching ? '✅ 正常' : '❌ 异常'}`);
  
  if (testResults.performance) {
    console.log(`性能测试: 成功率 ${(testResults.performance.successRate * 100).toFixed(1)}%, 平均响应 ${testResults.performance.avgResponseTime.toFixed(1)}ms`);
  }

  // 6. 详细结果
  if (process.env.VERBOSE === 'true') {
    console.log('\n📋 详细测试结果');
    console.log('='.repeat(50));
    console.log(JSON.stringify(testResults, null, 2));
  }

  // 7. 退出状态
  const allSuccess = testResults.healthCheck && 
    testResults.promptGeneration.every(r => r.success) && 
    testResults.caching &&
    (testResults.performance?.successRate || 0) >= 0.8;

  console.log(`\n${allSuccess ? '🎉 所有测试通过！' : '⚠️  部分测试失败，请检查系统状态'}`);
  
  process.exit(allSuccess ? 0 : 1);
}

// 运行测试
if (require.main === module) {
  runTests().catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testHealthCheck,
  testPromptGeneration,
  testCaching,
  performanceTest
};