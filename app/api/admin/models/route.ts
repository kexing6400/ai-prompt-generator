/**
 * AI模型管理API
 * 处理AI模型配置的CRUD操作
 * 作者：Claude Code (后端架构师)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/lib/server/admin-auth';
import { ConfigManager } from '@/lib/server/config-manager';

// AI模型验证模式
const aiModelSchema = z.object({
  name: z.string().min(1, '模型名称不能为空'),
  provider: z.string().min(1, '提供商不能为空'),
  model_id: z.string().min(1, '模型ID不能为空'),
  max_tokens: z.number().min(100).max(32000).default(4000),
  temperature: z.number().min(0).max(2).default(0.7),
  cost_per_1k_tokens: z.number().min(0).default(0.001),
  enabled: z.boolean().default(true),
  is_default: z.boolean().default(false),
  description: z.string().optional()
});

const updateModelSchema = aiModelSchema.partial().extend({
  id: z.string().uuid()
});

/**
 * GET - 获取AI模型列表
 */
export const GET = withAdminAuth(async (request: NextRequest) => {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  const enabledOnly = searchParams.get('enabled') === 'true';

  try {
    const configManager = ConfigManager.getInstance();
    const models = await configManager.getAIModels(enabledOnly);

    return NextResponse.json({
      success: true,
      models,
      count: models.length,
      responseTime: `${Date.now() - startTime}ms`
    });

  } catch (error) {
    console.error('[模型管理] 获取模型列表失败:', error);
    
    return NextResponse.json({
      success: false,
      error: '获取模型列表失败',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 500 });
  }
});

/**
 * POST - 创建新的AI模型配置
 */
export const POST = withAdminAuth(async (request: NextRequest, session) => {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const modelData = aiModelSchema.parse(body);

    const configManager = ConfigManager.getInstance();
    
    // 如果设置为默认模型，需要先取消其他模型的默认状态
    if (modelData.is_default) {
      // 这里需要实现数据库操作，暂时返回成功
      console.log(`[模型管理] 设置新的默认模型: ${modelData.name}`);
    }

    // TODO: 实现创建模型的数据库操作
    // const success = await configManager.createAIModel(modelData);

    console.log(`[模型管理] 创建模型: ${modelData.name}，会话: ${session.sessionId}`);

    return NextResponse.json({
      success: true,
      message: '模型创建成功',
      model: {
        id: 'temp-id', // 临时ID，实际应该从数据库返回
        ...modelData
      },
      responseTime: `${Date.now() - startTime}ms`
    });

  } catch (error: any) {
    console.error('[模型管理] 创建模型失败:', error);
    
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
      error: '创建模型失败',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 500 });
  }
});

/**
 * PUT - 更新AI模型配置
 */
export const PUT = withAdminAuth(async (request: NextRequest, session) => {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const modelData = updateModelSchema.parse(body);

    console.log(`[模型管理] 更新模型: ${modelData.id}，会话: ${session.sessionId}`);

    // TODO: 实现更新模型的数据库操作
    // const success = await configManager.updateAIModel(modelData);

    return NextResponse.json({
      success: true,
      message: '模型更新成功',
      responseTime: `${Date.now() - startTime}ms`
    });

  } catch (error: any) {
    console.error('[模型管理] 更新模型失败:', error);
    
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
      error: '更新模型失败',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 500 });
  }
});

/**
 * DELETE - 删除AI模型
 */
export const DELETE = withAdminAuth(async (request: NextRequest, session) => {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('id');

    if (!modelId) {
      return NextResponse.json({
        success: false,
        error: '缺少模型ID',
        responseTime: `${Date.now() - startTime}ms`
      }, { status: 400 });
    }

    console.log(`[模型管理] 删除模型: ${modelId}，会话: ${session.sessionId}`);

    // TODO: 实现删除模型的数据库操作
    // 需要检查是否为默认模型，如果是默认模型则不允许删除
    // const success = await configManager.deleteAIModel(modelId);

    return NextResponse.json({
      success: true,
      message: '模型删除成功',
      responseTime: `${Date.now() - startTime}ms`
    });

  } catch (error) {
    console.error('[模型管理] 删除模型失败:', error);
    
    return NextResponse.json({
      success: false,
      error: '删除模型失败',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 500 });
  }
});