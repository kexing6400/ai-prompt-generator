#!/usr/bin/env node

/**
 * 快速国际化功能验证脚本
 * 专注于核心国际化功能的快速检查
 */

const https = require('https');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// 快速HTTP请求
function quickRequest(url, timeout = 5000) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve({ error: 'timeout', status: 408 });
    }, timeout);

    try {
      https.get(url, { timeout: timeout }, (res) => {
        clearTimeout(timer);
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data.substring(0, 2000) // 只取前2000字符
          });
        });
      }).on('error', (err) => {
        clearTimeout(timer);
        resolve({ error: err.message, status: 0 });
      });
    } catch (err) {
      clearTimeout(timer);
      resolve({ error: err.message, status: 0 });
    }
  });
}

// 测试结果
const results = {
  routing: [],
  content: [],
  structure: []
};

async function runQuickTests() {
  const baseUrl = 'https://ai-prompt-generator.vercel.app';
  
  console.log(`${colors.cyan}==================================${colors.reset}`);
  console.log(`${colors.cyan}AI Prompt Generator 国际化快速检查${colors.reset}`);
  console.log(`${colors.cyan}==================================${colors.reset}\n`);

  // 1. 路由访问测试
  console.log(`${colors.blue}[1/3] 路由访问测试${colors.reset}`);
  
  const routeTests = [
    { path: '/', name: '根路径', expectRedirect: true },
    { path: '/cn/', name: '中文首页', expectRedirect: false },
    { path: '/en/', name: '英文首页', expectRedirect: false },
    { path: '/cn/ai-prompts-for-lawyers/', name: '中文律师页面', expectRedirect: false },
    { path: '/en/ai-prompts-for-lawyers/', name: '英文律师页面', expectRedirect: false }
  ];

  for (const test of routeTests) {
    process.stdout.write(`检查 ${test.name}... `);
    
    const result = await quickRequest(`${baseUrl}${test.path}`);
    
    if (result.error) {
      console.log(`${colors.red}❌ 错误: ${result.error}${colors.reset}`);
      results.routing.push({ name: test.name, success: false, error: result.error });
    } else if (result.status === 200) {
      console.log(`${colors.green}✅ 正常访问${colors.reset}`);
      results.routing.push({ name: test.name, success: true, status: result.status });
      
      // 检查内容是否包含基本的HTML结构
      if (result.data && result.data.includes('<html') && result.data.includes('</html>')) {
        results.structure.push({ name: test.name, hasValidHTML: true });
      }
    } else if (test.expectRedirect && (result.status >= 300 && result.status < 400)) {
      console.log(`${colors.green}✅ 重定向正常 (${result.status})${colors.reset}`);
      results.routing.push({ name: test.name, success: true, status: result.status, redirect: true });
    } else {
      console.log(`${colors.yellow}⚠️ 状态: ${result.status}${colors.reset}`);
      results.routing.push({ name: test.name, success: false, status: result.status });
    }
  }

  // 2. 内容语言检查
  console.log(`\n${colors.blue}[2/3] 内容语言检查${colors.reset}`);
  
  const contentTests = [
    { path: '/cn/', name: '中文首页内容', expectedLang: 'zh', pattern: /[\u4e00-\u9fff]/ },
    { path: '/en/', name: '英文首页内容', expectedLang: 'en', pattern: /[a-zA-Z]/ }
  ];

  for (const test of contentTests) {
    process.stdout.write(`检查 ${test.name}... `);
    
    const result = await quickRequest(`${baseUrl}${test.path}`);
    
    if (result.error || result.status !== 200) {
      console.log(`${colors.red}❌ 访问失败${colors.reset}`);
      results.content.push({ name: test.name, success: false });
      continue;
    }

    const hasCorrectContent = test.pattern.test(result.data);
    const hasTitle = /<title[^>]*>([^<]+)<\/title>/i.test(result.data);
    const hasLangAttr = new RegExp(`html[^>]*lang="${test.expectedLang}`, 'i').test(result.data);

    if (hasCorrectContent && hasTitle) {
      console.log(`${colors.green}✅ 语言内容正确${colors.reset}`);
      results.content.push({ 
        name: test.name, 
        success: true, 
        hasCorrectLang: hasCorrectContent,
        hasTitle: hasTitle,
        hasLangAttr: hasLangAttr
      });
    } else {
      console.log(`${colors.yellow}⚠️ 内容可能有问题${colors.reset}`);
      results.content.push({ 
        name: test.name, 
        success: false,
        hasCorrectLang: hasCorrectContent,
        hasTitle: hasTitle
      });
    }
  }

  // 3. API基本测试
  console.log(`\n${colors.blue}[3/3] API基本测试${colors.reset}`);
  
  process.stdout.write('检查API健康状态... ');
  const apiResult = await quickRequest(`${baseUrl}/api/generate-prompt`);
  
  if (apiResult.error) {
    console.log(`${colors.red}❌ API不可访问: ${apiResult.error}${colors.reset}`);
  } else if (apiResult.status === 200) {
    try {
      const apiData = JSON.parse(apiResult.data);
      if (apiData.status === 'healthy') {
        console.log(`${colors.green}✅ API正常运行${colors.reset}`);
      } else {
        console.log(`${colors.yellow}⚠️ API响应异常${colors.reset}`);
      }
    } catch (e) {
      console.log(`${colors.yellow}⚠️ API响应格式异常${colors.reset}`);
    }
  } else {
    console.log(`${colors.yellow}⚠️ API状态: ${apiResult.status}${colors.reset}`);
  }

  // 生成总结
  generateQuickReport();
}

