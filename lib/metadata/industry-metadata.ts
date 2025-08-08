import { Metadata } from 'next'

// 行业页面的 metadata 配置
export const industryMetadata = {
  lawyer: {
    title: '律师AI助手 - 专业法律AI提示词生成器',
    description: '为律师和法律从业者定制的AI提示词工具，涵盖合同审查、案例分析、法律研究、文书起草等专业场景，提升法律服务效率',
    keywords: [
      '律师AI工具', '法律AI助手', '合同审查AI', '案例分析AI', 
      '法律研究AI', '律师提示词', 'ChatGPT法律', 'Claude律师'
    ],
    openGraph: {
      title: '律师AI助手 - 专业法律AI提示词生成器',
      description: '为律师和法律从业者定制的AI提示词工具',
      url: 'https://ai-prompt-builder-pro.vercel.app/lawyer',
      images: ['/og-lawyer.jpg'],
    },
  } as Metadata,

  teacher: {
    title: '教师AI助手 - 专业教育AI提示词生成器',
    description: '为教师和教育工作者定制的AI提示词工具，涵盖教学设计、学生评估、课程规划、作业设计等教育场景，提升教学质量和效率',
    keywords: [
      '教师AI工具', '教育AI助手', '教学设计AI', '课程规划AI', 
      '学生评估AI', '教师提示词', 'ChatGPT教育', 'Claude教学'
    ],
    openGraph: {
      title: '教师AI助手 - 专业教育AI提示词生成器',
      description: '为教师和教育工作者定制的AI提示词工具',
      url: 'https://ai-prompt-builder-pro.vercel.app/teacher',
      images: ['/og-teacher.jpg'],
    },
  } as Metadata,

  insurance: {
    title: '保险顾问AI助手 - 专业保险AI提示词生成器',
    description: '为保险顾问和从业者定制的AI提示词工具，涵盖风险评估、产品推荐、理赔指导、客户教育等保险场景，提升保险服务专业度',
    keywords: [
      '保险AI工具', '保险顾问AI', '风险评估AI', '产品推荐AI', 
      '理赔指导AI', '保险提示词', 'ChatGPT保险', 'Claude保险'
    ],
    openGraph: {
      title: '保险顾问AI助手 - 专业保险AI提示词生成器',
      description: '为保险顾问和从业者定制的AI提示词工具',
      url: 'https://ai-prompt-builder-pro.vercel.app/insurance',
      images: ['/og-insurance.jpg'],
    },
  } as Metadata,

  accountant: {
    title: '会计师AI助手 - 专业财务AI提示词生成器',
    description: '为会计师和财务专业人员定制的AI提示词工具，涵盖财务分析、税务规划、审计支持、报表解读等财务场景，提升财务工作效率',
    keywords: [
      '会计AI工具', '财务AI助手', '财务分析AI', '税务规划AI', 
      '审计支持AI', '会计提示词', 'ChatGPT会计', 'Claude财务'
    ],
    openGraph: {
      title: '会计师AI助手 - 专业财务AI提示词生成器',
      description: '为会计师和财务专业人员定制的AI提示词工具',
      url: 'https://ai-prompt-builder-pro.vercel.app/accountant',
      images: ['/og-accountant.jpg'],
    },
  } as Metadata,

  realtor: {
    title: '房产经纪人AI助手 - 专业房地产AI提示词生成器',
    description: '为房产经纪人和地产从业者定制的AI提示词工具，涵盖市场分析、客户咨询、投资建议、房源描述等专业场景',
    keywords: [
      '房产AI工具', '地产经纪人AI', '房产分析AI', '投资建议AI', 
      '房源描述AI', '地产提示词', 'ChatGPT房产', 'Claude地产'
    ],
    openGraph: {
      title: '房产经纪人AI助手 - 专业房地产AI提示词生成器',
      description: '为房产经纪人和地产从业者定制的AI提示词工具',
      url: 'https://ai-prompt-builder-pro.vercel.app/realtor',
      images: ['/og-realtor.jpg'],
    },
  } as Metadata
}

// 导出函数来获取特定行业的 metadata
export function getIndustryMetadata(industry: keyof typeof industryMetadata): Metadata {
  return industryMetadata[industry]
}