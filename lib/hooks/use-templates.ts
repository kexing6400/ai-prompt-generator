'use client'

import { useState, useEffect, useMemo } from 'react'
import type { PromptTemplate, TemplateField } from '@/components/prompt-wizard/types'

interface ApiTemplate {
  id: string
  title: string
  category: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
  prompt: {
    system: string
    context: string
    task: string
    format: string
    examples: string
  }
  tags: string[]
  useCases: string[]
  bestPractices: string[]
}

interface ApiIndustry {
  id: string
  name: string
  description: string
  icon: string
  templateCount: number
  templates: ApiTemplate[]
}

interface ApiResponse {
  success: boolean
  industries: ApiIndustry[]
  totalTemplates: number
  version: string
  lastUpdated: string
}

// 为不同行业生成默认字段
const generateDefaultFields = (template: ApiTemplate): TemplateField[] => {
  const baseFields: TemplateField[] = [
    {
      id: 'task_description',
      name: 'task_description',
      label: '任务描述',
      type: 'textarea',
      required: true,
      placeholder: '请详细描述您需要处理的具体任务或问题...',
      helpText: '提供详细的任务描述将有助于生成更精准的提示词',
      validation: {
        minLength: 20,
        maxLength: 1000
      }
    },
    {
      id: 'context_details',
      name: 'context_details',
      label: '背景信息',
      type: 'textarea',
      required: false,
      placeholder: '请提供相关的背景信息、约束条件或特殊要求...',
      helpText: '背景信息有助于AI更好地理解任务环境'
    }
  ]

  // 根据模板类别添加特定字段
  const additionalFields: TemplateField[] = []

  if (template.category?.toLowerCase().includes('contract') || 
      template.title?.toLowerCase().includes('contract')) {
    additionalFields.push({
      id: 'contract_type',
      name: 'contract_type',
      label: '合同类型',
      type: 'select',
      required: true,
      options: ['购销合同', '服务合同', '租赁合同', '技术合同', '劳动合同', '合伙协议'],
      helpText: '选择您需要处理的合同类型'
    })
    additionalFields.push({
      id: 'jurisdiction',
      name: 'jurisdiction',
      label: '法律管辖区',
      type: 'select',
      required: false,
      options: ['中华人民共和国', '香港特别行政区', '其他'],
      helpText: '指定适用的法律管辖区域'
    })
  }

  if (template.category?.toLowerCase().includes('research') || 
      template.title?.toLowerCase().includes('research')) {
    additionalFields.push({
      id: 'research_scope',
      name: 'research_scope',
      label: '研究范围',
      type: 'multiselect',
      required: true,
      options: ['法律条文', '司法解释', '案例判决', '学术观点', '行业惯例'],
      helpText: '选择需要研究的具体范围'
    })
    additionalFields.push({
      id: 'time_range',
      name: 'time_range',
      label: '时间范围',
      type: 'select',
      required: false,
      options: ['近1年', '近3年', '近5年', '不限'],
      helpText: '指定研究的时间范围'
    })
  }

  if (template.category?.toLowerCase().includes('analysis') || 
      template.title?.toLowerCase().includes('analysis')) {
    additionalFields.push({
      id: 'analysis_depth',
      name: 'analysis_depth',
      label: '分析深度',
      type: 'select',
      required: true,
      options: ['概要分析', '详细分析', '深度分析'],
      helpText: '选择所需的分析详细程度'
    })
  }

  if (template.category?.toLowerCase().includes('document') || 
      template.title?.toLowerCase().includes('document')) {
    additionalFields.push({
      id: 'document_format',
      name: 'document_format',
      label: '文档格式',
      type: 'select',
      required: false,
      options: ['正式法律文件', '内部备忘录', '客户报告', '简化版本'],
      helpText: '选择输出文档的格式风格'
    })
  }

  return [...baseFields, ...additionalFields]
}

// 将API数据转换为PromptTemplate格式
const transformApiTemplate = (apiTemplate: ApiTemplate, industry: string): PromptTemplate => {
  return {
    id: apiTemplate.id,
    title: apiTemplate.title,
    category: apiTemplate.category,
    industry: industry,
    description: apiTemplate.description,
    difficulty: apiTemplate.difficulty,
    estimatedTime: apiTemplate.estimatedTime,
    tags: apiTemplate.tags,
    useCases: apiTemplate.useCases,
    fields: generateDefaultFields(apiTemplate),
    prompt: apiTemplate.prompt,
    bestPractices: apiTemplate.bestPractices
  }
}

export function useTemplates(industry?: string) {
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true)
        setError(null)

        const url = '/api/templates/list'
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data: ApiResponse = await response.json()
        
        if (!data.success) {
          throw new Error('API返回失败状态')
        }

        // 转换所有行业的模板
        const allTemplates: PromptTemplate[] = []
        
        data.industries.forEach(industryData => {
          const industryTemplates = industryData.templates.map(template =>
            transformApiTemplate(template, industryData.name)
          )
          allTemplates.push(...industryTemplates)
        })

        // 如果指定了行业，过滤相应模板
        let filteredTemplates = allTemplates
        if (industry) {
          // 行业映射
          const industryMap: { [key: string]: string } = {
            'lawyers': 'Legal Services',
            'realtors': 'Real Estate Services',
            'insurance-advisors': 'Insurance Services',
            'teachers': 'Education Services',
            'accountants': 'Accounting Services'
          }
          
          const targetIndustry = industryMap[industry] || industry
          filteredTemplates = allTemplates.filter(template => 
            template.industry === targetIndustry ||
            template.industry.toLowerCase().includes(targetIndustry.toLowerCase())
          )
        }

        setTemplates(filteredTemplates)
        
      } catch (err) {
        console.error('获取模板失败:', err)
        setError(err instanceof Error ? err.message : '获取模板时发生未知错误')
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [industry])

  // 按行业分组的模板
  const templatesByIndustry = useMemo(() => {
    const grouped: { [industry: string]: PromptTemplate[] } = {}
    templates.forEach(template => {
      if (!grouped[template.industry]) {
        grouped[template.industry] = []
      }
      grouped[template.industry].push(template)
    })
    return grouped
  }, [templates])

  // 获取所有唯一的行业
  const industries = useMemo(() => {
    return [...new Set(templates.map(t => t.industry))].sort()
  }, [templates])

  // 获取所有唯一的难度级别
  const difficulties = useMemo(() => {
    return [...new Set(templates.map(t => t.difficulty))].sort()
  }, [templates])

  return {
    templates,
    templatesByIndustry,
    industries,
    difficulties,
    loading,
    error
  }
}