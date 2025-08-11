/**
 * 管理后台系统健康检查API
 * 提供系统各组件的健康状态监控
 * 作者：Claude Code (后端架构师)
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// 健康检查结果接口
interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  responseTime: number;
  details?: any;
}

// 整体健康状态接口
interface SystemHealthStatus {
  success: boolean;
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
    successRate: string;
  };
  results: HealthCheckResult[];
  timestamp: string;
  responseTime: number;
}

/**
 * GET /api/admin/test/health - 执行系统健康检查
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🏥 开始系统健康检查...');
    const startTime = Date.now();
    
    // 获取检查级别参数
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level') || 'standard'; // basic, standard, comprehensive
    
    console.log(`健康检查级别: ${level}`);

    // 根据级别选择检查项目
    let healthChecks: Promise<HealthCheckResult>[] = [];

    // 基础检查（所有级别都包含）
    healthChecks.push(
      checkApiServer(),
      checkEnvironmentConfig(),
      checkFileSystem()
    );

    // 标准检查（standard级别及以上）
    if (level === 'standard' || level === 'comprehensive') {
      healthChecks.push(
        checkApiKey(),
        checkModelAvailability()
      );
    }

    // 全面检查（comprehensive级别）
    if (level === 'comprehensive') {
      healthChecks.push(
        checkDependencies(),
        checkMemoryUsage()
      );
    }

    // 并行执行所有健康检查
    const results = await Promise.all(healthChecks);
    
    // 计算总体状态
    const healthyCount = results.filter(r => r.status === 'healthy').length;
    const degradedCount = results.filter(r => r.status === 'degraded').length;
    const unhealthyCount = results.filter(r => r.status === 'unhealthy').length;
    const totalCount = results.length;
    
    const successRate = Math.round((healthyCount / totalCount) * 100);
    
    // 确定总体状态
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    let overallMessage: string;
    
    if (unhealthyCount > 0) {
      overallStatus = 'unhealthy';
      overallMessage = `系统存在严重问题 (${unhealthyCount}个组件不健康)`;
    } else if (degradedCount > 0) {
      overallStatus = 'degraded';
      overallMessage = `系统部分功能降级 (${degradedCount}个组件降级)`;
    } else {
      overallStatus = 'healthy';
      overallMessage = '系统运行正常';
    }

    const totalTime = Date.now() - startTime;

    const healthStatus: SystemHealthStatus = {
      success: true,
      overallStatus,
      message: overallMessage,
      summary: {
        total: totalCount,
        healthy: healthyCount,
        degraded: degradedCount,
        unhealthy: unhealthyCount,
        successRate: `${successRate}%`
      },
      results,
      timestamp: new Date().toISOString(),
      responseTime: totalTime
    };

    console.log(`✅ 健康检查完成: ${overallStatus} (${totalTime}ms)`);
    
    return NextResponse.json(healthStatus);

  } catch (error: any) {
    console.error('❌ 健康检查错误:', error);
    
    return NextResponse.json({
      success: false,
      overallStatus: 'unhealthy',
      message: '健康检查执行失败',
      error: error.message,
      timestamp: new Date().toISOString()
    } as Partial<SystemHealthStatus>, { status: 500 });
  }
}

/**
 * 检查API服务器状态
 */
