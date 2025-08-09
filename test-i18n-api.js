#!/usr/bin/env node

/**
 * 国际化API功能测试脚本
 * 专门验证AI Prompt Generator的国际化功能是否正常
 * 测试范围：路由重定向、语言切换、多语言API调用
 */

const https = require('https');

// 配置
const BASE_URL = process.argv[2] || 'https://ai-prompt-generator.vercel.app';
const LOCAL_URL = 'http://localhost:3000';

// 支持的语言和路径
const LOCALES = ['cn', 'en'];
const INDUSTRIES = [
  'ai-prompts-for-lawyers',
  'ai-prompts-for-realtors', 
  'ai-prompts-for-insurance-advisors',
  'ai-prompts-for-teachers',
  'ai-prompts-for-accountants'
];

// 测试数据 - 中英文对照
const I18N_TEST_CASES = [
  {
    name: '律师-中文',
    locale: 'cn',
    data: {
      industry: 'lawyer',
      scenario: '合同审查',
      goal: '审查一份软件采购合同的法律风险',
      requirements: '重点关注付款条款、知识产权归属和违约责任',
      locale: 'zh'
    }
  },
  {
    name: '律师-英文',
    locale: 'en',
    data: {
      industry: 'lawyer',
      scenario: 'Contract Review',
      goal: 'Review legal risks in a software procurement contract',
      requirements: 'Focus on payment terms, intellectual property rights, and breach of contract',
      locale: 'en'
    }
  },
  {
    name: '房产-中文',
    locale: 'cn',
    data: {
      industry: 'realtor',
      scenario: '市场分析',
      goal: '分析某小区的投资价值',
      requirements: '关注学区、交通和未来发展规划',
      locale: 'zh'
    }
  },
  {
    name: '房产-英文',
    locale: 'en',
    data: {
      industry: 'realtor',
      scenario: 'Market Analysis',
      goal: 'Analyze investment value of a residential community',
      requirements: 'Focus on school district, transportation, and future development plans',
      locale: 'en'
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
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// HTTP请求工具
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const httpModule = isHttps ? https : require('http');
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      followRedirect: false // 我们要手动处理重定向以测试路由逻辑
    };

    if (options.data) {
      const postData = JSON.stringify(options.data);
      requestOptions.headers['Content-Type'] = 'application/json';
      requestOptions.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = httpModule.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            headers: res.headers,
            data: data.length > 0 && data.startsWith('{') ? JSON.parse(data) : data
          };
          resolve(result);
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    
    if (options.data) {
      req.write(JSON.stringify(options.data));
    }
    
    req.end();
  });
}

// 测试路由重定向
async function testRoutingRedirects(baseUrl) {
  console.log(`${colors.blue}[1/5] 测试路由重定向功能...${colors.reset}`);
  const results = [];

  // 测试根路径重定向
  console.log('\n测试根路径重定向:');
  try {
    const response = await makeRequest(`${baseUrl}/`);
    const isRedirect = response.status >= 300 && response.status < 400;
    const location = response.headers.location;
    
    if (isRedirect && location) {
      const redirectLocale = location.includes('/cn/') ? 'cn' : (location.includes('/en/') ? 'en' : 'unknown');
      console.log(`${colors.green}✅ 根路径重定向正常${colors.reset}`);
      console.log(`   - 状态码: ${response.status}`);
      console.log(`   - 重定向到: ${location}`);
      console.log(`   - 检测语言: ${redirectLocale}`);
      results.push({ test: '根路径重定向', success: true, locale: redirectLocale });
    } else {
      console.log(`${colors.red}❌ 根路径重定向失败${colors.reset}`);
      console.log(`   - 状态码: ${response.status}`);
      results.push({ test: '根路径重定向', success: false });
    }
  } catch (error) {
    console.log(`${colors.red}❌ 根路径测试失败: ${error.message}${colors.reset}`);
    results.push({ test: '根路径重定向', success: false, error: error.message });
  }

  // 测试各语言首页访问
  console.log('\n测试各语言首页访问:');
  for (const locale of LOCALES) {
    try {
      const response = await makeRequest(`${baseUrl}/${locale}/`);
      const isSuccess = response.status === 200;
      
      if (isSuccess) {
        console.log(`${colors.green}✅ ${locale.toUpperCase()} 首页访问正常${colors.reset}`);
        console.log(`   - 路径: /${locale}/`);
        console.log(`   - 状态码: ${response.status}`);
        results.push({ test: `${locale}首页访问`, success: true });
      } else {
        console.log(`${colors.red}❌ ${locale.toUpperCase()} 首页访问失败${colors.reset}`);
        console.log(`   - 状态码: ${response.status}`);
        results.push({ test: `${locale}首页访问`, success: false });
      }
    } catch (error) {
      console.log(`${colors.red}❌ ${locale.toUpperCase()} 首页测试失败: ${error.message}${colors.reset}`);
      results.push({ test: `${locale}首页访问`, success: false, error: error.message });
    }
  }

  return results;
}

