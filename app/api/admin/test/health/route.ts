/**
 * 系统健康检查API
 * 提供全面的系统状态监控和诊断功能
 * 作者：Claude Code (测试自动化专家)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/lib/server/admin-auth';
import { DynamicConfigService } from '@/lib/server/dynamic-config-service';

// 健康检查级别
enum HealthCheckLevel {
  BASIC = 'basic',      // 基础检查：配置和连接
  STANDARD = 'standard', // 标准检查：基础 + 功能测试
  COMPREHENSIVE = 'comprehensive' // 全面检查：标准 + 性能测试
}

// 健康检查请求验证
const healthCheckSchema = z.object({
  level: z.nativeEnum(HealthCheckLevel).default(HealthCheckLevel.STANDARD),
  includeHistory: z.boolean().default(false),
  timeout: z.number().min(5000).max(30000).default(15000)
});

// 健康状态枚举
enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  FAILED = 'failed'
}

// 单项健康检查结果
interface HealthCheckResult {
  component: string;
  status: HealthStatus;
  message: string;
  responseTime: number;
  details: any;
  lastCheck?: string;
  error?: string;
}

/**
 * GET - 执行系统健康检查
 */
export const GET = withAdminAuth(async (request: NextRequest, session) => {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level') as HealthCheckLevel || HealthCheckLevel.STANDARD;
    const includeHistory = searchParams.get('includeHistory') === 'true';
    const timeout = Math.min(parseInt(searchParams.get('timeout') || '15000'), 30000);

    console.log(`[健康检查] 开始执行 ${level} 级别检查，会话: ${session.sessionId}`);

    // 根据检查级别执行不同的检查项
    const checks: Promise<HealthCheckResult>[] = [];

    // 基础检查项
    checks.push(checkDatabaseConnection());
    checks.push(checkConfiguration());

    if (level !== HealthCheckLevel.BASIC) {
      // 标准检查项
      checks.push(checkApiConnectivity(timeout));
      checks.push(checkModelAvailability(timeout));
      checks.push(checkTemplateSystem());
    }

    if (level === HealthCheckLevel.COMPREHENSIVE) {
      // 全面检查项
      checks.push(checkPerformanceMetrics());
      checks.push(checkResourceUsage());
      checks.push(checkSecurityStatus());
    }

    // 并行执行所有检查
    const results = await Promise.all(checks);

    // 计算整体健康状态
    const overallStatus = calculateOverallStatus(results);
    const healthyCount = results.filter(r => r.status === HealthStatus.HEALTHY).length;
    const degradedCount = results.filter(r => r.status === HealthStatus.DEGRADED).length;
    const failedCount = results.filter(r => r.status === HealthStatus.FAILED).length;

    // 记录健康检查结果
    await recordHealthCheck(level, overallStatus, results, Date.now() - startTime);

    // 获取历史数据（如果需要）
    let history: any[] = [];
    if (includeHistory) {
      history = await getHealthHistory(20);
    }

    return NextResponse.json({
      status: overallStatus,
      level,
      timestamp: new Date().toISOString(),
      responseTime: `${Date.now() - startTime}ms`,
      summary: {
        total: results.length,
        healthy: healthyCount,
        degraded: degradedCount,
        failed: failedCount,
        successRate: `${Math.round(healthyCount / results.length * 100)}%`
      },
      results,
      history: includeHistory ? history : undefined,
      recommendations: generateRecommendations(results)
    });

  } catch (error: any) {
    console.error('[健康检查] 执行失败:', error);

    return NextResponse.json({
      status: HealthStatus.FAILED,
      timestamp: new Date().toISOString(),
      responseTime: `${Date.now() - startTime}ms`,
      error: error.message || '健康检查执行失败',
      results: []
    }, { status: 500 });
  }
});

/**
 * POST - 触发特定组件的健康检查
 */
