import { test, expect } from '../fixtures';
import { allIndustriesTestData, commonTestData } from '../fixtures/test-data';
import { createIndustryPage } from '../pages';

/**
 * 性能基准测试
 * 测试页面加载时间、API响应时间、用户交互响应等性能指标
 */

test.describe('性能基准测试', () => {
  
  test('页面加载性能测试', async ({ page, checkPerformance }) => {
    for (const industryData of allIndustriesTestData) {
      await test.step(`测试${industryData.displayName}页面加载性能`, async () => {
        await checkPerformance(async () => {
          const industryPage = createIndustryPage(industryData.industry, page);
          await industryPage.goto(industryData.route);
          
          // 等待页面完全加载
          await industryPage.verifyPageElements();
        }, commonTestData.performanceThresholds.pageLoadTime);
      });
    }
  });

  test('API响应性能测试', async ({ page, checkPerformance }) => {
    const testData = allIndustriesTestData[0].testCases[0];
    
    await checkPerformance(async () => {
      const response = await page.request.post('/api/generate-prompt', {
        data: {
          industry: 'lawyer',
          scenario: testData.scenario,
          prompt: testData.prompt,
          context: testData.context,
          useAI: false
        }
      });
      
      expect(response.status()).toBe(200);
    }, commonTestData.performanceThresholds.apiResponseTime);
  });

  test('表单提交端到端性能测试', async ({ page, checkPerformance }) => {
    const industryPage = createIndustryPage('lawyer', page);
    await industryPage.goto('/ai-prompts-for-lawyers');
    
    await checkPerformance(async () => {
      // 填写表单
      await industryPage.fillForm({
        scenario: 'contract-review',
        prompt: '测试性能的提示词内容',
        context: '这是测试用的上下文信息'
      });
      
      // 提交表单并等待结果
      await industryPage.submitForm();
      await industryPage.waitForResult();
    }, commonTestData.performanceThresholds.formSubmitTime);
  });

  test('页面资源加载性能测试', async ({ page }) => {
    // 监控网络请求
    const requests: Array<{url: string, duration: number, size: number}> = [];
    
    page.on('response', async (response) => {
      const request = response.request();
      const timing = await response.serverAddr();
      
      requests.push({
        url: request.url(),
        duration: 0, // Playwright不直接提供请求时长
        size: (await response.body()).length
      });
    });
    
    // 访问律师页面
    const industryPage = createIndustryPage('lawyer', page);
    await industryPage.goto('/ai-prompts-for-lawyers');
    
    // 等待所有资源加载完成
    await page.waitForLoadState('networkidle');
    
    // 分析加载的资源
    const totalSize = requests.reduce((sum, req) => sum + req.size, 0);
    const jsRequests = requests.filter(req => req.url.includes('.js'));
    const cssRequests = requests.filter(req => req.url.includes('.css'));
    const imageRequests = requests.filter(req => req.url.match(/\.(png|jpg|jpeg|gif|svg)$/i));
    
    console.log(`📊 页面资源统计:`);
    console.log(`- 总请求数: ${requests.length}`);
    console.log(`- 总大小: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`- JS文件: ${jsRequests.length}`);
    console.log(`- CSS文件: ${cssRequests.length}`);
    console.log(`- 图片文件: ${imageRequests.length}`);
    
    // 性能断言
    expect(requests.length).toBeLessThan(50); // 请求数量不应过多
    expect(totalSize).toBeLessThan(5 * 1024 * 1024); // 总大小不应超过5MB
  });

  test('大量数据处理性能测试', async ({ page, checkPerformance }) => {
    const industryPage = createIndustryPage('lawyer', page);
    await industryPage.goto('/ai-prompts-for-lawyers');
    
    // 测试大量文本输入的处理性能
    const largePrompt = '这是一个很长的提示词。'.repeat(200); // 约2000字符
    const largeContext = '这是很长的上下文信息。'.repeat(100); // 约1000字符
    
    await checkPerformance(async () => {
      await industryPage.fillForm({
        scenario: 'contract-review',
        prompt: largePrompt,
        context: largeContext
      });
      
      await industryPage.submitForm();
      await industryPage.waitForResult();
    }, commonTestData.performanceThresholds.formSubmitTime * 1.5); // 大数据允许更长时间
  });

  test('并发用户模拟测试', async ({ browser }) => {
    // 创建多个浏览器上下文模拟并发用户
    const concurrentUsers = 3;
    const contexts = await Promise.all(
      Array.from({ length: concurrentUsers }, () => browser.newContext())
    );
    
    try {
      const startTime = Date.now();
      
      // 同时执行多个用户操作
      const userActions = contexts.map(async (context, index) => {
        const page = await context.newPage();
        const industryPage = createIndustryPage('lawyer', page);
        
        await industryPage.goto('/ai-prompts-for-lawyers');
        
        await industryPage.fillForm({
          scenario: 'contract-review',
          prompt: `用户${index + 1}的测试提示词`,
          context: `用户${index + 1}的测试上下文`
        });
        
        await industryPage.submitForm();
        await industryPage.waitForResult();
        
        return `用户${index + 1}完成`;
      });
      
      const results = await Promise.all(userActions);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      console.log(`🔄 并发测试结果:`);
      console.log(`- 并发用户数: ${concurrentUsers}`);
      console.log(`- 总耗时: ${totalTime}ms`);
      console.log(`- 平均每用户耗时: ${(totalTime / concurrentUsers).toFixed(0)}ms`);
      
      results.forEach(result => console.log(`- ${result}`));
      
      // 性能断言：并发操作不应该显著影响性能
      expect(totalTime).toBeLessThan(30000); // 30秒内完成
      expect(results.length).toBe(concurrentUsers);
    } finally {
      // 清理资源
      await Promise.all(contexts.map(context => context.close()));
    }
  });

  test('内存使用监控测试', async ({ page }) => {
    // 访问页面
    const industryPage = createIndustryPage('lawyer', page);
    await industryPage.goto('/ai-prompts-for-lawyers');
    
    // 获取初始内存使用情况
    const initialMetrics = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory;
      }
      return null;
    });
    
    if (initialMetrics) {
      console.log(`📈 初始内存使用: ${(initialMetrics.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    }
    
    // 执行多次表单操作
    for (let i = 0; i < 5; i++) {
      await industryPage.fillForm({
        scenario: 'contract-review',
        prompt: `第${i + 1}次测试的提示词内容`,
        context: `第${i + 1}次测试的上下文信息`
      });
      
      await industryPage.submitForm();
      await industryPage.waitForResult();
      await industryPage.clearResult();
    }
    
    // 获取最终内存使用情况
    const finalMetrics = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory;
      }
      return null;
    });
    
    if (finalMetrics && initialMetrics) {
      const memoryIncrease = (finalMetrics.usedJSHeapSize - initialMetrics.usedJSHeapSize) / 1024 / 1024;
      console.log(`📈 最终内存使用: ${(finalMetrics.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`📊 内存增长: ${memoryIncrease.toFixed(2)} MB`);
      
      // 内存增长不应该过大
      expect(memoryIncrease).toBeLessThan(50); // 不应该超过50MB
    }
  });

  test('移动端性能测试', async ({ page, checkPerformance }) => {
    // 设置移动端视窗
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 模拟移动网络条件
    await page.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms延迟
      await route.continue();
    });
    
    await checkPerformance(async () => {
      const industryPage = createIndustryPage('lawyer', page);
      await industryPage.goto('/ai-prompts-for-lawyers');
      
      await industryPage.verifyPageElements();
      
      // 测试移动端表单交互
      await industryPage.fillForm({
        scenario: 'contract-review',
        prompt: '移动端测试提示词',
        context: '移动端测试上下文'
      });
      
      await industryPage.submitForm();
      await industryPage.waitForResult();
    }, commonTestData.performanceThresholds.formSubmitTime * 2); // 移动端允许更长时间
  });
});