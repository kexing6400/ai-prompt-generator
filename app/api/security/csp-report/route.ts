/**
 * CSP违规报告API端点
 * 用于监控和分析内容安全策略违规事件
 * 遵循OWASP安全监控最佳实践
 */
import { NextRequest, NextResponse } from 'next/server';

// 强制动态渲染 - 确保每次请求都重新执行
export const dynamic = 'force-dynamic';


// CSP违规报告接口
interface CSPViolationReport {
  'blocked-uri'?: string;
  'column-number'?: number;
  'document-uri'?: string;
  'effective-directive'?: string;
  'line-number'?: number;
  'original-policy'?: string;
  'referrer'?: string;
  'script-sample'?: string;
  'source-file'?: string;
  'status-code'?: number;
  'violated-directive'?: string;
}

interface CSPReport {
  'csp-report': CSPViolationReport;
}

// 简单的内存存储 (生产环境应使用数据库)
const violationStore: {
  reports: Array<CSPViolationReport & { timestamp: string; userAgent?: string }>;
  stats: Record<string, number>;
} = {
  reports: [],
  stats: {}
};

/**
 * 处理CSP违规报告
 */
export async function POST(request: NextRequest) {
  try {
    // 验证Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/csp-report') && !contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: '无效的Content-Type' }, 
        { status: 400 }
      );
    }

    const body = await request.json() as CSPReport;
    const report = body['csp-report'];

    if (!report) {
      return NextResponse.json(
        { error: '无效的CSP报告格式' }, 
        { status: 400 }
      );
    }

    // 记录报告
    const enhancedReport = {
      ...report,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent') || '',
    };

    // 存储报告 (最多保留1000条)
    violationStore.reports.unshift(enhancedReport);
    if (violationStore.reports.length > 1000) {
      violationStore.reports = violationStore.reports.slice(0, 1000);
    }

    // 更新统计信息
    const directive = report['violated-directive'] || report['effective-directive'] || 'unknown';
    violationStore.stats[directive] = (violationStore.stats[directive] || 0) + 1;

    // 开发环境下打印详细信息
    if (process.env.NODE_ENV === 'development') {
      console.warn('🚨 CSP违规报告:', {
        directive,
        blockedUri: report['blocked-uri'],
        sourceFile: report['source-file'],
        lineNumber: report['line-number'],
        documentUri: report['document-uri']
      });
    }

    // 检查是否为严重违规 (脚本注入尝试)
    if (directive.includes('script-src') && report['blocked-uri'] && 
        (report['blocked-uri'].includes('javascript:') || 
         report['blocked-uri'].includes('data:') ||
         report['blocked-uri'].includes('eval'))) {
      
      console.error('🚨 严重安全威胁检测到:', {
        type: '可疑脚本注入',
        blockedUri: report['blocked-uri'],
        timestamp: enhancedReport.timestamp,
        userAgent: enhancedReport.userAgent,
        sourceFile: report['source-file']
      });

      // 这里可以集成告警系统 (如Slack, Email等)
      // await sendSecurityAlert(enhancedReport);
    }

    return NextResponse.json({ 
      status: 'received',
      reportId: enhancedReport.timestamp 
    });

  } catch (error) {
    console.error('CSP报告处理错误:', error);
    
    return NextResponse.json(
      { error: '报告处理失败' }, 
      { status: 500 }
    );
  }
}

/**
 * 获取CSP违规统计信息 (仅开发环境)
 */
export async function GET(request: NextRequest) {
  // 生产环境应该需要认证
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: '生产环境不提供此功能' }, 
      { status: 403 }
    );
  }

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const directive = url.searchParams.get('directive');

  let reports = violationStore.reports.slice(0, limit);
  
  // 根据指令筛选
  if (directive) {
    reports = reports.filter(report => 
      report['violated-directive']?.includes(directive) ||
      report['effective-directive']?.includes(directive)
    );
  }

  return NextResponse.json({
    reports,
    stats: violationStore.stats,
    total: violationStore.reports.length,
    lastUpdated: violationStore.reports[0]?.timestamp || null
  });
}

/**
 * 清除违规报告 (仅开发环境)
 */
export async function DELETE() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: '生产环境不提供此功能' }, 
      { status: 403 }
    );
  }

  violationStore.reports = [];
  violationStore.stats = {};

  return NextResponse.json({ 
    message: '违规报告已清空' 
  });
}