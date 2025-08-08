#!/usr/bin/env node

/**
 * 🔧 AI Prompt Generator API 完整测试套件
 * 版本: 2.0 - 深度诊断版
 * 用途: 全方位诊断API问题，包括环境变量、网络连接、API响应等
 */

const fs = require('fs');
const path = require('path');

// 颜色输出函数
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, emoji, message) {
  console.log(`${colors[color]}${emoji} ${message}${colors.reset}`);
}

// 测试配置
const config = {
  baseUrl: 'http://localhost:3000',
  apiEndpoint: '/api/generate-prompt-v2',
  timeout: 60000, // 60秒超时
  testData: {
    industry: 'lawyer',
    scenario: '合同审查',
    goal: '帮我生成一个专业的合同审查提示词',
    requirements: '需要包含风险识别和法律条款检查',
    context: '主要针对销售合同'
  }
};

// 工具函数：等待指定毫秒
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 1. 环境检查
async function checkEnvironment() {
  log('blue', '🔍', '开始环境检查...');
  
  const checks = {
    envFile: false,
    apiKey: false,
    baseUrl: false,
    nextjsRunning: false
  };
  
  // 检查 .env.local 文件
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    checks.envFile = true;
    log('green', '✅', '.env.local 文件存在');
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('OPENROUTER_API_KEY=')) {
      checks.apiKey = true;
      const keyMatch = envContent.match(/OPENROUTER_API_KEY=(.+)/);
      const keyPreview = keyMatch?.[1]?.substring(0, 10) + '...';
      log('green', '✅', `API密钥配置正确: ${keyPreview}`);
    } else {
      log('red', '❌', 'OPENROUTER_API_KEY 未在 .env.local 中找到');
    }
    
    if (envContent.includes('OPENROUTER_BASE_URL=')) {
      checks.baseUrl = true;
      log('green', '✅', 'OPENROUTER_BASE_URL 配置正确');
    }
  } else {
    log('red', '❌', '.env.local 文件不存在');
  }
  
  // 检查Next.js开发服务器
  try {
    const response = await fetch(`${config.baseUrl}/api/test`, { 
      method: 'GET',
      signal: AbortSignal.timeout(5000) 
    });
    if (response.ok) {
      checks.nextjsRunning = true;
      log('green', '✅', 'Next.js 开发服务器运行正常');
    }
  } catch (error) {
    log('red', '❌', `Next.js 开发服务器连接失败: ${error.message}`);
    log('yellow', '⚠️', '请确保运行了 npm run dev');
  }
  
  return checks;
}

// 2. 直接API连接测试
async function testDirectApiConnection() {
  log('blue', '🔗', '测试直接API连接...');
  
  // 读取环境变量
  const envPath = path.join(process.cwd(), '.env.local');
  let apiKey = '';
  let baseUrl = 'https://openrouter.ai/api/v1';
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const keyMatch = envContent.match(/OPENROUTER_API_KEY=(.+)/);
    const urlMatch = envContent.match(/OPENROUTER_BASE_URL=(.+)/);
    
    apiKey = keyMatch?.[1]?.trim() || '';
    baseUrl = urlMatch?.[1]?.trim() || baseUrl;
  }
  
  if (!apiKey) {
    log('red', '❌', 'API密钥未找到，无法进行直连测试');
    return false;
  }
  
  try {
    // 测试获取模型列表
    log('cyan', '📡', '正在测试 OpenRouter API 连接...');
    const response = await fetch(`${baseUrl}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (response.ok) {
      const data = await response.json();
      log('green', '✅', `OpenRouter API 连接成功 (找到 ${data.data?.length || 0} 个模型)`);
      return true;
    } else {
      const errorText = await response.text();
      log('red', '❌', `OpenRouter API 连接失败: ${response.status} - ${errorText}`);
      return false;
    }
  } catch (error) {
    log('red', '❌', `OpenRouter API 连接异常: ${error.message}`);
    return false;
  }
}

// 3. 本地API端点测试
async function testLocalApi() {
  log('blue', '🧪', '测试本地API端点...');
  
  const testUrl = `${config.baseUrl}${config.apiEndpoint}`;
  
  try {
    log('cyan', '📤', '发送测试请求...');
    console.log('请求URL:', testUrl);
    console.log('请求数据:', JSON.stringify(config.testData, null, 2));
    
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config.testData),
      signal: AbortSignal.timeout(config.timeout)
    });
    
    console.log('响应状态:', response.status, response.statusText);
    console.log('响应头:', Object.fromEntries(response.headers.entries()));
    
    const responseData = await response.json();
    console.log('响应数据:', JSON.stringify(responseData, null, 2));
    
    if (response.ok && responseData.success) {
      log('green', '🎉', 'API测试成功！');
      log('cyan', '📊', `生成的提示词长度: ${responseData.prompt?.length || 0} 字符`);
      log('cyan', '⭐', `质量评分: ${responseData.qualityScore || '未知'}/100`);
      log('cyan', '⏱️', `响应时间: ${responseData.responseTime || '未知'}ms`);
      return true;
    } else {
      log('red', '❌', 'API测试失败');
      if (responseData.error) {
        log('red', '💬', `错误信息: ${responseData.error}`);
      }
      if (responseData.errorType) {
        log('red', '🏷️', `错误类型: ${responseData.errorType}`);
      }
      if (responseData.debugInfo) {
        log('yellow', '🔍', '调试信息:');
        console.log(responseData.debugInfo);
      }
      return false;
    }
  } catch (error) {
    log('red', '💥', `API请求异常: ${error.message}`);
    if (error.name === 'AbortError') {
      log('yellow', '⏰', '请求超时，API可能响应较慢');
    } else if (error.message.includes('fetch')) {
      log('yellow', '🌐', '网络连接问题，请检查开发服务器是否运行');
    }
    return false;
  }
}

// 4. 完整的端到端测试
async function runEndToEndTest() {
  log('blue', '🚀', '运行完整的端到端测试...');
  
  const industries = ['lawyer', 'teacher', 'realtor', 'accountant', 'insurance'];
  const results = [];
  
  for (const industry of industries) {
    log('cyan', '🔄', `测试行业: ${industry}`);
    
    const testData = {
      ...config.testData,
      industry,
      scenario: `${industry} 专业场景测试`,
      goal: `为${industry}生成专业提示词`
    };
    
    try {
      const response = await fetch(`${config.baseUrl}${config.apiEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
        signal: AbortSignal.timeout(30000)
      });
      
      const data = await response.json();
      results.push({
        industry,
        success: response.ok && data.success,
        error: data.error,
        responseTime: data.responseTime
      });
      
      if (response.ok && data.success) {
        log('green', '✅', `${industry} 测试成功`);
      } else {
        log('red', '❌', `${industry} 测试失败: ${data.error || '未知错误'}`);
      }
      
      // 避免频繁请求
      await sleep(1000);
      
    } catch (error) {
      log('red', '❌', `${industry} 测试异常: ${error.message}`);
      results.push({
        industry,
        success: false,
        error: error.message
      });
    }
  }
  
  // 输出测试总结
  log('magenta', '📋', '测试总结:');
  const successCount = results.filter(r => r.success).length;
  console.log(`成功: ${successCount}/${results.length}`);
  console.table(results);
  
  return results;
}

