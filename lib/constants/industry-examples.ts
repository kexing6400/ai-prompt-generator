export const industryExamples = {
  lawyer: {
    scenarios: [
      { value: 'contract', label: '合同审查与起草' },
      { value: 'litigation', label: '诉讼案件处理' },
      { value: 'consulting', label: '法律咨询服务' },
      { value: 'compliance', label: '合规审查' },
      { value: 'research', label: '法律研究' }
    ],
    examples: [
      {
        scenario: 'contract',
        prompt: '分析一份商业合同的主要风险点，并提供相应的法律建议',
        context: '涉及软件许可协议，合同金额500万元，执行期3年'
      },
      {
        scenario: 'litigation',
        prompt: '帮我分析这起劳动争议案件的关键争议点和胜诉概率',
        context: '员工主张加班费，涉及金额8万元，有部分证据支持'
      },
      {
        scenario: 'consulting',
        prompt: '为客户解释新公司法修订对小微企业的影响',
        context: '客户是一家20人的科技公司，主要关心注册资本和治理结构变化'
      }
    ],
    practiceAreas: [
      { value: 'corporate', label: '公司法' },
      { value: 'criminal', label: '刑事法' },
      { value: 'civil', label: '民事诉讼' },
      { value: 'intellectual', label: '知识产权' },
      { value: 'labor', label: '劳动法' },
      { value: 'real-estate', label: '房地产法' },
      { value: 'finance', label: '金融法' }
    ]
  },

  teacher: {
    scenarios: [
      { value: 'lesson-planning', label: '课程设计与教案编写' },
      { value: 'assessment', label: '学生评估与测试' },
      { value: 'classroom-management', label: '课堂管理' },
      { value: 'curriculum', label: '课程规划' },
      { value: 'parent-communication', label: '家长沟通' }
    ],
    examples: [
      {
        scenario: 'lesson-planning',
        prompt: '设计一堂关于分数加减法的数学课，适合小学四年级学生',
        context: '学生基础参差不齐，班级人数35人，课时45分钟'
      },
      {
        scenario: 'assessment',
        prompt: '制作一套英语单元测试题，考查学生的词汇和语法掌握情况',
        context: '初中二年级，涵盖一般过去时和现在完成时的区别'
      },
      {
        scenario: 'classroom-management',
        prompt: '处理课堂上学生注意力不集中的问题',
        context: '下午第一节课，学生普遍困倦，影响教学效果'
      }
    ],
    subjects: [
      { value: 'math', label: '数学' },
      { value: 'chinese', label: '语文' },
      { value: 'english', label: '英语' },
      { value: 'science', label: '科学' },
      { value: 'history', label: '历史' },
      { value: 'geography', label: '地理' },
      { value: 'physics', label: '物理' },
      { value: 'chemistry', label: '化学' }
    ]
  },

  insurance: {
    scenarios: [
      { value: 'product-explanation', label: '产品介绍与讲解' },
      { value: 'risk-assessment', label: '风险评估分析' },
      { value: 'claim-assistance', label: '理赔协助' },
      { value: 'policy-comparison', label: '保单对比分析' },
      { value: 'customer-consultation', label: '客户咨询服务' }
    ],
    examples: [
      {
        scenario: 'product-explanation',
        prompt: '向客户解释重疾险和医疗险的区别，帮助客户选择合适产品',
        context: '客户35岁，有社保，年收入30万，主要担心大病风险'
      },
      {
        scenario: 'risk-assessment',
        prompt: '为一位出租车司机评估职业责任险的必要性',
        context: '司机45岁，开出租车8年，之前没有购买过商业保险'
      },
      {
        scenario: 'claim-assistance',
        prompt: '指导客户准备车险理赔所需的材料和流程',
        context: '客户车辆发生追尾事故，对方全责，车辆需要维修'
      }
    ],
    insuranceTypes: [
      { value: 'life', label: '人寿保险' },
      { value: 'health', label: '健康保险' },
      { value: 'auto', label: '车辆保险' },
      { value: 'property', label: '财产保险' },
      { value: 'liability', label: '责任保险' },
      { value: 'travel', label: '旅行保险' }
    ]
  },

  accountant: {
    scenarios: [
      { value: 'tax-planning', label: '税务规划' },
      { value: 'financial-analysis', label: '财务分析' },
      { value: 'bookkeeping', label: '记账核算' },
      { value: 'audit', label: '审计服务' },
      { value: 'consulting', label: '财务咨询' }
    ],
    examples: [
      {
        scenario: 'tax-planning',
        prompt: '为小微企业制定合理的税务筹划方案，降低税负',
        context: '制造业企业，年营业额800万，主要客户是大型国企'
      },
      {
        scenario: 'financial-analysis',
        prompt: '分析企业现金流状况，识别潜在的财务风险',
        context: '零售连锁企业，有20家门店，季节性波动较大'
      },
      {
        scenario: 'bookkeeping',
        prompt: '处理跨期收入确认的会计处理，确保符合准则要求',
        context: '软件开发公司，涉及多年期服务合同的收入确认'
      }
    ],
    serviceTypes: [
      { value: 'corporate', label: '企业财务' },
      { value: 'individual', label: '个人税务' },
      { value: 'audit', label: '审计服务' },
      { value: 'consulting', label: '财务咨询' },
      { value: 'tax', label: '税务服务' }
    ]
  },

  realtor: {
    scenarios: [
      { value: 'property-marketing', label: '房产营销推广' },
      { value: 'client-consultation', label: '客户咨询服务' },
      { value: 'market-analysis', label: '市场分析报告' },
      { value: 'negotiation', label: '价格谈判' },
      { value: 'transaction', label: '交易流程协助' }
    ],
    examples: [
      {
        scenario: 'property-marketing',
        prompt: '为一套高端公寓撰写吸引人的房产描述，突出独特卖点',
        context: '位于市中心，180平米，江景房，精装修，周边配套完善'
      },
      {
        scenario: 'client-consultation',
        prompt: '为首次购房的年轻夫妇提供购房建议和注意事项',
        context: '预算300万，看中学区房，对贷款流程不熟悉'
      },
      {
        scenario: 'market-analysis',
        prompt: '分析某个区域的房价趋势和投资价值',
        context: '新兴科技园区，政府规划中的地铁站，周边在建大型商场'
      }
    ],
    propertyTypes: [
      { value: 'residential', label: '住宅' },
      { value: 'commercial', label: '商业' },
      { value: 'office', label: '写字楼' },
      { value: 'industrial', label: '工业' },
      { value: 'investment', label: '投资物业' }
    ]
  }
}