/**
 * 律师AI工作台数据库类型定义
 * Lawyer AI Workstation Database Types
 * 
 * 基于PostgreSQL Schema自动生成的TypeScript类型定义
 * 提供完整的类型安全和智能提示支持
 */

// =================================================================
// 枚举类型 (Enum Types)
// =================================================================

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  FIRM_ADMIN = 'firm_admin',
  PARTNER = 'partner',
  SENIOR_ATTORNEY = 'senior_attorney',
  ATTORNEY = 'attorney',
  PARALEGAL = 'paralegal',
  LEGAL_ASSISTANT = 'legal_assistant',
  INTERN = 'intern'
}

export enum CaseStatus {
  PROSPECTIVE = 'prospective',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  CLOSED = 'closed',
  ARCHIVED = 'archived'
}

export enum CasePriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum CaseParticipantRole {
  LEAD_ATTORNEY = 'lead_attorney',
  CO_COUNSEL = 'co_counsel',
  PARALEGAL = 'paralegal',
  CONSULTANT = 'consultant',
  OBSERVER = 'observer'
}

export enum DocumentType {
  CONTRACT = 'contract',
  MOTION = 'motion',
  BRIEF = 'brief',
  MEMO = 'memo',
  CORRESPONDENCE = 'correspondence',
  EVIDENCE = 'evidence',
  RESEARCH = 'research',
  TEMPLATE = 'template',
  OTHER = 'other'
}

export enum DocumentStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  APPROVED = 'approved',
  FINAL = 'final',
  ARCHIVED = 'archived'
}

export enum TemplateCategory {
  CONTRACTS = 'contracts',
  LITIGATION = 'litigation',
  CORPORATE = 'corporate',
  REAL_ESTATE = 'real_estate',
  EMPLOYMENT = 'employment',
  INTELLECTUAL_PROPERTY = 'intellectual_property',
  FAMILY_LAW = 'family_law',
  CRIMINAL_LAW = 'criminal_law',
  IMMIGRATION = 'immigration',
  OTHER = 'other'
}

export enum PromptType {
  LEGAL_RESEARCH = 'legal_research',
  CONTRACT_REVIEW = 'contract_review',
  DOCUMENT_DRAFT = 'document_draft',
  CASE_ANALYSIS = 'case_analysis',
  COMPLIANCE_CHECK = 'compliance_check',
  RISK_ASSESSMENT = 'risk_assessment',
  CLIENT_ADVICE = 'client_advice',
  OTHER = 'other'
}

export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  ACCESS_DENIED = 'access_denied',
  EXPORT = 'export',
  IMPORT = 'import',
  SHARE = 'share'
}

// =================================================================
// 核心业务类型 (Core Business Types)
// =================================================================

export interface LawFirm {
  id: string;
  name: string;
  registration_number?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  jurisdiction?: string;
  founded_date?: Date;
  bar_association_id?: string;
  
  // 合规设置
  data_retention_days: number;
  encryption_enabled: boolean;
  audit_enabled: boolean;
  
  // 系统字段
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  is_active: boolean;
}

export interface User {
  id: string;
  law_firm_id: string;
  
  // 基本信息
  email: string;
  password_hash: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  
  // 职业信息
  role: UserRole;
  bar_number?: string;
  bar_admission_date?: Date;
  specializations?: string[];
  
  // 认证信息
  email_verified: boolean;
  phone?: string;
  phone_verified: boolean;
  
  // 安全设置
  two_factor_enabled: boolean;
  two_factor_secret?: string;
  last_login_at?: Date;
  last_login_ip?: string;
  failed_login_attempts: number;
  locked_until?: Date;
  
  // 个人设置
  timezone: string;
  language: string;
  preferences: Record<string, any>;
  
  // 系统字段
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  
  // 关联数据
  law_firm?: LawFirm;
}

export interface Client {
  id: string;
  law_firm_id: string;
  
