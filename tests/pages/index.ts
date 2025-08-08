import { Page } from '@playwright/test';
import { BaseIndustryPage } from './base-industry-page';
import { LawyerPage } from './lawyer-page';

/**
 * 页面对象工厂
 * 根据行业类型创建相应的页面对象
 */

export class AccountantPage extends BaseIndustryPage {
  constructor(page: Page) {
    super(page);
  }
  
  async goto() {
    await super.goto('/ai-prompts-for-accountants');
  }
  
  async fillFinancialAnalysisForm() {
    await this.fillForm({
      scenario: 'financial-analysis',
      prompt: '分析公司第三季度财务报表，识别关键财务指标的变化趋势',
      context: '制造业公司，营收5000万，员工200人'
    });
  }
}

export class TeacherPage extends BaseIndustryPage {
  constructor(page: Page) {
    super(page);
  }
  
  async goto() {
    await super.goto('/ai-prompts-for-teachers');
  }
  
  async fillLessonPlanForm() {
    await this.fillForm({
      scenario: 'lesson-planning',
      prompt: '设计一堂关于机器学习的入门课程，包括理论讲解和实践练习',
      context: '面向大学二年级学生，课程时长90分钟'
    });
  }
}

export class InsurancePage extends BaseIndustryPage {
  constructor(page: Page) {
    super(page);
  }
  
  async goto() {
    await super.goto('/ai-prompts-for-insurance-advisors');
  }
  
  async fillRiskAssessmentForm() {
    await this.fillForm({
      scenario: 'risk-assessment',
      prompt: '评估一位35岁软件工程师的保险需求，制定综合保障方案',
      context: '年收入30万，已婚有孩，有房贷200万'
    });
  }
}

export class RealtorPage extends BaseIndustryPage {
  constructor(page: Page) {
    super(page);
  }
  
  async goto() {
    await super.goto('/ai-prompts-for-realtors');
  }
  
  async fillPropertyValuationForm() {
    await this.fillForm({
      scenario: 'property-valuation',
      prompt: '评估北京朝阳区一套120平米三居室的市场价值',
      context: '2015年建成，精装修，地铁500米，学区房'
    });
  }
}

/**
 * 页面对象工厂函数
 */
export function createIndustryPage(industry: string, page: Page): BaseIndustryPage {
  switch (industry) {
    case 'lawyer':
      return new LawyerPage(page);
    case 'accountant':
      return new AccountantPage(page);
    case 'teacher':
      return new TeacherPage(page);
    case 'insurance':
      return new InsurancePage(page);
    case 'realtor':
      return new RealtorPage(page);
    default:
      throw new Error(`Unknown industry: ${industry}`);
  }
}

export {
  BaseIndustryPage,
  LawyerPage
};