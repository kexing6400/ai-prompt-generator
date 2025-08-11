/**
 * AI Prompt Generator - 专业角色类型定义
 * 
 * 定义管理后台的专业角色和AI模型相关的类型
 */

/**
 * 专业角色接口 - 包含完整的AI配置参数
 */
export interface ProfessionalRole {
  id: string
  name: string
  systemPrompt: string
  // AI模型相关配置 - 修复缺失的属性
  model: string
  temperature: number
  maxTokens: number
  // 元数据
  description?: string
  category?: string
  industry?: string
  tags?: string[]
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
}

/**
 * 可用的AI模型列表
 */
export interface AIModel {
  id: string
  name: string
  provider: 'openrouter' | 'openai' | 'anthropic' | 'custom'
  displayName: string
  description: string
  maxTokens: number
  costPer1kTokens?: number
  capabilities?: string[]
  isActive: boolean
}

/**
 * AI模型配置
 */
export interface ModelConfig {
  model: string
  temperature: number
  maxTokens: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
}

/**
 * 管理员模型管理返回类型 - 修复UseAdminModelsReturn缺失error属性
 */
export interface UseAdminModelsReturn {
  models: AIModel[]
  categories: Record<string, AIModel[]> | null
  loading: boolean
  error: string | null  // 添加缺失的error属性
  // 操作方法
  refreshModels: () => Promise<void>
  addModel: (model: Omit<AIModel, 'id'>) => Promise<boolean>
  updateModel: (id: string, updates: Partial<AIModel>) => Promise<boolean>
  deleteModel: (id: string) => Promise<boolean>
  testModel: (modelId: string, testPrompt: string) => Promise<{
    success: boolean
    response?: string
    error?: string
    latency?: number
  }>
}

/**
 * 专业角色管理Hook返回类型
 */
export interface UseAdminRolesReturn {
  roles: ProfessionalRole[]
  loading: boolean
  error: string | null
  // 操作方法
  refreshRoles: () => Promise<void>
  addRole: (role: Omit<ProfessionalRole, 'id'>) => Promise<boolean>
  updateRole: (id: string, updates: Partial<ProfessionalRole>) => Promise<boolean>
  deleteRole: (id: string) => Promise<boolean>
  duplicateRole: (id: string) => Promise<boolean>
}

/**
 * 模板管理相关类型
 */
