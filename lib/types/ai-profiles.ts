/**
 * 专业AI角色数据结构定义
 * 为5个垂直行业构建标准化AI专家配置
 * 作者：Claude Code (AI专家工厂数据架构师)
 */

// 🏭 专业AI角色完整配置接口
export interface ProfessionalAIProfile {
  // 基础标识信息
  id: string;                           // 唯一标识 "lawyer_civil_disputes_01"
  name: string;                         // 显示名称 "民事纠纷专家律师"
  code: string;                         // 简短代码 "LAW_CIVIL_01" 
  version: string;                      // 版本号 "1.2.0"
  
  // 行业分类
  industry: IndustryType;               // 行业类型
  specialization: string;               // 专业细分领域
  expertiseLevel: ExpertiseLevel;       // 专业级别
  
  // AI模型配置
  aiConfig: {
    primaryModel: string;               // 主力模型 "anthropic/claude-3-sonnet"
    fallbackModel?: string;             // 备用模型
    provider: ModelProvider;            // 模型提供商
    modelCategory: ModelCategory;       // 模型分类 (免费/付费/顶级等)
  };
  
  // 系统提示词配置 
  systemPrompts: {
    primary: string;                    // 主要角色提示词
    contextual?: string;                // 上下文增强提示词
    safety?: string;                    // 安全性提示词
    constraints?: string;               // 约束条件
  };
  
  // 生成参数配置
  parameters: {
    maxTokens: number;                  // 最大Token数
    temperature: number;                // 创造性温度 0-2
    topP: number;                       // 核心采样
    frequencyPenalty: number;           // 频率惩罚
    presencePenalty: number;            // 存在惩罚
    stopSequences?: string[];           // 停止序列
  };
  
  // 输出配置
  outputConfig: {
    format: OutputFormat;               // 输出格式
    streaming: boolean;                 // 是否流式输出
    includeReasoning: boolean;          // 是否包含推理过程
    structuredOutput?: StructuredOutputSchema; // 结构化输出模式
  };
  
  // 成本控制
  costControl: {
    estimatedCostPer1KTokens: number;   // 预估成本
    budgetLimit?: number;               // 预算限制
    costCategory: CostCategory;         // 成本等级
  };
  
  // 文档模板关联
  documentTemplates: string[];          // 关联的文档模板ID列表
  
  // 使用场景
  useCases: string[];                   // 适用场景列表
  
  // 性能指标
  performance: {
    avgResponseTime: number;            // 平均响应时间(ms)
    successRate: number;                // 成功率 0-1
    userSatisfaction: number;           // 用户满意度 0-5
    lastOptimized: string;              // 最后优化时间
  };
  
  // 元数据
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    isActive: boolean;
    tags: string[];
    description: string;
  };
}

// 🏢 行业类型枚举
export enum IndustryType {
  LEGAL = 'legal',           // 法律行业  
  REAL_ESTATE = 'real_estate',   // 房地产行业
  INSURANCE = 'insurance',   // 保险行业
  EDUCATION = 'education',   // 教育行业
  ACCOUNTING = 'accounting'  // 会计行业
}

// 🎯 专业级别
export enum ExpertiseLevel {
  JUNIOR = 'junior',         // 初级专家
  SENIOR = 'senior',         // 资深专家  
  EXPERT = 'expert',         // 顶级专家
  MASTER = 'master'          // 大师级
}

// 🤖 模型提供商
export enum ModelProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic', 
  GOOGLE = 'google',
  META = 'meta',
  MISTRAL = 'mistral',
  DEEPSEEK = 'deepseek',
  LIQUID = 'liquid'
}

// 📊 模型分类
export enum ModelCategory {
  FREE = 'free',                    // 免费模型
  COST_EFFECTIVE = 'cost_effective', // 性价比模型
  PREMIUM = 'premium',              // 顶级模型
  LATEST = 'latest',                // 最新模型
  FASTEST = 'fastest',              // 最快模型
  LONG_CONTEXT = 'long_context'     // 长上下文模型
}

