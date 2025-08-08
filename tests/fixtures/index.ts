import { test as base, expect } from '@playwright/test';
import { allIndustriesTestData, commonTestData, IndustryTestData } from './test-data';

/**
 * 自定义测试fixtures
 * 为测试提供统一的数据和工具方法
 */

export interface TestFixtures {
  // 测试数据
  industryData: IndustryTestData;
  commonData: typeof commonTestData;
  
  // 工具方法
  fillForm: (data: { scenario: string; prompt: string; context?: string }) => Promise<void>;
  waitForResult: () => Promise<void>;
  checkPerformance: (action: () => Promise<void>, threshold: number) => Promise<void>;
}

export const test = base.extend<TestFixtures>({
  // 行业数据fixture
  industryData: async ({ page }, use, testInfo) => {
    const testPath = testInfo.file;
    let industryData = allIndustriesTestData[0]; // 默认使用律师数据
    
    // 根据测试文件路径确定行业数据
    if (testPath.includes('lawyer')) {
      industryData = allIndustriesTestData.find(d => d.industry === 'lawyer')!;
    } else if (testPath.includes('accountant')) {
      industryData = allIndustriesTestData.find(d => d.industry === 'accountant')!;
    } else if (testPath.includes('teacher')) {
      industryData = allIndustriesTestData.find(d => d.industry === 'teacher')!;
    } else if (testPath.includes('insurance')) {
      industryData = allIndustriesTestData.find(d => d.industry === 'insurance')!;
    } else if (testPath.includes('realtor')) {
      industryData = allIndustriesTestData.find(d => d.industry === 'realtor')!;
    }
    
    await use(industryData);
  },
  
  // 通用数据fixture
  commonData: async ({}, use) => {
    await use(commonTestData);
  },
  
  // 表单填写工具
  fillForm: async ({ page }, use) => {
    const fillFormFn = async (data: { scenario: string; prompt: string; context?: string }) => {
      // 选择场景
      await page.selectOption('#scenario', data.scenario);
      
      // 填写需求描述
      await page.fill('#requirements', data.prompt);
      
      // 填写额外信息（可选）
      if (data.context) {
        await page.fill('#context', data.context);
      }
    };
    
    await use(fillFormFn);
  },
  
  // 等待结果工具
  waitForResult: async ({ page }, use) => {
    const waitForResultFn = async () => {
      // 等待加载状态消失
      await page.waitForSelector('button:has-text("生成中...")', { state: 'detached' });
      
      // 等待结果显示
      await page.waitForSelector('[data-testid="prompt-result"]', { state: 'visible' });
    };
    
    await use(waitForResultFn);
  },
  
  // 性能检查工具
  checkPerformance: async ({}, use) => {
    const checkPerformanceFn = async (action: () => Promise<void>, threshold: number) => {
      const startTime = Date.now();
      await action();
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(threshold);
      console.log(`⏱️ 性能检查: ${duration}ms (阈值: ${threshold}ms)`);
    };
    
    await use(checkPerformanceFn);
  }
});

export { expect } from '@playwright/test';