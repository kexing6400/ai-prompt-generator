import { NextResponse } from 'next/server';

// 🔧 调试版API路由 - 用于诊断问题
// 这个路由专门用于调试环境变量和API连接问题

export async function GET(request: Request) {
  return NextResponse.json({
    status: 'debug_api_working',
    timestamp: new Date().toISOString(),
    message: '调试API路由工作正常'
  });
}

export async function POST(request: Request) {
  console.log('🔍 调试API被调用...');
  
  try {
    const body = await request.json();
    console.log('📥 接收到的请求数据:', body);
    
    // 检查环境变量
    const envCheck = {
      hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
      keyLength: process.env.OPENROUTER_API_KEY?.length || 0,
      keyPrefix: process.env.OPENROUTER_API_KEY?.substring(0, 10) || 'NOT_FOUND',
      baseUrl: process.env.OPENROUTER_BASE_URL || 'NOT_SET',
      nodeEnv: process.env.NODE_ENV || 'NOT_SET'
    };
    
    console.log('🔑 环境变量检查:', envCheck);
    
    // 如果有API密钥，测试API连接
    let apiTest = null;
    if (process.env.OPENROUTER_API_KEY) {
      try {
        console.log('🌐 测试API连接...');
        const testResponse = await fetch('https://openrouter.ai/api/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(10000)
        });
        
        apiTest = {
          status: testResponse.status,
          ok: testResponse.ok,
          statusText: testResponse.statusText
        };
        
        if (testResponse.ok) {
          const data = await testResponse.json();
          apiTest.modelCount = data.data?.length || 0;
        } else {
          const errorText = await testResponse.text();
          apiTest.error = errorText;
        }
        
        console.log('🔗 API连接测试结果:', apiTest);
      } catch (error) {
        apiTest = {
          error: error instanceof Error ? error.message : '未知错误',
          type: 'network_error'
        };
        console.log('❌ API连接失败:', apiTest);
      }
    }
    
    return NextResponse.json({
      success: true,
      debug: {
        timestamp: new Date().toISOString(),
        requestBody: body,
        environment: envCheck,
        apiConnection: apiTest,
        processInfo: {
          pid: process.pid,
          cwd: process.cwd(),
          platform: process.platform,
          nodeVersion: process.version
        }
      }
    });
    
  } catch (error) {
    console.error('🚨 调试API错误:', error);
    
    return NextResponse.json({
      success: false,
      error: '调试API内部错误',
      details: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack?.substring(0, 500)
      } : String(error)
    }, { status: 500 });
  }
}