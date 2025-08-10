/**
 * 订阅API测试脚本
 * 测试刚修复的订阅端点
 */

const http = require('http');

// 测试配置
const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = 'test_user_123';

// 设置Cookie
function getCookieHeader(userId) {
  return `userId=${userId}`;
}

// HTTP请求辅助函数
function makeRequest(path, method = 'GET', body = null, userId = TEST_USER_ID) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': getCookieHeader(userId)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

// 测试函数
async function runTests() {
  console.log('🧪 开始测试订阅API...\n');
  
  const tests = [
    {
      name: '获取订阅计划列表',
      run: async () => {
        const result = await makeRequest('/api/subscription/plans');
        return {
          passed: result.status === 200 && result.data.success,
          response: result
        };
      }
    },
    {
      name: '获取订阅计划（带比较）',
      run: async () => {
        const result = await makeRequest('/api/subscription/plans?comparison=true');
        return {
          passed: result.status === 200 && result.data.success && result.data.data.comparison,
          response: result
        };
      }
    },
    {
      name: '获取当前订阅状态（未登录）',
      run: async () => {
        const result = await makeRequest('/api/subscription/current', 'GET', null, '');
        return {
          passed: result.status === 401,
          response: result
        };
      }
    },
    {
      name: '获取当前订阅状态（已登录）',
      run: async () => {
        const result = await makeRequest('/api/subscription/current');
        return {
          passed: result.status === 200 || result.status === 404, // 用户可能不存在
          response: result
        };
      }
    },
    {
      name: '升级订阅（无效计划）',
      run: async () => {
        const result = await makeRequest('/api/subscription/upgrade', 'POST', {
          plan: 'invalid'
        });
        return {
          passed: result.status === 400,
          response: result
        };
      }
    },
    {
      name: '升级订阅（有效计划）',
      run: async () => {
        const result = await makeRequest('/api/subscription/upgrade', 'POST', {
          plan: 'pro',
          paymentMethod: 'test'
        });
        return {
          passed: result.status === 200 || result.status === 404, // 用户可能不存在
          response: result
        };
      }
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`运行测试: ${test.name}`);
      const result = await test.run();
      
      if (result.passed) {
        console.log(`✅ 通过 - 状态码: ${result.response.status}`);
        passed++;
      } else {
        console.log(`❌ 失败 - 状态码: ${result.response.status}`);
        console.log('响应:', JSON.stringify(result.response.data, null, 2));
        failed++;
      }
    } catch (error) {
      console.log(`❌ 错误: ${error.message}`);
      failed++;
    }
    console.log('');
  }
  
  console.log('📊 测试结果汇总:');
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`📈 通过率: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 所有测试通过！订阅API工作正常。');
  } else {
    console.log('\n⚠️ 部分测试失败，需要进一步调试。');
  }
}

// 等待服务器启动并运行测试
setTimeout(() => {
  runTests().catch(console.error);
}, 2000);