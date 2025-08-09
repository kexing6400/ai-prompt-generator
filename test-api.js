#!/usr/bin/env node

/**
 * API功能测试脚本
 * 用于验证AI Prompt Generator的核心功能是否正常
 */

const https = require('https');

// 配置
const BASE_URL = process.argv[2] || 'https://ai-prompt-generator.vercel.app';
const API_ENDPOINT = '/api/generate-prompt';

// 测试数据
const testCases = [
  {
    name: '律师-合同审查',
    data: {
      industry: 'lawyer',
      scenario: '合同审查',
      goal: '审查一份软件采购合同的法律风险',
      requirements: '重点关注付款条款、知识产权归属和违约责任',
      locale: 'zh'
    }
  },
  {
    name: '房产-市场分析',
    data: {
      industry: 'realtor',
      scenario: '市场分析',
      goal: '分析某小区的投资价值',
      requirements: '关注学区、交通和未来发展规划',
      locale: 'zh'
    }
  },
  {
    name: '教师-教学设计',
    data: {
      industry: 'teacher',
      scenario: '教学设计',
      goal: '设计一节关于光合作用的生物课',
      requirements: '适合初中二年级，包含实验环节',
      locale: 'zh'
    }
  }
];

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// HTTP POST请求
function postRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
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
    req.write(postData);
    req.end();
  });
}

// HTTP GET请求
function getRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
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
    }).on('error', reject);
  });
}

// 主测试函数
async function runTests() {
  console.log(`${colors.cyan}==================================${colors.reset}`);
  console.log(`${colors.cyan}AI Prompt Generator 功能测试${colors.reset}`);
  console.log(`${colors.cyan}==================================${colors.reset}\n`);
  console.log(`测试环境: ${colors.yellow}${BASE_URL}${colors.reset}\n`);

  // 1. 测试API健康状态
  console.log(`${colors.blue}[1/4] 测试API健康状态...${colors.reset}`);
  try {
    const healthCheck = await getRequest(`${BASE_URL}${API_ENDPOINT}`);
    if (healthCheck.status === 200 && healthCheck.data.status === 'healthy') {
      console.log(`${colors.green}✅ API运行正常${colors.reset}`);
      console.log(`   - 状态: ${healthCheck.data.status}`);
      console.log(`   - 有API密钥: ${healthCheck.data.hasApiKey ? '是' : '否'}`);
      console.log(`   - 缓存大小: ${healthCheck.data.cacheSize}`);
      console.log(`   - 支持行业: ${healthCheck.data.industries.join(', ')}\n`);
    } else {
      console.log(`${colors.red}❌ API健康检查失败${colors.reset}\n`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ 无法连接到API: ${error.message}${colors.reset}\n`);
    return;
  }

  // 2. 测试提示词生成
  console.log(`${colors.blue}[2/4] 测试提示词生成功能...${colors.reset}`);
  const results = [];
  
  for (const testCase of testCases) {
    console.log(`\n测试: ${colors.yellow}${testCase.name}${colors.reset}`);
    const startTime = Date.now();
    
    try {
      const response = await postRequest(
        `${BASE_URL}${API_ENDPOINT}`,
        testCase.data
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (response.status === 200 && response.data.success) {
        const prompt = response.data.prompt;
        const source = response.data.source || 'unknown';
        const wordCount = prompt ? prompt.length : 0;
        
        console.log(`${colors.green}✅ 生成成功${colors.reset}`);
        console.log(`   - 响应时间: ${duration}ms`);
        console.log(`   - 数据来源: ${source}`);
        console.log(`   - 字数: ${wordCount}`);
        console.log(`   - 预览: ${prompt.substring(0, 100)}...`);
        
        // 验证关键点
        const checks = {
          isNotUserInput: !prompt.includes(testCase.data.goal),
          hasMinLength: wordCount > 300,
          hasProfessionalContent: prompt.includes('步骤') || prompt.includes('分析') || prompt.includes('建议'),
          isStructured: prompt.includes('1.') || prompt.includes('**')
        };
        
        console.log(`\n   质量检查:`);
        console.log(`   ${checks.isNotUserInput ? '✅' : '❌'} 不是用户输入的回声`);
        console.log(`   ${checks.hasMinLength ? '✅' : '❌'} 字数充足（>300字）`);
        console.log(`   ${checks.hasProfessionalContent ? '✅' : '❌'} 包含专业内容`);
        console.log(`   ${checks.isStructured ? '✅' : '❌'} 结构化输出`);
        
        results.push({
          name: testCase.name,
          success: true,
          duration,
          source,
          wordCount,
          quality: Object.values(checks).filter(v => v).length
        });
      } else {
        console.log(`${colors.red}❌ 生成失败: ${response.data.error || '未知错误'}${colors.reset}`);
        results.push({
          name: testCase.name,
          success: false,
          error: response.data.error
        });
      }
    } catch (error) {
      console.log(`${colors.red}❌ 请求失败: ${error.message}${colors.reset}`);
      results.push({
        name: testCase.name,
        success: false,
        error: error.message
      });
    }
  }

  // 3. 测试缓存
  console.log(`\n${colors.blue}[3/4] 测试缓存机制...${colors.reset}`);
  const cacheTestData = testCases[0].data;
  
  console.log('第一次请求（应该较慢）...');
  const firstStart = Date.now();
  const firstResponse = await postRequest(`${BASE_URL}${API_ENDPOINT}`, cacheTestData);
  const firstDuration = Date.now() - firstStart;
  
  console.log('第二次请求（应该很快）...');
  const secondStart = Date.now();
  const secondResponse = await postRequest(`${BASE_URL}${API_ENDPOINT}`, cacheTestData);
  const secondDuration = Date.now() - secondStart;
  
  const cacheImprovement = Math.round(((firstDuration - secondDuration) / firstDuration) * 100);
  
  console.log(`第一次: ${firstDuration}ms (${firstResponse.data.source})`);
  console.log(`第二次: ${secondDuration}ms (${secondResponse.data.source})`);
  
  if (secondDuration < firstDuration / 2 || secondResponse.data.source === 'cache') {
    console.log(`${colors.green}✅ 缓存工作正常（性能提升${cacheImprovement}%）${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠️ 缓存可能未生效${colors.reset}`);
  }

  // 4. 总结报告
  console.log(`\n${colors.blue}[4/4] 测试总结${colors.reset}`);
  console.log(`${colors.cyan}==================================${colors.reset}`);
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  const successRate = Math.round((successCount / totalCount) * 100);
  
  console.log(`\n测试结果: ${successCount}/${totalCount} 成功 (${successRate}%)`);
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    const color = result.success ? colors.green : colors.red;
    console.log(`${color}${icon} ${result.name}${colors.reset}`);
    if (result.success) {
      console.log(`   响应时间: ${result.duration}ms | 字数: ${result.wordCount} | 质量分: ${result.quality}/4`);
    } else {
      console.log(`   错误: ${result.error}`);
    }
  });

  // 最终判定
  console.log(`\n${colors.cyan}==================================${colors.reset}`);
  if (successRate === 100) {
    console.log(`${colors.green}🎉 所有测试通过！产品完全可用！${colors.reset}`);
  } else if (successRate >= 75) {
    console.log(`${colors.yellow}⚠️ 大部分功能正常，建议检查失败的测试${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ 存在严重问题，请检查部署配置${colors.reset}`);
  }
  console.log(`${colors.cyan}==================================${colors.reset}\n`);
}

// 运行测试
runTests().catch(error => {
  console.error(`${colors.red}测试运行失败: ${error.message}${colors.reset}`);
  process.exit(1);
});