/**
 * 订阅计划API端点
 * 使用JSON存储系统
 */

import { NextRequest, NextResponse } from 'next/server'

// 完整的订阅计划信息
const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: '免费版',
    description: '适合个人用户和初学者',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: [
      '每月50次AI生成',
      '基础提示词模板',
      '7天历史记录',
      '基础AI模型',
      '社区支持'
    ],
    limitations: [
      '不能使用高级模板',
      '不能导出历史记录',
      '不能使用GPT-4模型'
    ],
    limits: {
      generationsPerMonth: 50,
      templatesAccess: 'basic',
      historyDays: 7,
      models: ['gemini-pro', 'claude-haiku', 'llama-3']
    },
    recommended: false,
    badge: null
  },
  pro: {
    id: 'pro',
    name: '专业版',
    description: '适合专业人士和小型团队',
    price: 4.99,
    currency: 'USD',
    interval: 'month',
    features: [
      '每月500次AI生成',
      '所有高级模板',
      '30天历史记录',
      '标准AI模型（Claude Sonnet）',
      '优先技术支持',
      '批量导出功能',
      '自定义提示词模板'
    ],
    limitations: [
      '不能使用最强AI模型',
      '不支持团队协作'
    ],
    limits: {
      generationsPerMonth: 500,
      templatesAccess: 'premium',
      historyDays: 30,
      models: ['claude-sonnet', 'gpt-3.5-turbo', 'mistral-medium']
    },
    recommended: true,
    badge: '最受欢迎'
  },
  team: {
    id: 'team',
    name: '团队版',
    description: '适合企业和大型团队',
    price: 19.99,
    currency: 'USD',
    interval: 'month',
    features: [
      '无限次AI生成',
      '所有模板无限制',
      '无限历史记录',
      '最强AI模型（GPT-4、Claude Opus）',
      '专属客户经理',
      'API访问权限',
      '团队协作功能',
      '自定义训练模型',
      '优先处理队列',
      'SLA服务保障'
    ],
    limitations: [],
    limits: {
      generationsPerMonth: -1, // 无限
      templatesAccess: 'all',
      historyDays: -1, // 无限
      models: ['gpt-4-turbo', 'claude-opus', 'gemini-pro-1.5']
    },
    recommended: false,
    badge: '企业首选'
  }
};

/**
 * 获取所有订阅计划
 */
export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const includeComparison = searchParams.get('comparison') === 'true';
    const currency = searchParams.get('currency') || 'USD';
    
    // 构建响应数据
    const plans = Object.values(SUBSCRIPTION_PLANS);
    
    // 如果需要比较数据
    let comparison = null;
    if (includeComparison) {
      comparison = {
        features: [
          {
            name: '每月生成次数',
            free: '50次',
            pro: '500次',
            team: '无限'
          },
          {
            name: 'AI模型质量',
            free: '基础模型',
            pro: '标准模型',
            team: '顶级模型'
          },
          {
            name: '模板访问',
            free: '基础模板',
            pro: '所有模板',
            team: '所有模板+自定义'
          },
          {
            name: '历史记录',
            free: '7天',
            pro: '30天',
            team: '永久'
          },
          {
            name: '导出功能',
            free: '❌',
            pro: '✅',
            team: '✅'
          },
          {
            name: 'API访问',
            free: '❌',
            pro: '❌',
            team: '✅'
          },
          {
            name: '团队协作',
            free: '❌',
            pro: '❌',
            team: '✅'
          },
          {
            name: '技术支持',
            free: '社区',
            pro: '优先',
            team: '专属经理'
          }
        ]
      };
    }
    
    return NextResponse.json({
      success: true,
      data: {
        plans,
        comparison,
        currency,
        promotions: {
          annual_discount: 0.2, // 年付8折
          code: 'EARLY2025',
          message: '限时优惠：年付享8折优惠！'
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('[Plans API] 获取计划失败:', error);
    
    return NextResponse.json({
      success: false,
      error: '获取订阅计划失败',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}