/**
 * 测试用例管理API
 * 提供测试场景的CRUD操作和批量测试功能
 * 作者：Claude Code (测试自动化专家)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/lib/server/admin-auth';
import { DynamicConfigService } from '@/lib/server/dynamic-config-service';

// 测试场景验证模式
const testScenarioSchema = z.object({
  name: z.string().min(1, '场景名称不能为空').max(200, '场景名称过长'),
  description: z.string().optional(),
  industry: z.string().min(1, '行业不能为空'),
  scenario: z.string().min(1, '场景不能为空'),
  goal: z.string().min(1, '目标不能为空'),
  requirements: z.string().min(1, '要求不能为空'),
  expected_output: z.string().optional(),
  active: z.boolean().default(true)
});

// 批量测试请求验证
const batchTestSchema = z.object({
  scenarioIds: z.array(z.string().uuid()).min(1, '至少选择一个测试场景'),
  modelIds: z.array(z.string()).optional(),
  timeout: z.number().min(10000).max(60000).default(30000)
});

/**
 * GET - 获取测试场景列表
 */
export const GET = withAdminAuth(async (request: NextRequest) => {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get('industry');
    const active = searchParams.get('active');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const configService = DynamicConfigService.getInstance();
    const client = configService['client'];

    if (!client) {
      return NextResponse.json({
        success: false,
        error: '数据库连接不可用'
      }, { status: 500 });
    }

    // 构建查询
    let query = client
      .from('test_scenarios')
      .select('*, test_results(id)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (industry) {
      query = query.eq('industry', industry);
    }

    if (active !== null) {
      query = query.eq('active', active === 'true');
    }

    const { data: scenarios, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // 计算统计信息
    const { data: stats } = await client
      .from('test_scenarios')
      .select('industry, active');

    let statistics = {
      total: 0,
      active: 0,
      inactive: 0,
      byIndustry: {} as Record<string, number>
    };

    if (stats) {
      statistics.total = stats.length;
      statistics.active = stats.filter(s => s.active).length;
      statistics.inactive = stats.length - statistics.active;
      
      stats.forEach(s => {
        statistics.byIndustry[s.industry] = (statistics.byIndustry[s.industry] || 0) + 1;
      });
    }

    return NextResponse.json({
      success: true,
      scenarios: scenarios || [],
      count: scenarios?.length || 0,
      statistics,
      pagination: {
        offset,
        limit,
        hasMore: scenarios && scenarios.length === limit
      },
      responseTime: `${Date.now() - startTime}ms`
    });

  } catch (error: any) {
    console.error('[测试场景] 获取场景列表失败:', error);

    return NextResponse.json({
      success: false,
      error: error.message || '获取场景列表失败',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 500 });
  }
});

/**
 * POST - 创建测试场景或执行批量测试
 */
export const POST = withAdminAuth(async (request: NextRequest, session) => {
  const startTime = Date.now();

  try {
    const body = await request.json();
    
    // 检查是否为批量测试请求
    if (body.scenarioIds && Array.isArray(body.scenarioIds)) {
      return await executeBatchTest(body, session, startTime);
    } else {
      return await createTestScenario(body, session, startTime);
    }

  } catch (error: any) {
    console.error('[测试场景] POST操作失败:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: '请求参数无效',
        details: error.issues,
        responseTime: `${Date.now() - startTime}ms`
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'POST操作失败',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 500 });
  }
});

/**
 * PUT - 更新测试场景
 */
export const PUT = withAdminAuth(async (request: NextRequest, session) => {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { id, ...updateData } = z.object({
      id: z.string().uuid('无效的场景ID'),
      ...testScenarioSchema.partial().shape
    }).parse(body);

    const configService = DynamicConfigService.getInstance();
    const client = configService['client'];

    if (!client) {
      return NextResponse.json({
        success: false,
        error: '数据库连接不可用'
      }, { status: 500 });
    }

    const { data: scenario, error } = await client
      .from('test_scenarios')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    console.log(`[测试场景] 更新场景成功: ${scenario.name}，会话: ${session.sessionId}`);

    return NextResponse.json({
      success: true,
      message: '测试场景更新成功',
      scenario,
      responseTime: `${Date.now() - startTime}ms`
    });

  } catch (error: any) {
    console.error('[测试场景] 更新场景失败:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: '请求参数无效',
        details: error.issues,
        responseTime: `${Date.now() - startTime}ms`
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || '更新场景失败',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 500 });
  }
});

/**
 * DELETE - 删除测试场景
 */
