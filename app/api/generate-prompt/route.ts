import { NextResponse } from 'next/server';

// 环境变量
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

// 简单的内存缓存
const cache = new Map<string, { data: string; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1小时

// 行业专业知识库
const industryTemplates = {
  lawyer: {
    name: '法律专业',
    templates: {
      '合同审查': {
        base: `作为一名拥有15年经验的资深合同法律师，我需要你帮我进行专业的合同审查。

请按照以下步骤进行分析：

1. **合同基本信息识别**
   - 合同类型和性质
   - 合同主体资格审查
   - 合同金额和支付条款

2. **关键条款审查**（重点关注）
   - 权利义务条款的对等性
   - 违约责任条款的合理性
   - 争议解决条款的可执行性
   - 保密条款的完整性
   - 终止条款的明确性

3. **风险点识别**
   - 隐含的法律风险
   - 商业风险评估
   - 执行难点预判

4. **修改建议**
   - 具体条款的修改意见
   - 新增条款的建议
   - 谈判要点提示

请用专业但易懂的语言，输出结构化的审查报告。`,
        enhancement: (context: string) => `

具体审查要求：
${context}

特别注意：
- 重点关注可能损害我方利益的条款
- 识别所有模糊不清的表述
- 提供可操作的修改建议
- 引用相关法律条文支持观点`
      },
      '案例分析': {
        base: `作为一名专精于诉讼业务的资深律师，我需要你协助进行深度案例分析。

分析框架：

1. **案情梳理**
   - 时间线整理
   - 关键事实提取
   - 争议焦点识别

2. **法律分析**
   - 适用法律条文
   - 相似案例对比
   - 法理论证

3. **证据评估**
   - 现有证据分析
   - 证据链完整性
   - 补充证据建议

4. **策略建议**
   - 诉讼策略
   - 和解可能性
   - 风险与机会

输出专业的案例分析报告，包含具体的行动建议。`,
        enhancement: (context: string) => `

案件具体情况：
${context}

分析重点：
- 胜诉概率评估
- 关键证据的证明力
- 对方可能的抗辩策略
- 最优诉讼路径建议`
      }
    }
  },
  realtor: {
    name: '房地产',
    templates: {
      '市场分析': {
        base: `作为一名拥有10年经验的资深房地产顾问，我将为您提供专业的市场分析。

分析维度：

1. **区域市场概况**
   - 供需关系分析
   - 价格走势判断
   - 政策影响评估

2. **项目竞争力分析**
   - 地段价值评估
   - 产品力对比
   - 定价策略建议

3. **投资价值判断**
   - ROI测算
   - 风险收益比
   - 持有策略建议

4. **交易时机建议**
   - 最佳入市时机
   - 议价空间分析
   - 交易注意事项`,
        enhancement: (context: string) => `

具体分析需求：
${context}

请提供：
- 具体数据支撑
- 3-6个月趋势预测
- 可执行的操作建议`
      }
    }
  },
  insurance: {
    name: '保险顾问',
    templates: {
      '风险评估': {
        base: `作为资深保险规划师，我将为您提供全面的风险评估和保险方案。

评估框架：

1. **风险识别**
   - 人身风险
   - 财产风险
   - 责任风险
   - 信用风险

2. **保障缺口分析**
   - 现有保障梳理
   - 保障需求计算
   - 缺口定量分析

3. **产品推荐**
   - 产品特点对比
   - 保费预算规划
   - 投保顺序建议

4. **方案优化**
   - 保障组合设计
   - 缴费期限选择
   - 受益人安排建议`,
        enhancement: (context: string) => `

客户具体情况：
${context}

定制化建议：
- 根据预算优化方案
- 考虑税务筹划
- 长期保障规划`
      }
    }
  },
  teacher: {
    name: '教育工作者',
    templates: {
      '教学设计': {
        base: `作为经验丰富的教育专家，我将帮您设计高效的教学方案。

设计框架：

1. **教学目标设定**
   - 知识目标
   - 能力目标
   - 情感目标

2. **教学方法选择**
   - 适配学生特点
   - 激发学习兴趣
   - 促进深度理解

3. **教学活动设计**
   - 导入环节
   - 新知讲授
   - 练习巩固
   - 总结提升

4. **评价方式设计**
   - 形成性评价
   - 总结性评价
   - 多元化评价`,
        enhancement: (context: string) => `

具体教学需求：
${context}

请确保：
- 符合课程标准
- 贴近学生实际
- 具有可操作性`
      }
    }
  },
  accountant: {
    name: '会计师',
    templates: {
      '财务分析': {
        base: `作为资深财务分析师，我将提供专业的财务分析报告。

分析框架：

1. **财务状况评估**
   - 资产负债分析
   - 现金流分析
   - 盈利能力分析

2. **关键指标计算**
   - 流动性指标
   - 营运效率指标
   - 盈利能力指标
   - 发展能力指标

3. **问题诊断**
   - 异常数据识别
   - 风险点分析
   - 改进机会发现

4. **优化建议**
   - 成本控制方案
   - 资金管理建议
   - 税务筹划思路`,
        enhancement: (context: string) => `

具体分析要求：
${context}

重点关注：
- 同行业对比
- 趋势分析
- 可行性建议`
      }
    }
  }
};

// 生成专业提示词的本地增强版本
function generateLocalEnhancedPrompt(
  industry: string,
  scenario: string,
  goal: string,
  requirements: string
): string {
  const industryData = industryTemplates[industry as keyof typeof industryTemplates];
  
  if (!industryData) {
    return `请帮我生成关于"${goal}"的专业提示词。要求：${requirements}`;
  }

  // 查找匹配的模板
  const templates = industryData.templates;
  let selectedTemplate = null;
  
  for (const [key, template] of Object.entries(templates)) {
    if (scenario.includes(key) || key.includes(scenario)) {
      selectedTemplate = template;
      break;
    }
  }

  if (!selectedTemplate) {
    // 使用第一个模板作为默认
    selectedTemplate = Object.values(templates)[0];
  }

  // 生成增强的提示词
  const basePrompt = selectedTemplate.base;
  const enhancement = selectedTemplate.enhancement(requirements || goal);
  
  return `${basePrompt}${enhancement}

---
【任务目标】
${goal}

【输出要求】
1. 结构清晰，逻辑严密
2. 专业术语准确，表述规范
3. 建议具体可行，具有操作性
4. 根据实际情况灵活调整

请开始你的专业分析：`;
}

// 生成缓存键
function getCacheKey(params: any): string {
  return `${params.industry}-${params.scenario}-${params.goal}`.toLowerCase();
}

// 清理过期缓存
function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      cache.delete(key);
    }
  }
}

