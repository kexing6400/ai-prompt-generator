/**
 * 配置管理API
 * 处理系统配置的CRUD操作
 * 作者：Claude Code (后端架构师)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/lib/server/admin-auth';
import { ConfigManager } from '@/lib/server/config-manager';

// 配置更新验证模式
const configUpdateSchema = z.object({
  configs: z.array(z.object({
    key: z.string().min(1, '配置键不能为空'),
    value: z.string(),
    encrypted: z.boolean().optional().default(false)
  })).min(1, '至少需要更新一个配置')
});

// 单个配置验证模式
const singleConfigSchema = z.object({
  key: z.string().min(1, '配置键不能为空'),
  value: z.string(),
  encrypted: z.boolean().optional().default(false)
});

/**
 * GET - 获取配置
 */
export const GET = withAdminAuth(async (request: NextRequest) => {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const key = searchParams.get('key');

  try {
    const configManager = ConfigManager.getInstance();

    // 如果指定了具体的配置键
    if (key) {
      const value = await configManager.getConfig(key);
      return NextResponse.json({
        success: true,
        config: {
          key,
          value,
          timestamp: Date.now()
        },
        responseTime: `${Date.now() - startTime}ms`
      });
    }

    // 如果指定了分类
    if (category) {
      const configs = await configManager.getConfigByCategory(category);
      return NextResponse.json({
        success: true,
        category,
        configs,
        count: Object.keys(configs).length,
        responseTime: `${Date.now() - startTime}ms`
      });
    }

    // 获取所有分类的配置概览
    const categories = ['api', 'auth', 'cache', 'business'];
    const allConfigs: Record<string, any> = {};

    for (const cat of categories) {
      const configs = await configManager.getConfigByCategory(cat);
      allConfigs[cat] = configs;
    }

    return NextResponse.json({
      success: true,
      configs: allConfigs,
      categories,
      cacheStats: configManager.getCacheStats(),
      responseTime: `${Date.now() - startTime}ms`
    });

  } catch (error) {
    console.error('[配置管理] 获取配置失败:', error);
    
    return NextResponse.json({
      success: false,
      error: '获取配置失败',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 500 });
  }
});

/**
 * PUT - 更新配置
 */
export const PUT = withAdminAuth(async (request: NextRequest, session) => {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const configManager = ConfigManager.getInstance();

    // 检查是否为批量更新
    if (body.configs && Array.isArray(body.configs)) {
      // 批量更新
      const { configs } = configUpdateSchema.parse(body);
      
      // 验证每个配置
      const validationResults = await Promise.all(
        configs.map(async (config) => {
          const result = await configManager.validateConfig(config.key, config.value);
          return { ...config, validation: result };
        })
      );

      // 检查是否有验证失败的配置
      const invalidConfigs = validationResults.filter(c => !c.validation.valid);
      if (invalidConfigs.length > 0) {
        return NextResponse.json({
          success: false,
          error: '配置验证失败',
          invalidConfigs: invalidConfigs.map(c => ({
            key: c.key,
            error: c.validation.error
          })),
          responseTime: `${Date.now() - startTime}ms`
        }, { status: 400 });
      }

      // 执行批量更新
      const success = await configManager.batchUpdateConfig(configs);
      
      if (!success) {
        return NextResponse.json({
          success: false,
          error: '批量更新配置失败',
          responseTime: `${Date.now() - startTime}ms`
        }, { status: 500 });
      }

      console.log(`[配置管理] 批量更新成功，更新了${configs.length}个配置，会话: ${session.sessionId}`);

      return NextResponse.json({
        success: true,
        message: `成功更新${configs.length}个配置`,
        updatedCount: configs.length,
        responseTime: `${Date.now() - startTime}ms`
      });
      
    } else {
      // 单个配置更新
      const { key, value, encrypted } = singleConfigSchema.parse(body);
      
      // 验证配置
      const validation = await configManager.validateConfig(key, value);
      if (!validation.valid) {
        return NextResponse.json({
          success: false,
          error: `配置验证失败: ${validation.error}`,
          responseTime: `${Date.now() - startTime}ms`
        }, { status: 400 });
      }

      // 更新配置
      const success = await configManager.updateConfig(key, value, encrypted);
      
      if (!success) {
        return NextResponse.json({
          success: false,
          error: '更新配置失败',
          responseTime: `${Date.now() - startTime}ms`
        }, { status: 500 });
      }

      console.log(`[配置管理] 配置更新成功: ${key}，会话: ${session.sessionId}`);

      return NextResponse.json({
        success: true,
        message: '配置更新成功',
        key,
        responseTime: `${Date.now() - startTime}ms`
      });
    }

  } catch (error: any) {
    console.error('[配置管理] 更新配置失败:', error);
    
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
      error: '服务器内部错误',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 500 });
  }
});