  // 客户信息（加密存储）
  full_name_encrypted: string;
  email_encrypted?: string;
  phone_encrypted?: string;
  address_encrypted?: string;
  
  // 客户类型
  client_type: 'individual' | 'corporation' | 'government';
  tax_id_encrypted?: string;
  
  // 业务信息
  intake_date: Date;
  source?: string;
  referring_attorney?: string;
  primary_attorney?: string;
  
  // 风险评级
  conflict_check_status: 'pending' | 'cleared' | 'conflicted';
  risk_level: 'low' | 'medium' | 'high';
  credit_rating?: string;
  
  // 系统字段
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  is_active: boolean;
  
  // 关联数据
  law_firm?: LawFirm;
  primary_attorney_user?: User;
  referring_attorney_user?: User;
}

export interface Case {
  id: string;
  law_firm_id: string;
  client_id: string;
  
  // 案件基本信息
  case_number: string;
  title: string;
  description?: string;
  case_type: string;
  
  // 案件状态
  status: CaseStatus;
  priority: CasePriority;
  
  // 重要日期
  opened_date: Date;
  statute_of_limitations_date?: Date;
  closed_date?: Date;
  
  // 财务信息
  estimated_value?: number;
  billing_rate_type: 'hourly' | 'flat_fee' | 'contingency';
  hourly_rate?: number;
  flat_fee?: number;
  contingency_percentage?: number;
  
  // 法庭信息
  court_name?: string;
  judge_name?: string;
  opposing_counsel?: string;
  opposing_party?: string;
  
  // 系统字段
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  
  // 关联数据
  law_firm?: LawFirm;
  client?: Client;
  participants?: CaseParticipant[];
  documents?: CaseDocument[];
  time_entries?: TimeEntry[];
}

export interface CaseParticipant {
  id: string;
  case_id: string;
  user_id: string;
  role: CaseParticipantRole;
  
  // 权限设置
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_share: boolean;
  
  // 时间追踪
  assigned_date: Date;
  removed_date?: Date;
  billable_hours: number;
  
  // 系统字段
  created_at: Date;
  created_by?: string;
  
  // 关联数据
  case?: Case;
  user?: User;
}

export interface Document {
  id: string;
  law_firm_id: string;
  
  // 基本信息
  title: string;
  description?: string;
  document_type: DocumentType;
  status: DocumentStatus;
  
  // 文件信息
  file_name?: string;
  file_size?: number;
  file_path?: string;
  mime_type?: string;
  file_hash?: string;
  
  // 版本控制
  version: number;
  parent_document_id?: string;
  is_current_version: boolean;
  
  // 分类和标签
  tags?: string[];
  category?: string;
  
  // 安全设置
  is_confidential: boolean;
  privilege_type?: string;
  access_level: number;
  
  // 系统字段
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  last_modified_by?: string;
  
  // 关联数据
  law_firm?: LawFirm;
  created_by_user?: User;
  parent_document?: Document;
  case_documents?: CaseDocument[];
}

export interface CaseDocument {
  id: string;
  case_id: string;
  document_id: string;
  
  // 关联信息
  relationship_type: string;
  notes?: string;
  
  // 系统字段
  created_at: Date;
  created_by?: string;
  
  // 关联数据
  case?: Case;
  document?: Document;
}

export interface LegalTemplate {
  id: string;
  law_firm_id: string;
  
  // 模板信息
  title: string;
  description?: string;
  category: TemplateCategory;
  subcategory?: string;
  
  // 模板内容
  content: string;
  variables: Array<{
    name: string;
    type: string;
    required: boolean;
    default_value?: any;
    description?: string;
  }>;
  
  // 使用统计
  usage_count: number;
  success_rate: number;
  
  // 权限设置
  is_public: boolean;
  access_level: number;
  
  // 版本控制
  version: number;
  parent_template_id?: string;
  is_active: boolean;
  
  // 系统字段
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  last_modified_by?: string;
  
  // 关联数据
  law_firm?: LawFirm;
  created_by_user?: User;
  parent_template?: LegalTemplate;
}

