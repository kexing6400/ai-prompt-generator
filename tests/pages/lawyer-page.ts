import { Page } from '@playwright/test';
import { BaseIndustryPage } from './base-industry-page';

/**
 * 律师行业页面对象
 * 继承基础页面类，添加律师行业特定的功能
 */
export class LawyerPage extends BaseIndustryPage {
  readonly templateCategories;
  
  constructor(page: Page) {
    super(page);
    
    // 律师页面特有的模板分类
    this.templateCategories = {
      contractReview: page.locator('text=Contract Review'),
      caseAnalysis: page.locator('text=Case Analysis'),
      legalResearch: page.locator('text=Legal Research'),
      documentDrafting: page.locator('text=Document Drafting')
    };
  }
  
  /**
   * 导航到律师页面
   */
  async goto() {
    await super.goto('/ai-prompts-for-lawyers');
  }
  
  /**
   * 验证律师页面特定元素
   */
  async verifyLawyerElements() {
    await this.verifyPageElements();
    
    // 验证律师页面标题包含相关关键词
    const title = await this.getPageTitle();
    expect(title).toMatch(/lawyer|法律|律师/i);
    
    // 验证模板分类存在
    await expect(this.templateCategories.contractReview).toBeVisible();
    await expect(this.templateCategories.caseAnalysis).toBeVisible();
    await expect(this.templateCategories.legalResearch).toBeVisible();
    await expect(this.templateCategories.documentDrafting).toBeVisible();
  }
  
  /**
   * 选择合同审查模板
   */
  async selectContractReviewTemplate() {
    await this.templateCategories.contractReview.click();
  }
  
  /**
   * 填写合同审查相关表单
   */
  async fillContractReviewForm() {
    await this.fillForm({
      scenario: 'contract-review',
      prompt: '请帮我分析这份商业合同的主要风险点，并提供相应的法律建议',
      context: '合同金额100万，涉及软件开发服务，合同期限2年'
    });
  }
  
  /**
   * 验证律师提示词结果的专业性
   */
  async verifyLawyerResult() {
    const legalKeywords = [
      '合同', '风险', '法律', '建议', '条款', 
      '责任', '违约', '争议', '解决', '法规'
    ];
    
    await this.verifyResult(legalKeywords);
  }
}