// 测试行业页面多语言访问
async function testIndustryPages(baseUrl) {
  console.log(`\n${colors.blue}[2/5] 测试行业页面多语言访问...${colors.reset}`);
  const results = [];

  for (const industry of INDUSTRIES) {
    console.log(`\n测试行业: ${colors.yellow}${industry}${colors.reset}`);
    
    for (const locale of LOCALES) {
      const url = `${baseUrl}/${locale}/${industry}/`;
      try {
        const response = await makeRequest(url);
        const isSuccess = response.status === 200;
        
        if (isSuccess) {
          console.log(`  ${colors.green}✅ ${locale.toUpperCase()}: 访问正常${colors.reset}`);
          results.push({ 
            test: `${industry}-${locale}`, 
            success: true,
            url: `/${locale}/${industry}/`
          });
        } else {
          console.log(`  ${colors.red}❌ ${locale.toUpperCase()}: 访问失败 (${response.status})${colors.reset}`);
          results.push({ 
            test: `${industry}-${locale}`, 
            success: false, 
            status: response.status 
          });
        }
      } catch (error) {
        console.log(`  ${colors.red}❌ ${locale.toUpperCase()}: 请求失败 (${error.message})${colors.reset}`);
        results.push({ 
          test: `${industry}-${locale}`, 
          success: false, 
          error: error.message 
        });
      }
    }
  }

  return results;
}

// 测试API多语言支持
async function testMultilingualAPI(baseUrl) {
  console.log(`\n${colors.blue}[3/5] 测试API多语言支持...${colors.reset}`);
  const results = [];

  for (const testCase of I18N_TEST_CASES) {
    console.log(`\n测试: ${colors.yellow}${testCase.name}${colors.reset}`);
    const startTime = Date.now();
    
    try {
      const response = await makeRequest(
        `${baseUrl}/api/generate-prompt`,
        {
          method: 'POST',
          data: testCase.data
        }
      );
      
      const duration = Date.now() - startTime;
      
      if (response.status === 200 && response.data.success) {
        const prompt = response.data.prompt;
        const wordCount = prompt ? prompt.length : 0;
        const source = response.data.source || 'unknown';
        
        console.log(`${colors.green}✅ API调用成功${colors.reset}`);
        console.log(`   - 响应时间: ${duration}ms`);
        console.log(`   - 数据来源: ${source}`);
        console.log(`   - 字数: ${wordCount}`);
        console.log(`   - 语言: ${testCase.locale}`);
        
        // 语言相关的内容检查
        const languageChecks = {
          hasContent: wordCount > 100,
          correctLanguage: testCase.locale === 'cn' ? 
            /[\u4e00-\u9fff]/.test(prompt) : // 包含中文字符
            /[a-zA-Z]/.test(prompt) && !/[\u4e00-\u9fff]/.test(prompt.substring(0, 200)), // 主要是英文
          isStructured: prompt.includes('1.') || prompt.includes('**') || prompt.includes('步骤') || prompt.includes('Step')
        };
        
        console.log(`\n   语言检查:`);
        console.log(`   ${languageChecks.hasContent ? '✅' : '❌'} 内容充足`);
        console.log(`   ${languageChecks.correctLanguage ? '✅' : '❌'} 语言正确`);
        console.log(`   ${languageChecks.isStructured ? '✅' : '❌'} 结构化输出`);
        
        results.push({
          name: testCase.name,
          locale: testCase.locale,
          success: true,
          duration,
          wordCount,
          source,
          quality: Object.values(languageChecks).filter(v => v).length
        });
        
        // 显示内容预览
        const preview = prompt.substring(0, 150) + (prompt.length > 150 ? '...' : '');
        console.log(`   预览: ${preview}`);
        
      } else {
        console.log(`${colors.red}❌ API调用失败${colors.reset}`);
        console.log(`   - 状态码: ${response.status}`);
        console.log(`   - 错误: ${response.data.error || '未知错误'}`);
        results.push({
          name: testCase.name,
          locale: testCase.locale,
          success: false,
          error: response.data.error
        });
      }
    } catch (error) {
      console.log(`${colors.red}❌ 请求失败: ${error.message}${colors.reset}`);
      results.push({
        name: testCase.name,
        locale: testCase.locale,
        success: false,
        error: error.message
      });
    }
  }

  return results;
}

