import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

/**
 * 获取模板列表API
 * 支持按行业筛选
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const industry = searchParams.get('industry')
    const limit = searchParams.get('limit')
    
    // 读取模板数据
    const templatesPath = path.join(process.cwd(), 'data', 'templates-2025.json')
    const fileContent = await fs.readFile(templatesPath, 'utf-8')
    const data = JSON.parse(fileContent)
    
    // 如果指定了行业，返回该行业的模板
    if (industry && data.industries[industry]) {
      const industryData = data.industries[industry]
      const templates = limit 
        ? industryData.templates.slice(0, parseInt(limit))
        : industryData.templates
        
      return NextResponse.json({
        success: true,
        industry: industry,
        name: industryData.name,
        description: industryData.description,
        icon: industryData.icon,
        templates: templates,
        total: industryData.templates.length
      })
    }
    
    // 返回所有行业的概览
    const overview = Object.entries(data.industries).map(([key, value]: [string, any]) => ({
      id: key,
      name: value.name,
      description: value.description,
      icon: value.icon,
      templateCount: value.templates.length,
      templates: limit ? value.templates.slice(0, parseInt(limit)) : value.templates
    }))
    
    return NextResponse.json({
      success: true,
      version: data.version,
      lastUpdated: data.lastUpdated,
      totalTemplates: data.totalTemplates,
      industries: overview
    })
    
  } catch (error) {
    console.error('获取模板列表失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取模板列表失败',
      message: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}