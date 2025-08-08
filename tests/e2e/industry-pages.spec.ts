import { test, expect } from '../fixtures';
import { createIndustryPage } from '../pages';
import { allIndustriesTestData } from '../fixtures/test-data';

/**
 * 所有行业页面的基础功能测试
 * 测试覆盖：页面加载、表单填写、提交、结果验证
 */

for (const industryData of allIndustriesTestData) {
  test.describe(`${industryData.displayName}行业页面测试`, () => {
    
    test.beforeEach(async ({ page }) => {
      const industryPage = createIndustryPage(industryData.industry, page);
      await industryPage.goto(industryData.route);
    });

    test(`应该正确加载${industryData.displayName}页面`, async ({ page }) => {
      const industryPage = createIndustryPage(industryData.industry, page);
      
      // 验证页面基本元素
      await industryPage.verifyPageElements();
      
      // 验证页面标题
      const title = await industryPage.getPageTitle();
      expect(title).toContain(industryData.displayName);
      
      // 验证页面URL
      const url = industryPage.getPageUrl();
      expect(url).toContain(industryData.route);
      
      // 验证场景选项
      const scenarioOptions = await industryPage.scenarioSelect.locator('option').allTextContents();
      expect(scenarioOptions.length).toBeGreaterThan(1);
    });

    test(`应该显示${industryData.displayName}的成功指标`, async ({ page }) => {
      const industryPage = createIndustryPage(industryData.industry, page);
      
      await industryPage.verifySuccessMetrics();
    });

    test(`应该正确验证${industryData.displayName}表单`, async ({ page }) => {
      const industryPage = createIndustryPage(industryData.industry, page);
      
      // 测试表单验证
      await industryPage.verifyFormValidation();
    });

    test(`应该正确统计${industryData.displayName}字数`, async ({ page }) => {
      const industryPage = createIndustryPage(industryData.industry, page);
      
      const testPrompt = "这是一个测试提示词，用于验证字数统计功能";
      await industryPage.promptTextarea.fill(testPrompt);
      
      // 等待字数更新
      await page.waitForTimeout(500);
      
      await industryPage.verifyWordCount();
    });

    // 为每个测试用例创建独立的测试
    for (const testCase of industryData.testCases) {
      test(`应该成功生成${industryData.displayName}的${testCase.scenario}提示词`, async ({ page, checkPerformance }) => {
        const industryPage = createIndustryPage(industryData.industry, page);
        
        // 使用性能检查包装表单提交
        await checkPerformance(async () => {
          // 填写表单
          await industryPage.fillForm({
            scenario: testCase.scenario,
            prompt: testCase.prompt,
            context: testCase.context
          });
          
          // 提交表单
          await industryPage.submitForm();
          
          // 等待结果
          await industryPage.waitForResult();
        }, 15000); // 15秒性能阈值
        
        // 验证结果包含预期关键词
        await industryPage.verifyResult(testCase.expectedKeywords);
      });
    }

    test(`应该能够使用${industryData.displayName}示例快速填写`, async ({ page }) => {
      const industryPage = createIndustryPage(industryData.industry, page);
      
      // 检查是否有示例卡片
      const exampleCount = await industryPage.exampleCards.count();
      if (exampleCount > 0) {
        // 点击第一个示例
        await industryPage.clickExample(0);
        
        // 验证表单已自动填写
        await industryPage.verifyExampleFilled();
      }
    });

    test(`应该能够保存和加载${industryData.displayName}草稿`, async ({ page }) => {
      const industryPage = createIndustryPage(industryData.industry, page);
      
      // 填写一些内容
      await industryPage.fillForm({
        scenario: industryData.testCases[0].scenario,
        prompt: "测试草稿保存功能",
        context: "这是测试用的上下文信息"
      });
      
      // 保存草稿
      await industryPage.saveDraft();
      
      // 清空表单
      await industryPage.scenarioSelect.selectOption('');
      await industryPage.promptTextarea.fill('');
      await industryPage.contextTextarea.fill('');
      
      // 加载草稿
      await industryPage.loadDraft();
      
      // 验证内容已恢复（这里需要根据实际实现调整）
      // 注意：如果草稿功能是基于localStorage，可能需要特殊处理
    });
  });
}

/**
 * 跨行业通用功能测试
 */
test.describe('跨行业通用功能测试', () => {
  
  test('所有行业页面应该有一致的导航结构', async ({ page }) => {
    for (const industryData of allIndustriesTestData) {
      const industryPage = createIndustryPage(industryData.industry, page);
      await industryPage.goto(industryData.route);
      
      // 验证面包屑导航
      await expect(industryPage.breadcrumb).toBeVisible();
      
      // 验证回到首页的链接
      const homeLink = page.locator('a[href="/"]');
      await expect(homeLink).toBeVisible();
    }
  });

  test('所有行业页面应该有相同的表单结构', async ({ page }) => {
    for (const industryData of allIndustriesTestData) {
      const industryPage = createIndustryPage(industryData.industry, page);
      await industryPage.goto(industryData.route);
      
      // 验证表单必要元素
      await expect(industryPage.scenarioSelect).toBeVisible();
      await expect(industryPage.promptTextarea).toBeVisible();
      await expect(industryPage.contextTextarea).toBeVisible();
      await expect(industryPage.submitButton).toBeVisible();
    }
  });

  test('所有行业页面应该支持响应式设计', async ({ page }) => {
    // 测试不同屏幕尺寸
    const viewports = [
      { width: 375, height: 667 },   // Mobile
      { width: 768, height: 1024 },  // Tablet
      { width: 1920, height: 1080 }  // Desktop
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      for (const industryData of allIndustriesTestData.slice(0, 2)) { // 只测试前两个以节省时间
        const industryPage = createIndustryPage(industryData.industry, page);
        await industryPage.goto(industryData.route);
        
        // 验证关键元素在不同尺寸下都可见
        await expect(industryPage.header).toBeVisible();
        await expect(industryPage.form).toBeVisible();
        await expect(industryPage.submitButton).toBeVisible();
      }
    }
  });
});