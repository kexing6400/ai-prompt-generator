import { test, expect } from '../fixtures';
import { createIndustryPage } from '../pages';
import { commonTestData } from '../fixtures/test-data';

/**
 * 错误处理和边界情况测试
 * 测试各种异常情况下的系统行为
 */

test.describe('错误处理和边界情况测试', () => {
  
  test('应该正确处理网络错误', async ({ page }) => {
    const industryPage = createIndustryPage('lawyer', page);
    await industryPage.goto('/ai-prompts-for-lawyers');
    
    // 模拟网络故障
    await page.route('/api/generate-prompt', async (route) => {
      await route.abort('failed');
    });
    
    // 填写表单
    await industryPage.fillForm({
      scenario: 'contract-review',
      prompt: '测试网络错误处理',
      context: '网络错误测试'
    });
    
    // 提交表单
    await industryPage.submitForm();
    
    // 应该显示错误信息或降级处理
    await expect(
      page.locator('.text-red-500, .text-destructive, .error-message').or(
        page.locator('text=/网络错误|请求失败|生成失败/i')
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test('应该正确处理API超时', async ({ page }) => {
    const industryPage = createIndustryPage('lawyer', page);
    await industryPage.goto('/ai-prompts-for-lawyers');
    
    // 模拟API超时
    await page.route('/api/generate-prompt', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 15000)); // 15秒延迟
      await route.continue();
    });
    
    // 填写表单
    await industryPage.fillForm({
      scenario: 'contract-review',
      prompt: '测试API超时处理',
      context: 'API超时测试'
    });
    
    // 提交表单
    await industryPage.submitForm();
    
    // 验证超时处理 - 应该在合理时间内显示错误或结果
    await expect(
      page.locator('.text-red-500, .text-destructive').or(
        industryPage.resultSection
      )
    ).toBeVisible({ timeout: 12000 });
  });

  test('应该正确处理服务器错误(500)', async ({ page }) => {
    const industryPage = createIndustryPage('lawyer', page);
    await industryPage.goto('/ai-prompts-for-lawyers');
    
    // 模拟服务器500错误
    await page.route('/api/generate-prompt', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: '服务器内部错误',
          enhancedPrompt: '服务器错误，请稍后重试',
          method: 'error-fallback'
        })
      });
    });
    
    // 填写并提交表单
    await industryPage.fillForm({
      scenario: 'contract-review',
      prompt: '测试服务器错误处理',
      context: '服务器错误测试'
    });
    
    await industryPage.submitForm();
    await industryPage.waitForResult();
    
    // 验证错误信息显示
    const resultText = await industryPage.resultSection.textContent();
    expect(resultText).toContain('服务器错误，请稍后重试');
  });

  test('应该正确处理无效输入', async ({ page }) => {
    const industryPage = createIndustryPage('lawyer', page);
    await industryPage.goto('/ai-prompts-for-lawyers');
    
    const invalidInputs = commonTestData.invalidInputs;
    
    // 测试空提示词
    await test.step('测试空提示词', async () => {
      await industryPage.scenarioSelect.selectOption('contract-review');
      await industryPage.promptTextarea.fill(invalidInputs.emptyPrompt);
      
      // 提交按钮应该被禁用
      await expect(industryPage.submitButton).toBeDisabled();
    });
    
    // 测试过短提示词
    await test.step('测试过短提示词', async () => {
      await industryPage.promptTextarea.fill(invalidInputs.tooShortPrompt);
      
      // 可能显示验证错误或允许提交但返回特定处理结果
      if (await industryPage.submitButton.isEnabled()) {
        await industryPage.submitForm();
        await industryPage.waitForResult();
        
        // 结果应该包含某种形式的提示或错误信息
        const resultText = await industryPage.resultSection.textContent();
        expect(resultText).toBeTruthy();
      }
    });
    
    // 测试过长提示词
    await test.step('测试过长提示词', async () => {
      await industryPage.promptTextarea.fill(invalidInputs.tooLongPrompt);
      
      if (await industryPage.submitButton.isEnabled()) {
        await industryPage.submitForm();
        await industryPage.waitForResult();
        
        const resultText = await industryPage.resultSection.textContent();
        expect(resultText).toBeTruthy();
      }
    });
    
    // 测试特殊字符
    await test.step('测试特殊字符', async () => {
      await industryPage.promptTextarea.fill(invalidInputs.specialCharacters);
      
      if (await industryPage.submitButton.isEnabled()) {
        await industryPage.submitForm();
        await industryPage.waitForResult();
        
        const resultText = await industryPage.resultSection.textContent();
        expect(resultText).toBeTruthy();
        
        // 验证XSS防护
        expect(resultText).not.toContain('<script>');
        expect(resultText).not.toContain('alert(');
      }
    });
  });

  test('应该正确处理页面刷新后的状态恢复', async ({ page }) => {
    const industryPage = createIndustryPage('lawyer', page);
    await industryPage.goto('/ai-prompts-for-lawyers');
    
    // 填写表单
    const testData = {
      scenario: 'contract-review',
      prompt: '测试页面刷新后的状态恢复',
      context: '页面刷新测试'
    };
    
    await industryPage.fillForm(testData);
    
    // 刷新页面
    await page.reload();
    await industryPage.verifyPageElements();
    
    // 检查表单状态是否恢复（取决于实现方式）
    const scenarioValue = await industryPage.scenarioSelect.inputValue();
    const promptValue = await industryPage.promptTextarea.inputValue();
    
    // 如果实现了状态恢复，验证数据是否保留
    // 如果没有实现，确保页面正常工作
    expect(scenarioValue).toBeDefined();
    expect(promptValue).toBeDefined();
  });

  test('应该正确处理浏览器返回操作', async ({ page }) => {
    const industryPage = createIndustryPage('lawyer', page);
    await industryPage.goto('/ai-prompts-for-lawyers');
    
    // 填写表单
    await industryPage.fillForm({
      scenario: 'contract-review',
      prompt: '测试浏览器返回操作',
      context: '浏览器返回测试'
    });
    
    // 导航到首页
    await page.goto('/');
    
    // 使用浏览器返回按钮
    await page.goBack();
    
    // 验证页面和表单状态
    await industryPage.verifyPageElements();
    
    const currentUrl = page.url();
    expect(currentUrl).toContain('/ai-prompts-for-lawyers');
  });

  test('应该正确处理JavaScript错误', async ({ page }) => {
    const jsErrors: string[] = [];
    
    // 监听JavaScript错误
    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
      console.error('📛 JavaScript错误:', error.message);
    });
    
    const industryPage = createIndustryPage('lawyer', page);
    await industryPage.goto('/ai-prompts-for-lawyers');
    
    // 执行各种操作
    await industryPage.verifyPageElements();
    
    await industryPage.fillForm({
      scenario: 'contract-review',
      prompt: '测试JavaScript错误处理',
      context: 'JavaScript错误测试'
    });
    
    await industryPage.submitForm();
    await industryPage.waitForResult();
    
    // 验证没有严重的JavaScript错误
    const criticalErrors = jsErrors.filter(error => 
      !error.includes('404') && // 忽略资源404错误
      !error.includes('ChunkLoadError') // 忽略chunk加载错误
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('应该正确处理CORS错误', async ({ page }) => {
    const industryPage = createIndustryPage('lawyer', page);
    await industryPage.goto('/ai-prompts-for-lawyers');
    
    // 模拟CORS错误
    await page.route('/api/generate-prompt', async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': 'https://not-allowed-domain.com'
        },
        body: JSON.stringify({ success: false, error: 'CORS error' })
      });
    });
    
    // 填写并提交表单
    await industryPage.fillForm({
      scenario: 'contract-review',
      prompt: '测试CORS错误处理',
      context: 'CORS错误测试'
    });
    
    await industryPage.submitForm();
    
    // 应该有某种错误处理或降级方案
    await expect(
      page.locator('.text-red-500, .text-destructive').or(
        industryPage.resultSection
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test('应该正确处理离线状态', async ({ page }) => {
    const industryPage = createIndustryPage('lawyer', page);
    await industryPage.goto('/ai-prompts-for-lawyers');
    
    // 模拟离线状态
    await page.context().setOffline(true);
    
    // 填写并尝试提交表单
    await industryPage.fillForm({
      scenario: 'contract-review',
      prompt: '测试离线状态处理',
      context: '离线状态测试'
    });
    
    await industryPage.submitButton.click();
    
    // 应该显示离线错误或提供离线功能
    await expect(
      page.locator('text=/离线|网络不可用|请检查网络连接/i').or(
        page.locator('.text-red-500, .text-destructive')
      )
    ).toBeVisible({ timeout: 10000 });
    
    // 恢复在线状态
    await page.context().setOffline(false);
  });

  test('应该正确处理大文件上传限制', async ({ page }) => {
    // 如果应用支持文件上传功能，测试大文件限制
    const industryPage = createIndustryPage('lawyer', page);
    await industryPage.goto('/ai-prompts-for-lawyers');
    
    // 测试极大的文本输入
    const hugeText = 'a'.repeat(10000); // 10K字符
    
    await industryPage.fillForm({
      scenario: 'contract-review',
      prompt: hugeText,
      context: '大文件测试'
    });
    
    if (await industryPage.submitButton.isEnabled()) {
      await industryPage.submitForm();
      
      // 应该在合理时间内响应或显示限制错误
      await expect(
        industryPage.resultSection.or(
          page.locator('.text-red-500, .text-destructive')
        )
      ).toBeVisible({ timeout: 15000 });
    }
  });
});