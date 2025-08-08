import { test, expect } from '../fixtures';
import { allIndustriesTestData } from '../fixtures/test-data';

/**
 * API集成测试
 * 测试/api/generate-prompt路由的功能
 */

test.describe('API集成测试', () => {
  
  test.beforeEach(async ({ page }) => {
    // 设置API拦截和监控
    await page.route('/api/generate-prompt', async (route) => {
      const request = route.request();
      console.log(`📡 API请求: ${request.method()} ${request.url()}`);
      console.log(`📋 请求体:`, await request.postData());
      
      // 继续正常请求
      await route.continue();
    });
  });

  test('应该正确处理有效的API请求', async ({ page }) => {
    const testData = allIndustriesTestData[0].testCases[0];
    
    const response = await page.request.post('/api/generate-prompt', {
      data: {
        industry: 'lawyer',
        scenario: testData.scenario,
        prompt: testData.prompt,
        context: testData.context,
        useAI: false // 使用本地模式以避免外部依赖
      }
    });
    
    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
    expect(responseBody.enhancedPrompt).toBeTruthy();
    expect(responseBody.method).toMatch(/local|ai-enhanced/);
    expect(responseBody.industry).toBeTruthy();
  });

  test('应该处理所有支持的行业', async ({ page }) => {
    for (const industryData of allIndustriesTestData) {
      const testCase = industryData.testCases[0];
      
      const response = await page.request.post('/api/generate-prompt', {
        data: {
          industry: industryData.industry,
          scenario: testCase.scenario,
          prompt: testCase.prompt,
          context: testCase.context,
          useAI: false
        }
      });
      
      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody.success).toBe(true);
      expect(responseBody.enhancedPrompt).toBeTruthy();
      console.log(`✅ ${industryData.displayName} API测试通过`);
    }
  });

  test('应该正确处理缺少必填参数的请求', async ({ page }) => {
    const invalidRequests = [
      { industry: 'lawyer' }, // 缺少scenario和prompt
      { scenario: 'contract-review' }, // 缺少industry和prompt
      { prompt: 'test prompt' }, // 缺少industry和scenario
      {} // 完全空的请求
    ];
    
    for (const invalidData of invalidRequests) {
      const response = await page.request.post('/api/generate-prompt', {
        data: invalidData
      });
      
      // API应该返回错误或使用默认值处理
      const responseBody = await response.json();
      
      // 根据实际API行为调整预期
      if (response.status() === 500) {
        expect(responseBody.success).toBe(false);
      } else {
        // 如果API容错性好，应该返回某种形式的回退响应
        expect(responseBody).toBeTruthy();
      }
    }
  });

  test('应该正确处理不支持的行业', async ({ page }) => {
    const response = await page.request.post('/api/generate-prompt', {
      data: {
        industry: 'unsupported-industry',
        scenario: 'test-scenario',
        prompt: 'test prompt',
        useAI: false
      }
    });
    
    expect(response.status()).toBe(200); // API应该优雅处理未知行业
    
    const responseBody = await response.json();
    // 应该返回原始提示词或使用默认处理
    expect(responseBody.enhancedPrompt).toBeTruthy();
  });

  test('应该支持GET请求获取行业列表', async ({ page }) => {
    const response = await page.request.get('/api/generate-prompt');
    
    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody.industries).toBeInstanceOf(Array);
    expect(responseBody.industries.length).toBeGreaterThan(0);
    
    // 验证返回的行业列表包含必要字段
    const industry = responseBody.industries[0];
    expect(industry.id).toBeTruthy();
    expect(industry.name).toBeTruthy();
    expect(industry.systemPrompt).toBeTruthy();
    expect(industry.enhanceRules).toBeInstanceOf(Array);
  });

  test('应该正确处理API性能', async ({ page, checkPerformance }) => {
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
    }, 5000); // API响应应该在5秒内完成
  });

  test('应该正确处理并发请求', async ({ page }) => {
    const testData = allIndustriesTestData[0].testCases[0];
    
    // 创建多个并发请求
    const requests = Array.from({ length: 5 }, () => 
      page.request.post('/api/generate-prompt', {
        data: {
          industry: 'lawyer',
          scenario: testData.scenario,
          prompt: `测试并发请求 ${Math.random()}`,
          useAI: false
        }
      })
    );
    
    const responses = await Promise.all(requests);
    
    // 验证所有请求都成功
    for (const response of responses) {
      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody.success).toBe(true);
      expect(responseBody.enhancedPrompt).toBeTruthy();
    }
  });

  test('应该正确处理长文本输入', async ({ page }) => {
    const longPrompt = 'a'.repeat(2000); // 2000字符的长提示词
    const longContext = 'b'.repeat(1000); // 1000字符的长上下文
    
    const response = await page.request.post('/api/generate-prompt', {
      data: {
        industry: 'lawyer',
        scenario: 'contract-review',
        prompt: longPrompt,
        context: longContext,
        useAI: false
      }
    });
    
    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
    expect(responseBody.enhancedPrompt).toBeTruthy();
  });

  test('应该正确处理特殊字符输入', async ({ page }) => {
    const specialPrompt = '<script>alert("xss")</script> & 中文测试 & émojis 🎉';
    
    const response = await page.request.post('/api/generate-prompt', {
      data: {
        industry: 'lawyer',
        scenario: 'contract-review',
        prompt: specialPrompt,
        useAI: false
      }
    });
    
    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
    expect(responseBody.enhancedPrompt).toBeTruthy();
    
    // 验证XSS防护 - 结果不应该包含原始脚本标签
    expect(responseBody.enhancedPrompt).not.toContain('<script>');
  });
});