export const DELETE = withAdminAuth(async (request: NextRequest, session) => {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: '缺少场景ID参数'
      }, { status: 400 });
    }

    const configService = DynamicConfigService.getInstance();
    const client = configService['client'];

    if (!client) {
      return NextResponse.json({
        success: false,
        error: '数据库连接不可用'
      }, { status: 500 });
    }

    // 检查是否存在关联的测试结果
    const { data: results } = await client
      .from('test_results')
      .select('id')
      .eq('test_scenario_id', id);

    const hasResults = results && results.length > 0;

    if (hasResults) {
      // 如果有关联结果，只是标记为不活跃而不是物理删除
      const { error } = await client
        .from('test_scenarios')
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      console.log(`[测试场景] 软删除场景: ${id}，会话: ${session.sessionId}`);

      return NextResponse.json({
        success: true,
        message: '测试场景已标记为不活跃（存在历史结果）',
        responseTime: `${Date.now() - startTime}ms`
      });
    } else {
      // 物理删除
      const { error } = await client
        .from('test_scenarios')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      console.log(`[测试场景] 删除场景: ${id}，会话: ${session.sessionId}`);

      return NextResponse.json({
        success: true,
        message: '测试场景删除成功',
        responseTime: `${Date.now() - startTime}ms`
      });
    }

  } catch (error: any) {
    console.error('[测试场景] 删除场景失败:', error);

    return NextResponse.json({
      success: false,
      error: error.message || '删除场景失败',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 500 });
  }
});

/**
 * 创建测试场景
 */
async function createTestScenario(body: any, session: any, startTime: number) {
  const scenarioData = testScenarioSchema.parse(body);

  const configService = DynamicConfigService.getInstance();
  const client = configService['client'];

  if (!client) {
    return NextResponse.json({
      success: false,
      error: '数据库连接不可用'
    }, { status: 500 });
  }

  // 检查名称是否已存在
  const { data: existing } = await client
    .from('test_scenarios')
    .select('id')
    .eq('name', scenarioData.name)
    .single();

  if (existing) {
    return NextResponse.json({
      success: false,
      error: '场景名称已存在',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 400 });
  }

  const { data: scenario, error } = await client
    .from('test_scenarios')
    .insert(scenarioData)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  console.log(`[测试场景] 创建场景成功: ${scenario.name}，会话: ${session.sessionId}`);

  return NextResponse.json({
    success: true,
    message: '测试场景创建成功',
    scenario,
    responseTime: `${Date.now() - startTime}ms`
  }, { status: 201 });
}

/**
 * 执行批量测试
 */
async function executeBatchTest(body: any, session: any, startTime: number) {
  const { scenarioIds, modelIds, timeout } = batchTestSchema.parse(body);

  const configService = DynamicConfigService.getInstance();
  const client = configService['client'];

  if (!client) {
    return NextResponse.json({
      success: false,
      error: '数据库连接不可用'
    }, { status: 500 });
  }

  // 获取要测试的场景
  const { data: scenarios, error: scenarioError } = await client
    .from('test_scenarios')
    .select('*')
    .in('id', scenarioIds)
    .eq('active', true);

  if (scenarioError || !scenarios || scenarios.length === 0) {
    return NextResponse.json({
      success: false,
      error: '未找到有效的测试场景',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 400 });
  }

  // 获取要测试的模型
  let testModels = await configService.getAvailableModels();
  testModels = testModels.filter(m => m.enabled);

  if (modelIds && modelIds.length > 0) {
    testModels = testModels.filter(m => modelIds.includes(m.model_id));
  }

  if (testModels.length === 0) {
    return NextResponse.json({
      success: false,
      error: '没有可用的模型进行测试',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 400 });
  }

  console.log(`[批量测试] 开始执行 ${scenarios.length} 个场景 × ${testModels.length} 个模型，会话: ${session.sessionId}`);

  // 执行批量测试
  const results = [];
  const batchStartTime = Date.now();

  for (const scenario of scenarios) {
    for (const model of testModels) {
      try {
        const result = await executeScenarioTest(scenario, model, timeout);
        results.push(result);

        // 记录测试结果
        await recordTestResult(scenario.id, result);

      } catch (error: any) {
        results.push({
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          modelId: model.model_id,
          modelName: model.name,
          success: false,
          error: error.message,
          responseTime: 0
        });
      }
    }
  }

  const batchTime = Date.now() - batchStartTime;
  const successCount = results.filter(r => r.success).length;
  const successRate = (successCount / results.length * 100).toFixed(1);

  return NextResponse.json({
    success: successCount > 0,
    message: `批量测试完成: ${successCount}/${results.length} 成功`,
    results,
    summary: {
      totalTests: results.length,
      scenarios: scenarios.length,
      models: testModels.length,
      successCount,
      failureCount: results.length - successCount,
      successRate: `${successRate}%`,
      batchTime: `${batchTime}ms`
    },
    responseTime: `${Date.now() - startTime}ms`
  });
}

