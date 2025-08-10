// 简化的类型定义 - 专注核心功能

export interface SimpleTemplate {
  id: string
  title: string
  description: string
  industry: string
  icon?: string
  fields: SimpleField[]
  prompt: string // 简化为单个提示词模板
}

export interface SimpleField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select'
  placeholder?: string
  required: boolean
  options?: string[] // 仅用于select类型
}

export interface SimpleFormData {
  [key: string]: string
}

export interface GeneratedResult {
  id: string
  content: string
  template: SimpleTemplate
  formData: SimpleFormData
  createdAt: Date
}

export interface SimplePromptGeneratorProps {
  industry: string
  templates: SimpleTemplate[]
  onGenerate?: (result: GeneratedResult) => void
  className?: string
}