import { SimpleTemplate } from './types'

// 律师专业人员的简化模板库
export const lawyerTemplates: SimpleTemplate[] = [
  {
    id: 'legal-document-draft',
    title: '法律文件起草助手',
    description: '协助起草各类法律文件和合同条款',
    industry: 'lawyers',
    icon: '📋',
    fields: [
      {
        name: 'documentType',
        label: '文件类型',
        type: 'select',
        required: true,
        options: ['合同协议', '法律意见书', '起诉状', '答辩书', '律师函', '备忘录']
      },
      {
        name: 'parties',
        label: '当事人信息',
        type: 'text',
        placeholder: '例如：甲方XX公司，乙方XX个人',
        required: true
      },
      {
        name: 'legalIssue',
        label: '法律事项',
        type: 'textarea',
        placeholder: '例如：商品销售合同纠纷，涉及货物质量问题和违约责任',
        required: true
      },
      {
        name: 'jurisdiction',
        label: '适用法律/管辖',
        type: 'text',
        placeholder: '例如：中华人民共和国合同法，北京市朝阳区法院管辖',
        required: true
      }
    ],
    prompt: `你是一名资深执业律师。请协助起草以下法律文件：

文件类型：{{documentType}}
当事人：{{parties}}
法律事项：{{legalIssue}}
适用法律/管辖：{{jurisdiction}}

请起草一份专业的法律文件，要求：
1. 结构清晰，条款完整
2. 语言严谨，符合法律文书规范
3. 充分保护委托人合法权益
4. 包含必要的法律条文引用
5. 考虑可能的风险点并做出相应规定
6. 格式符合法律文书标准

请生成400-600字的专业法律文书内容。`
  },

  {
    id: 'legal-research',
    title: '案例分析研究',
    description: '法律案例分析和判例研究助手',
    industry: 'lawyers',
    icon: '🔍',
    fields: [
      {
        name: 'caseBackground',
        label: '案例背景',
        type: 'textarea',
        placeholder: '例如：企业合同违约纠纷，涉及预付款返还和违约金计算',
        required: true
      },
      {
        name: 'legalQuestions',
        label: '法律争议焦点',
        type: 'textarea',
        placeholder: '例如：1.违约金是否过高 2.预付款是否应当返还 3.适用哪些法条',
        required: true
      },
      {
        name: 'researchPurpose',
        label: '研究目的',
        type: 'select',
        required: true,
        options: ['诉讼策略制定', '法律风险评估', '客户咨询答复', '学术研究', '内部培训']
      }
    ],
    prompt: `你是一名专业的法律研究员和资深律师。请对以下案例进行深度分析：

案例背景：{{caseBackground}}
法律争议焦点：{{legalQuestions}}
研究目的：{{researchPurpose}}

请提供一份全面的法律分析报告，包括：
1. 案例事实梳理和争议焦点识别
2. 相关法律法规和司法解释分析
3. 类似判例研究和裁判观点总结
4. 各方观点的法律依据和胜诉可能性分析
5. 风险提示和应对策略建议
6. 结论和专业建议

总字数控制在500-800字，要求分析透彻，逻辑清晰。`
  },

  {
    id: 'client-consultation',
    title: '客户咨询回复',
    description: '专业法律咨询问题回复模板',
    industry: 'lawyers',
    icon: '💬',
    fields: [
      {
        name: 'clientQuestion',
        label: '客户问题',
        type: 'textarea',
        placeholder: '例如：我的公司被员工起诉劳动争议，要求赔偿，我们应该如何应对？',
        required: true
      },
      {
        name: 'caseDetails',
        label: '案情细节',
        type: 'textarea',
        placeholder: '例如：员工工作3年，因公司调岗降薪提出离职，现要求补偿金',
        required: true
      },
      {
        name: 'urgency',
        label: '紧急程度',
        type: 'select',
        required: true,
        options: ['非常紧急(需立即处理)', '比较紧急(一周内)', '一般情况(一月内)', '长期规划']
      }
    ],
    prompt: `你是一名经验丰富的专业律师。请为客户提供专业的法律咨询回复：

客户问题：{{clientQuestion}}
案情细节：{{caseDetails}}
紧急程度：{{urgency}}

请提供一份专业的法律咨询回复，包括：
1. 问题性质和法律定性分析
2. 相关法律依据和政策规定
3. 可能面临的法律风险和后果
4. 具体的应对措施和解决方案
5. 需要收集的证据材料清单
6. 时间节点和注意事项提醒
7. 进一步法律服务建议

语言专业但通俗易懂，让客户能够理解并执行。字数300-500字。`
  },

  {
    id: 'contract-review',
    title: '合同审查意见',
    description: '合同条款审查和风险提示',
    industry: 'lawyers',
    icon: '📝',
    fields: [
      {
        name: 'contractType',
        label: '合同类型',
        type: 'select',
        required: true,
        options: ['买卖合同', '服务合同', '租赁合同', '劳动合同', '股权转让合同', '保密协议']
      },
      {
        name: 'reviewFocus',
        label: '审查重点',
        type: 'textarea',
        placeholder: '例如：主要关注付款条件、违约责任、知识产权归属等条款',
        required: true
      },
      {
        name: 'clientConcerns',
        label: '客户主要担忧',
        type: 'textarea',
        placeholder: '例如：担心对方违约、付款安全、保密信息泄露等',
        required: true
      }
    ],
    prompt: `你是一名专业的合同法律师。请对以下合同进行专业审查：

合同类型：{{contractType}}
审查重点：{{reviewFocus}}
客户担忧：{{clientConcerns}}

请提供一份详细的合同审查意见，包括：
1. 合同整体结构和完整性评估
2. 重点条款的风险分析和改进建议
3. 缺失条款补充建议
4. 不利条款识别和谈判策略
5. 履行风险提示和防范措施
6. 争议解决机制评估
7. 具体的修改建议和替代条款

要求专业严谨，实用性强，字数400-600字。`
  },

  {
    id: 'litigation-strategy',
    title: '诉讼策略制定',
    description: '诉讼案件策略分析和程序指导',
    industry: 'lawyers',
    icon: '⚖️',
    fields: [
      {
        name: 'caseType',
        label: '案件类型',
        type: 'select',
        required: true,
        options: ['民事合同纠纷', '劳动争议', '公司商事纠纷', '知识产权纠纷', '侵权责任', '行政诉讼']
      },
      {
        name: 'clientPosition',
        label: '委托人地位',
        type: 'select',
        required: true,
        options: ['原告/申请人', '被告/被申请人', '第三人', '上诉人', '被上诉人']
      },
      {
        name: 'caseStrength',
        label: '案件情况评估',
        type: 'textarea',
        placeholder: '例如：证据较充分，法理依据清晰，但对方可能提出反驳...',
        required: true
      }
    ],
    prompt: `你是一名资深诉讼律师。请为以下案件制定诉讼策略：

案件类型：{{caseType}}
委托人地位：{{clientPosition}}
案件情况：{{caseStrength}}

请制定一份完整的诉讼策略方案，包括：
1. 案件分析和胜诉可能性评估
2. 诉讼程序规划和时间安排
3. 证据收集和固定策略
4. 法律适用和裁判标准分析
5. 和解谈判的时机和条件
6. 可能遇到的困难和应对方案
7. 诉讼费用预估和风险提示

要求策略清晰，具有可操作性，字数500-700字。`
  }
]