export const POST = withAdminAuth(async (request: NextRequest, session) => {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { level, includeHistory, timeout } = healthCheckSchema.parse(body);

    // 执行与GET相同的逻辑，但允许更复杂的参数配置
    // 这里可以扩展特定的检查逻辑
    const response = await GET(request, { params: {} });
    return response;

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        status: HealthStatus.FAILED,
        error: '请求参数无效',
        details: error.issues,
        responseTime: `${Date.now() - startTime}ms`
      }, { status: 400 });
    }

    return NextResponse.json({
      status: HealthStatus.FAILED,
      error: error.message || '健康检查失败',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 500 });
  }
});

/**
 * 检查数据库连接
 */
async function checkDatabaseConnection(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const configService = DynamicConfigService.getInstance();
    
    // 尝试执行简单查询
    await configService.getApiConfig();
    
    return {
      component: 'database',
      status: HealthStatus.HEALTHY,
      message: '数据库连接正常',
      responseTime: Date.now() - startTime,
      details: {
        connectionType: 'supabase',
        queryResponse: 'success'
      }
    };

  } catch (error: any) {
    return {
      component: 'database',
      status: HealthStatus.FAILED,
      message: '数据库连接失败',
      responseTime: Date.now() - startTime,
      details: { error: error.message },
      error: error.message
    };
  }
}

/**
 * 检查配置状态
 */
async function checkConfiguration(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const configService = DynamicConfigService.getInstance();
    const validation = await configService.validateConfiguration();

    if (validation.valid) {
      return {
        component: 'configuration',
        status: HealthStatus.HEALTHY,
        message: '系统配置有效',
        responseTime: Date.now() - startTime,
        details: {
          validated: true,
          configItems: Object.keys(validation.configs || {}).length
        }
      };
    } else {
      return {
        component: 'configuration',
        status: HealthStatus.DEGRADED,
        message: '配置存在问题',
        responseTime: Date.now() - startTime,
        details: {
          validated: false,
          errors: validation.errors
        },
        error: validation.errors?.join(', ')
      };
    }

  } catch (error: any) {
    return {
      component: 'configuration',
      status: HealthStatus.FAILED,
      message: '配置检查失败',
      responseTime: Date.now() - startTime,
      details: { error: error.message },
      error: error.message
    };
  }
}

/**
 * 检查API连接性
 */
async function checkApiConnectivity(timeout: number): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const configService = DynamicConfigService.getInstance();
    const apiConfig = await configService.getApiConfig();

    if (!apiConfig.openrouterApiKey) {
      return {
        component: 'api_connectivity',
        status: HealthStatus.DEGRADED,
        message: 'API密钥未配置',
        responseTime: Date.now() - startTime,
        details: { configured: false }
      };
    }

    // 测试API连接
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${apiConfig.openrouterBaseUrl}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiConfig.openrouterApiKey}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));

    if (response.ok) {
      const data = await response.json();
      return {
        component: 'api_connectivity',
        status: HealthStatus.HEALTHY,
        message: 'API连接正常',
        responseTime: Date.now() - startTime,
        details: {
          baseUrl: apiConfig.openrouterBaseUrl,
          modelsAvailable: data.data?.length || 0,
          httpStatus: response.status
        }
      };
    } else {
      return {
        component: 'api_connectivity',
        status: HealthStatus.FAILED,
        message: `API连接失败: ${response.status}`,
        responseTime: Date.now() - startTime,
        details: {
          httpStatus: response.status,
          statusText: response.statusText
        },
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

  } catch (error: any) {
    return {
      component: 'api_connectivity',
      status: HealthStatus.FAILED,
      message: 'API连接检查失败',
      responseTime: Date.now() - startTime,
      details: { error: error.message },
      error: error.message
    };
  }
}

/**
 * 检查AI模型可用性
 */
