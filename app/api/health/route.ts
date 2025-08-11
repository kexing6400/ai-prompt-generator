/**
 * 系统基础健康检查API
 * 提供快速的系统状态检查
 * 作者：Claude Code (后端架构师)
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/health - 基础健康检查
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'healthy',
    message: 'AI Prompt Generator API正常运行',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
}

/**
 * HEAD /api/health - 快速健康检查
 */
export async function HEAD(request: NextRequest) {
  return new Response(null, { status: 200 });
}