/**
 * 行业配置常量
 * 定义五个垂直行业的主题、图标和配置信息
 */

import { 
  Scale, 
  Home, 
  Shield, 
  GraduationCap, 
  Calculator,
  type LucideIcon
} from 'lucide-react';

export interface Industry {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  icon: LucideIcon;
  color: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  scenarios: number;
  features: string[];
}

export const INDUSTRIES: Record<string, Industry> = {
  lawyer: {
    id: 'lawyer',
    name: '律师',
    nameEn: 'Lawyer',
    description: '合同审查、案例分析、法律研究、文书起草',
    icon: Scale,
    color: {
      primary: '#1e3a8a', // 深蓝色 - 专业、权威
      secondary: '#3b82f6',
      accent: '#e0f2fe',
      background: 'from-blue-50 to-indigo-50'
    },
    scenarios: 24,
    features: ['合同审查', '案例分析', '法律研究', '文书起草']
  },
  realtor: {
    id: 'realtor',
    name: '房产经纪人',
    nameEn: 'Real Estate',
    description: '市场分析、客户咨询、投资建议、房源描述',
    icon: Home,
    color: {
      primary: '#059669', // 绿色 - 成长、稳定
      secondary: '#10b981',
      accent: '#ecfdf5',
      background: 'from-emerald-50 to-green-50'
    },
    scenarios: 18,
    features: ['市场分析', '客户咨询', '投资建议', '房源描述']
  },
  insurance: {
    id: 'insurance',
    name: '保险顾问',
    nameEn: 'Insurance',
    description: '风险评估、产品推荐、理赔指导、客户教育',
    icon: Shield,
    color: {
      primary: '#7c3aed', // 紫色 - 信任、保障
      secondary: '#8b5cf6',
      accent: '#f3e8ff',
      background: 'from-violet-50 to-purple-50'
    },
    scenarios: 21,
    features: ['风险评估', '产品推荐', '理赔指导', '客户教育']
  },
  teacher: {
    id: 'teacher',
    name: '教师',
    nameEn: 'Teacher',
    description: '教学设计、学生评估、课程规划、作业设计',
    icon: GraduationCap,
    color: {
      primary: '#ea580c', // 橙色 - 活力、启发
      secondary: '#f97316',
      accent: '#fff7ed',
      background: 'from-orange-50 to-amber-50'
    },
    scenarios: 27,
    features: ['教学设计', '学生评估', '课程规划', '作业设计']
  },
  accountant: {
    id: 'accountant',
    name: '会计师',
    nameEn: 'Accountant',
    description: '财务分析、税务规划、审计支持、报表解读',
    icon: Calculator,
    color: {
      primary: '#dc2626', // 红色 - 准确、财务
      secondary: '#ef4444',
      accent: '#fef2f2',
      background: 'from-red-50 to-rose-50'
    },
    scenarios: 19,
    features: ['财务分析', '税务规划', '审计支持', '报表解读']
  }
};

export const INDUSTRY_IDS = Object.keys(INDUSTRIES) as (keyof typeof INDUSTRIES)[];

export const getIndustryById = (id: string): Industry | undefined => {
  return INDUSTRIES[id];
};

export const getIndustryColor = (industryId: string) => {
  const industry = getIndustryById(industryId);
  return industry?.color || INDUSTRIES.lawyer.color;
};