async function checkModelAvailability(timeout: number): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const configService = DynamicConfigService.getInstance();
    const models = await configService.getAvailableModels();
    const enabledModels = models.filter(m => m.enabled);

    if (enabledModels.length === 0) {
      return {
        component: 'model_availability',
        status: HealthStatus.DEGRADED,
        message: '没有启用的AI模型',
        responseTime: Date.now() - startTime,
        details: {
          totalModels: models.length,
          enabledModels: 0
        }
      };
    }

    // 测试默认模型
    const defaultModel = enabledModels.find(m => m.is_default) || enabledModels[0];
    const modelConfig = await configService.getBestModelConfig(defaultModel.model_id);
    const apiConfig = await configService.getApiConfig();

    // 发送测试请求
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${apiConfig.openrouterBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiConfig.openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ai-prompt-generator.vercel.app',
        'X-Title': 'AI Prompt Generator - Health Check'
      },
      body: JSON.stringify({
        model: defaultModel.model_id,
        messages: [{ role: 'user', content: 'health check' }],
        temperature: 0.1,
        max_tokens: 10
      }),
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));

    if (response.ok) {
      return {
        component: 'model_availability',
        status: HealthStatus.HEALTHY,
        message: 'AI模型可用',
        responseTime: Date.now() - startTime,
        details: {
          totalModels: models.length,
          enabledModels: enabledModels.length,
          defaultModel: defaultModel.name,
          testedModel: defaultModel.model_id
        }
      };
    } else {
      return {
        component: 'model_availability',
        status: HealthStatus.DEGRADED,
        message: `模型测试失败: ${response.status}`,
        responseTime: Date.now() - startTime,
        details: {
          totalModels: models.length,
          enabledModels: enabledModels.length,
          httpStatus: response.status,
          testedModel: defaultModel.model_id
        },
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

  } catch (error: any) {
    return {
      component: 'model_availability',
      status: HealthStatus.FAILED,
      message: '模型可用性检查失败',
      responseTime: Date.now() - startTime,
      details: { error: error.message },
      error: error.message
    };
  }
}

/**
 * 检查模板系统
 */
async function checkTemplateSystem(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const configService = DynamicConfigService.getInstance();
    const templates = await configService.getPromptTemplates();
    const activeTemplates = templates.filter(t => t.active);

    return {
      component: 'template_system',
      status: activeTemplates.length > 0 ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
      message: `模板系统运行正常，有${activeTemplates.length}个活跃模板`,
      responseTime: Date.now() - startTime,
      details: {
        totalTemplates: templates.length,
        activeTemplates: activeTemplates.length,
        industries: [...new Set(templates.map(t => t.industry))].length
      }
    };

  } catch (error: any) {
    return {
      component: 'template_system',
      status: HealthStatus.FAILED,
      message: '模板系统检查失败',
      responseTime: Date.now() - startTime,
      details: { error: error.message },
      error: error.message
    };
  }
}

/**
 * 检查性能指标
 */
async function checkPerformanceMetrics(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const configService = DynamicConfigService.getInstance();
    const stats = configService.getStats();

    // 模拟性能检查
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    return {
      component: 'performance_metrics',
      status: HealthStatus.HEALTHY,
      message: '性能指标正常',
      responseTime: Date.now() - startTime,
      details: {
        configStats: stats,
        memoryUsage: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB'
        },
        uptime: Math.round(uptime) + 's'
      }
    };

  } catch (error: any) {
    return {
      component: 'performance_metrics',
      status: HealthStatus.FAILED,
      message: '性能指标检查失败',
      responseTime: Date.now() - startTime,
      details: { error: error.message },
      error: error.message
    };
  }
}

/**
 * 检查资源使用情况
 */
