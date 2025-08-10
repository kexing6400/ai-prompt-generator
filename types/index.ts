/**
 * AI Prompt Generator - 核心类型定义
 * 
 * 这个文件定义了整个应用的TypeScript类型，确保类型安全和开发效率
 */

// ============ 行业相关类型 ============

/**
 * 支持的5个垂直行业类型
 */
export type IndustryType = 'lawyer' | 'realtor' | 'insurance' | 'teacher' | 'accountant'

/**
 * 行业信息接口
 */
export interface IndustryInfo {
  id: IndustryType
  name: string
  displayName: string
  description: string
  icon: string
  color: string
  gradient: string
  keywords: string[]
  defaultPromptTemplates: PromptTemplate[]
}

// ============ Prompt相关类型 ============

/**
 * Prompt模板类型
 */
export interface PromptTemplate {
  id: string
  name: string
  description: string
  industry: IndustryType
  category: PromptCategory
  template: string
  parameters: PromptParameter[]
  tags: string[]
  isPopular?: boolean
  isPremium?: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Prompt参数类型
 */
export interface PromptParameter {
  id: string
  name: string
  displayName: string
  description: string
  type: ParameterType
  required: boolean
  defaultValue?: string
  options?: ParameterOption[]
  placeholder?: string
  validation?: ValidationRule[]
}

/**
 * 参数数据类型
 */
export type ParameterType = 
  | 'text' 
  | 'textarea' 
  | 'select' 
  | 'multiselect' 
  | 'number' 
  | 'date' 
  | 'boolean' 
  | 'file'

/**
 * 参数选项类型
 */
export interface ParameterOption {
  label: string
  value: string
  description?: string
}

/**
 * Prompt分类
 */
export type PromptCategory = 
  | 'analysis'    // 分析类
  | 'generation'  // 生成类
  | 'review'      // 审查类
  | 'consultation' // 咨询类
  | 'planning'    // 规划类
  | 'communication' // 沟通类
  | 'research'    // 研究类
  | 'documentation' // 文档类

/**
 * 验证规则类型
 */
export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom'
  value?: string | number
  message: string
}

// ============ 用户与认证相关类型 ============

/**
 * 用户接口
 */
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  industry?: IndustryType
  subscription: SubscriptionPlan
  createdAt: Date
  lastLoginAt: Date
  preferences: UserPreferences
}

/**
 * 用户偏好设置
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: 'zh' | 'en'
  defaultIndustry?: IndustryType
  emailNotifications: boolean
  autoSave: boolean
}

/**
 * 订阅计划类型
 */
export type SubscriptionPlan = 'free' | 'pro' | 'enterprise'

// ============ Prompt生成与历史记录类型 ============

/**
 * 生成的Prompt结果
 */
export interface GeneratedPrompt {
  id: string
  userId: string
  templateId: string
  industry: IndustryType
  title: string
  content: string
  parameters: Record<string, unknown>
  createdAt: Date
  isFavorite: boolean
  usageCount: number
  tags: string[]
}

/**
 * Prompt使用历史
 */
export interface PromptHistory {
  id: string
  userId: string
  promptId: string
  action: HistoryAction
  timestamp: Date
  metadata?: Record<string, unknown>
}

/**
 * 历史记录操作类型
 */
export type HistoryAction = 'created' | 'viewed' | 'copied' | 'favorited' | 'shared' | 'exported'

// ============ API响应类型 ============

/**
 * 标准API响应格式
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
  timestamp: Date
}

/**
 * 分页响应格式
 */
export interface PaginatedResponse<T = unknown> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ============ 表单与UI相关类型 ============

/**
 * 表单字段状态
 */
export interface FormFieldState {
  value: string
  error?: string
  touched: boolean
  isValid: boolean
}

/**
 * 表单状态
 */
export interface FormState {
  fields: Record<string, FormFieldState>
  isSubmitting: boolean
  isValid: boolean
  errors: Record<string, string>
}

/**
 * 通知类型
 */
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

/**
 * 加载状态类型
 */
export interface LoadingState {
  isLoading: boolean
  error?: string
  retryCount: number
}

// ============ 业务逻辑相关类型 ============

/**
 * 搜索过滤器
 */
export interface SearchFilters {
  query?: string
  industry?: IndustryType
  category?: PromptCategory
  tags?: string[]
  isPopular?: boolean
  isPremium?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
}

/**
 * 排序选项
 */
export interface SortOption {
  field: 'name' | 'createdAt' | 'popularity' | 'category'
  direction: 'asc' | 'desc'
}

/**
 * 导出格式类型
 */
export type ExportFormat = 'json' | 'csv' | 'txt' | 'md'

/**
 * 分析统计数据
 */
export interface AnalyticsData {
  totalPrompts: number
  favoritePrompts: number
  industryUsage: Record<IndustryType, number>
  categoryUsage: Record<PromptCategory, number>
  monthlyUsage: Array<{
    month: string
    count: number
  }>
}

// ============ 工具函数类型 ============

/**
 * 异步函数返回类型
 */
export type AsyncReturnType<T extends (...args: any[]) => Promise<any>> = 
  T extends (...args: any[]) => Promise<infer R> ? R : any

/**
 * 可选属性类型工具
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * 深度只读类型
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

/**
 * 可空类型
 */
export type Nullable<T> = T | null

/**
 * 组件属性类型
 */
export interface ComponentProps {
  className?: string
  children?: React.ReactNode
}

// ============ AI对话系统类型 ============

/**
 * 导出AI对话相关类型
 */
export * from './ai-chat'