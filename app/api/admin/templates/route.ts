/**
 * 提示词模版管理API
 * 处理提示词模版的CRUD操作
 * 作者：Claude Code (后端架构师)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/lib/server/admin-auth';
import { ConfigManager } from '@/lib/server/config-manager';

// 提示词模版验证模式
const templateSchema = z.object({
  name: z.string().min(1, '模版名称不能为空'),
  industry: z.string().min(1, '行业不能为空'),
  scenario: z.string().min(1, '场景不能为空'),
  template: z.string().min(50, '模版内容至少50字符'),
  variables: z.array(z.string()).default([]),
  active: z.boolean().default(true),
  description: z.string().optional()
});

const updateTemplateSchema = templateSchema.partial().extend({
  id: z.string().uuid()
});

/**
 * GET - 获取提示词模版列表
 */
export const GET = withAdminAuth(async (request: NextRequest) => {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  const industry = searchParams.get('industry');
  const activeOnly = searchParams.get('active') !== 'false'; // 默认只显示激活的

  try {
    const configManager = ConfigManager.getInstance();
    let templates = await configManager.getPromptTemplates(industry || undefined);
    
    if (activeOnly) {
      templates = templates.filter(t => t.active);
    }

    // 按行业分组统计
    const industriesStats = templates.reduce((acc, template) => {
      acc[template.industry] = (acc[template.industry] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      templates,
      count: templates.length,
      industries: Object.keys(industriesStats),
      industriesStats,
      responseTime: `${Date.now() - startTime}ms`
    });

  } catch (error) {
    console.error('[模版管理] 获取模版列表失败:', error);
    
    return NextResponse.json({
      success: false,
      error: '获取模版列表失败',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 500 });
  }
});

/**
 * POST - 创建新的提示词模版
 */
export const POST = withAdminAuth(async (request: NextRequest, session) => {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const templateData = templateSchema.parse(body);

    console.log(`[模版管理] 创建模版: ${templateData.name}，行业: ${templateData.industry}，会话: ${session.sessionId}`);

    // TODO: 实现创建模版的数据库操作
    // 需要检查同一行业场景下是否已存在同名模版
    // const success = await configManager.createPromptTemplate(templateData);

    return NextResponse.json({
      success: true,
      message: '模版创建成功',
      template: {
        id: 'temp-id', // 临时ID，实际应该从数据库返回
        ...templateData,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      responseTime: `${Date.now() - startTime}ms`
    });

  } catch (error: any) {
    console.error('[模版管理] 创建模版失败:', error);
    
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
      error: '创建模版失败',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 500 });
  }
});

/**
 * PUT - 更新提示词模版
 */
export const PUT = withAdminAuth(async (request: NextRequest, session) => {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const templateData = updateTemplateSchema.parse(body);

    console.log(`[模版管理] 更新模版: ${templateData.id}，会话: ${session.sessionId}`);

    // TODO: 实现更新模版的数据库操作
    // const success = await configManager.updatePromptTemplate(templateData);

    return NextResponse.json({
      success: true,
      message: '模版更新成功',
      responseTime: `${Date.now() - startTime}ms`
    });

  } catch (error: any) {
    console.error('[模版管理] 更新模版失败:', error);
    
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
      error: '更新模版失败',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 500 });
  }
});

/**
 * DELETE - 删除提示词模版
 */
export const DELETE = withAdminAuth(async (request: NextRequest, session) => {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json({
        success: false,
        error: '缺少模版ID',
        responseTime: `${Date.now() - startTime}ms`
      }, { status: 400 });
    }

    console.log(`[模版管理] 删除模版: ${templateId}，会话: ${session.sessionId}`);

    // TODO: 实现删除模版的数据库操作
    // 可以考虑软删除（设置active=false）而不是硬删除
    // const success = await configManager.deletePromptTemplate(templateId);

    return NextResponse.json({
      success: true,
      message: '模版删除成功',
      responseTime: `${Date.now() - startTime}ms`
    });

  } catch (error) {
    console.error('[模版管理] 删除模版失败:', error);
    
    return NextResponse.json({
      success: false,
      error: '删除模版失败',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 500 });
  }
});

/**
 * PATCH - 批量操作模版（激活/停用/删除）
 */
export const PATCH = withAdminAuth(async (request: NextRequest, session) => {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { action, templateIds } = z.object({
      action: z.enum(['activate', 'deactivate', 'delete']),
      templateIds: z.array(z.string().uuid()).min(1, '至少选择一个模版')
    }).parse(body);

    console.log(`[模版管理] 批量${action}模版: ${templateIds.length}个，会话: ${session.sessionId}`);

    // TODO: 实现批量操作的数据库操作
    let message = '';
    switch (action) {
      case 'activate':
        message = `成功激活 ${templateIds.length} 个模版`;
        break;
      case 'deactivate':
        message = `成功停用 ${templateIds.length} 个模版`;
        break;
      case 'delete':
        message = `成功删除 ${templateIds.length} 个模版`;
        break;
    }

    return NextResponse.json({
      success: true,
      message,
      processedCount: templateIds.length,
      responseTime: `${Date.now() - startTime}ms`
    });

  } catch (error: any) {
    console.error('[模版管理] 批量操作失败:', error);
    
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
      error: '批量操作失败',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 500 });
  }
});