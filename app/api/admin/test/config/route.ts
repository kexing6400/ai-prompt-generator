/**
 * 管理后台配置测试API
 * 提供API密钥验证、模型连接测试等功能
 * 作者：Claude Code (后端架构师)
 */

import { NextRequest, NextResponse } from 'next/server';

// 配置测试结果接口
interface TestResult {
  success: boolean;
  message: string;
  details?: any;
  responseTime?: number;
  timestamp: string;
}

// 测试配置接口
interface TestConfig {
  testType: 'api_key' | 'model_connection' | 'all';
  config?: any;
}

/**
 * POST /api/admin/test/config - 执行配置测试
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 开始配置测试...');
    const startTime = Date.now();
    
    // 解析请求体
    const body: TestConfig = await request.json();
    const { testType, config } = body;

    console.log(`测试类型: ${testType}`);

    let testResult: TestResult;

    switch (testType) {
      case 'api_key':
        testResult = await testApiKey();
        break;
      
      case 'model_connection':
        testResult = await testModelConnection();
        break;
      
      case 'all':
        testResult = await testAllConfigurations();
        break;
      
      default:
        return NextResponse.json({
          success: false,
          error: '不支持的测试类型',
          supportedTypes: ['api_key', 'model_connection', 'all']
        }, { status: 400 });
    }

    // 计算总响应时间
    testResult.responseTime = Date.now() - startTime;

    console.log(`✅ 配置测试完成: ${testResult.success ? '成功' : '失败'}`);
    
    return NextResponse.json(testResult);

  } catch (error: any) {
    console.error('❌ 配置测试错误:', error);
    
    return NextResponse.json({
      success: false,
      error: '配置测试时发生错误',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * 测试API密钥有效性
 */
async function testApiKey(): Promise<TestResult> {
  try {
    console.log('🔑 测试API密钥...');
    
    // 从环境变量获取API密钥
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      return {
        success: false,
        message: 'OpenRouter API密钥未配置',
        details: { error: 'OPENROUTER_API_KEY环境变量未设置' },
        timestamp: new Date().toISOString()
      };
    }

    // 验证API密钥格式
    if (!apiKey.startsWith('sk-')) {
      return {
        success: false,
        message: 'API密钥格式不正确',
        details: { error: 'API密钥应以sk-开头' },
        timestamp: new Date().toISOString()
      };
    }

    // 尝试调用OpenRouter API验证密钥
    const testStart = Date.now();
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'AI Prompt Generator'
      },
      signal: AbortSignal.timeout(10000) // 10秒超时
    });

    const responseTime = Date.now() - testStart;

    if (response.ok) {
      const models = await response.json();
      
      return {
        success: true,
        message: 'API密钥验证成功',
        details: {
          apiType: 'OpenRouter',
          responseTime: `${responseTime}ms`,
          modelsAvailable: Array.isArray(models.data) ? models.data.length : '未知',
          status: response.status
        },
        responseTime,
        timestamp: new Date().toISOString()
      };
    } else {
      const errorText = await response.text().catch(() => '未知错误');
      
      return {
        success: false,
        message: `API密钥验证失败 (HTTP ${response.status})`,
        details: {
          httpStatus: response.status,
          error: errorText,
          responseTime: `${responseTime}ms`
        },
        responseTime,
        timestamp: new Date().toISOString()
      };
    }

  } catch (error: any) {
    console.error('API密钥测试错误:', error);
    
    return {
      success: false,
      message: '网络错误或服务不可用',
      details: {
        error: error.message || '未知网络错误',
        type: error.name || 'NetworkError'
      },
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 测试模型连接
 */
async function testModelConnection(): Promise<TestResult> {
  try {
    console.log('🤖 测试模型连接...');
    
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      return {
        success: false,
        message: '无法测试模型连接：API密钥未配置',
        timestamp: new Date().toISOString()
      };
    }

    // 使用轻量级模型进行测试
    const testModel = 'anthropic/claude-3-haiku';
    const testStart = Date.now();
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'AI Prompt Generator'
      },
      body: JSON.stringify({
        model: testModel,
        messages: [
          {
            role: 'user',
            content: '请简单回复"测试成功"'
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      }),
      signal: AbortSignal.timeout(15000) // 15秒超时
    });

    const responseTime = Date.now() - testStart;

    if (response.ok) {
      const result = await response.json();
      const responseText = result.choices?.[0]?.message?.content || '无响应内容';
      
      return {
        success: true,
        message: '模型连接测试成功',
        details: {
          modelName: testModel,
          provider: 'Anthropic',
          responsePreview: responseText.substring(0, 50) + (responseText.length > 50 ? '...' : ''),
          tokensUsed: result.usage?.total_tokens || '未知'
        },
        responseTime,
        timestamp: new Date().toISOString()
      };
    } else {
      const errorData = await response.json().catch(() => null);
      
      return {
        success: false,
        message: `模型连接失败 (HTTP ${response.status})`,
        details: {
          modelName: testModel,
          httpStatus: response.status,
          error: errorData?.error?.message || '未知错误'
        },
        responseTime,
        timestamp: new Date().toISOString()
      };
    }

  } catch (error: any) {
    console.error('模型连接测试错误:', error);
    
    return {
      success: false,
      message: '模型连接测试失败',
      details: {
        error: error.message || '未知错误',
        type: error.name || 'NetworkError'
      },
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 执行全面配置测试
 */
async function testAllConfigurations(): Promise<TestResult> {
  try {
    console.log('🔄 执行全面配置测试...');
    const startTime = Date.now();
    
    // 并行执行所有测试
    const [apiKeyResult, modelConnectionResult] = await Promise.all([
      testApiKey(),
      testModelConnection()
    ]);

    const totalTime = Date.now() - startTime;
    const allTests = [apiKeyResult, modelConnectionResult];
    const successfulTests = allTests.filter(test => test.success).length;
    const totalTests = allTests.length;
    const successRate = Math.round((successfulTests / totalTests) * 100);

    return {
      success: successfulTests === totalTests,
      message: `全面测试完成 (${successfulTests}/${totalTests} 通过)`,
      details: {
        summary: {
          successRate: `${successRate}%`,
          totalTests,
          successfulTests,
          failedTests: totalTests - successfulTests
        },
        results: {
          apiKey: apiKeyResult,
          modelConnection: modelConnectionResult
        }
      },
      responseTime: totalTime,
      timestamp: new Date().toISOString()
    };

  } catch (error: any) {
    console.error('全面测试错误:', error);
    
    return {
      success: false,
      message: '全面测试执行失败',
      details: {
        error: error.message || '未知错误'
      },
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * GET /api/admin/test/config - 获取测试状态信息
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: '配置测试API正常运行',
    availableTests: {
      api_key: '验证OpenRouter API密钥有效性',
      model_connection: '测试AI模型连接和响应',
      all: '执行所有配置测试'
    },
    usage: {
      method: 'POST',
      body: {
        testType: 'api_key | model_connection | all',
        config: '可选的配置参数'
      }
    },
    timestamp: new Date().toISOString()
  });
}