// 测试语言偏好保存机制
async function testLanguagePreference(baseUrl) {
  console.log(`\n${colors.blue}[4/5] 测试语言偏好保存机制...${colors.reset}`);
  const results = [];

  // 测试不同Accept-Language头
  const languageHeaders = [
    { header: 'zh-CN,zh;q=0.9,en;q=0.8', expected: 'cn', name: '中文浏览器' },
    { header: 'en-US,en;q=0.9', expected: 'en', name: '英文浏览器' },
    { header: 'fr-FR,fr;q=0.9,en;q=0.8', expected: 'en', name: '法语浏览器(回退到英文)' }
  ];

  for (const test of languageHeaders) {
    console.log(`\n测试: ${colors.yellow}${test.name}${colors.reset}`);
    
    try {
      const response = await makeRequest(`${baseUrl}/`, {
        headers: {
          'Accept-Language': test.header
        }
      });
      
      const isRedirect = response.status >= 300 && response.status < 400;
      const location = response.headers.location;
      
      if (isRedirect && location) {
        const detectedLocale = location.includes('/cn/') ? 'cn' : 'en';
        const isCorrect = detectedLocale === test.expected;
        
        if (isCorrect) {
          console.log(`${colors.green}✅ 语言检测正确${colors.reset}`);
          console.log(`   - Accept-Language: ${test.header}`);
          console.log(`   - 检测结果: ${detectedLocale}`);
          console.log(`   - 预期结果: ${test.expected}`);
          results.push({ test: test.name, success: true, detected: detectedLocale });
        } else {
          console.log(`${colors.red}❌ 语言检测错误${colors.reset}`);
          console.log(`   - 检测结果: ${detectedLocale}`);
          console.log(`   - 预期结果: ${test.expected}`);
          results.push({ test: test.name, success: false, detected: detectedLocale, expected: test.expected });
        }
      } else {
        console.log(`${colors.red}❌ 重定向失败${colors.reset}`);
        results.push({ test: test.name, success: false, error: '无重定向响应' });
      }
      
    } catch (error) {
      console.log(`${colors.red}❌ 测试失败: ${error.message}${colors.reset}`);
      results.push({ test: test.name, success: false, error: error.message });
    }
  }

  return results;
}

// 测试SEO和meta标签
async function testSEOInternationalization(baseUrl) {
  console.log(`\n${colors.blue}[5/5] 测试SEO国际化...${colors.reset}`);
  const results = [];

  const testPages = [
    { path: '/cn/', name: '中文首页' },
    { path: '/en/', name: '英文首页' },
    { path: '/cn/ai-prompts-for-lawyers/', name: '中文律师页' },
    { path: '/en/ai-prompts-for-lawyers/', name: '英文律师页' }
  ];

  for (const page of testPages) {
    console.log(`\n测试: ${colors.yellow}${page.name}${colors.reset}`);
    
    try {
      const response = await makeRequest(`${baseUrl}${page.path}`);
      
      if (response.status === 200 && typeof response.data === 'string') {
        const html = response.data;
        
        // 检查关键的SEO元素
        const seoChecks = {
          hasTitle: /<title[^>]*>(.+?)<\/title>/i.test(html),
          hasMetaDescription: /<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i.test(html),
          hasLangAttribute: /html[^>]*lang="([^"]*)"/.test(html),
          hasCanonical: /<link[^>]*rel="canonical"[^>]*href="([^"]*)"[^>]*>/i.test(html),
          hasAlternateLinks: /<link[^>]*rel="alternate"[^>]*hreflang="([^"]*)"[^>]*>/i.test(html)
        };
        
        // 提取语言信息
        const langMatch = html.match(/html[^>]*lang="([^"]*)"/);
        const currentLang = langMatch ? langMatch[1] : 'not found';
        
        console.log(`${colors.green}✅ 页面加载成功${colors.reset}`);
        console.log(`   - 页面语言: ${currentLang}`);
        console.log(`\n   SEO检查:`);
        console.log(`   ${seoChecks.hasTitle ? '✅' : '❌'} 页面标题`);
        console.log(`   ${seoChecks.hasMetaDescription ? '✅' : '❌'} Meta描述`);
        console.log(`   ${seoChecks.hasLangAttribute ? '✅' : '❌'} Lang属性`);
        console.log(`   ${seoChecks.hasCanonical ? '✅' : '❌'} Canonical链接`);
        console.log(`   ${seoChecks.hasAlternateLinks ? '✅' : '❌'} 备用语言链接`);
        
        results.push({
          page: page.name,
          path: page.path,
          success: true,
          lang: currentLang,
          seoScore: Object.values(seoChecks).filter(v => v).length
        });
        
      } else {
        console.log(`${colors.red}❌ 页面访问失败${colors.reset}`);
        console.log(`   - 状态码: ${response.status}`);
        results.push({
          page: page.name,
          path: page.path,
          success: false,
          status: response.status
        });
      }
    } catch (error) {
      console.log(`${colors.red}❌ 请求失败: ${error.message}${colors.reset}`);
      results.push({
        page: page.name,
        path: page.path,
        success: false,
        error: error.message
      });
    }
  }

  return results;
}

