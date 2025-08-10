import { SimpleTemplate } from './types'

// 会计师专业人员的简化模板库
export const accountantTemplates: SimpleTemplate[] = [
  {
    id: 'financial-analysis',
    title: '财务分析报告',
    description: '生成专业的企业财务分析和解读',
    industry: 'accountants',
    icon: '📊',
    fields: [
      {
        name: 'companyType',
        label: '企业类型',
        type: 'select',
        required: true,
        options: ['制造业', '服务业', '贸易企业', '科技公司', '金融企业', '房地产', '其他行业']
      },
      {
        name: 'analysisScope',
        label: '分析范围',
        type: 'select',
        required: true,
        options: ['月度分析', '季度分析', '年度分析', '专项分析', '对比分析']
      },
      {
        name: 'keyMetrics',
        label: '关键财务指标',
        type: 'textarea',
        placeholder: '例如：营业收入增长20%，毛利率下降2%，应收账款周转率提升等',
        required: true
      },
      {
        name: 'analysisTarget',
        label: '报告对象',
        type: 'select',
        required: true,
        options: ['管理层内部', '投资者', '银行贷款', '税务机关', '外部审计', '潜在合作伙伴']
      }
    ],
    prompt: `你是一名资深的财务分析师和注册会计师。请为以下企业撰写专业的财务分析报告：

企业类型：{{companyType}}
分析范围：{{analysisScope}}
关键指标：{{keyMetrics}}
报告对象：{{analysisTarget}}

请生成一份专业的财务分析报告，包括：
1. 财务状况概述和整体评价
2. 主要财务指标分析和趋势解读
3. 盈利能力、偿债能力、运营能力分析
4. 现金流量状况和资金管理评估
5. 风险因素识别和预警提示
6. 行业对比和市场地位分析
7. 改进建议和未来展望
8. 关键财务数据的专业解释

要求分析深入、数据准确、结论客观，符合会计准则和行业规范。字数400-600字。`
  },

  {
    id: 'tax-planning',
    title: '税务筹划方案',
    description: '合规的企业税务优化建议',
    industry: 'accountants',
    icon: '📋',
    fields: [
      {
        name: 'businessScale',
        label: '企业规模',
        type: 'select',
        required: true,
        options: ['小微企业', '中小企业', '一般纳税人', '大型企业', '跨国公司']
      },
      {
        name: 'taxIssue',
        label: '税务重点',
        type: 'select',
        required: true,
        options: ['增值税优化', '企业所得税筹划', '个人所得税规划', '印花税节约', '综合税务筹划', '税务风险防控']
      },
      {
        name: 'currentSituation',
        label: '当前税务状况',
        type: 'textarea',
        placeholder: '例如：年营业额5000万，适用一般纳税人税率，主要涉及增值税和企业所得税',
        required: true
      },
      {
        name: 'planningGoal',
        label: '筹划目标',
        type: 'textarea',
        placeholder: '例如：在合规前提下降低整体税负，提高资金使用效率，规避税务风险',
        required: true
      }
    ],
    prompt: `你是一名专业的税务师和财务顾问。请为企业制定合规的税务筹划方案：

企业规模：{{businessScale}}
税务重点：{{taxIssue}}
当前状况：{{currentSituation}}
筹划目标：{{planningGoal}}

请制定一份专业的税务筹划方案，包括：
1. 现行税务政策和优惠条件分析
2. 企业税务现状诊断和问题识别
3. 具体的税务优化措施和实施方案
4. 合规性审查和风险防控要点
5. 预期节税效果和成本效益分析
6. 实施时间安排和操作流程
7. 持续监控和调整机制
8. 相关法规依据和注意事项

要求方案合法合规，操作性强，风险可控，符合最新税法规定。字数500-700字。`
  },

  {
    id: 'audit-report',
    title: '审计意见书',
    description: '规范的企业审计报告和建议',
    industry: 'accountants',
    icon: '🔍',
    fields: [
      {
        name: 'auditType',
        label: '审计类型',
        type: 'select',
        required: true,
        options: ['年度财务审计', '专项审计', '内控审计', '税务审计', '清算审计', '验资审计']
      },
      {
        name: 'auditScope',
        label: '审计范围',
        type: 'textarea',
        placeholder: '例如：2023年度财务报表，包括资产负债表、利润表、现金流量表等',
        required: true
      },
      {
        name: 'keyFindings',
        label: '主要发现',
        type: 'textarea',
        placeholder: '例如：内控制度较完善，但存在部分会计处理不规范，固定资产管理有待改进',
        required: true
      },
      {
        name: 'auditOpinion',
        label: '审计意见类型',
        type: 'select',
        required: true,
        options: ['无保留意见', '带强调事项的无保留意见', '保留意见', '否定意见', '无法表示意见']
      }
    ],
    prompt: `你是一名注册会计师和执业审计师。请撰写规范的审计报告：

审计类型：{{auditType}}
审计范围：{{auditScope}}
主要发现：{{keyFindings}}
审计意见：{{auditOpinion}}

请撰写一份专业的审计报告，包括：
1. 审计概况和审计依据说明
2. 被审计单位基本情况介绍
3. 审计程序执行和证据获取情况
4. 主要审计发现和问题分析
5. 内控制度评价和改进建议
6. 会计处理规范性评估
7. 审计意见的形成依据和结论
8. 管理建议书和后续关注事项

要求符合审计准则，表述准确严谨，具有法律效力，体现审计师的职业判断。字数400-600字。`
  },

  {
    id: 'budget-planning',
    title: '预算编制指导',
    description: '企业全面预算管理方案',
    industry: 'accountants',
    icon: '💰',
    fields: [
      {
        name: 'budgetType',
        label: '预算类型',
        type: 'select',
        required: true,
        options: ['年度全面预算', '季度预算', '项目预算', '部门预算', '现金流预算', '资本支出预算']
      },
      {
        name: 'businessNature',
        label: '业务性质',
        type: 'select',
        required: true,
        options: ['生产制造', '批发零售', '服务咨询', '技术研发', '金融投资', '房地产开发']
      },
      {
        name: 'budgetGoal',
        label: '预算目标',
        type: 'textarea',
        placeholder: '例如：控制成本支出，提高资金使用效率，实现年度利润目标1000万元',
        required: true
      },
      {
        name: 'historicalData',
        label: '历史数据参考',
        type: 'textarea',
        placeholder: '例如：去年营收8000万，成本5000万，管理费用800万，销售费用600万',
        required: true
      }
    ],
    prompt: `你是一名资深的财务管理专家和预算分析师。请制定详细的预算编制方案：

预算类型：{{budgetType}}
业务性质：{{businessNature}}
预算目标：{{budgetGoal}}
历史数据：{{historicalData}}

请制定一份全面的预算编制指导方案，包括：
1. 预算编制原则和方法论
2. 收入预算的编制依据和测算方法
3. 成本费用预算的分类和控制要点
4. 资金预算和现金流量预测
5. 预算执行监控和差异分析机制
6. 预算调整的条件和审批程序
7. 各部门预算责任和考核指标
8. 预算管理制度和流程优化建议

要求科学合理，操作性强，符合企业实际情况和管理需要。字数500-700字。`
  },

  {
    id: 'financial-consulting',
    title: '财务咨询建议',
    description: '企业财务管理优化方案',
    industry: 'accountants',
    icon: '💡',
    fields: [
      {
        name: 'consultingFocus',
        label: '咨询重点',
        type: 'select',
        required: true,
        options: ['资金管理优化', '成本控制改进', '财务流程规范', '风险管理加强', '投资决策支持', '融资方案设计']
      },
      {
        name: 'companyStage',
        label: '企业发展阶段',
        type: 'select',
        required: true,
        options: ['初创期', '成长期', '成熟期', '转型期', '困难期', '扩张期']
      },
      {
        name: 'currentChallenges',
        label: '当前挑战',
        type: 'textarea',
        placeholder: '例如：现金流紧张，应收账款回收困难，成本控制不够精细，缺乏有效的绩效评价体系',
        required: true
      },
      {
        name: 'improvementExpectation',
        label: '改进期望',
        type: 'textarea',
        placeholder: '例如：提高资金周转效率，建立完善的内控制度，优化财务报告质量',
        required: true
      }
    ],
    prompt: `你是一名专业的财务顾问和管理会计师。请为企业提供专业的财务咨询建议：

咨询重点：{{consultingFocus}}
发展阶段：{{companyStage}}
当前挑战：{{currentChallenges}}
改进期望：{{improvementExpectation}}

请提供一份综合性的财务咨询报告，包括：
1. 企业财务现状诊断和问题分析
2. 行业标杆对比和差距识别
3. 财务管理优化的具体建议措施
4. 内控制度建设和流程改进方案
5. 财务信息化和数字化转型建议
6. 人员培训和能力提升计划
7. 实施路径和时间计划安排
8. 预期效果评估和成功指标

要求建议切实可行，针对性强，能够有效解决企业面临的财务管理问题。字数400-600字。`
  }
]