export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { industry, scenario, goal, requirements, context, locale = 'zh' } = body;

    console.log(`[API] 收到请求:`, { 
      industry, 
      scenario,
      timestamp: new Date().toISOString()
    });

    // 验证必填字段
    if (!industry || !scenario || !goal) {
      return NextResponse.json({
        success: false,
        error: locale === 'zh' ? '请填写完整信息' : 'Please fill in all required fields'
      }, { status: 400 });
    }

    // 检查缓存
    const cacheKey = getCacheKey({ industry, scenario, goal });
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('[API] 返回缓存结果');
      return NextResponse.json({
        success: true,
        prompt: cached.data,
        source: 'cache',
        responseTime: `${Date.now() - startTime}ms`
      });
    }

    // 如果有API密钥，尝试调用OpenRouter
    if (OPENROUTER_API_KEY && OPENROUTER_API_KEY.startsWith('sk-or-')) {
      try {
        console.log('[API] 调用OpenRouter API...');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时

        const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://ai-prompt-generator.vercel.app',
            'X-Title': 'AI Prompt Builder Pro'
          },
          body: JSON.stringify({
            model: 'anthropic/claude-3.5-sonnet',
            messages: [
              {
                role: 'system',
                content: `你是世界顶级的${industryTemplates[industry as keyof typeof industryTemplates]?.name || industry}领域提示词工程专家。
                
你的任务是生成极其专业、详细、可立即使用的AI提示词。生成的提示词必须：
1. 包含明确的角色定位和专业背景
2. 详细的任务分解（至少5个步骤）
3. 具体的输出要求和格式
4. 相关的专业术语和行业标准
5. 至少500字以上的详细内容`
              },
              {
                role: 'user',
                content: `请为以下需求生成专业的AI提示词：

【行业】${industry}
【场景】${scenario}
【目标】${goal}
【具体要求】${requirements || context || '无'}

要求生成的提示词要让用户直接复制给ChatGPT/Claude使用，就能得到专业的结果。`
              }
            ],
            temperature: 0.7,
            max_tokens: 2000
          }),
          signal: controller.signal
        }).finally(() => clearTimeout(timeoutId));

        if (response.ok) {
          const data = await response.json();
          const aiGeneratedPrompt = data.choices[0]?.message?.content;
          
          if (aiGeneratedPrompt) {
            // 缓存结果
            cache.set(cacheKey, {
              data: aiGeneratedPrompt,
              timestamp: Date.now()
            });
            
            // 定期清理缓存
            cleanExpiredCache();
            
            return NextResponse.json({
              success: true,
              prompt: aiGeneratedPrompt,
              source: 'ai',
              model: 'claude-3.5-sonnet',
              responseTime: `${Date.now() - startTime}ms`
            });
          }
        }
      } catch (error) {
        console.error('[API] OpenRouter调用失败，使用本地增强:', error);
      }
    }

    // 降级方案：使用本地增强生成
    console.log('[API] 使用本地增强生成提示词');
    const enhancedPrompt = generateLocalEnhancedPrompt(
      industry,
      scenario,
      goal,
      requirements || context || ''
    );

    // 缓存本地生成的结果
    cache.set(cacheKey, {
      data: enhancedPrompt,
      timestamp: Date.now()
    });

    return NextResponse.json({
      success: true,
      prompt: enhancedPrompt,
      source: 'local-enhanced',
      responseTime: `${Date.now() - startTime}ms`,
      notice: OPENROUTER_API_KEY ? undefined : '使用本地增强版本。配置API密钥可获得更智能的结果。'
    });

  } catch (error: any) {
    console.error('[API] 处理请求失败:', error);
    
    return NextResponse.json({
      success: false,
      error: '生成失败，请稍后重试',
      details: error.message
    }, { status: 500 });
  }
}

// GET端点用于健康检查
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    hasApiKey: !!OPENROUTER_API_KEY,
    cacheSize: cache.size,
    industries: Object.keys(industryTemplates),
    message: '✅ API运行正常'
  });
}