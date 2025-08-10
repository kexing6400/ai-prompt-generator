/**
 * 文档生成系统类型定义
 * Document Generation System Type Definitions
 */

// 文档格式枚举
export enum DocumentFormat {
  PDF = 'pdf',
  DOCX = 'docx',
  MD = 'markdown'
}

// 文档模板类型枚举
export enum DocumentTemplateType {
  LEGAL_CONTRACT = 'legal-contract',
  BUSINESS_PROPOSAL = 'business-proposal', 
  RESEARCH_REPORT = 'research-report',
  EDUCATION_PLAN = 'education-plan',
  FINANCIAL_REPORT = 'financial-report'
}

// 文档样式配置
export interface DocumentStyle {
  // 字体配置
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  
  // 颜色配置
  primaryColor?: string;
  secondaryColor?: string;
  textColor?: string;
  backgroundColor?: string;
  
  // 页面配置
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  pageSize?: 'A4' | 'Letter' | 'Legal';
  orientation?: 'portrait' | 'landscape';
  
  // 头部和页脚
  showHeader?: boolean;
  showFooter?: boolean;
  showPageNumbers?: boolean;
  
  // 品牌配置
  logo?: string;
  watermark?: string;
  companyName?: string;
}

// 文档内容数据结构
export interface DocumentData {
  // 基本信息
  title: string;
  subtitle?: string;
  author?: string;
  date?: string;
  version?: string;
  
  // 内容部分
  sections: DocumentSection[];
  
  // 附加信息
  metadata?: Record<string, any>;
  variables?: Record<string, string>;
}

// 文档章节结构
export interface DocumentSection {
  id: string;
  title: string;
  content: string;
  subsections?: DocumentSection[];
  type?: 'text' | 'table' | 'image' | 'list' | 'code';
  metadata?: Record<string, any>;
}

// 文档模板接口
export interface DocumentTemplate {
  id: string;
  name: string;
  type: DocumentTemplateType;
  description: string;
  category: string;
  thumbnail?: string;
  
  // 模板配置
  defaultStyle: DocumentStyle;
  requiredFields: string[];
  optionalFields: string[];
  
  // 内容结构定义
  structure: TemplateStructure;
  
  // 示例数据
  sampleData: DocumentData;
}

// 模板结构定义
export interface TemplateStructure {
  sections: TemplateSectionConfig[];
  allowCustomSections?: boolean;
}

export interface TemplateSectionConfig {
  id: string;
  title: string;
  required: boolean;
  type: 'text' | 'table' | 'image' | 'list' | 'code';
  placeholder?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

// 文档生成请求
export interface DocumentGenerationRequest {
  templateId: string;
  format: DocumentFormat;
  data: DocumentData;
  style?: Partial<DocumentStyle>;
  options?: DocumentGenerationOptions;
}

// 文档生成选项
export interface DocumentGenerationOptions {
  includeWatermark?: boolean;
  includeTimestamp?: boolean;
  includeTOC?: boolean; // Table of Contents
  pageNumbers?: boolean;
  fileName?: string;
  quality?: 'low' | 'medium' | 'high';
}

// 文档生成响应
export interface DocumentGenerationResponse {
  success: boolean;
  documentId: string;
  downloadUrl?: string;
  base64?: string;
  fileName: string;
  fileSize: number;
  error?: string;
}

// 文档预览配置
export interface DocumentPreviewConfig {
  showToolbar?: boolean;
  showPageNumbers?: boolean;
  allowZoom?: boolean;
  allowFullscreen?: boolean;
  initialZoom?: number;
  theme?: 'light' | 'dark';
}

// 文档状态
export interface DocumentState {
  isGenerating: boolean;
  isPreviewLoading: boolean;
  currentTemplate: DocumentTemplate | null;
  documentData: DocumentData | null;
  style: DocumentStyle;
  previewUrl?: string;
  errors: string[];
}

// 模板验证结果
export interface TemplateValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}