async function checkApiServer(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // 检查Next.js API路由是否响应
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/health`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    }).catch(() => null);

    const responseTime = Date.now() - startTime;

    if (response && response.ok) {
      return {
        component: 'api_server',
        status: 'healthy',
        message: 'API服务器响应正常',
        responseTime,
        details: {
          httpStatus: response.status,
          url: response.url
        }
      };
    } else {
      return {
        component: 'api_server',
        status: 'degraded',
        message: 'API服务器响应异常',
        responseTime,
        details: {
          httpStatus: response?.status || 'timeout'
        }
      };
    }

  } catch (error: any) {
    return {
      component: 'api_server',
      status: 'unhealthy',
      message: 'API服务器不可访问',
      responseTime: Date.now() - startTime,
      details: { error: error.message }
    };
  }
}

/**
 * 检查环境配置
 */
async function checkEnvironmentConfig(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const requiredEnvVars = [
      'NODE_ENV',
      'NEXT_PUBLIC_SITE_URL'
    ];
    
    const optionalEnvVars = [
      'OPENROUTER_API_KEY',
      'ADMIN_USERNAME',
      'ADMIN_PASSWORD_HASH'
    ];

    const missing: string[] = [];
    const present: string[] = [];
    
    // 检查必需的环境变量
    for (const varName of requiredEnvVars) {
      if (process.env[varName]) {
        present.push(varName);
      } else {
        missing.push(varName);
      }
    }
    
    // 检查可选的环境变量
    const optionalPresent: string[] = [];
    for (const varName of optionalEnvVars) {
      if (process.env[varName]) {
        optionalPresent.push(varName);
      }
    }

    const responseTime = Date.now() - startTime;

    if (missing.length === 0) {
      return {
        component: 'environment_config',
        status: 'healthy',
        message: '环境配置完整',
        responseTime,
        details: {
          required: present,
          optional: optionalPresent,
          nodeEnv: process.env.NODE_ENV
        }
      };
    } else if (missing.length <= 1) {
      return {
        component: 'environment_config',
        status: 'degraded',
        message: `部分环境变量缺失: ${missing.join(', ')}`,
        responseTime,
        details: {
          missing,
          present
        }
      };
    } else {
      return {
        component: 'environment_config',
        status: 'unhealthy',
        message: `关键环境变量缺失: ${missing.join(', ')}`,
        responseTime,
        details: {
          missing,
          present
        }
      };
    }

  } catch (error: any) {
    return {
      component: 'environment_config',
      status: 'unhealthy',
      message: '环境配置检查失败',
      responseTime: Date.now() - startTime,
      details: { error: error.message }
    };
  }
}

/**
 * 检查文件系统
 */
async function checkFileSystem(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // 检查关键目录是否存在
    const keyPaths = [
      'app',
      'app/api',
      'app/admin',
      'components',
      'lib',
      'public'
    ];

    const existingPaths: string[] = [];
    const missingPaths: string[] = [];

    for (const relativePath of keyPaths) {
      const fullPath = path.join(process.cwd(), relativePath);
      try {
        await fs.access(fullPath);
        existingPaths.push(relativePath);
      } catch {
        missingPaths.push(relativePath);
      }
    }

    const responseTime = Date.now() - startTime;

    if (missingPaths.length === 0) {
      return {
        component: 'file_system',
        status: 'healthy',
        message: '文件系统结构完整',
        responseTime,
        details: {
          existingPaths,
          workingDirectory: process.cwd()
        }
      };
    } else if (missingPaths.length <= 2) {
      return {
        component: 'file_system',
        status: 'degraded',
        message: `部分目录缺失: ${missingPaths.join(', ')}`,
        responseTime,
        details: {
          missingPaths,
          existingPaths
        }
      };
    } else {
      return {
        component: 'file_system',
        status: 'unhealthy',
        message: `关键目录大量缺失: ${missingPaths.join(', ')}`,
        responseTime,
        details: {
          missingPaths,
          existingPaths
        }
      };
    }

  } catch (error: any) {
    return {
      component: 'file_system',
      status: 'unhealthy',
      message: '文件系统检查失败',
      responseTime: Date.now() - startTime,
      details: { error: error.message }
    };
  }
}

/**
 * 检查API密钥状态
 */
async function checkApiKey(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      return {
        component: 'api_key',
        status: 'degraded',
        message: 'OpenRouter API密钥未配置',
        responseTime: Date.now() - startTime,
        details: { configured: false }
      };
    }

    // 快速验证密钥格式
    if (!apiKey.startsWith('sk-')) {
      return {
        component: 'api_key',
        status: 'degraded',
        message: 'API密钥格式可能不正确',
        responseTime: Date.now() - startTime,
        details: { 
          configured: true,
          formatValid: false 
        }
      };
    }

    return {
      component: 'api_key',
      status: 'healthy',
      message: 'API密钥已正确配置',
      responseTime: Date.now() - startTime,
      details: { 
        configured: true,
        formatValid: true,
        keyLength: apiKey.length,
        keyPreview: apiKey.substring(0, 8) + '...'
      }
    };

  } catch (error: any) {
    return {
      component: 'api_key',
      status: 'unhealthy',
      message: 'API密钥检查失败',
      responseTime: Date.now() - startTime,
      details: { error: error.message }
    };
  }
}

/**
 * 检查模型可用性
 */
async function checkModelAvailability(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      return {
        component: 'model_availability',
        status: 'degraded',
        message: '无法检查模型：API密钥未配置',
        responseTime: Date.now() - startTime
      };
    }

    // 快速检查模型列表
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'HEAD', // 只检查响应头，不获取内容
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      },
      signal: AbortSignal.timeout(8000)
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        component: 'model_availability',
        status: 'healthy',
        message: 'AI模型服务可用',
        responseTime,
        details: {
          apiStatus: response.status,
          provider: 'OpenRouter'
        }
      };
    } else {
      return {
        component: 'model_availability',
        status: 'degraded',
        message: `模型服务响应异常 (HTTP ${response.status})`,
        responseTime,
        details: {
          httpStatus: response.status
        }
      };
    }

  } catch (error: any) {
    return {
      component: 'model_availability',
      status: 'unhealthy',
      message: '模型服务不可访问',
      responseTime: Date.now() - startTime,
      details: { error: error.message }
    };
  }
}

/**
 * 检查依赖项
 */
async function checkDependencies(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // 检查关键依赖项的版本
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    
    const keyDependencies = [
      'next',
      'react',
      'typescript'
    ];

    const dependencyInfo = keyDependencies.map(dep => ({
      name: dep,
      version: packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep] || 'not found'
    }));

    const responseTime = Date.now() - startTime;

    return {
      component: 'dependencies',
      status: 'healthy',
      message: '依赖项检查完成',
      responseTime,
      details: {
        nodeVersion: process.version,
        dependencies: dependencyInfo,
        packageManager: packageJson.packageManager || 'npm'
      }
    };

  } catch (error: any) {
    return {
      component: 'dependencies',
      status: 'degraded',
      message: '依赖项检查失败',
      responseTime: Date.now() - startTime,
      details: { error: error.message }
    };
  }
}

/**
 * 检查内存使用情况
 */
async function checkMemoryUsage(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const memUsage = process.memoryUsage();
    const mbConvert = (bytes: number) => Math.round(bytes / 1024 / 1024);
    
    // 内存使用阈值 (MB)
    const heapUsedMB = mbConvert(memUsage.heapUsed);
    const heapTotalMB = mbConvert(memUsage.heapTotal);
    const rssMB = mbConvert(memUsage.rss);
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    let message: string;
    
    if (heapUsedMB > 512 || rssMB > 1024) {
      status = 'degraded';
      message = '内存使用率较高';
    } else if (heapUsedMB > 1024 || rssMB > 2048) {
      status = 'unhealthy';
      message = '内存使用率过高';
    } else {
      status = 'healthy';
      message = '内存使用正常';
    }

    const responseTime = Date.now() - startTime;

    return {
      component: 'memory_usage',
      status,
      message,
      responseTime,
      details: {
        rss: `${rssMB}MB`,
        heapTotal: `${heapTotalMB}MB`,
        heapUsed: `${heapUsedMB}MB`,
        external: `${mbConvert(memUsage.external)}MB`,
        heapUsagePercent: Math.round((heapUsedMB / heapTotalMB) * 100)
      }
    };

  } catch (error: any) {
    return {
      component: 'memory_usage',
      status: 'degraded',
      message: '内存检查失败',
      responseTime: Date.now() - startTime,
      details: { error: error.message }
    };
  }
}

/**
 * POST /api/admin/test/health - 执行特定组件的健康检查
 */
export async function POST(request: NextRequest) {
  try {
    const { component } = await request.json();
    
    let result: HealthCheckResult;
    
    switch (component) {
      case 'api_server':
        result = await checkApiServer();
        break;
      case 'environment_config':
        result = await checkEnvironmentConfig();
        break;
      case 'file_system':
        result = await checkFileSystem();
        break;
      case 'api_key':
        result = await checkApiKey();
        break;
      case 'model_availability':
        result = await checkModelAvailability();
        break;
      case 'dependencies':
        result = await checkDependencies();
        break;
      case 'memory_usage':
        result = await checkMemoryUsage();
        break;
      default:
        return NextResponse.json({
          success: false,
          error: '不支持的组件类型',
          supportedComponents: [
            'api_server',
            'environment_config', 
            'file_system',
            'api_key',
            'model_availability',
            'dependencies',
            'memory_usage'
          ]
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: '组件健康检查失败',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}