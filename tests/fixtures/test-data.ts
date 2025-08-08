/**
 * 测试数据工厂
 * 为所有行业页面提供标准化的测试数据
 */

export interface IndustryTestData {
  industry: string;
  displayName: string;
  route: string;
  scenarios: Array<{
    value: string;
    label: string;
  }>;
  testCases: Array<{
    scenario: string;
    prompt: string;
    context?: string;
    expectedKeywords: string[];
  }>;
}

// 律师行业测试数据
export const lawyerTestData: IndustryTestData = {
  industry: 'lawyer',
  displayName: '律师',
  route: '/ai-prompts-for-lawyers',
  scenarios: [
    { value: 'contract-review', label: '合同审查' },
    { value: 'legal-research', label: '法律研究' },
    { value: 'case-analysis', label: '案例分析' },
    { value: 'document-drafting', label: '文书起草' }
  ],
  testCases: [
    {
      scenario: 'contract-review',
      prompt: '请帮我分析这份商业合同的主要风险点，并提供相应的法律建议',
      context: '合同金额100万，涉及软件开发服务',
      expectedKeywords: ['合同', '风险', '法律', '建议', '商业']
    },
    {
      scenario: 'legal-research',
      prompt: '研究关于数据保护的最新法规，重点分析对企业的影响',
      context: '针对互联网公司',
      expectedKeywords: ['数据保护', '法规', '企业', '影响']
    }
  ]
};

// 会计师行业测试数据
export const accountantTestData: IndustryTestData = {
  industry: 'accountant',
  displayName: '会计师',
  route: '/ai-prompts-for-accountants',
  scenarios: [
    { value: 'financial-analysis', label: '财务分析' },
    { value: 'tax-planning', label: '税务筹划' },
    { value: 'audit-review', label: '审计复核' },
    { value: 'budget-planning', label: '预算规划' }
  ],
  testCases: [
    {
      scenario: 'financial-analysis',
      prompt: '分析公司第三季度财务报表，识别关键财务指标的变化趋势',
      context: '制造业公司，营收5000万',
      expectedKeywords: ['财务分析', '报表', '指标', '趋势']
    },
    {
      scenario: 'tax-planning',
      prompt: '制定年度税务筹划方案，优化企业所得税缴纳',
      context: '高新技术企业',
      expectedKeywords: ['税务筹划', '企业所得税', '优化']
    }
  ]
};

// 教师行业测试数据
export const teacherTestData: IndustryTestData = {
  industry: 'teacher',
  displayName: '教师',
  route: '/ai-prompts-for-teachers',
  scenarios: [
    { value: 'lesson-planning', label: '课程设计' },
    { value: 'assessment-creation', label: '考核评估' },
    { value: 'student-guidance', label: '学生指导' },
    { value: 'teaching-resources', label: '教学资源' }
  ],
  testCases: [
    {
      scenario: 'lesson-planning',
      prompt: '设计一堂关于机器学习的入门课程，包括理论讲解和实践练习',
      context: '面向大学二年级学生，课程时长90分钟',
      expectedKeywords: ['课程设计', '机器学习', '理论', '实践']
    },
    {
      scenario: 'assessment-creation',
      prompt: '创建数学期中考试试卷，涵盖代数和几何两个单元',
      context: '高中一年级学生，考试时长120分钟',
      expectedKeywords: ['考试', '试卷', '代数', '几何']
    }
  ]
};

// 保险顾问行业测试数据
export const insuranceTestData: IndustryTestData = {
  industry: 'insurance',
  displayName: '保险顾问',
  route: '/ai-prompts-for-insurance-advisors',
  scenarios: [
    { value: 'risk-assessment', label: '风险评估' },
    { value: 'policy-recommendation', label: '保险方案推荐' },
    { value: 'claims-analysis', label: '理赔分析' },
    { value: 'client-consultation', label: '客户咨询' }
  ],
  testCases: [
    {
      scenario: 'risk-assessment',
      prompt: '评估一位35岁软件工程师的保险需求，制定综合保障方案',
      context: '年收入30万，已婚有孩，有房贷',
      expectedKeywords: ['风险评估', '保险需求', '保障方案']
    },
    {
      scenario: 'policy-recommendation',
      prompt: '为小微企业推荐合适的团体保险产品组合',
      context: '20人规模的科技公司',
      expectedKeywords: ['团体保险', '企业', '产品组合']
    }
  ]
};

// 房产经纪行业测试数据
export const realtorTestData: IndustryTestData = {
  industry: 'realtor',
  displayName: '房产经纪',
  route: '/ai-prompts-for-realtors',
  scenarios: [
    { value: 'property-valuation', label: '房产估值' },
    { value: 'market-analysis', label: '市场分析' },
    { value: 'client-matching', label: '客户匹配' },
    { value: 'property-marketing', label: '房源推广' }
  ],
  testCases: [
    {
      scenario: 'property-valuation',
      prompt: '评估北京朝阳区一套120平米三居室的市场价值',
      context: '2015年建成，精装修，地铁500米',
      expectedKeywords: ['房产估值', '市场价值', '朝阳区']
    },
    {
      scenario: 'market-analysis',
      prompt: '分析上海浦东新区2024年第一季度房地产市场趋势',
      context: '重点关注新房和二手房价格变化',
      expectedKeywords: ['市场分析', '浦东新区', '趋势']
    }
  ]
};

// 所有行业测试数据
export const allIndustriesTestData: IndustryTestData[] = [
  lawyerTestData,
  accountantTestData,
  teacherTestData,
  insuranceTestData,
  realtorTestData
];

// 通用测试数据
export const commonTestData = {
  // 无效输入测试数据
  invalidInputs: {
    emptyPrompt: '',
    tooShortPrompt: 'abc',
    tooLongPrompt: 'a'.repeat(5001),
    specialCharacters: '<script>alert("xss")</script>',
    sqlInjection: "'; DROP TABLE users; --"
  },
  
  // 性能测试数据
  performanceThresholds: {
    pageLoadTime: 3000, // 3秒
    apiResponseTime: 5000, // 5秒
    formSubmitTime: 10000 // 10秒
  },
  
  // 预期的页面元素
  expectedElements: {
    header: 'h1',
    form: 'form',
    scenarioSelect: '#scenario',
    promptTextarea: '#requirements',
    contextTextarea: '#context',
    submitButton: 'button[type="submit"]',
    resultSection: '[data-testid="prompt-result"]'
  }
};