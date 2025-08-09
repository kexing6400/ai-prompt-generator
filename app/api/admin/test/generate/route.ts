/**
 * 实时生成测试API
 * 提供提示词生成测试、多模型对比等功能
 * 作者：Claude Code (测试自动化专家)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/lib/server/admin-auth';
import { DynamicConfigService } from '@/lib/server/dynamic-config-service';

// 生成测试请求验证
const generateTestSchema = z.object({
  industry: z.string().min(1, '行业不能为空'),
  scenario: z.string().min(1, '场景不能为空'),
  goal: z.string().min(1, '目标不能为空'),
  requirements: z.string().optional().default(''),
  testScenarioId: z.string().uuid().optional(),
  modelIds: z.array(z.string()).optional(), // 指定要测试的模型列表
  compareModels: z.boolean().default(false), // 是否进行模型对比
  timeout: z.number().min(5000).max(60000).default(30000)
});

// 单个模型测试结果
interface ModelTestResult {
  modelId: string;
  modelName: string;
  success: boolean;
  prompt: string;
  source: 'ai' | 'template' | 'fallback';
  responseTime: number;
  error?: string;
  metrics?: {
    tokensUsed?: number;
    cost?: number;
  };
}

/**
 * POST - 执行生成测试
 */
export const POST = withAdminAuth(async (request: NextRequest, session) => {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { 
      industry, 
      scenario, 
      goal, 
      requirements, 
      testScenarioId,
      modelIds,
      compareModels,
      timeout 
    } = generateTestSchema.parse(body);

    console.log(`[生成测试] 开始测试生成: ${industry}/${scenario}，会话: ${session.sessionId}`);

    const configService = DynamicConfigService.getInstance();

    // 获取要测试的模型列表
    let testModels = await configService.getAvailableModels();
    testModels = testModels.filter(m => m.enabled);

    if (modelIds && modelIds.length > 0) {
      // 如果指定了模型，只测试指定的模型
      testModels = testModels.filter(m => modelIds.includes(m.model_id));
    } else if (!compareModels) {
      // 如果没有指定模型且不是对比测试，只测试默认模型
      const defaultModel = testModels.find(m => m.is_default);
      testModels = defaultModel ? [defaultModel] : testModels.slice(0, 1);
    }

    if (testModels.length === 0) {
      return NextResponse.json({
        success: false,
        error: '没有可用的模型进行测试'
      }, { status: 400 });
    }

    // 限制并发测试的模型数量
    if (testModels.length > 5) {
      testModels = testModels.slice(0, 5);
      console.log('[生成测试] 限制并发测试模型数量为5个');
    }

    // 并行测试所有模型
    const modelTests = await Promise.all(
      testModels.map(model => testModelGeneration(
        model.model_id,
        model.name,
        industry,
        scenario,
        goal,
        requirements,
        timeout
      ))
    );

    // 计算整体统计
    const successCount = modelTests.filter(t => t.success).length;
    const totalResponseTime = modelTests.reduce((sum, t) => sum + t.responseTime, 0);
    const avgResponseTime = Math.round(totalResponseTime / modelTests.length);

    // 如果有测试场景ID，记录结果
    if (testScenarioId) {
      await Promise.all(
        modelTests.map(result => recordTestResult(testScenarioId, result))
      );
    }

    // 找出最佳结果
    const bestResult = modelTests
      .filter(t => t.success)
      .sort((a, b) => a.responseTime - b.responseTime)[0];

    return NextResponse.json({
      success: successCount > 0,
      testType: 'generate',
      results: modelTests,
      summary: {
        totalModels: modelTests.length,
        successCount,
        failureCount: modelTests.length - successCount,
        avgResponseTime,
        bestModel: bestResult?.modelId,
        bestResponseTime: bestResult?.responseTime
      },
      bestResult: bestResult || null,
      testParams: {
        industry,
        scenario,
        goal,
        requirements,
        compareModels,
        testScenarioId
      },
      timestamp: new Date().toISOString(),
      totalTime: `${Date.now() - startTime}ms`
    });

  } catch (error: any) {
    console.error('[生成测试] 测试失败:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: '请求参数无效',
        details: error.issues
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || '生成测试失败'
    }, { status: 500 });
  }
});

/**
 * 测试单个模型的生成能力
 */