/**
 * 执行单个场景测试
 */
async function executeScenarioTest(scenario: any, model: any, timeout: number) {
  const testStartTime = Date.now();

  try {
    const configService = DynamicConfigService.getInstance();
    const apiConfig = await configService.getApiConfig();
    const modelConfig = await configService.getBestModelConfig(model.model_id);

    // 检查API配置
    if (!apiConfig.openrouterApiKey || !apiConfig.openrouterApiKey.startsWith('sk-or-')) {
      return {
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        modelId: model.model_id,
        modelName: model.name,
        success: false,
        prompt: '',
        source: 'fallback',
        responseTime: Date.now() - testStartTime,
        error: 'API密钥无效'
      };
    }

    // 构建系统提示
    const industryNames = {
      lawyer: '法律专业',
      realtor: '房地产',
      insurance: '保险',
      teacher: '教育',
      accountant: '会计'
    };
    
    const industryName = industryNames[scenario.industry as keyof typeof industryNames] || scenario.industry;
    
    const systemPrompt = `你是世界顶级的${industryName}领域提示词工程专家。

你的任务是生成极其专业、详细、可立即使用的AI提示词。生成的提示词必须：
1. 包含明确的角色定位和专业背景
2. 详细的任务分解（至少5个步骤）
3. 具体的输出要求和格式
4. 相关的专业术语和行业标准
5. 至少500字以上的详细内容`;

    const userPrompt = `请为以下需求生成专业的AI提示词：

【行业】${scenario.industry}
【场景】${scenario.scenario}
【目标】${scenario.goal}
【具体要求】${scenario.requirements}

要求生成的提示词要让用户直接复制给ChatGPT/Claude使用，就能得到专业的结果。`;

    // 发送AI请求
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${apiConfig.openrouterBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiConfig.openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ai-prompt-generator.vercel.app',
        'X-Title': 'AI Prompt Generator - Batch Test'
      },
      body: JSON.stringify({
        model: model.model_id,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.maxTokens
      }),
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      return {
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        modelId: model.model_id,
        modelName: model.name,
        success: false,
        prompt: '',
        source: 'ai',
        responseTime: Date.now() - testStartTime,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.json();
    const generatedPrompt = data.choices?.[0]?.message?.content;

    if (!generatedPrompt) {
      return {
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        modelId: model.model_id,
        modelName: model.name,
        success: false,
        prompt: '',
        source: 'ai',
        responseTime: Date.now() - testStartTime,
        error: '模型返回空内容'
      };
    }

    return {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      modelId: model.model_id,
      modelName: model.name,
      success: true,
      prompt: generatedPrompt,
      source: 'ai',
      responseTime: Date.now() - testStartTime,
      metrics: {
        tokensUsed: data.usage?.total_tokens || 0
      }
    };

  } catch (error: any) {
    return {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      modelId: model.model_id,
      modelName: model.name,
      success: false,
      prompt: '',
      source: 'ai',
      responseTime: Date.now() - testStartTime,
      error: error.message
    };
  }
}

/**
 * 记录测试结果
 */
async function recordTestResult(scenarioId: string, result: any): Promise<void> {
  try {
    const configService = DynamicConfigService.getInstance();
    const client = configService['client'];

    if (!client) {
      return;
    }

    await client.from('test_results').insert({
      test_scenario_id: scenarioId,
      model_used: result.modelId,
      prompt_generated: result.prompt,
      response_time: result.responseTime,
      success: result.success,
      error_message: result.error,
      source: result.source,
      metrics: result.metrics || {}
    });

    // 更新场景统计
    const { data: scenario } = await client
      .from('test_scenarios')
      .select('execution_count, success_count, avg_response_time')
      .eq('id', scenarioId)
      .single();

    if (scenario) {
      const newExecutionCount = scenario.execution_count + 1;
      const newSuccessCount = scenario.success_count + (result.success ? 1 : 0);
      const newAvgResponseTime = Math.round(
        (scenario.avg_response_time * scenario.execution_count + result.responseTime) / newExecutionCount
      );

      await client
        .from('test_scenarios')
        .update({
          execution_count: newExecutionCount,
          success_count: newSuccessCount,
          avg_response_time: newAvgResponseTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', scenarioId);
    }

  } catch (error) {
    console.warn('[测试场景] 记录测试结果失败:', error);
  }
}