function generateQuickReport() {
  console.log(`\n${colors.cyan}==================================${colors.reset}`);
  console.log(`${colors.cyan}快速检查结果总结${colors.reset}`);
  console.log(`${colors.cyan}==================================${colors.reset}\n`);

  // 路由测试总结
  const routingSuccess = results.routing.filter(r => r.success).length;
  const routingTotal = results.routing.length;
  console.log(`${colors.blue}路由访问: ${routingSuccess}/${routingTotal} 成功${colors.reset}`);
  
  // 内容测试总结
  const contentSuccess = results.content.filter(r => r.success).length;
  const contentTotal = results.content.length;
  console.log(`${colors.blue}内容语言: ${contentSuccess}/${contentTotal} 正确${colors.reset}`);

  // 整体评估
  const totalSuccess = routingSuccess + contentSuccess;
  const totalTests = routingTotal + contentTotal;
  const successRate = Math.round((totalSuccess / totalTests) * 100);

  console.log(`\n${colors.cyan}总体成功率: ${successRate}%${colors.reset}`);

  if (successRate >= 90) {
    console.log(`${colors.green}🎉 国际化功能运行良好！${colors.reset}`);
  } else if (successRate >= 70) {
    console.log(`${colors.yellow}⚠️ 国际化功能基本正常，建议进一步测试${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ 国际化功能可能存在问题${colors.reset}`);
  }

  // 详细建议
  console.log(`\n${colors.blue}发现的问题:${colors.reset}`);
  const failures = [...results.routing, ...results.content].filter(r => !r.success);
  
  if (failures.length === 0) {
    console.log('✅ 未发现明显问题');
  } else {
    failures.forEach(failure => {
      console.log(`- ${failure.name}: ${failure.error || failure.status || '未知问题'}`);
    });
  }

  console.log(`\n${colors.blue}下一步建议:${colors.reset}`);
  if (successRate >= 90) {
    console.log('✅ 可以进行完整的E2E测试');
    console.log('✅ 可以测试语言切换功能');
    console.log('✅ 可以测试API多语言支持');
  } else {
    console.log('⚠️ 建议先修复基础路由问题');
    console.log('⚠️ 检查服务器配置和部署状态');
    console.log('⚠️ 验证middleware是否正确工作');
  }

  console.log(`\n${colors.cyan}==================================${colors.reset}`);
}

// 运行测试
runQuickTests().catch(error => {
  console.error(`${colors.red}测试运行失败: ${error.message}${colors.reset}`);
  process.exit(1);
});