// 📄 输出格式
export enum OutputFormat {
  MARKDOWN = 'markdown',
  HTML = 'html',
  JSON = 'json',
  PLAIN_TEXT = 'plain_text',
  STRUCTURED = 'structured'
}

// 💰 成本等级
export enum CostCategory {
  FREE = 'free',           // 免费
  LOW = 'low',             // 低成本 <$0.01/1K tokens
  MEDIUM = 'medium',       // 中等成本 $0.01-$0.05/1K tokens  
  HIGH = 'high',           // 高成本 $0.05-$0.10/1K tokens
  PREMIUM = 'premium'      // 顶级成本 >$0.10/1K tokens
}

// 🏗️ 结构化输出模式  
export interface StructuredOutputSchema {
  type: 'json_schema' | 'xml' | 'yaml';
  schema: object;
  validation?: ValidationRule[];
}

export interface ValidationRule {
  field: string;
  rule: 'required' | 'min_length' | 'max_length' | 'pattern';
  value: string | number;
}

// 📋 专业角色模板 - 为快速创建新角色
export interface ProfileTemplate {
  templateId: string;
  templateName: string;
  industry: IndustryType;
  baseConfig: Partial<ProfessionalAIProfile>;
  customizationOptions: string[];
}

// 🔄 角色使用统计
export interface ProfileUsageStats {
  profileId: string;
  totalUsage: number;              // 总使用次数
  successfulRuns: number;          // 成功运行次数
  avgResponseTime: number;         // 平均响应时间
  avgTokensUsed: number;          // 平均Token使用量
  totalCost: number;              // 总成本
  lastUsed: string;               // 最后使用时间
  userRatings: number[];          // 用户评分历史
  commonFailures: string[];       // 常见失败原因
}

// 🎛️ 批量角色操作
export interface BatchProfileOperation {
  operationType: 'create' | 'update' | 'delete' | 'clone';
  profiles: ProfessionalAIProfile[];
  options?: {
    skipValidation?: boolean;
    dryRun?: boolean;
    notifyUsers?: boolean;
  };
}

// 🔍 角色搜索过滤器
export interface ProfileSearchFilter {
  industry?: IndustryType[];
  expertiseLevel?: ExpertiseLevel[];
  modelProvider?: ModelProvider[];
  costCategory?: CostCategory[];
  tags?: string[];
  isActive?: boolean;
  searchQuery?: string;
}

// 🏆 推荐系统接口
export interface ProfileRecommendation {
  recommendedProfile: ProfessionalAIProfile;
  matchScore: number;              // 匹配度 0-1
  reasons: string[];               // 推荐理由
  alternativeProfiles: ProfessionalAIProfile[];
  costComparison: {
    recommended: number;
    alternatives: number[];
  };
}

/**
 * 🎯 专业角色工厂类
 * 用于创建和管理专业AI角色
 */
export class ProfessionalProfileFactory {
  /**
   * 为特定行业创建标准角色
   */
  static createStandardProfile(
    industry: IndustryType,
    specialization: string,
    options?: Partial<ProfessionalAIProfile>
  ): ProfessionalAIProfile {
    // 实现标准角色创建逻辑
    throw new Error('Method not implemented');
  }
  
  /**
   * 基于使用统计优化角色配置
   */
  static optimizeProfile(
    profile: ProfessionalAIProfile,
    usageStats: ProfileUsageStats
  ): ProfessionalAIProfile {
    // 实现智能优化逻辑
    throw new Error('Method not implemented');
  }
  
  /**
   * 推荐最佳角色配置
   */
  static recommendProfile(
    requirements: ProfileSearchFilter,
    availableProfiles: ProfessionalAIProfile[]
  ): ProfileRecommendation {
    // 实现智能推荐逻辑
    throw new Error('Method not implemented');
  }
}