export interface TemplateConfig {
  id: string
  name: string
  description: string
  template: string
  category: string
  industry: string
  parameters: TemplateParameter[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TemplateParameter {
  key: string
  name: string
  type: 'text' | 'textarea' | 'select' | 'number'
  required: boolean
  defaultValue?: string
  options?: string[]
  placeholder?: string
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
  }
}

/**
 * 管理员配置类型
 */
export interface AdminConfig {
  // 系统设置
  systemSettings: {
    siteName: string
    siteDescription: string
    supportEmail: string
    maintenanceMode: boolean
    debugMode: boolean
  }
  // AI配置
  aiSettings: {
    defaultModel: string
    defaultTemperature: number
    defaultMaxTokens: number
    rateLimits: {
      requestsPerMinute: number
      requestsPerHour: number
      requestsPerDay: number
    }
  }
  // 安全配置
  securitySettings: {
    sessionTimeout: number
    maxFailedAttempts: number
    passwordRequirements: {
      minLength: number
      requireUppercase: boolean
      requireLowercase: boolean
      requireNumbers: boolean
      requireSymbols: boolean
    }
  }
}

/**
 * 管理员配置管理Hook返回类型
 */
export interface UseAdminConfigReturn {
  config: AdminConfig | null
  loading: boolean
  error: string | null
  // 操作方法
  refreshConfig: () => Promise<void>
  updateConfig: (updates: Partial<AdminConfig>) => Promise<boolean>
  resetToDefaults: () => Promise<boolean>
}

/**
 * 文档生成相关类型
 */
export interface DocumentTemplate {
  id: string
  name: string
  description: string
  type: 'contract' | 'letter' | 'report' | 'analysis' | 'other'
  template: string
  variables: DocumentVariable[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface DocumentVariable {
  key: string
  name: string
  type: 'text' | 'date' | 'number' | 'boolean' | 'list'
  required: boolean
  defaultValue?: any
  description?: string
}

/**
 * 管理员文档管理Hook返回类型
 */
export interface UseAdminDocumentsReturn {
  documents: DocumentTemplate[]
  loading: boolean
  error: string | null
  // 操作方法
  refreshDocuments: () => Promise<void>
  addDocument: (document: Omit<DocumentTemplate, 'id'>) => Promise<boolean>
  updateDocument: (id: string, updates: Partial<DocumentTemplate>) => Promise<boolean>
  deleteDocument: (id: string) => Promise<boolean>
}

/**
 * 管理员模板管理Hook返回类型
 */
export interface UseAdminTemplatesReturn {
  templates: TemplateConfig[]
  loading: boolean
  error: string | null
  // 操作方法
  refreshTemplates: () => Promise<void>
  addTemplate: (template: Omit<TemplateConfig, 'id'>) => Promise<boolean>
  updateTemplate: (id: string, updates: Partial<TemplateConfig>) => Promise<boolean>
  deleteTemplate: (id: string) => Promise<boolean>
  duplicateTemplate: (id: string) => Promise<boolean>
}

// 常量定义 - 修复AVAILABLE_MODELS未定义问题
export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: 'gpt-4o',
    name: 'gpt-4o',
    provider: 'openrouter',
    displayName: 'GPT-4o',
    description: '最新的GPT-4优化版本，更快更智能',
    maxTokens: 128000,
    costPer1kTokens: 0.005,
    capabilities: ['text', 'code', 'analysis'],
    isActive: true
  },
  {
    id: 'claude-3-sonnet',
    name: 'anthropic/claude-3-sonnet',
    provider: 'openrouter',
    displayName: 'Claude 3 Sonnet',
    description: 'Anthropic的Claude 3 Sonnet，平衡性能与速度',
    maxTokens: 200000,
    costPer1kTokens: 0.003,
    capabilities: ['text', 'analysis', 'reasoning'],
    isActive: true
  },
  {
    id: 'claude-3-haiku',
    name: 'anthropic/claude-3-haiku',
    provider: 'openrouter',
    displayName: 'Claude 3 Haiku',
    description: 'Anthropic的Claude 3 Haiku，快速响应',
    maxTokens: 200000,
    costPer1kTokens: 0.00025,
    capabilities: ['text', 'quick-response'],
    isActive: true
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'openai/gpt-3.5-turbo',
    provider: 'openrouter',
    displayName: 'GPT-3.5 Turbo',
    description: '经济实用的GPT模型',
    maxTokens: 4096,
    costPer1kTokens: 0.0015,
    capabilities: ['text', 'code'],
    isActive: true
  }
]

/**
 * 风险评估级别 - 修复legal-generate中的比较错误
 */
export type RiskLevel = 'minimal' | 'moderate' | 'significant' | 'critical'

/**
 * 使用限制类型 - 修复privilegedContentAccess缺失
 */
export interface UsageLimits {
  daily: number
  monthly: number
  privilegedContentAccess: boolean  // 添加缺失的属性
}

/**
 * 用户类型扩展 - 修复subscription.plan类型问题
 */
export interface ExtendedUser {
  id: string
  email: string
  name: string
  createdAt: Date
  updatedAt: Date
  preferences: {
    language: 'zh' | 'en'
    theme: string
    defaultModel: string
    autoSave: boolean
    notifications: {
      email: boolean
      push: boolean
    }
  }
  isActive: boolean
  emailVerified: boolean
  subscription: {
    plan: 'free' | 'pro' | 'enterprise' | 'professional'  // 添加professional选项
    status: 'active' | 'inactive' | 'suspended'
    expiresAt?: Date
  }
}

/**
 * 使用记录类型 - 修复metadata不存在错误
 */
export interface Usage {
  id: string
  userId: string
  action: string
  timestamp: Date
  metadata?: Record<string, any>  // 添加metadata属性
}

// 删除错误的默认导出，类型不能作为值导出