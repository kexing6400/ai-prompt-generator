import { NextResponse } from 'next/server';

// 强制动态渲染 - 确保每次请求都重新执行
export const dynamic = 'force-dynamic';


// 环境变量
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

// 行业知识库
const industryKnowledge = {
  lawyer: {
    name: '法律专业',
    expertise: {
      contracts: {
        keyPoints: ['付款条款', '违约责任', '争议解决', '保密条款', '终止条件'],
        redFlags: ['无限责任', '单方面修改权', '放弃诉讼权', '过高违约金'],
        negotiation: ['分期付款', '责任上限', '仲裁条款', '知识产权归属']
      },
      litigation: {
        phases: ['立案', '举证', '质证', '辩论', '判决'],
        evidence: ['书证', '物证', '证人证言', '鉴定意见', '视听资料'],
        strategies: ['证据链构建', '法律适用', '程序瑕疵', '和解时机']
      }
    }
  },
  realtor: {
    name: '房地产',
    expertise: {
      valuation: {
        factors: ['地段位置', '学区资源', '交通便利', '物业品质', '升值潜力'],
        metrics: ['单价对比', '租售比', '供需关系', '成交周期', '议价空间'],
        trends: ['政策影响', '人口流动', '产业布局', '城市规划', '金融环境']
      },
      marketing: {
        channels: ['线上平台', '中介网络', '社区推广', '老客户转介', '开发商合作'],
        techniques: ['VR看房', '直播带看', '社群营销', '内容营销', '数据分析']
      }
    }
  },
  insurance: {
    name: '保险顾问',
    expertise: {
      riskAssessment: {
        personal: ['健康状况', '职业风险', '生活习惯', '家族病史', '财务状况'],
        business: ['行业风险', '经营规模', '现金流', '负债率', '合规风险'],
        methods: ['定量分析', '定性评估', '压力测试', '情景模拟', '历史数据']
      },
      products: {
        life: ['定期寿险', '终身寿险', '两全保险', '年金保险', '万能险'],
        health: ['重疾险', '医疗险', '意外险', '护理险', '补充医疗'],
        property: ['车险', '家财险', '责任险', '工程险', '货运险']
      }
    }
  },
  teacher: {
    name: '教育工作者',
    expertise: {
      pedagogy: {
        methods: ['项目式学习', '翻转课堂', '合作学习', '探究式教学', '差异化教学'],
        assessment: ['形成性评价', '总结性评价', '同伴评价', '自我评价', '档案评价'],
        technology: ['在线平台', '教育软件', 'AI辅助', '虚拟实验', '游戏化学习']
      },
      classroom: {
        management: ['规则建立', '积极强化', '行为契约', '座位安排', '时间管理'],
        engagement: ['提问技巧', '小组讨论', '角色扮演', '案例教学', '实践活动']
      }
    }
  },
  accountant: {
    name: '会计师',
    expertise: {
      financial: {
        statements: ['资产负债表', '利润表', '现金流量表', '所有者权益变动表', '附注'],
        analysis: ['比率分析', '趋势分析', '同业对比', '杜邦分析', '现金流分析'],
        planning: ['预算编制', '成本控制', '投资决策', '融资方案', '税务筹划']
      },
      compliance: {
        standards: ['企业会计准则', '国际财务报告准则', '税法法规', '审计准则', '内控规范'],
        reporting: ['季度报告', '年度报告', '税务申报', '统计报表', '监管报告']
      }
    }
  }
};

// 详细错误日志
function logDetailedError(error: any, context: string) {
  console.error(`[${new Date().toISOString()}] API错误 - ${context}:`, {
    message: error.message || '未知错误',
    stack: error.stack,
    context,
    env: {
      hasApiKey: !!OPENROUTER_API_KEY,
      apiKeyPrefix: OPENROUTER_API_KEY?.substring(0, 10) + '...',
      baseUrl: OPENROUTER_BASE_URL
    }
  });
}

// 生成智能提示词
async function generateIntelligentPrompt(
  industry: string,
  scenario: string,
  goal: string,
  requirements: string,
  context?: string
) {
  const knowledge = industryKnowledge[industry as keyof typeof industryKnowledge];
  
  if (!knowledge) {
    throw new Error(`不支持的行业类型: ${industry}`);
  }

  const systemPrompt = `你是世界顶级的${knowledge.name}领域提示词工程专家，拥有20年以上的行业经验。

你的任务是基于用户的需求，生成一个极其专业、详细、可立即使用的AI提示词。

你必须：
1. 深度理解${knowledge.name}行业的专业知识和最佳实践
2. 分析用户的具体场景和目标，识别关键需求
3. 生成的提示词必须包含：
   - 明确的角色定位（包括经验年限、专业领域、成功案例）
   - 详细的任务分解（至少5个步骤）
   - 具体的检查清单（至少10个要点）
   - 专业术语和行业标准
   - 输出格式要求
   - 质量标准和验收条件

行业专业知识库：
${JSON.stringify(knowledge.expertise, null, 2)}

记住：生成的提示词质量必须让用户感到"这是我自己绝对想不到的专业水准"！`;

  const userMessage = `请为以下需求生成专业的AI提示词：

【行业】${knowledge.name}
【场景】${scenario}
【目标】${goal}
【具体要求】${requirements}
${context ? `【补充信息】${context}` : ''}

要求：
1. 提示词必须超过500字，包含丰富的专业细节
2. 必须包含该场景下的具体操作步骤
3. 必须包含常见陷阱和注意事项
4. 必须提供具体的输出示例
5. 语言要专业但不晦涩，让AI能准确理解并执行`;

  try {
    console.log('[API] 开始调用OpenRouter API...');
    
    // 添加超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://www.aiprompts.ink',
        'X-Title': 'AI Prompt Generator V3'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.9
      }),
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] OpenRouter响应错误:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      if (response.status === 401) {
        throw new Error('API密钥无效或过期');
      } else if (response.status === 429) {
        throw new Error('API请求频率限制');
      } else if (response.status === 500) {
        throw new Error('OpenRouter服务器错误');
      } else {
        throw new Error(`API请求失败: ${response.status} - ${errorText}`);
      }
    }

    const data = await response.json();
    console.log('[API] OpenRouter响应成功');
    return data.choices[0]?.message?.content;
    
  } catch (error: any) {
    logDetailedError(error, 'generateIntelligentPrompt');
    
    if (error.name === 'AbortError') {
      throw new Error('请求超时，请稍后重试');
    } else if (error.message?.includes('密钥')) {
      throw new Error('API密钥配置错误');
    } else if (error.message?.includes('network')) {
      throw new Error('网络连接失败');
    } else {
      throw error;
    }
  }
}

