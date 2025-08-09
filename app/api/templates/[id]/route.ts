import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

/**
 * 获取单个模板详情API
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id
    
    // 读取模板数据
    const templatesPath = path.join(process.cwd(), 'data', 'templates-2025.json')
    const fileContent = await fs.readFile(templatesPath, 'utf-8')
    const data = JSON.parse(fileContent)
    
    // 在所有行业中查找模板
    for (const [industryKey, industryData] of Object.entries(data.industries)) {
      const template = (industryData as any).templates.find(
        (t: any) => t.id === templateId
      )
      
      if (template) {
        return NextResponse.json({
          success: true,
          template: template,
          industry: {
            id: industryKey,
            name: (industryData as any).name,
            description: (industryData as any).description
          }
        })
      }
    }
    
    // 模板未找到
    return NextResponse.json({
      success: false,
      error: '模板不存在',
      templateId: templateId
    }, { status: 404 })
    
  } catch (error) {
    console.error('获取模板详情失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取模板详情失败',
      message: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}