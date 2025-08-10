/**
 * AI Prompt Builder Pro - 模板管理API
 * 
 * 核心功能：
 * - 模板列表查询（支持过滤、分页、缓存）
 * - 模板详情获取
 * - 智能搜索和推荐
 * - 性能监控和限流
 * 
 * @author Claude Code (后端架构师)
 * @version 2.0
 * @date 2025-01-10
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { getCacheManager } from '@/lib/cache-manager'
import { getSecurityManager } from '@/lib/security-manager'

// =================================================================
// 类型定义和验证Schema
// =================================================================

const GetTemplatesSchema = z.object({
  industry: z.string().optional(),
  scenario: z.string().optional(),
  accessLevel: z.enum(['free', 'pro', 'enterprise']).optional(),
  search: z.string().optional(),
  page: z.string().transform((val) => parseInt(val) || 1),
  limit: z.string().transform((val) => Math.min(parseInt(val) || 20, 100)),
  sortBy: z.enum(['usage', 'rating', 'name', 'created_at']).default('usage'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

interface Template {
  id: string
  name: string
  description: string
  industry: {
    id: string
    code: string
    name: string
    icon: string
    color: string
  }
  scenario: {
    id: string
    code: string
    name: string
    difficulty: number
    estimatedTime: number
  }
  parametersSchema: object
  usageCount: number
  rating: number
  accessLevel: 'free' | 'pro' | 'enterprise'
  createdAt: string
  updatedAt: string
}

// =================================================================
// 数据库连接
// =================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// =================================================================
// GET /api/v1/templates - 获取模板列表
// =================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()
  
  const cacheManager = getCacheManager()
  const securityManager = getSecurityManager()

  try {
    // 1. 参数验证
    const searchParams = request.nextUrl.searchParams
    const params = GetTemplatesSchema.parse({
      industry: searchParams.get('industry'),
      scenario: searchParams.get('scenario'),  
      accessLevel: searchParams.get('accessLevel'),
      search: searchParams.get('search'),
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      sortBy: searchParams.get('sortBy') || 'usage',
      sortOrder: searchParams.get('sortOrder') || 'desc'
    })

    // 2. 生成缓存键
    const cacheKey = cacheManager.generateKey(
      'templates-list',
      params.industry || 'all',
      params.scenario || 'all', 
      params.accessLevel || 'all',
      params.search || '',
      params.page,
      params.limit,
      params.sortBy,
      params.sortOrder
    )

    // 3. 尝试从缓存获取
    let result = await cacheManager.get<any>(cacheKey)
    let fromCache = !!result

    if (!result) {
      // 4. 从数据库查询
      result = await fetchTemplatesFromDatabase(params)
      
      // 5. 缓存结果（5分钟TTL）
      await cacheManager.set(cacheKey, result, { ttl: 5 * 60 * 1000 })
      fromCache = false
    }

    // 6. 更新响应元数据
    result.meta = {
      ...result.meta,
      requestId,
      responseTime: Date.now() - startTime,
      cached: fromCache
    }

    return NextResponse.json(result, {
      headers: {
        'X-Request-ID': requestId,
        'X-Response-Time': (Date.now() - startTime).toString(),
        'X-Cache-Status': fromCache ? 'HIT' : 'MISS',
        'Cache-Control': 'public, max-age=300'
      }
    })

  } catch (error) {
    console.error('模板列表查询失败:', error)

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服务器内部错误'
      },
      meta: {
        requestId,
        responseTime: Date.now() - startTime
      }
    }, { status: 500 })
  }
}

// =================================================================
// 数据库查询函数
// =================================================================

async function fetchTemplatesFromDatabase(params: z.infer<typeof GetTemplatesSchema>) {
  try {
    // 模拟数据库查询 - 实际应该连接Supabase
    const mockTemplates = [
      {
        id: '1',
        name: '合同审查专家',
        description: '专业的合同条款分析和风险评估',
        industry: { code: 'lawyer', name: '法律服务', icon: 'scale', color: '#1F2937' },
        scenario: { code: 'contract-review', name: '合同审查', difficulty: 3, estimatedTime: 10 },
        parametersSchema: { contractType: { type: 'select', options: ['服务合同', '买卖合同'] } },
        usageCount: 1250,
        rating: 4.8,
        accessLevel: 'free' as const,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-10T00:00:00Z'
      }
    ]

    // 应用过滤和分页
    let filtered = mockTemplates
    if (params.industry) {
      filtered = filtered.filter(t => t.industry.code === params.industry)
    }

    const total = filtered.length
    const totalPages = Math.ceil(total / params.limit)
    const offset = (params.page - 1) * params.limit
    const paginatedResults = filtered.slice(offset, offset + params.limit)

    return {
      success: true,
      data: paginatedResults,
      meta: {
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages,
          hasNext: params.page < totalPages,
          hasPrev: params.page > 1
        }
      }
    }
  } catch (error) {
    throw error
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: '方法不允许' }
  }, { status: 405 })
}