export interface AIPrompt {
  id: string;
  law_firm_id: string;
  
  // 提示词基本信息
  title: string;
  description?: string;
  prompt_type: PromptType;
  
  // 提示词内容
  system_prompt?: string;
  user_prompt: string;
  parameters: Record<string, any>;
  
  // 使用统计
  usage_count: number;
  average_rating: number;
  total_tokens: number;
  
  // 版本控制
  version: number;
  parent_prompt_id?: string;
  is_active: boolean;
  
  // 权限设置
  is_public: boolean;
  access_level: number;
  
  // 系统字段
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  last_modified_by?: string;
  
  // 关联数据
  law_firm?: LawFirm;
  created_by_user?: User;
  parent_prompt?: AIPrompt;
  interactions?: AIInteraction[];
}

export interface AIInteraction {
  id: string;
  law_firm_id: string;
  user_id: string;
  case_id?: string;
  prompt_id?: string;
  
  // 交互内容
  input_text: string;
  output_text?: string;
  
  // AI模型信息
  model_name?: string;
  model_version?: string;
  
  // 使用统计
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  processing_time_ms?: number;
  cost_usd?: number;
  
  // 质量评估
  user_rating?: number;
  feedback?: string;
  
  // 系统字段
  created_at: Date;
  
  // 关联数据
  law_firm?: LawFirm;
  user?: User;
  case?: Case;
  prompt?: AIPrompt;
}

export interface TimeEntry {
  id: string;
  law_firm_id: string;
  user_id: string;
  case_id?: string;
  
  // 时间信息
  entry_date: Date;
  start_time?: string;
  end_time?: string;
  duration_minutes: number;
  
  // 工作内容
  description: string;
  task_type?: string;
  
  // 计费信息
  is_billable: boolean;
  hourly_rate?: number;
  billable_amount?: number;
  
  // 状态
  is_billed: boolean;
  billing_date?: Date;
  
  // 系统字段
  created_at: Date;
  updated_at: Date;
  
  // 关联数据
  law_firm?: LawFirm;
  user?: User;
  case?: Case;
}

// =================================================================
// 审计和合规类型 (Audit and Compliance Types)
// =================================================================

export interface AuditLog {
  id: string;
  law_firm_id: string;
  
  // 操作信息
  user_id?: string;
  action: AuditAction;
  resource_type: string;
  resource_id?: string;
  
  // 操作详情
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  description?: string;
  
  // 会话信息
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  
  // 时间戳
  timestamp: Date;
  
  // 关联数据
  law_firm?: LawFirm;
  user?: User;
}

export interface DataRetentionPolicy {
  id: string;
  law_firm_id: string;
  
  // 策略信息
  table_name: string;
  retention_period_days: number;
  deletion_method: 'soft_delete' | 'hard_delete' | 'archive';
  
  // 执行信息
  last_cleanup_at?: Date;
  next_cleanup_at?: Date;
  
  // 系统字段
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  
  // 关联数据
  law_firm?: LawFirm;
}

export interface ComplianceCheck {
  id: string;
  law_firm_id: string;
  
  // 检查信息
  check_type: string;
  check_name: string;
  description?: string;
  
  // 执行结果
  status: 'passed' | 'failed' | 'warning';
  result_data?: Record<string, any>;
  issues_found: number;
  
  // 时间信息
  scheduled_at?: Date;
  started_at?: Date;
  completed_at?: Date;
  
  // 系统字段
  created_at: Date;
  
  // 关联数据
  law_firm?: LawFirm;
}

// =================================================================
// 统计和报告类型 (Statistics and Report Types)
// =================================================================

export interface ActiveCasesSummary {
  law_firm_id: string;
  status: CaseStatus;
  priority: CasePriority;
  case_count: number;
  avg_days_open: number;
}

export interface UserBillableHoursSummary {
  law_firm_id: string;
  user_id: string;
  full_name: string;
  month: Date;
  total_hours: number;
  billable_hours: number;
  total_revenue: number;
}

