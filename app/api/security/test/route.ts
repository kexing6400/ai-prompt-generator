/**
 * 安全配置测试API端点
 * 用于验证CSP和其他安全头部配置
 * 仅在开发环境下可用
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSecurityHeaders, generateNonce, validateNonce } from '../../../../lib/security/csp';

// 强制动态渲染 - 确保每次请求都重新执行
export const dynamic = 'force-dynamic';


/**
 * 测试安全头部配置
 */
export async function GET(request: NextRequest) {
  // 仅在开发环境下提供
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: '此功能仅在开发环境下可用' }, 
      { status: 403 }
    );
  }

  try {
    // 生成测试nonce
    const testNonce = generateNonce();
    
    // 获取安全头部
    const securityHeaders = getSecurityHeaders(testNonce);
    
    // 解析CSP策略
    const cspHeader = securityHeaders['Content-Security-Policy'];
    const cspDirectives = cspHeader ? cspHeader.split(';').reduce((acc, directive) => {
      const [key, ...values] = directive.trim().split(' ');
      if (key) {
        acc[key] = values;
      }
      return acc;
    }, {} as Record<string, string[]>) : {};

    // 运行安全测试
    const tests = {
      nonceGeneration: {
        test: '测试Nonce生成',
        passed: validateNonce(testNonce),
        details: { nonce: testNonce, length: testNonce.length }
      },
      
      cspDirectives: {
        test: '测试CSP指令完整性',
        passed: !!(cspDirectives['default-src'] && 
                   cspDirectives['script-src'] && 
                   cspDirectives['connect-src'] && 
                   cspDirectives['style-src']),
        details: Object.keys(cspDirectives)
      },
      
      openRouterAccess: {
        test: '测试OpenRouter API访问权限',
        passed: cspDirectives['connect-src']?.some(src => 
          src.includes('openrouter.ai') || src.includes('api.openrouter.ai')
        ) || false,
        details: cspDirectives['connect-src'] || []
      },
      
      scriptSecurity: {
        test: '测试脚本安全配置',
        passed: cspDirectives['script-src']?.includes(`'nonce-${testNonce}'`) ||
                cspDirectives['script-src']?.includes("'unsafe-inline'") || false,
        details: cspDirectives['script-src'] || []
      },
      
      styleSecurity: {
        test: '测试样式安全配置(Tailwind支持)',
        passed: cspDirectives['style-src']?.includes("'unsafe-inline'") && 
                cspDirectives['style-src']?.includes("fonts.googleapis.com") || false,
        details: cspDirectives['style-src'] || []
      },
      
      frameProtection: {
        test: '测试点击劫持防护',
        passed: !!(securityHeaders['X-Frame-Options'] || 
                   cspDirectives['frame-ancestors']),
        details: {
          xFrameOptions: securityHeaders['X-Frame-Options'],
          frameAncestors: cspDirectives['frame-ancestors']
        }
      },
      
      xssProtection: {
        test: '测试XSS防护',
        passed: !!(securityHeaders['X-XSS-Protection'] && 
                   securityHeaders['Content-Security-Policy']),
        details: {
          xXssProtection: securityHeaders['X-XSS-Protection'],
          hasCsp: !!securityHeaders['Content-Security-Policy']
        }
      }
    };

    // 计算通过率
    const totalTests = Object.keys(tests).length;
    const passedTests = Object.values(tests).filter(test => test.passed).length;
    const passRate = Math.round((passedTests / totalTests) * 100);

    return NextResponse.json({
      summary: {
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        passRate: `${passRate}%`
      },
      securityHeaders,
      cspDirectives,
      tests,
      recommendations: generateRecommendations(tests)
    });

  } catch (error) {
    console.error('安全测试错误:', error);
    
    return NextResponse.json(
      { error: '安全测试执行失败', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * 基于测试结果生成安全建议
 */
function generateRecommendations(tests: Record<string, any>): string[] {
  const recommendations: string[] = [];

  if (!tests.nonceGeneration.passed) {
    recommendations.push('🔧 修复nonce生成机制，确保随机性和长度符合要求');
  }

  if (!tests.cspDirectives.passed) {
    recommendations.push('🔧 补充缺失的CSP指令，确保完整的内容安全策略');
  }

  if (!tests.openRouterAccess.passed) {
    recommendations.push('🔧 确保connect-src指令包含OpenRouter API域名');
  }

  if (!tests.scriptSecurity.passed) {
    recommendations.push('🔧 优化script-src配置，建议使用nonce而非unsafe-inline');
  }

  if (!tests.styleSecurity.passed) {
    recommendations.push('🔧 确保style-src支持Tailwind CSS和Google Fonts');
  }

  if (!tests.frameProtection.passed) {
    recommendations.push('🔧 配置frame-ancestors或X-Frame-Options防护');
  }

  if (!tests.xssProtection.passed) {
    recommendations.push('🔧 启用XSS防护和CSP策略');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ 安全配置良好，无需额外优化');
  }

  return recommendations;
}