/**
 * POST - 测试配置
 */
export const POST = withAdminAuth(async (request: NextRequest, session) => {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { type, config } = z.object({
      type: z.enum(['api', 'database', 'cache']),
      config: z.record(z.string(), z.any())
    }).parse(body);

    console.log(`[配置管理] 开始测试配置类型: ${type}，会话: ${session.sessionId}`);

    let testResult: any = {};

    switch (type) {
      case 'api':
        testResult = await testAPIConfiguration(config);
        break;
      
      case 'database':
        testResult = await testDatabaseConfiguration(config);
        break;
      
      case 'cache':
        testResult = await testCacheConfiguration(config);
        break;
      
      default:
        throw new Error(`不支持的测试类型: ${type}`);
    }

    return NextResponse.json({
      success: true,
      testType: type,
      result: testResult,
      responseTime: `${Date.now() - startTime}ms`
    });

  } catch (error: any) {
    console.error(`[配置管理] 测试配置失败:`, error);
    
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
      error: error.message || '配置测试失败',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 500 });
  }
});

/**
 * DELETE - 重置配置缓存
 */
export const DELETE = withAdminAuth(async (request: NextRequest, session) => {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    const configManager = ConfigManager.getInstance();
    
    if (key) {
      configManager.invalidateCache(key);
      console.log(`[配置管理] 清除配置缓存: ${key}，会话: ${session.sessionId}`);
    } else {
      configManager.invalidateCache();
      console.log(`[配置管理] 清除所有配置缓存，会话: ${session.sessionId}`);
    }

    return NextResponse.json({
      success: true,
      message: key ? `清除配置缓存: ${key}` : '清除所有配置缓存',
      cacheStats: configManager.getCacheStats(),
      responseTime: `${Date.now() - startTime}ms`
    });

  } catch (error) {
    console.error('[配置管理] 清除缓存失败:', error);
    
    return NextResponse.json({
      success: false,
      error: '清除缓存失败',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 500 });
  }
});

/**
 * 测试API配置
 */
async function testAPIConfiguration(config: any) {
  const { openrouter_api_key, openrouter_base_url } = config;
  
  if (!openrouter_api_key) {
    throw new Error('API密钥为空');
  }

  try {
    const testUrl = `${openrouter_base_url}/models`;
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${openrouter_api_key}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000) // 10秒超时
    });

    if (!response.ok) {
      throw new Error(`API调用失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      message: 'API配置测试成功',
      details: {
        status: response.status,
        modelsCount: data.data?.length || 0,
        responseTime: Date.now()
      }
    };
    
  } catch (error: any) {
    return {
      success: false,
      message: 'API配置测试失败',
      error: error.message
    };
  }
}

/**
 * 测试数据库配置
 */
async function testDatabaseConfiguration(config: any) {
  try {
    const configManager = ConfigManager.getInstance();
    
    // 尝试获取一个配置来测试数据库连接
    const testConfig = await configManager.getConfig('api_timeout');
    
    return {
      success: true,
      message: '数据库连接测试成功',
      details: {
        testConfig: testConfig,
        timestamp: Date.now()
      }
    };
    
  } catch (error: any) {
    return {
      success: false,
      message: '数据库连接测试失败',
      error: error.message
    };
  }
}

/**
 * 测试缓存配置
 */
async function testCacheConfiguration(config: any) {
  try {
    const configManager = ConfigManager.getInstance();
    const testKey = `cache_test_${Date.now()}`;
    const testValue = 'test_value';
    
    // 测试缓存写入和读取
    configManager['updateCache'](testKey, testValue);
    const cachedValue = configManager['cache'].get(testKey);
    
    if (cachedValue !== testValue) {
      throw new Error('缓存读写测试失败');
    }
    
    return {
      success: true,
      message: '缓存配置测试成功',
      details: {
        cacheStats: configManager.getCacheStats(),
        testKey,
        testValue,
        timestamp: Date.now()
      }
    };
    
  } catch (error: any) {
    return {
      success: false,
      message: '缓存配置测试失败',
      error: error.message
    };
  }
}