export interface AIUsageSummary {
  law_firm_id: string;
  user_id: string;
  full_name: string;
  month: Date;
  interaction_count: number;
  total_tokens: number;
  total_cost: number;
  avg_rating: number;
}

// =================================================================
// API请求和响应类型 (API Request/Response Types)
// =================================================================

// 创建请求类型
export interface CreateLawFirmRequest {
  name: string;
  registration_number?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  jurisdiction?: string;
  founded_date?: Date;
  bar_association_id?: string;
}

export interface CreateUserRequest {
  law_firm_id: string;
  email: string;
  password: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  role: UserRole;
  bar_number?: string;
  bar_admission_date?: Date;
  specializations?: string[];
  phone?: string;
  timezone?: string;
  language?: string;
}

export interface CreateCaseRequest {
  law_firm_id: string;
  client_id: string;
  case_number: string;
  title: string;
  description?: string;
  case_type: string;
  priority?: CasePriority;
  opened_date: Date;
  statute_of_limitations_date?: Date;
  estimated_value?: number;
  billing_rate_type: 'hourly' | 'flat_fee' | 'contingency';
  hourly_rate?: number;
  flat_fee?: number;
  contingency_percentage?: number;
  court_name?: string;
  judge_name?: string;
  opposing_counsel?: string;
  opposing_party?: string;
}

export interface CreateDocumentRequest {
  law_firm_id: string;
  title: string;
  description?: string;
  document_type: DocumentType;
  file_name?: string;
  file_size?: number;
  file_path?: string;
  mime_type?: string;
  tags?: string[];
  category?: string;
  is_confidential?: boolean;
  privilege_type?: string;
  access_level?: number;
}

export interface CreateLegalTemplateRequest {
  law_firm_id: string;
  title: string;
  description?: string;
  category: TemplateCategory;
  subcategory?: string;
  content: string;
  variables?: Array<{
    name: string;
    type: string;
    required: boolean;
    default_value?: any;
    description?: string;
  }>;
  is_public?: boolean;
  access_level?: number;
}

export interface CreateAIPromptRequest {
  law_firm_id: string;
  title: string;
  description?: string;
  prompt_type: PromptType;
  system_prompt?: string;
  user_prompt: string;
  parameters?: Record<string, any>;
  is_public?: boolean;
  access_level?: number;
}

export interface CreateAIInteractionRequest {
  law_firm_id: string;
  user_id: string;
  case_id?: string;
  prompt_id?: string;
  input_text: string;
  output_text?: string;
  model_name?: string;
  model_version?: string;
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  processing_time_ms?: number;
  cost_usd?: number;
  user_rating?: number;
  feedback?: string;
}

export interface CreateTimeEntryRequest {
  law_firm_id: string;
  user_id: string;
  case_id?: string;
  entry_date: Date;
  start_time?: string;
  end_time?: string;
  duration_minutes: number;
  description: string;
  task_type?: string;
  is_billable?: boolean;
  hourly_rate?: number;
}

// 更新请求类型
export interface UpdateCaseRequest extends Partial<CreateCaseRequest> {
  status?: CaseStatus;
  closed_date?: Date;
}

export interface UpdateDocumentRequest extends Partial<CreateDocumentRequest> {
  status?: DocumentStatus;
  version?: number;
}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {
  two_factor_enabled?: boolean;
  preferences?: Record<string, any>;
  is_active?: boolean;
}

// 查询参数类型
export interface CaseQueryParams {
  law_firm_id?: string;
  client_id?: string;
  status?: CaseStatus;
  priority?: CasePriority;
  case_type?: string;
  opened_after?: Date;
  opened_before?: Date;
  assigned_to?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sort_by?: 'opened_date' | 'updated_at' | 'title';
  sort_order?: 'asc' | 'desc';
}