// 5. 生成诊断报告
function generateDiagnosticReport(envChecks, apiConnected, localApiWorking, e2eResults) {
  const report = {
    timestamp: new Date().toISOString(),
    environment: envChecks,
    directApiConnection: apiConnected,
    localApiWorking: localApiWorking,
    endToEndResults: e2eResults,
    overallHealth: 'unknown',
    recommendations: []
  };
  
  // 计算整体健康状况
  if (!envChecks.envFile || !envChecks.apiKey) {
    report.overallHealth = 'critical';
    report.recommendations.push('修复环境变量配置');
  } else if (!apiConnected) {
    report.overallHealth = 'critical';
    report.recommendations.push('检查API密钥有效性和网络连接');
  } else if (!localApiWorking) {
    report.overallHealth = 'degraded';
    report.recommendations.push('检查Next.js应用配置和环境变量加载');
  } else {
    const successRate = e2eResults.filter(r => r.success).length / e2eResults.length;
    if (successRate >= 0.8) {
      report.overallHealth = 'healthy';
    } else {
      report.overallHealth = 'degraded';
      report.recommendations.push('部分行业API存在问题，需要进一步调试');
    }
  }
  
  // 保存报告
  const reportPath = path.join(process.cwd(), 'api-diagnostic-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log('green', '📄', `诊断报告已保存至: ${reportPath}`);
  
  return report;
}

// 主执行函数
async function main() {
  console.log('='.repeat(80));
  log('magenta', '🚀', 'AI Prompt Generator API 完整诊断开始');
  console.log('='.repeat(80));
  
  try {
    // 步骤1: 环境检查
    const envChecks = await checkEnvironment();
    console.log('\n');
    
    // 步骤2: 直接API连接测试
    const apiConnected = await testDirectApiConnection();
    console.log('\n');
    
    // 步骤3: 本地API测试
    const localApiWorking = await testLocalApi();
    console.log('\n');
    
    // 步骤4: 端到端测试
    const e2eResults = await runEndToEndTest();
    console.log('\n');
    
    // 步骤5: 生成诊断报告
    const report = generateDiagnosticReport(envChecks, apiConnected, localApiWorking, e2eResults);
    
    console.log('='.repeat(80));
    log('magenta', '📊', '诊断完成');
    log(report.overallHealth === 'healthy' ? 'green' : 'yellow', '🏥', `整体状态: ${report.overallHealth}`);
    
    if (report.recommendations.length > 0) {
      log('yellow', '💡', '建议操作:');
      report.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
    }
    console.log('='.repeat(80));
    
    // 如果所有测试通过，显示成功消息
    if (report.overallHealth === 'healthy') {
      log('green', '🎉', 'API完全正常工作！您可以安全地使用应用程序。');
    } else if (report.overallHealth === 'critical') {
      log('red', '🚨', '发现严重问题，请按照建议操作后重新测试。');
      process.exit(1);
    }
    
  } catch (error) {
    log('red', '💥', `诊断过程异常: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  main();
}

module.exports = { main, testLocalApi, checkEnvironment };