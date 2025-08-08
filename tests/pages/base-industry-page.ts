import { Page, Locator, expect } from '@playwright/test';

/**
 * 基础行业页面类
 * 包含所有行业页面的通用功能和元素
 */
export class BaseIndustryPage {
  readonly page: Page;
  
  // 页面元素定位器
  readonly header: Locator;
  readonly industryIcon: Locator;
  readonly breadcrumb: Locator;
  readonly form: Locator;
  readonly scenarioSelect: Locator;
  readonly promptTextarea: Locator;
  readonly contextTextarea: Locator;
  readonly wordCount: Locator;
  readonly exampleCards: Locator;
  readonly submitButton: Locator;
  readonly saveDraftButton: Locator;
  readonly loadDraftButton: Locator;
  readonly resultSection: Locator;
  readonly loadingSpinner: Locator;
  readonly errorMessage: Locator;
  readonly copyButton: Locator;
  readonly clearButton: Locator;
  readonly regenerateButton: Locator;
  readonly successMetrics: Locator;
  
  constructor(page: Page) {
    this.page = page;
    
    // 页面标题和导航
    this.header = page.locator('h1');
    this.industryIcon = page.locator('.gradient-lawyer, .gradient-accountant, .gradient-teacher, .gradient-insurance, .gradient-realtor').first();
    this.breadcrumb = page.locator('nav');
    
    // 表单元素
    this.form = page.locator('form');
    this.scenarioSelect = page.locator('#scenario');
    this.promptTextarea = page.locator('#requirements');
    this.contextTextarea = page.locator('#context');
    this.wordCount = page.locator('text=/\\d+ characters/');
    
    // 示例卡片
    this.exampleCards = page.locator('[data-testid="example-card"], .cursor-pointer:has(.text-sm.font-medium)');
    
    // 操作按钮
    this.submitButton = page.locator('button[type="submit"]');
    this.saveDraftButton = page.locator('button:has-text("Save Draft"), button:has-text("保存草稿")');
    this.loadDraftButton = page.locator('button:has-text("Load Draft"), button:has-text("加载草稿")');
    
    // 结果区域
    this.resultSection = page.locator('[data-testid="prompt-result"]').or(page.locator('.border.rounded-lg').last());
    this.loadingSpinner = page.locator('button:has-text("生成中..."), button:has-text("Generating...")');
    this.errorMessage = page.locator('.text-red-500, .text-destructive');
    this.copyButton = page.locator('button:has-text("Copy"), button:has-text("复制")');
    this.clearButton = page.locator('button:has-text("Clear"), button:has-text("清除")');
    this.regenerateButton = page.locator('button:has-text("Regenerate"), button:has-text("重新生成")');
    
    // 成功指标
    this.successMetrics = page.locator('.grid.grid-cols-2.gap-4.sm\\:grid-cols-4');
  }
  
  /**
   * 导航到指定的行业页面
   */
  async goto(route: string) {
    await this.page.goto(route);
    await this.page.waitForLoadState('networkidle');
  }
  
  /**
   * 验证页面基本元素是否存在
   */
  async verifyPageElements() {
    await expect(this.header).toBeVisible();
    await expect(this.form).toBeVisible();
    await expect(this.scenarioSelect).toBeVisible();
    await expect(this.promptTextarea).toBeVisible();
    await expect(this.contextTextarea).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }
  
  /**
   * 填写表单
   */
  async fillForm(data: {
    scenario: string;
    prompt: string;
    context?: string;
  }) {
    // 选择场景
    await this.scenarioSelect.selectOption(data.scenario);
    
    // 填写需求描述
    await this.promptTextarea.fill(data.prompt);
    
    // 填写额外信息
    if (data.context) {
      await this.contextTextarea.fill(data.context);
    }
    
    // 验证表单已填写
    await expect(this.scenarioSelect).toHaveValue(data.scenario);
    await expect(this.promptTextarea).toHaveValue(data.prompt);
    if (data.context) {
      await expect(this.contextTextarea).toHaveValue(data.context);
    }
  }
  
  /**
   * 提交表单
   */
  async submitForm() {
    await this.submitButton.click();
  }
  
  /**
   * 等待结果生成
   */
  async waitForResult(timeout: number = 30000) {
    // 等待提交按钮变为加载状态
    await expect(this.loadingSpinner).toBeVisible({ timeout: 5000 });
    
    // 等待加载完成
    await expect(this.loadingSpinner).toBeHidden({ timeout });
    
    // 等待结果显示
    await expect(this.resultSection).toBeVisible({ timeout: 5000 });
  }
  
  /**
   * 验证结果内容
   */
  async verifyResult(expectedKeywords: string[]) {
    await expect(this.resultSection).toBeVisible();
    
    const resultText = await this.resultSection.textContent();
    expect(resultText).toBeTruthy();
    
    // 检查是否包含预期关键词
    for (const keyword of expectedKeywords) {
      expect(resultText!.toLowerCase()).toContain(keyword.toLowerCase());
    }
  }
  
  /**
   * 点击示例卡片
   */
  async clickExample(index: number = 0) {
    await this.exampleCards.nth(index).click();
  }
  
  /**
   * 验证示例是否自动填入表单
   */
  async verifyExampleFilled() {
    // 验证场景已选择
    await expect(this.scenarioSelect).not.toHaveValue('');
    
    // 验证需求描述已填写
    await expect(this.promptTextarea).not.toHaveValue('');
  }
  
  /**
   * 复制结果
   */
  async copyResult() {
    await this.copyButton.click();
  }
  
  /**
   * 清除结果
   */
  async clearResult() {
    await this.clearButton.click();
    await expect(this.resultSection).toBeHidden();
  }
  
  /**
   * 重新生成
   */
  async regenerateResult() {
    await this.regenerateButton.click();
    await this.waitForResult();
  }
  
  /**
   * 保存草稿
   */
  async saveDraft() {
    await this.saveDraftButton.click();
    // 这里可以添加保存成功的验证逻辑
  }
  
  /**
   * 加载草稿
   */
  async loadDraft() {
    await this.loadDraftButton.click();
    // 这里可以添加加载成功的验证逻辑
  }
  
  /**
   * 验证字数统计
   */
  async verifyWordCount() {
    const prompt = await this.promptTextarea.inputValue();
    const expectedCount = prompt.length;
    
    await expect(this.wordCount).toContainText(expectedCount.toString());
  }
  
  /**
   * 验证表单验证
   */
  async verifyFormValidation() {
    // 清空必填字段
    await this.scenarioSelect.selectOption('');
    await this.promptTextarea.fill('');
    
    // 尝试提交
    await this.submitButton.click();
    
    // 验证按钮是否被禁用或显示验证错误
    await expect(this.submitButton).toBeDisabled();
  }
  
  /**
   * 验证性能指标显示
   */
  async verifySuccessMetrics() {
    await expect(this.successMetrics).toBeVisible();
    
    // 验证指标卡片数量
    const metricCards = this.successMetrics.locator('> *');
    await expect(metricCards).toHaveCount(4);
  }
  
  /**
   * 获取页面标题
   */
  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }
  
  /**
   * 获取页面URL
   */
  getPageUrl(): string {
    return this.page.url();
  }
  
  /**
   * 截图用于调试
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}.png`,
      fullPage: true 
    });
  }
}