// 生成测试报告
function generateReport(testResults) {
  console.log(`\n${colors.cyan}==================================${colors.reset}`);
  console.log(`${colors.cyan}  国际化功能测试总结报告${colors.reset}`);
  console.log(`${colors.cyan}==================================${colors.reset}\n`);

  let overallSuccess = 0;
  let overallTotal = 0;

  // 汇总各部分测试结果
  Object.entries(testResults).forEach(([category, results]) => {
    console.log(`${colors.magenta}【${category}】${colors.reset}`);
    
    const categorySuccess = results.filter(r => r.success).length;
    const categoryTotal = results.length;
    const categoryRate = Math.round((categorySuccess / categoryTotal) * 100);
    
    console.log(`通过率: ${categorySuccess}/${categoryTotal} (${categoryRate}%)`);
    
    results.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      const color = result.success ? colors.green : colors.red;
      console.log(`${color}${icon} ${result.test || result.name || result.page}${colors.reset}`);
      
      if (!result.success && result.error) {
        console.log(`   错误: ${result.error}`);
      }
    });
    
    console.log('');
    overallSuccess += categorySuccess;
    overallTotal += categoryTotal;
  });

  // 总体评估
  const overallRate = Math.round((overallSuccess / overallTotal) * 100);
  
  console.log(`${colors.cyan}==================================${colors.reset}`);
  console.log(`${colors.cyan}总体测试结果: ${overallSuccess}/${overallTotal} (${overallRate}%)${colors.reset}`);
  
  if (overallRate === 100) {
    console.log(`${colors.green}🎉 所有国际化功能测试通过！系统完全支持多语言！${colors.reset}`);
  } else if (overallRate >= 90) {
    console.log(`${colors.green}✅ 国际化功能基本正常，少数问题需要修复${colors.reset}`);
  } else if (overallRate >= 75) {
    console.log(`${colors.yellow}⚠️ 国际化功能大部分正常，建议检查失败的测试${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ 国际化功能存在严重问题，需要立即修复${colors.reset}`);
  }
  
  console.log(`${colors.cyan}==================================${colors.reset}\n`);

  return {
    overallRate,
    overallSuccess,
    overallTotal,
    details: testResults
  };
}

// 主测试函数
async function runI18nTests() {
  const testUrl = BASE_URL;
  
  console.log(`${colors.cyan}==================================${colors.reset}`);
  console.log(`${colors.cyan}AI Prompt Generator 国际化功能测试${colors.reset}`);
  console.log(`${colors.cyan}==================================${colors.reset}\n`);
  console.log(`测试环境: ${colors.yellow}${testUrl}${colors.reset}`);
  console.log(`支持语言: ${colors.yellow}${LOCALES.join(', ')}${colors.reset}`);
  console.log(`测试行业: ${colors.yellow}${INDUSTRIES.length} 个行业页面${colors.reset}\n`);

  try {
    // 执行各项测试
    const routingResults = await testRoutingRedirects(testUrl);
    const industryResults = await testIndustryPages(testUrl);
    const apiResults = await testMultilingualAPI(testUrl);
    const preferenceResults = await testLanguagePreference(testUrl);
    const seoResults = await testSEOInternationalization(testUrl);

    // 生成报告
    const testResults = {
      '路由重定向测试': routingResults,
      '行业页面多语言测试': industryResults,
      'API多语言支持测试': apiResults,
      '语言偏好保存测试': preferenceResults,
      'SEO国际化测试': seoResults
    };

    const report = generateReport(testResults);
    
    // 返回测试结果供进一步处理
    return report;
    
  } catch (error) {
    console.error(`${colors.red}测试执行失败: ${error.message}${colors.reset}`);
    console.error(error.stack);
    return null;
  }
}

// 运行测试
if (require.main === module) {
  runI18nTests()
    .then(report => {
      if (report && report.overallRate < 75) {
        process.exit(1); // 测试失败率过高时退出码为1
      }
    })
    .catch(error => {
      console.error(`${colors.red}测试运行异常: ${error.message}${colors.reset}`);
      process.exit(1);
    });
}

module.exports = { runI18nTests };