export interface DocumentQueryParams {
  law_firm_id?: string;
  case_id?: string;
  document_type?: DocumentType;
  status?: DocumentStatus;
  is_confidential?: boolean;
  created_after?: Date;
  created_before?: Date;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
  sort_by?: 'created_at' | 'updated_at' | 'title';
  sort_order?: 'asc' | 'desc';
}

export interface TimeEntryQueryParams {
  law_firm_id?: string;
  user_id?: string;
  case_id?: string;
  entry_date_from?: Date;
  entry_date_to?: Date;
  is_billable?: boolean;
  is_billed?: boolean;
  task_type?: string;
  limit?: number;
  offset?: number;
}

// =================================================================
// 实用工具类型 (Utility Types)
// =================================================================

// 数据库记录类型（带系统字段）
export type DatabaseRecord<T> = T & {
  id: string;
  created_at: Date;
  updated_at: Date;
};

// API响应包装类型
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

// 分页查询结果类型
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// 文件上传类型
export interface FileUpload {
  file: File;
  document_type: DocumentType;
  title?: string;
  description?: string;
  tags?: string[];
  is_confidential?: boolean;
  privilege_type?: string;
}

// 搜索结果类型
export interface SearchResult<T> {
  item: T;
  score: number;
  highlight?: Record<string, string[]>;
}

// 统计数据类型
export interface DashboardStats {
  total_cases: number;
  active_cases: number;
  total_clients: number;
  total_documents: number;
  billable_hours_this_month: number;
  revenue_this_month: number;
  ai_interactions_this_month: number;
  recent_activities: AuditLog[];
}

// 权限检查结果类型
export interface PermissionCheck {
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_share: boolean;
  reason?: string;
}

// 数据导出类型
export interface DataExportRequest {
  table_names: string[];
  date_range?: {
    start_date: Date;
    end_date: Date;
  };
  format: 'json' | 'csv' | 'xlsx';
  include_deleted?: boolean;
}

// =================================================================
// 类型守卫和验证函数 (Type Guards and Validation)
// =================================================================

export const isUserRole = (role: string): role is UserRole => {
  return Object.values(UserRole).includes(role as UserRole);
};

export const isCaseStatus = (status: string): status is CaseStatus => {
  return Object.values(CaseStatus).includes(status as CaseStatus);
};

export const isDocumentType = (type: string): type is DocumentType => {
  return Object.values(DocumentType).includes(type as DocumentType);
};

export const isTemplateCategory = (category: string): category is TemplateCategory => {
  return Object.values(TemplateCategory).includes(category as TemplateCategory);
};

export const isPromptType = (type: string): type is PromptType => {
  return Object.values(PromptType).includes(type as PromptType);
};

// =================================================================
// 默认值和常量 (Defaults and Constants)
// =================================================================

export const DEFAULT_PAGINATION = {
  page: 1,
  per_page: 20,
  max_per_page: 100
};

export const ACCESS_LEVELS = {
  PUBLIC: 1,
  INTERNAL: 2,
  CONFIDENTIAL: 3,
  RESTRICTED: 4,
  TOP_SECRET: 5
};

export const BILLING_RATE_TYPES = {
  HOURLY: 'hourly',
  FLAT_FEE: 'flat_fee',
  CONTINGENCY: 'contingency'
} as const;

export const CLIENT_TYPES = {
  INDIVIDUAL: 'individual',
  CORPORATION: 'corporation',
  GOVERNMENT: 'government'
} as const;

export const CONFLICT_CHECK_STATUSES = {
  PENDING: 'pending',
  CLEARED: 'cleared',
  CONFLICTED: 'conflicted'
} as const;

export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
} as const;

// =================================================================
// 导出所有类型
// =================================================================

export type {
  LawFirm,
  User,
  Client,
  Case,
  CaseParticipant,
  Document,
  CaseDocument,
  LegalTemplate,
  AIPrompt,
  AIInteraction,
  TimeEntry,
  AuditLog,
  DataRetentionPolicy,
  ComplianceCheck,
  ActiveCasesSummary,
  UserBillableHoursSummary,
  AIUsageSummary
};