import { SimpleTemplate } from './types'

// 房地产专业人员的简化模板库
export const realtorTemplates: SimpleTemplate[] = [
  {
    id: 'property-description',
    title: '房产描述生成器',
    description: '为房产列表生成吸引人的专业描述',
    industry: 'realtors',
    icon: '🏠',
    fields: [
      {
        name: 'propertyType',
        label: '房产类型',
        type: 'select',
        required: true,
        options: ['公寓', '别墅', '联排别墅', '办公楼', '商铺', '土地']
      },
      {
        name: 'location',
        label: '房产位置',
        type: 'text',
        placeholder: '例如：北京朝阳区三里屯',
        required: true
      },
      {
        name: 'keyFeatures',
        label: '主要特色',
        type: 'textarea',
        placeholder: '例如：3室2厅2卫、南北通透、精装修、地铁站附近',
        required: true
      },
      {
        name: 'targetAudience',
        label: '目标客群',
        type: 'select',
        required: true,
        options: ['首次购房者', '投资客', '改善性购房', '高端客户', '租房客']
      }
    ],
    prompt: `你是一名专业的房地产营销文案专家。请为以下房产生成一段吸引人的专业描述：

房产类型：{{propertyType}}
房产位置：{{location}}  
主要特色：{{keyFeatures}}
目标客群：{{targetAudience}}

请生成一段200-300字的房产描述，要求：
1. 突出房产的核心卖点
2. 使用专业但易懂的语言
3. 针对目标客群的需求和关注点
4. 包含情感化的描述，让客户产生购买欲望
5. 结构清晰，重点突出`
  },
  
  {
    id: 'client-follow-up',
    title: '客户跟进邮件',
    description: '生成专业的客户跟进和沟通邮件',
    industry: 'realtors',
    icon: '📧',
    fields: [
      {
        name: 'clientName',
        label: '客户姓名',
        type: 'text',
        placeholder: '例如：张先生',
        required: true
      },
      {
        name: 'followUpReason',
        label: '跟进原因',
        type: 'select',
        required: true,
        options: ['看房后跟进', '报价反馈', '市场更新', '新房源推荐', '合同进展']
      },
      {
        name: 'context',
        label: '具体情况',
        type: 'textarea',
        placeholder: '例如：客户上周看了三里屯的公寓，对地段很满意但觉得价格偏高',
        required: true
      }
    ],
    prompt: `你是一名专业的房地产经纪人。请为客户生成一封专业的跟进邮件：

客户姓名：{{clientName}}
跟进原因：{{followUpReason}}
具体情况：{{context}}

请生成一封150-200字的跟进邮件，要求：
1. 称呼礼貌专业
2. 针对具体情况提供有价值的信息或建议
3. 展现专业性和关怀
4. 包含明确的下一步行动建议
5. 结尾留下联系方式和进一步沟通的邀请`
  },

  {
    id: 'market-analysis',
    title: '市场分析报告',
    description: '生成专业的区域市场分析内容',
    industry: 'realtors',
    icon: '📊',
    fields: [
      {
        name: 'area',
        label: '分析区域',
        type: 'text',
        placeholder: '例如：北京朝阳区',
        required: true
      },
      {
        name: 'timeframe',
        label: '时间范围',
        type: 'select',
        required: true,
        options: ['最近3个月', '最近6个月', '最近1年', '最近2年']
      },
      {
        name: 'propertyTypes',
        label: '房产类型',
        type: 'select',
        required: true,
        options: ['住宅', '公寓', '别墅', '商业地产', '全部类型']
      }
    ],
    prompt: `你是一名资深的房地产市场分析师。请为以下区域生成一份专业的市场分析总结：

分析区域：{{area}}
时间范围：{{timeframe}}
房产类型：{{propertyTypes}}

请生成一份300-400字的市场分析报告，包括：
1. 区域概况和发展前景
2. 价格趋势分析
3. 供需情况概述
4. 影响因素分析（交通、配套、政策等）
5. 投资建议或购房建议
6. 使用专业术语但保持可读性`
  },

  {
    id: 'social-media-post',
    title: '社交媒体营销',
    description: '生成房地产社交媒体营销内容',
    industry: 'realtors',
    icon: '📱',
    fields: [
      {
        name: 'platform',
        label: '平台类型',
        type: 'select',
        required: true,
        options: ['微信朋友圈', '微博', '抖音/快手', '小红书', 'LinkedIn']
      },
      {
        name: 'contentType',
        label: '内容类型',
        type: 'select',
        required: true,
        options: ['房源推广', '市场动态', '购房知识', '成功案例', '团队介绍']
      },
      {
        name: 'keyMessage',
        label: '核心信息',
        type: 'textarea',
        placeholder: '例如：新上优质房源、市场价格下调、购房注意事项等',
        required: true
      }
    ],
    prompt: `你是一名专业的房地产社交媒体营销专家。请为以下内容生成社交媒体文案：

发布平台：{{platform}}
内容类型：{{contentType}}
核心信息：{{keyMessage}}

请生成一段100-150字的社交媒体文案，要求：
1. 符合平台特色和用户习惯
2. 语言生动有趣，易于传播
3. 包含适当的标签或关键词
4. 有明确的行动召唤
5. 专业性与亲和力并重
6. 如果适合，可以包含emoji表情`
  },

  {
    id: 'negotiation-strategy',
    title: '谈判策略指导',
    description: '生成房地产交易谈判策略和话术',
    industry: 'realtors',
    icon: '🤝',
    fields: [
      {
        name: 'situation',
        label: '谈判情况',
        type: 'select',
        required: true,
        options: ['买方出价低于预期', '卖方坚持高价', '竞价情况', '合同条件争议', '付款方式分歧']
      },
      {
        name: 'clientType',
        label: '客户类型',
        type: 'select',
        required: true,
        options: ['首次购房者', '投资客', '换房客', '企业客户', '海外客户']
      },
      {
        name: 'specificDetails',
        label: '具体情况',
        type: 'textarea',
        placeholder: '例如：买方出价比房主期望低20万，但买方资质很好，全款购买',
        required: true
      }
    ],
    prompt: `你是一名经验丰富的房地产谈判专家。请为以下情况提供谈判策略和建议话术：

谈判情况：{{situation}}
客户类型：{{clientType}}
具体情况：{{specificDetails}}

请提供一套完整的谈判策略，包括：
1. 情况分析和关键点识别
2. 谈判目标和底线设定
3. 具体的沟通话术和表达方式
4. 可能的让步空间和条件
5. 应对各种反应的备选方案
6. 注意事项和风险提示

总字数控制在400-500字，要求实用性强，可操作性高。`
  }
]