import { Page, expect } from '@playwright/test';
import { allIndustriesTestData } from '../fixtures/test-data';

/**
 * 测试工具函数集合
 * 提供通用的测试辅助功能
 */

/**
 * 等待元素消失
 */
export async function waitForElementToDisappear(page: Page, selector: string, timeout: number = 10000) {
  await expect(page.locator(selector)).toBeHidden({ timeout });
}

/**
 * 等待元素出现并可见
 */
export async function waitForElementToAppear(page: Page, selector: string, timeout: number = 10000) {
  await expect(page.locator(selector)).toBeVisible({ timeout });
}

/**
 * 滚动到元素
 */
export async function scrollToElement(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
}

/**
 * 等待网络空闲
 */
export async function waitForNetworkIdle(page: Page, timeout: number = 30000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * 模拟慢网络
 */
export async function simulateSlowNetwork(page: Page) {
  await page.route('**/*', async (route) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    await route.continue();
  });
}

/**
 * 清除所有路由拦截
 */
export async function clearRouteInterception(page: Page) {
  await page.unroute('**/*');
}

/**
 * 获取页面性能指标
 */
export async function getPerformanceMetrics(page: Page) {
  return await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    return {
      // 导航时间
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      
      // 绘制时间
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      
      // 内存信息（如果可用）
      memory: (performance as any).memory || null
    };
  });
}

/**
 * 等待指定时间
 */
export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 生成随机字符串
 */
export function generateRandomString(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成测试数据
 */
export function generateTestData() {
  return {
    scenario: 'contract-review',
    prompt: `测试提示词 ${generateRandomString(8)}`,
    context: `测试上下文 ${generateRandomString(6)}`,
    timestamp: Date.now()
  };
}

/**
 * 截图并保存（用于调试）
 */
export async function takeDebugScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `test-results/debug-screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  });
  console.log(`📸 调试截图已保存: ${name}-${timestamp}.png`);
}

/**
 * 检查页面是否有JavaScript错误
 */
export function setupErrorTracking(page: Page): string[] {
  const errors: string[] = [];
  
  page.on('pageerror', (error) => {
    errors.push(error.message);
    console.error('🔴 页面错误:', error.message);
  });
  
  page.on('requestfailed', (request) => {
    errors.push(`请求失败: ${request.url()}`);
    console.error('🔴 请求失败:', request.url());
  });
  
  return errors;
}

/**
 * 验证页面可访问性
 */
export async function checkAccessibility(page: Page) {
  // 检查必要的可访问性属性
  const checks = [
    // 图片应该有alt属性
    { selector: 'img', attribute: 'alt', description: '图片alt属性' },
    // 表单控件应该有label
    { selector: 'input[type="text"], input[type="email"], textarea', attribute: 'aria-label,id', description: '表单控件标签' },
    // 按钮应该有可读文本
    { selector: 'button', text: true, description: '按钮文本' }
  ];
  
  const issues: string[] = [];
  
  for (const check of checks) {
    const elements = await page.locator(check.selector).all();
    
    for (const element of elements) {
      if (check.text) {
        const text = await element.textContent();
        if (!text || text.trim().length === 0) {
          issues.push(`${check.description}: 元素缺少文本内容`);
        }
      } else if (check.attribute) {
        const attributes = check.attribute.split(',');
        let hasAttribute = false;
        
        for (const attr of attributes) {
          if (await element.getAttribute(attr.trim())) {
            hasAttribute = true;
            break;
          }
        }
        
        if (!hasAttribute) {
          issues.push(`${check.description}: 元素缺少必要属性 (${check.attribute})`);
        }
      }
    }
  }
  
  return issues;
}

/**
 * 模拟不同的设备和网络条件
 */
export async function simulateDevice(page: Page, deviceType: 'mobile' | 'tablet' | 'desktop') {
  const devices = {
    mobile: { width: 375, height: 667, userAgent: 'Mobile' },
    tablet: { width: 768, height: 1024, userAgent: 'Tablet' },
    desktop: { width: 1920, height: 1080, userAgent: 'Desktop' }
  };
  
  const device = devices[deviceType];
  await page.setViewportSize({ width: device.width, height: device.height });
}

/**
 * 验证表单验证消息
 */
export async function checkFormValidation(page: Page, fieldSelector: string, expectedMessage?: string) {
  // 尝试提交表单或触发验证
  await page.locator(fieldSelector).focus();
  await page.locator(fieldSelector).blur();
  
  if (expectedMessage) {
    await expect(page.locator(`text=${expectedMessage}`)).toBeVisible();
  }
}

/**
 * 监控网络请求
 */
export function setupNetworkMonitoring(page: Page) {
  const requests: Array<{
    url: string;
    method: string;
    status: number;
    timing: number;
  }> = [];
  
  page.on('request', (request) => {
    console.log(`📤 请求: ${request.method()} ${request.url()}`);
  });
  
  page.on('response', (response) => {
    const request = response.request();
    console.log(`📥 响应: ${response.status()} ${request.url()}`);
    
    requests.push({
      url: request.url(),
      method: request.method(),
      status: response.status(),
      timing: 0 // 实际项目中可以计算时间差
    });
  });
  
  return requests;
}

/**
 * 清理测试数据
 */
export async function cleanupTestData(page: Page) {
  // 清理localStorage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  // 清理cookies
  const context = page.context();
  await context.clearCookies();
}

/**
 * 等待API调用完成
 */
export async function waitForApiCall(page: Page, apiEndpoint: string, timeout: number = 10000) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`API调用超时: ${apiEndpoint}`));
    }, timeout);
    
    page.on('response', (response) => {
      if (response.url().includes(apiEndpoint)) {
        clearTimeout(timeoutId);
        resolve(response);
      }
    });
  });
}

/**
 * 批量验证元素
 */
export async function verifyElementsExist(page: Page, selectors: string[]) {
  for (const selector of selectors) {
    await expect(page.locator(selector)).toBeVisible();
  }
}

/**
 * 获取随机测试用例
 */
export function getRandomTestCase() {
  const randomIndustry = allIndustriesTestData[Math.floor(Math.random() * allIndustriesTestData.length)];
  const randomTestCase = randomIndustry.testCases[Math.floor(Math.random() * randomIndustry.testCases.length)];
  
  return {
    industry: randomIndustry,
    testCase: randomTestCase
  };
}