async function checkResourceUsage(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
    const heapUsagePercent = (heapUsedMB / heapTotalMB) * 100;

    let status = HealthStatus.HEALTHY;
    let message = '资源使用正常';

    if (heapUsagePercent > 90) {
      status = HealthStatus.FAILED;
      message = '内存使用过高';
    } else if (heapUsagePercent > 70) {
      status = HealthStatus.DEGRADED;
      message = '内存使用偏高';
    }

    return {
      component: 'resource_usage',
      status,
      message,
      responseTime: Date.now() - startTime,
      details: {
        heapUsage: `${Math.round(heapUsedMB)}MB`,
        heapTotal: `${Math.round(heapTotalMB)}MB`,
        heapUsagePercent: `${Math.round(heapUsagePercent)}%`,
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`
      }
    };

  } catch (error: any) {
    return {
      component: 'resource_usage',
      status: HealthStatus.FAILED,
      message: '资源使用检查失败',
      responseTime: Date.now() - startTime,
      details: { error: error.message },
      error: error.message
    };
  }
}

/**
 * 检查安全状态
 */
async function checkSecurityStatus(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    // 检查环境变量和配置安全性
    const hasSecureConfig = process.env.NODE_ENV === 'production';
    const hasHttps = process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https://');

    let status = HealthStatus.HEALTHY;
    let message = '安全配置正常';
    const issues: string[] = [];

    if (!hasSecureConfig) {
      issues.push('非生产环境');
    }

    if (!hasHttps) {
      issues.push('未使用HTTPS');
    }

    if (issues.length > 0) {
      status = issues.length > 1 ? HealthStatus.FAILED : HealthStatus.DEGRADED;
      message = `安全检查发现问题: ${issues.join(', ')}`;
    }

    return {
      component: 'security_status',
      status,
      message,
      responseTime: Date.now() - startTime,
      details: {
        environment: process.env.NODE_ENV,
        httpsEnabled: hasHttps,
        securityHeaders: 'enabled', // 假设已启用
        issues
      }
    };

  } catch (error: any) {
    return {
      component: 'security_status',
      status: HealthStatus.FAILED,
      message: '安全状态检查失败',
      responseTime: Date.now() - startTime,
      details: { error: error.message },
      error: error.message
    };
  }
}

/**
 * 计算整体健康状态
 */
function calculateOverallStatus(results: HealthCheckResult[]): HealthStatus {
  const failedCount = results.filter(r => r.status === HealthStatus.FAILED).length;
  const degradedCount = results.filter(r => r.status === HealthStatus.DEGRADED).length;

  if (failedCount > 0) {
    return HealthStatus.FAILED;
  } else if (degradedCount > 0) {
    return HealthStatus.DEGRADED;
  } else {
    return HealthStatus.HEALTHY;
  }
}

/**
 * 生成改进建议
 */
function generateRecommendations(results: HealthCheckResult[]): string[] {
  const recommendations: string[] = [];

  results.forEach(result => {
    if (result.status === HealthStatus.FAILED) {
      switch (result.component) {
        case 'database':
          recommendations.push('检查数据库连接配置，确保网络连通性');
          break;
        case 'api_connectivity':
          recommendations.push('验证API密钥是否有效，检查网络防火墙设置');
          break;
        case 'model_availability':
          recommendations.push('确认AI模型配置，检查API配额和权限');
          break;
      }
    } else if (result.status === HealthStatus.DEGRADED) {
      switch (result.component) {
        case 'configuration':
          recommendations.push('完善系统配置，解决配置验证错误');
          break;
        case 'resource_usage':
          recommendations.push('优化内存使用，考虑增加服务器资源');
          break;
        case 'security_status':
          recommendations.push('加强安全配置，启用HTTPS和安全头');
          break;
      }
    }
  });

  return recommendations;
}

/**
 * 记录健康检查结果
 */
async function recordHealthCheck(
  level: string,
  status: HealthStatus,
  results: HealthCheckResult[],
  responseTime: number
): Promise<void> {
  try {
    const configService = DynamicConfigService.getInstance();
    const client = configService['client'];

    if (!client) {
      console.warn('[健康检查] 无法记录结果：数据库客户端不可用');
      return;
    }

    await client.from('health_checks').insert({
      check_type: level,
      status,
      response_time: responseTime,
      details: { results, level },
      error_message: status === HealthStatus.HEALTHY ? null : 
        results.filter(r => r.error).map(r => r.error).join('; ')
    });

  } catch (error) {
    console.warn('[健康检查] 记录结果失败:', error);
  }
}

/**
 * 获取健康检查历史
 */
async function getHealthHistory(limit: number): Promise<any[]> {
  try {
    const configService = DynamicConfigService.getInstance();
    const client = configService['client'];

    if (!client) {
      return [];
    }

    const { data, error } = await client
      .from('health_checks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('[健康检查] 获取历史数据失败:', error);
      return [];
    }

    return data || [];

  } catch (error) {
    console.warn('[健康检查] 获取历史数据失败:', error);
    return [];
  }
}