// 提示词质量评分
async function evaluatePromptQuality(prompt: string): Promise<number> {
  const criteria = {
    length: prompt.length > 500 ? 20 : prompt.length / 25,
    structure: prompt.includes('步骤') || prompt.includes('Step') ? 20 : 0,
    specificity: (prompt.match(/\d+/g) || []).length * 2,
    professional: (prompt.match(/专业|标准|规范|准则/g) || []).length * 3,
    actionable: prompt.includes('输出') || prompt.includes('格式') ? 20 : 0
  };

  const score = Object.values(criteria).reduce((a, b) => a + b, 0);
  return Math.min(100, score);
}

export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { industry, scenario, goal, requirements, context, locale = 'zh' } = body;

    console.log(`[API] 收到请求:`, { 
      industry, 
      scenario, 
      locale, 
      timestamp: new Date().toISOString(),
      hasApiKey: !!OPENROUTER_API_KEY,
      apiKeyPrefix: OPENROUTER_API_KEY?.substring(0, 15)
    });

    // 验证必填字段
    if (!industry || !scenario || !goal) {
      console.warn('[API] 缺少必填字段');
      return NextResponse.json({
        success: false,
        error: locale === 'zh' ? '请填写完整信息' : 'Please fill in all required fields',
        details: { industry, scenario, goal }
      }, { status: 400 });
    }

    // 检查API密钥
    if (!OPENROUTER_API_KEY) {
      console.error('[API] OPENROUTER_API_KEY未配置');
      return NextResponse.json({
        success: false,
        error: locale === 'zh' ? 
          'API密钥未配置。请在Vercel控制台设置OPENROUTER_API_KEY环境变量' : 
          'API key not configured. Please set OPENROUTER_API_KEY in Vercel dashboard',
        errorCode: 'MISSING_API_KEY',
        suggestion: '访问 Vercel Dashboard > Settings > Environment Variables'
      }, { status: 500 });
    }

    console.log('[API] 环境变量检查通过，准备生成提示词');

    // 生成智能提示词
    const intelligentPrompt = await generateIntelligentPrompt(
      industry,
      scenario,
      goal,
      requirements || '',
      context
    );

    // 评估质量
    const qualityScore = await evaluatePromptQuality(intelligentPrompt);
    console.log(`[API] 提示词质量分数: ${qualityScore}/100`);

    // 如果质量太低，重新生成
    if (qualityScore < 60) {
      console.log('[API] 质量分数不足，重新生成...');
      const improvedPrompt = await generateIntelligentPrompt(
        industry,
        scenario,
        goal,
        requirements + ' [要求：更详细、更专业、更具体]',
        context
      );
      
      const responseTime = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        prompt: improvedPrompt,
        qualityScore: await evaluatePromptQuality(improvedPrompt),
        method: 'ai-enhanced-v3',
        model: 'claude-3.5-sonnet',
        industry: industryKnowledge[industry as keyof typeof industryKnowledge]?.name,
        responseTime: `${responseTime}ms`
      });
    }

    const responseTime = Date.now() - startTime;
    return NextResponse.json({
      success: true,
      prompt: intelligentPrompt,
      qualityScore,
      method: 'ai-enhanced-v3',
      model: 'claude-3.5-sonnet',
      industry: industryKnowledge[industry as keyof typeof industryKnowledge]?.name,
      responseTime: `${responseTime}ms`
    });

  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    logDetailedError(error, 'POST handler');
    
    // 返回详细的错误信息
    const errorResponse = {
      success: false,
      error: error.message || '生成失败，请稍后重试',
      errorCode: error.name || 'UNKNOWN_ERROR',
      details: {
        message: error.message,
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        suggestion: '请检查网络连接和API密钥配置',
        debugInfo: {
          hasApiKey: !!OPENROUTER_API_KEY,
          apiKeyLength: OPENROUTER_API_KEY?.length,
          baseUrl: OPENROUTER_BASE_URL
        }
      }
    };
    
    // 根据错误类型返回不同状态码
    const statusCode = error.message?.includes('密钥') ? 401 : 
                      error.message?.includes('超时') ? 504 :
                      error.message?.includes('网络') ? 503 : 500;
    
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// 调试端点
export async function GET(request: Request) {
  return NextResponse.json({
    status: 'API v3 运行中',
    timestamp: new Date().toISOString(),
    environment: {
      hasApiKey: !!OPENROUTER_API_KEY,
      apiKeyPrefix: OPENROUTER_API_KEY ? OPENROUTER_API_KEY.substring(0, 15) + '...' : 'NOT_SET',
      baseUrl: OPENROUTER_BASE_URL,
      nodeVersion: process.version
    },
    industries: Object.keys(industryKnowledge),
    message: '使用POST请求生成提示词'
  });
}