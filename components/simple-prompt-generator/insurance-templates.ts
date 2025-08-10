import { SimpleTemplate } from './types'

// 保险顾问专业人员的简化模板库
export const insuranceTemplates: SimpleTemplate[] = [
  {
    id: 'client-needs-analysis',
    title: '客户需求分析',
    description: '全面分析客户保险需求和风险状况',
    industry: 'insurance-advisors',
    icon: '🛡️',
    fields: [
      {
        name: 'clientProfile',
        label: '客户基本信息',
        type: 'textarea',
        placeholder: '例如：35岁男性，已婚有子女，年收入50万，从事IT行业，有房贷200万',
        required: true
      },
      {
        name: 'familyStructure',
        label: '家庭结构',
        type: 'select',
        required: true,
        options: ['单身无负担', '单身有父母', '新婚夫妇', '有子女家庭', '三代同堂', '单亲家庭']
      },
      {
        name: 'riskConcerns',
        label: '主要风险担忧',
        type: 'textarea',
        placeholder: '例如：担心重疾影响家庭收入，孩子教育费用，父母养老医疗，意外事故等',
        required: true
      },
      {
        name: 'budgetRange',
        label: '保费预算',
        type: 'select',
        required: true,
        options: ['年收入5%以内', '年收入5-10%', '年收入10-15%', '年收入15%以上', '具体预算待定']
      },
      {
        name: 'currentCoverage',
        label: '现有保障',
        type: 'textarea',
        placeholder: '例如：有社保，公司团险20万，商业医疗险30万等',
        required: false
      }
    ],
    prompt: `你是一名专业的保险规划师和风险管理顾问。请为以下客户进行全面的保险需求分析：

客户信息：{{clientProfile}}
家庭结构：{{familyStructure}}
风险担忧：{{riskConcerns}}
保费预算：{{budgetRange}}
现有保障：{{currentCoverage}}

请提供一份专业的保险需求分析报告，包括：
1. 客户生命周期和风险特征分析
2. 主要保障需求识别和优先级排序
3. 现有保障缺口分析和不足之处
4. 家庭财务责任和保额测算建议
5. 不同险种的配置必要性评估
6. 保费支出合理性和可负担性分析
7. 分阶段保障规划和优化建议
8. 风险管理策略和保险外补充措施

要求分析全面深入，建议具有针对性和可操作性，体现专业保险规划理念。字数500-700字。`
  },

  {
    id: 'product-recommendation',
    title: '保险产品推荐',
    description: '为客户推荐最适合的保险产品组合',
    industry: 'insurance-advisors',
    icon: '📋',
    fields: [
      {
        name: 'insuranceType',
        label: '主要险种需求',
        type: 'select',
        required: true,
        options: ['重疾险', '医疗险', '意外险', '定期寿险', '年金险', '教育金', '综合规划']
      },
      {
        name: 'clientAge',
        label: '客户年龄段',
        type: 'select',
        required: true,
        options: ['20-30岁', '30-40岁', '40-50岁', '50-60岁', '60岁以上']
      },
      {
        name: 'healthStatus',
        label: '健康状况',
        type: 'select',
        required: true,
        options: ['健康状况良好', '有慢性病史', '曾有住院记录', '家族遗传病史', '需要详细核保']
      },
      {
        name: 'coverageAmount',
        label: '期望保额',
        type: 'text',
        placeholder: '例如：重疾保额50万，医疗保额300万',
        required: true
      },
      {
        name: 'specialRequirements',
        label: '特殊需求',
        type: 'textarea',
        placeholder: '例如：希望有轻症保障，需要保费豁免功能，看重保险公司品牌等',
        required: false
      }
    ],
    prompt: `你是一名资深的保险产品专家和客户顾问。请为客户推荐最适合的保险产品：

主要需求：{{insuranceType}}
客户年龄：{{clientAge}}
健康状况：{{healthStatus}}
期望保额：{{coverageAmount}}
特殊要求：{{specialRequirements}}

请提供专业的产品推荐方案，包括：
1. 产品选择的核心理由和匹配度分析
2. 推荐产品的核心保障责任和特色优势
3. 保额设计的科学依据和合理性说明
4. 缴费期限和缴费方式的最优建议
5. 产品组合搭配的协调性和互补性
6. 核保风险评估和投保注意事项
7. 保费性价比分析和同类产品对比
8. 后续保障升级和调整的可能性

要求推荐方案客观专业，充分考虑客户实际需求和支付能力，避免过度销售。字数400-600字。`
  },

  {
    id: 'claim-assistance',
    title: '理赔协助指导',
    description: '专业的保险理赔流程和注意事项',
    industry: 'insurance-advisors',
    icon: '📞',
    fields: [
      {
        name: 'claimType',
        label: '理赔类型',
        type: 'select',
        required: true,
        options: ['重疾险理赔', '医疗险报销', '意外伤害理赔', '身故理赔', '残疾理赔', '其他理赔']
      },
      {
        name: 'incidentDescription',
        label: '事故情况',
        type: 'textarea',
        placeholder: '例如：客户确诊恶性肿瘤，已在三甲医院治疗，有完整病历资料',
        required: true
      },
      {
        name: 'policyInfo',
        label: '保单情况',
        type: 'textarea',
        placeholder: '例如：XX保险公司重疾险，保额50万，已缴费3年，等待期已过',
        required: true
      },
      {
        name: 'urgencyLevel',
        label: '紧急程度',
        type: 'select',
        required: true,
        options: ['非常紧急', '比较紧急', '一般情况', '不着急处理']
      }
    ],
    prompt: `你是一名专业的保险理赔专家和客户服务顾问。请为以下理赔案例提供专业协助：

理赔类型：{{claimType}}
事故情况：{{incidentDescription}}
保单信息：{{policyInfo}}
紧急程度：{{urgencyLevel}}

请提供详细的理赔指导方案，包括：
1. 理赔可行性初步判断和依据分析
2. 理赔申请的具体流程和时间节点
3. 所需理赔材料清单和获取途径
4. 医院就诊和检查的注意事项
5. 与保险公司沟通的要点和技巧
6. 可能遇到的理赔障碍和应对策略
7. 理赔时效预估和催办方法
8. 理赔结果不满意时的申诉渠道

要求指导专业准确，操作性强，能够有效维护客户合法权益，提高理赔成功率。字数400-600字。`
  },

  {
    id: 'policy-review',
    title: '保单体检分析',
    description: '现有保单的全面检视和优化建议',
    industry: 'insurance-advisors',
    icon: '🔍',
    fields: [
      {
        name: 'reviewPurpose',
        label: '体检目的',
        type: 'select',
        required: true,
        options: ['定期保单检视', '保障需求变化', '保费负担调整', '产品升级考虑', '理赔后重新规划']
      },
      {
        name: 'currentPolicies',
        label: '现有保单情况',
        type: 'textarea',
        placeholder: '例如：重疾险2份共70万保额，医疗险1份300万，意外险50万，年缴保费3万',
        required: true
      },
      {
        name: 'lifeChanges',
        label: '生活变化情况',
        type: 'textarea',
        placeholder: '例如：收入增长，新增子女，购买房产，父母年龄增长需要赡养等',
        required: true
      },
      {
        name: 'currentConcerns',
        label: '当前困惑',
        type: 'textarea',
        placeholder: '例如：保费负担重，保障是否充足，产品是否过时，是否有重复保障等',
        required: true
      }
    ],
    prompt: `你是一名专业的保险规划顾问和风险管理专家。请为客户进行全面的保单体检：

体检目的：{{reviewPurpose}}
现有保单：{{currentPolicies}}
生活变化：{{lifeChanges}}
当前困惑：{{currentConcerns}}

请提供详细的保单体检报告，包括：
1. 现有保障结构的全面梳理和分析
2. 保障充足性评估和缺口识别
3. 保单性价比分析和费率合理性
4. 重复保障识别和优化建议
5. 保单条款的优劣势对比分析
6. 基于生活变化的保障需求调整
7. 保费负担优化和缴费方式建议
8. 分阶段保单调整和升级规划

要求分析客观中立，建议切实可行，既要保证保障充足，又要考虑经济负担的合理性。字数500-700字。`
  },

  {
    id: 'customer-education',
    title: '保险知识科普',
    description: '为客户提供专业的保险知识教育',
    industry: 'insurance-advisors',
    icon: '📚',
    fields: [
      {
        name: 'educationTopic',
        label: '科普主题',
        type: 'select',
        required: true,
        options: ['保险基础概念', '险种功能对比', '理赔流程介绍', '保单条款解读', '投保注意事项', '保险规划理念']
      },
      {
        name: 'targetAudience',
        label: '目标受众',
        type: 'select',
        required: true,
        options: ['保险小白', '有基础认知', '专业人士', '特定年龄群体', '特定职业群体']
      },
      {
        name: 'communicationStyle',
        label: '沟通方式',
        type: 'select',
        required: true,
        options: ['通俗易懂', '专业详细', '案例说明', '对比分析', '问答形式']
      },
      {
        name: 'specificFocus',
        label: '重点内容',
        type: 'textarea',
        placeholder: '例如：重点解释保额、保费、保障期间的关系，以及如何选择适合的缴费期限',
        required: true
      }
    ],
    prompt: `你是一名专业的保险教育专家和客户培训师。请针对以下需求提供保险知识科普：

科普主题：{{educationTopic}}
目标受众：{{targetAudience}}
沟通风格：{{communicationStyle}}
重点内容：{{specificFocus}}

请提供一份专业的保险知识科普内容，包括：
1. 核心概念的清晰定义和通俗解释
2. 相关知识点的逻辑关系和体系结构
3. 实际案例和生活化的例子说明
4. 常见误区的澄清和正确理解
5. 实用技巧和选择方法指导
6. 注意事项和风险提示
7. 进阶学习的方向和资源推荐
8. 互动问题设计和思考启发

要求内容准确专业，表达清晰易懂，能够有效提升客户的保险素养和决策能力。字数400-600字。`
  }
]