async function testModelGeneration(
  modelId: string,
  modelName: string,
  industry: string,
  scenario: string,
  goal: string,
  requirements: string,
  timeout: number
): Promise<ModelTestResult> {
  const startTime = Date.now();

  try {
    const configService = DynamicConfigService.getInstance();
    const apiConfig = await configService.getApiConfig();
    const modelConfig = await configService.getBestModelConfig(modelId);

    // 检查API配置
    if (!apiConfig.openrouterApiKey || !apiConfig.openrouterApiKey.startsWith('sk-or-')) {
      return {
        modelId,
        modelName,
        success: false,
        prompt: '',
        source: 'fallback',
        responseTime: Date.now() - startTime,
        error: 'API密钥无效'
      };
    }

    // 尝试获取提示词模板
    const template = await configService.getPromptTemplate(industry, scenario);
    
    // 构建系统提示
    const industryNames = {
      lawyer: '法律专业',
      realtor: '房地产',
      insurance: '保险',
      teacher: '教育',
      accountant: '会计'
    };
    
    const industryName = industryNames[industry as keyof typeof industryNames] || industry;
    
    const systemPrompt = `你是世界顶级的${industryName}领域提示词工程专家。

你的任务是生成极其专业、详细、可立即使用的AI提示词。生成的提示词必须：
1. 包含明确的角色定位和专业背景
2. 详细的任务分解（至少5个步骤）
3. 具体的输出要求和格式
4. 相关的专业术语和行业标准
5. 至少500字以上的详细内容

${template ? `\n参考模版：\n${template.template}\n` : ''}`;

    // 构建用户请求
    const userPrompt = `请为以下需求生成专业的AI提示词：

【行业】${industry}
【场景】${scenario}
【目标】${goal}
【具体要求】${requirements || '请根据行业最佳实践提供专业建议'}

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
        'X-Title': 'AI Prompt Generator - Test Mode'
      },
      body: JSON.stringify({
        model: modelConfig.model.model_id,
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
        modelId,
        modelName,
        success: false,
        prompt: '',
        source: 'ai',
        responseTime: Date.now() - startTime,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.json();
    const generatedPrompt = data.choices?.[0]?.message?.content;

    if (!generatedPrompt) {
      return {
        modelId,
        modelName,
        success: false,
        prompt: '',
        source: 'ai',
        responseTime: Date.now() - startTime,
        error: '模型返回空内容'
      };
    }

    return {
      modelId,
      modelName,
      success: true,
      prompt: generatedPrompt,
      source: 'ai',
      responseTime: Date.now() - startTime,
      metrics: {
        tokensUsed: data.usage?.total_tokens || 0,
        cost: calculateCost(data.usage?.total_tokens || 0, modelConfig.model.cost_per_1k_tokens)
      }
    };

  } catch (error: any) {
    return {
      modelId,
      modelName,
      success: false,
      prompt: '',
      source: 'ai',
      responseTime: Date.now() - startTime,
      error: error.message
    };
  }
}

/**
 * 计算使用成本
 */
function calculateCost(tokens: number, costPer1k: number): number {
  return Number((tokens / 1000 * costPer1k).toFixed(6));
}

/**
 * 记录测试结果到数据库
 */
async function recordTestResult(
  testScenarioId: string,
  result: ModelTestResult
): Promise<void> {
  try {
    const configService = DynamicConfigService.getInstance();
    const client = configService['client'];

    if (!client) {
      console.warn('[生成测试] 无法记录测试结果：数据库客户端不可用');
      return;
    }

    await client.from('test_results').insert({
      test_scenario_id: testScenarioId,
      model_used: result.modelId,
      prompt_generated: result.prompt,
      response_time: result.responseTime,
      success: result.success,
      error_message: result.error,
      source: result.source,
      metrics: result.metrics || {}
    });

    // 更新测试场景统计
    const { data: scenario } = await client
      .from('test_scenarios')
      .select('execution_count, success_count, avg_response_time')
      .eq('id', testScenarioId)
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
          avg_response_time: newAvgResponseTime
        })
        .eq('id', testScenarioId);
    }

  } catch (error) {
    console.warn('[生成测试] 记录测试结果失败:', error);
  }
}

/**
 * GET - 获取测试历史和统计
 */
export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const modelId = searchParams.get('modelId');

    const configService = DynamicConfigService.getInstance();
    const client = configService['client'];

    if (!client) {
      return NextResponse.json({
        success: false,
        error: '数据库连接不可用',
        results: []
      });
    }

    // 构建查询
    let query = client
      .from('test_results')
      .select('*, test_scenarios(name, industry, scenario)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (modelId) {
      query = query.eq('model_used', modelId);
    }

    const { data: results, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // 获取统计信息
    const { data: stats } = await client
      .from('test_results')
      .select('success, model_used, response_time')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // 最近7天

    const modelStats: Record<string, any> = {};
    if (stats) {
      stats.forEach(stat => {
        if (!modelStats[stat.model_used]) {
          modelStats[stat.model_used] = {
            total: 0,
            success: 0,
            avgResponseTime: 0,
            totalResponseTime: 0
          };
        }
        
        const modelStat = modelStats[stat.model_used];
        modelStat.total++;
        if (stat.success) modelStat.success++;
        modelStat.totalResponseTime += stat.response_time;
        modelStat.avgResponseTime = Math.round(modelStat.totalResponseTime / modelStat.total);
      });
    }

    return NextResponse.json({
      success: true,
      results: results || [],
      count: results?.length || 0,
      statistics: {
        modelPerformance: modelStats,
        period: '最近7天'
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      results: []
    }, { status: 500 });
  }
});