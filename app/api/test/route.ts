import { NextResponse } from 'next/server';

// 强制动态渲染 - 确保每次请求都重新执行
export const dynamic = 'force-dynamic';


export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'API endpoint working',
    timestamp: new Date().toISOString() 
  });
}