import { NextResponse } from 'next/server';

// 🔧 AI提示词生成器 - 修复版
// 版本: v2.1 - 简化但稳定的错误处理

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

// 详细的错误日志函数
function logDetailedError(step: string, error: any, context?: any) {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    step,
    error: error instanceof Error ? {
      message: error.message,
      name: error.name,
      stack: error.stack?.substring(0, 500)
    } : error,
    context,
    environment: {
      hasApiKey: !!OPENROUTER_API_KEY,
      apiKeyLength: OPENROUTER_API_KEY?.length || 0,
      baseUrl: OPENROUTER_BASE_URL,
      nodeEnv: process.env.NODE_ENV
    }
  };
  
  console.error('🚨 详细错误信息:', JSON.stringify(errorInfo, null, 2));
  return errorInfo;
}

// 专业的行业知识库 - 包含真实的行业洞察
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

// 生成智能提示词
async function generateIntelligentPrompt(
  industry: string,
  scenario: string,
  goal: string,
  requirements: string,
  context?: string
) {
  console.log('🚀 开始生成AI提示词:', { industry, scenario, goal: goal.substring(0, 50) });
  
  const knowledge = industryKnowledge[industry as keyof typeof industryKnowledge];
  
  if (!knowledge) {
    throw new Error('不支持的行业类型');
  }

  // 构建超级详细的系统提示词
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

  // 构建用户消息
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
    console.log('📡 发送请求到OpenRouter API...');
    
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://www.aiprompts.ink',
        'X-Title': 'AI Prompt Generator V2'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet', // 使用更强大的模型
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.9
      }),
      signal: AbortSignal.timeout(30000) // 30秒超时
    });

    console.log('📥 API响应状态:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API请求失败:', response.status, errorText);
      throw new Error(`API请求失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ API响应成功');

    const generatedPrompt = data.choices?.[0]?.message?.content;
    if (!generatedPrompt) {
      throw new Error('API返回了空的提示词内容');
    }

    return generatedPrompt;

  } catch (error) {
    console.error('💥 生成提示词异常:', error);
    throw error;
  }
}

// 提示词质量评分
async function evaluatePromptQuality(prompt: string): Promise<number> {
  // 评分标准
  const criteria = {
    length: prompt.length > 500 ? 20 : prompt.length / 25, // 长度分
    structure: prompt.includes('步骤') || prompt.includes('Step') ? 20 : 0, // 结构分
    specificity: (prompt.match(/\d+/g) || []).length * 2, // 具体数字
    professional: (prompt.match(/专业|标准|规范|准则/g) || []).length * 3, // 专业度
    actionable: prompt.includes('输出') || prompt.includes('格式') ? 20 : 0 // 可执行性
  };

  const score = Object.values(criteria).reduce((a, b) => a + b, 0);
  return Math.min(100, score);
}

export async function POST(request: Request) {
  const startTime = Date.now();
  console.log('🚀 处理提示词生成请求...');

  try {
    const body = await request.json();
    const { industry, scenario, goal, requirements, context, locale = 'zh' } = body;

    console.log('📝 请求参数:', {
      industry: !!industry,
      scenario: !!scenario,
      goal: !!goal,
      hasRequirements: !!requirements,
      locale
    });

    // 验证必填字段
    if (!industry || !scenario || !goal) {
      logDetailedError('input_validation', {
        missingFields: { industry: !industry, scenario: !scenario, goal: !goal }
      }, body);
      
      return NextResponse.json({
        success: false,
        error: locale === 'zh' ? '请填写完整信息：行业、场景和目标都是必需的' : 'Please fill in all required fields',
        errorType: 'INVALID_INPUT'
      }, { status: 400 });
    }

    // 检查API密钥
    if (!OPENROUTER_API_KEY) {
      logDetailedError('api_key_missing', {
        message: 'OPENROUTER_API_KEY environment variable is not set',
        suggestion: '请确保 .env.local 文件存在且包含正确的 OPENROUTER_API_KEY'
      });
      
      return NextResponse.json({
        success: false,
        error: locale === 'zh' ? 'API密钥未配置。请检查环境变量 OPENROUTER_API_KEY 是否正确设置。' : 'API key not configured',
        errorType: 'MISSING_API_KEY',
        debugInfo: {
          suggestion: '请确保 .env.local 文件存在且包含正确的 OPENROUTER_API_KEY',
          hasApiKey: !!OPENROUTER_API_KEY,
          baseUrl: OPENROUTER_BASE_URL
        }
      }, { status: 500 });
    }

    // 生成智能提示词
    console.log('🤖 开始AI生成...');
    const intelligentPrompt = await generateIntelligentPrompt(
      industry,
      scenario,
      goal,
      requirements || '',
      context
    );

    // 评估质量
    const qualityScore = await evaluatePromptQuality(intelligentPrompt);
    console.log(`📊 提示词质量评分: ${qualityScore}/100`);

    // 如果质量太低，重新生成
    if (qualityScore < 60) {
      console.log('⚠️ 提示词质量不足，重新生成...');
      try {
        const improvedPrompt = await generateIntelligentPrompt(
          industry,
          scenario,
          goal,
          requirements + ' [要求：更详细、更专业、更具体]',
          context
        );
        
        const improvedQuality = await evaluatePromptQuality(improvedPrompt);
        console.log(`✨ 改进后质量评分: ${improvedQuality}/100`);
        
        const responseTime = Date.now() - startTime;
        return NextResponse.json({
          success: true,
          prompt: improvedPrompt,
          qualityScore: improvedQuality,
          method: 'ai-enhanced-v2-improved',
          model: 'claude-3.5-sonnet',
          industry: industryKnowledge[industry as keyof typeof industryKnowledge]?.name,
          responseTime,
          improved: true
        });
      } catch (retryError) {
        logDetailedError('retry_generation_failed', retryError, { originalQuality: qualityScore });
        // 如果重试失败，返回原始结果
      }
    }

    const responseTime = Date.now() - startTime;
    console.log(`🎉 请求完成, 用时: ${responseTime}ms`);

    return NextResponse.json({
      success: true,
      prompt: intelligentPrompt,
      qualityScore,
      method: 'ai-enhanced-v2',
      model: 'claude-3.5-sonnet',
      industry: industryKnowledge[industry as keyof typeof industryKnowledge]?.name,
      responseTime
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorInfo = logDetailedError('request_processing_failed', error, { responseTime });
    
    console.error(`❌ 请求失败, 用时: ${responseTime}ms`);
    
    // 根据错误类型返回不同的错误信息
    let userErrorMessage = '生成失败，请稍后重试';
    let errorType = 'UNKNOWN';
    
    if (error instanceof Error) {
      if (error.message.includes('API请求失败')) {
        userErrorMessage = 'OpenRouter API调用失败，请稍后重试';
        errorType = 'API_ERROR';
      } else if (error.message.includes('fetch')) {
        userErrorMessage = '网络连接失败，请检查网络后重试';
        errorType = 'NETWORK_ERROR';
      } else if (error.name === 'AbortError') {
        userErrorMessage = '请求超时，请稍后重试';
        errorType = 'TIMEOUT';
      }
    }
    
    return NextResponse.json({
      success: false,
      error: userErrorMessage,
      errorType,
      errorId: errorInfo.timestamp,
      debugInfo: {
        originalError: error instanceof Error ? error.message : String(error),
        responseTime
      }
    }, { status: 500 });
  }
}

// 获取行业列表（支持国际化）
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'zh';
    
    return NextResponse.json({
      industries: Object.entries(industryKnowledge).map(([key, value]) => ({
        id: key,
        name: value.name,
        expertise: value.expertise
      })),
      locale,
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logDetailedError('get_industries_failed', error);
    
    return NextResponse.json({
      success: false,
      error: '获取行业列表失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}