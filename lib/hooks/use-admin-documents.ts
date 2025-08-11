/**
 * 文档模板管理Hook
 * 管理各行业的文档生成模板库
 * 作者：Claude Code (AI专家工厂架构师)
 */

import { useState, useEffect, useCallback } from 'react';

// 文档模板接口
export interface DocumentTemplate {
  id: string;
  name: string;
  category: string;
  industry: string;
  description: string;
  templateType: 'contract' | 'report' | 'proposal' | 'letter' | 'form' | 'policy' | 'guide' | 'other';
  content: string;
  variables: DocumentVariable[];
  format: 'markdown' | 'html' | 'docx' | 'pdf';
  language: 'zh' | 'en' | 'zh-en';
  tags: string[];
  complexity: 'simple' | 'medium' | 'complex';
  estimatedTime: number; // 预估生成时间（分钟）
  requirements: string[];
  examples: string[];
  active: boolean;
  featured: boolean;
  usageCount: number;
  rating: number;
  reviews: DocumentReview[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: string;
}

// 文档变量接口
export interface DocumentVariable {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'textarea';
  required: boolean;
  defaultValue?: any;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  description?: string;
}

// 文档评论接口
export interface DocumentReview {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// 文档统计接口
export interface DocumentStats {
  totalTemplates: number;
  activeTemplates: number;
  inactiveTemplates: number;
  totalUsage: number;
  avgRating: number;
  topCategories: Array<{ category: string; count: number; }>;
  recentlyAdded: DocumentTemplate[];
  mostUsed: DocumentTemplate[];
  topRated: DocumentTemplate[];
}

// API响应接口
interface DocumentsApiResponse {
  success: boolean;
  error?: string;
  templates?: DocumentTemplate[];
  stats?: DocumentStats;
  message?: string;
}

// Hook状态
interface UseAdminDocumentsState {
  templates: DocumentTemplate[];
  stats: DocumentStats | null;
  loading: boolean;
  saving: boolean;
  lastError: string | null;
  lastUpdate: Date | null;
  selectedTemplate: DocumentTemplate | null;
  editingTemplate: Partial<DocumentTemplate> | null;
  showTemplateEditor: boolean;
  searchQuery: string;
  filterCategory: string;
  filterIndustry: string;
  filterType: string;
  sortBy: 'name' | 'usage' | 'rating' | 'updated' | 'created';
  sortOrder: 'asc' | 'desc';
}

// Hook返回值
interface UseAdminDocumentsReturn extends UseAdminDocumentsState {
  loadTemplates: () => Promise<void>;
  createTemplate: (template: Partial<DocumentTemplate>) => Promise<boolean>;
  updateTemplate: (id: string, updates: Partial<DocumentTemplate>) => Promise<boolean>;
  deleteTemplate: (id: string) => Promise<boolean>;
  duplicateTemplate: (id: string) => Promise<boolean>;
  toggleTemplateStatus: (id: string) => Promise<boolean>;
  toggleFeaturedStatus: (id: string) => Promise<boolean>;
  setSelectedTemplate: (template: DocumentTemplate | null) => void;
  setEditingTemplate: (template: Partial<DocumentTemplate> | null) => void;
  setShowTemplateEditor: (show: boolean) => void;
  setSearchQuery: (query: string) => void;
  setFilterCategory: (category: string) => void;
  setFilterIndustry: (industry: string) => void;
  setFilterType: (type: string) => void;
  setSortBy: (sort: 'name' | 'usage' | 'rating' | 'updated' | 'created') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  getFilteredTemplates: () => DocumentTemplate[];
  getTemplatesByCategory: () => { [category: string]: DocumentTemplate[] };
  getTemplatesByIndustry: () => { [industry: string]: DocumentTemplate[] };
  getCategories: () => string[];
  getIndustries: () => string[];
  getTemplateTypes: () => string[];
  validateTemplate: (template: Partial<DocumentTemplate>) => { valid: boolean; errors: string[] };
  previewTemplate: (template: DocumentTemplate, variables: { [key: string]: any }) => string;
  exportTemplate: (id: string, format: 'json' | 'yaml' | 'docx') => Promise<boolean>;
  importTemplates: (file: File) => Promise<boolean>;
}

// 默认文档模板库
const DEFAULT_TEMPLATES: Partial<DocumentTemplate>[] = [
  // 法律行业模板
  {
    name: '服务合同模板',
    category: '法律文件',
    industry: 'legal',
    description: '标准服务提供合同模板，包含服务内容、费用、责任条款等',
    templateType: 'contract',
    content: `# 服务合同

**甲方（服务需求方）：** {clientName}
**乙方（服务提供方）：** {providerName}

## 第一条 服务内容
乙方同意向甲方提供以下服务：{serviceDescription}

## 第二条 合同期限
本合同自{startDate}起至{endDate}止。

## 第三条 服务费用
1. 服务总费用：{totalAmount}元
2. 付款方式：{paymentMethod}
3. 付款期限：{paymentDeadline}

## 第四条 双方权利义务
### 甲方义务：
{clientObligations}

### 乙方义务：
{providerObligations}

## 第五条 违约责任
{breachClause}

## 第六条 争议解决
本合同履行过程中发生的争议，由双方友好协商解决；协商不成的，提交{arbitrationLocation}仲裁委员会仲裁。

**甲方签字：** _________________ **日期：** _________
**乙方签字：** _________________ **日期：** _________`,
    variables: [
      { name: 'clientName', label: '甲方名称', type: 'text', required: true },
      { name: 'providerName', label: '乙方名称', type: 'text', required: true },
      { name: 'serviceDescription', label: '服务描述', type: 'textarea', required: true },
      { name: 'startDate', label: '开始日期', type: 'date', required: true },
      { name: 'endDate', label: '结束日期', type: 'date', required: true },
      { name: 'totalAmount', label: '总金额', type: 'number', required: true },
      { name: 'paymentMethod', label: '付款方式', type: 'select', required: true, options: ['一次性付款', '分期付款', '按进度付款'] },
      { name: 'paymentDeadline', label: '付款期限', type: 'text', required: true }
    ],
    format: 'markdown',
    language: 'zh',
    tags: ['合同', '法律', '服务'],
    complexity: 'medium',
    estimatedTime: 15,
    requirements: ['合同双方信息', '服务详情', '费用结构'],
    examples: ['IT服务合同', '咨询服务合同', '维护服务合同'],
    active: true,
    featured: true,
    rating: 4.8
  },
  
  // 房地产行业模板
  {
    name: '房产投资分析报告',
    category: '投资分析',
    industry: 'realEstate',
    description: '专业房产投资分析报告模板，包含市场分析、收益预测等',
    templateType: 'report',
    content: `# 房产投资分析报告

## 项目基本信息
- **项目名称：** {projectName}
- **项目地址：** {projectAddress}
- **建筑面积：** {buildingArea}平方米
- **投资金额：** {investmentAmount}万元
- **分析日期：** {analysisDate}

## 市场环境分析
### 区域概况
{regionOverview}

### 交通便利性
{transportationAnalysis}

### 周边配套设施
{facilitiesAnalysis}

## 投资收益分析
### 租金收益预测
- **预期月租金：** {expectedRent}元/月
- **年租金收入：** {annualRentIncome}元
- **租金收益率：** {rentYield}%

### 增值潜力分析
{appreciationPotential}

## 风险评估
### 市场风险
{marketRisks}

### 政策风险
{policyRisks}

### 财务风险
{financialRisks}

## 投资建议
{investmentRecommendation}

## 结论
{conclusion}`,
    variables: [
      { name: 'projectName', label: '项目名称', type: 'text', required: true },
      { name: 'projectAddress', label: '项目地址', type: 'text', required: true },
      { name: 'buildingArea', label: '建筑面积', type: 'number', required: true },
      { name: 'investmentAmount', label: '投资金额(万元)', type: 'number', required: true },
      { name: 'analysisDate', label: '分析日期', type: 'date', required: true },
      { name: 'expectedRent', label: '预期月租金', type: 'number', required: true },
      { name: 'rentYield', label: '租金收益率(%)', type: 'number', required: true }
    ],
    format: 'markdown',
    language: 'zh',
    tags: ['房地产', '投资', '分析报告'],
    complexity: 'complex',
    estimatedTime: 30,
    requirements: ['项目基本信息', '市场数据', '财务数据'],
    examples: ['住宅投资分析', '商业地产分析', '办公楼投资评估'],
    active: true,
    featured: true,
    rating: 4.6
  },

  // 保险行业模板
  {
    name: '保险需求分析书',
    category: '风险评估',
    industry: 'insurance',
    description: '个人/家庭保险需求分析报告模板，帮助制定保险规划方案',
    templateType: 'report',
    content: `# 保险需求分析报告

## 客户基本信息
- **姓名：** {clientName}
- **年龄：** {age}岁
- **职业：** {occupation}
- **年收入：** {annualIncome}万元
- **家庭状况：** {familyStatus}

## 风险分析
### 人身风险
{personalRisks}

### 财产风险
{propertyRisks}

### 健康风险
{healthRisks}

## 保险需求评估
### 寿险需求
- **保障金额：** {lifeInsuranceAmount}万元
- **保障期限：** {lifeInsuranceTerm}年

### 健康险需求
- **医疗保障：** {medicalCoverage}
- **重疾保障：** {criticalIllnessCoverage}万元

### 意外险需求
- **意外保障：** {accidentCoverage}万元

## 保险方案推荐
### 方案一：基础保障型
{basicPlan}

### 方案二：全面保障型
{comprehensivePlan}

### 方案三：高端定制型
{premiumPlan}

## 保费预算分析
- **年保费预算：** {annualPremiumBudget}元
- **保费收入比：** {premiumIncomeRatio}%

## 实施建议
{implementationAdvice}`,
    variables: [
      { name: 'clientName', label: '客户姓名', type: 'text', required: true },
      { name: 'age', label: '年龄', type: 'number', required: true },
      { name: 'occupation', label: '职业', type: 'text', required: true },
      { name: 'annualIncome', label: '年收入(万元)', type: 'number', required: true },
      { name: 'familyStatus', label: '家庭状况', type: 'select', required: true, options: ['单身', '已婚无子女', '已婚有子女', '离异', '丧偶'] },
      { name: 'lifeInsuranceAmount', label: '寿险保障金额(万元)', type: 'number', required: true },
      { name: 'annualPremiumBudget', label: '年保费预算', type: 'number', required: true }
    ],
    format: 'markdown',
    language: 'zh',
    tags: ['保险', '风险评估', '保险规划'],
    complexity: 'complex',
    estimatedTime: 25,
    requirements: ['个人基本信息', '收入状况', '风险偏好'],
    examples: ['家庭保险规划', '企业员工保险', '高净值客户保险'],
    active: true,
    featured: true,
    rating: 4.7
  },

  // 教育行业模板
  {
    name: '课程教学大纲',
    category: '教学文档',
    industry: 'education',
    description: '标准课程教学大纲模板，包含课程目标、内容安排、考核方式等',
    templateType: 'guide',
    content: `# {courseName} 教学大纲

## 课程基本信息
- **课程名称：** {courseName}
- **课程代码：** {courseCode}
- **学时：** {totalHours}学时（理论{theoryHours}学时，实践{practiceHours}学时）
- **学分：** {credits}学分
- **适用专业：** {targetMajor}
- **先修课程：** {prerequisites}

## 课程性质与目标
### 课程性质
{courseNature}

### 课程目标
{courseObjectives}

## 教学内容安排
{teachingContent}

## 实践环节
{practicalSessions}

## 考核方式
- **考核方式：** {assessmentMethod}
- **成绩构成：** {gradeComposition}

## 教材与参考资料
### 教材
{textbooks}

### 参考资料
{references}

## 教学方法与手段
{teachingMethods}

## 课程考核标准
{assessmentCriteria}`,
    variables: [
      { name: 'courseName', label: '课程名称', type: 'text', required: true },
      { name: 'courseCode', label: '课程代码', type: 'text', required: true },
      { name: 'totalHours', label: '总学时', type: 'number', required: true },
      { name: 'theoryHours', label: '理论学时', type: 'number', required: true },
      { name: 'practiceHours', label: '实践学时', type: 'number', required: true },
      { name: 'credits', label: '学分', type: 'number', required: true },
      { name: 'targetMajor', label: '适用专业', type: 'text', required: true },
      { name: 'assessmentMethod', label: '考核方式', type: 'select', required: true, options: ['考试', '考查', '课程设计', '综合评价'] }
    ],
    format: 'markdown',
    language: 'zh',
    tags: ['教育', '教学', '大纲'],
    complexity: 'medium',
    estimatedTime: 20,
    requirements: ['课程基本信息', '教学内容', '考核标准'],
    examples: ['程序设计课程大纲', '市场营销课程大纲', '财务管理课程大纲'],
    active: true,
    featured: false,
    rating: 4.5
  },

  // 财务会计模板
  {
    name: '财务分析报告',
    category: '财务报告',
    industry: 'accounting',
    description: '企业财务分析报告模板，包含财务状况、经营成果、现金流等分析',
    templateType: 'report',
    content: `# {companyName} 财务分析报告

## 报告概述
- **报告期间：** {reportPeriod}
- **分析日期：** {analysisDate}
- **报告编制人：** {preparedBy}

## 财务状况分析
### 资产结构分析
- **总资产：** {totalAssets}万元
- **流动资产占比：** {currentAssetRatio}%
- **固定资产占比：** {fixedAssetRatio}%

### 负债结构分析
- **总负债：** {totalLiabilities}万元
- **资产负债率：** {debtToAssetRatio}%
- **流动负债占比：** {currentLiabilityRatio}%

### 所有者权益分析
- **所有者权益：** {ownersEquity}万元
- **权益增长率：** {equityGrowthRate}%

## 盈利能力分析
### 盈利指标
- **营业收入：** {revenue}万元
- **净利润：** {netProfit}万元
- **毛利率：** {grossProfitMargin}%
- **净利率：** {netProfitMargin}%

### 盈利趋势分析
{profitabilityTrend}

## 偿债能力分析
### 短期偿债能力
- **流动比率：** {currentRatio}
- **速动比率：** {quickRatio}

### 长期偿债能力
- **资产负债率：** {debtRatio}%
- **利息保障倍数：** {interestCoverage}

## 营运能力分析
{operatingEfficiency}

## 发展能力分析
{developmentCapacity}

## 现金流分析
{cashFlowAnalysis}

## 风险评估
{riskAssessment}

## 建议与对策
{recommendations}`,
    variables: [
      { name: 'companyName', label: '公司名称', type: 'text', required: true },
      { name: 'reportPeriod', label: '报告期间', type: 'text', required: true },
      { name: 'analysisDate', label: '分析日期', type: 'date', required: true },
      { name: 'preparedBy', label: '编制人', type: 'text', required: true },
      { name: 'totalAssets', label: '总资产(万元)', type: 'number', required: true },
      { name: 'revenue', label: '营业收入(万元)', type: 'number', required: true },
      { name: 'netProfit', label: '净利润(万元)', type: 'number', required: true },
      { name: 'debtRatio', label: '资产负债率(%)', type: 'number', required: true }
    ],
    format: 'markdown',
    language: 'zh',
    tags: ['财务', '分析', '报告'],
    complexity: 'complex',
    estimatedTime: 40,
    requirements: ['财务报表数据', '历史对比数据', '行业数据'],
    examples: ['年度财务分析', '季度财务分析', '专项财务分析'],
    active: true,
    featured: true,
    rating: 4.9
  }
];

export function useAdminDocuments(): UseAdminDocumentsReturn {
  const [state, setState] = useState<UseAdminDocumentsState>({
    templates: [],
    stats: null,
    loading: false,
    saving: false,
    lastError: null,
    lastUpdate: null,
    selectedTemplate: null,
    editingTemplate: null,
    showTemplateEditor: false,
    searchQuery: '',
    filterCategory: '',
    filterIndustry: '',
    filterType: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  // 状态更新辅助函数
  const updateState = useCallback((updates: Partial<UseAdminDocumentsState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // 加载模板数据
  const loadTemplates = useCallback(async () => {
    updateState({ loading: true, lastError: null });

    try {
      // 初始化默认模板
      if (state.templates.length === 0) {
        const defaultTemplates = DEFAULT_TEMPLATES.map((template, index) => ({
          ...template,
          id: `doc_${Date.now()}_${index}`,
          usageCount: Math.floor(Math.random() * 200),
          reviews: [],
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: '1.0.0'
        } as DocumentTemplate));

        const stats: DocumentStats = {
          totalTemplates: defaultTemplates.length,
          activeTemplates: defaultTemplates.filter(t => t.active).length,
          inactiveTemplates: defaultTemplates.filter(t => !t.active).length,
          totalUsage: defaultTemplates.reduce((sum, t) => sum + t.usageCount, 0),
          avgRating: defaultTemplates.reduce((sum, t) => sum + t.rating, 0) / defaultTemplates.length,
          topCategories: Object.entries(
            defaultTemplates.reduce((acc, t) => {
              acc[t.category] = (acc[t.category] || 0) + 1;
              return acc;
            }, {} as { [key: string]: number })
          ).map(([category, count]) => ({ category, count })),
          recentlyAdded: defaultTemplates.slice(0, 3),
          mostUsed: defaultTemplates.sort((a, b) => b.usageCount - a.usageCount).slice(0, 5),
          topRated: defaultTemplates.sort((a, b) => b.rating - a.rating).slice(0, 5)
        };

        updateState({
          templates: defaultTemplates,
          stats,
          loading: false,
          lastUpdate: new Date()
        });
      }

    } catch (error: any) {
      console.error('❌ 加载文档模板失败:', error);
      updateState({
        loading: false,
        lastError: `加载失败: ${error.message || '网络错误'}`
      });
    }
  }, [state.templates.length, updateState]);

  // 创建模板
  const createTemplate = useCallback(async (template: Partial<DocumentTemplate>): Promise<boolean> => {
    updateState({ saving: true, lastError: null });

    try {
      const newTemplate: DocumentTemplate = {
        ...template,
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        usageCount: 0,
        rating: 0,
        reviews: [],
        createdBy: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0',
        active: template.active ?? true
      } as DocumentTemplate;

      updateState({
        templates: [...state.templates, newTemplate],
        saving: false,
        lastUpdate: new Date()
      });

      return true;
    } catch (error: any) {
      updateState({
        saving: false,
        lastError: `创建模板失败: ${error.message || '未知错误'}`
      });
      return false;
    }
  }, [state.templates, updateState]);

  // 更新模板
  const updateTemplate = useCallback(async (id: string, updates: Partial<DocumentTemplate>): Promise<boolean> => {
    updateState({ saving: true, lastError: null });

    try {
      const updatedTemplates = state.templates.map(template => 
        template.id === id 
          ? { 
              ...template, 
              ...updates, 
              updatedAt: new Date().toISOString(),
              version: template.version ? `${parseFloat(template.version) + 0.1}.0` : '1.1.0'
            }
          : template
      );

      updateState({
        templates: updatedTemplates,
        saving: false,
        lastUpdate: new Date()
      });

      return true;
    } catch (error: any) {
      updateState({
        saving: false,
        lastError: `更新模板失败: ${error.message || '未知错误'}`
      });
      return false;
    }
  }, [state.templates, updateState]);

  // 删除模板
  const deleteTemplate = useCallback(async (id: string): Promise<boolean> => {
    updateState({ saving: true, lastError: null });

    try {
      const updatedTemplates = state.templates.filter(template => template.id !== id);
      updateState({
        templates: updatedTemplates,
        saving: false,
        lastUpdate: new Date()
      });
      return true;
    } catch (error: any) {
      updateState({
        saving: false,
        lastError: `删除模板失败: ${error.message || '未知错误'}`
      });
      return false;
    }
  }, [state.templates, updateState]);

  // 复制模板
  const duplicateTemplate = useCallback(async (id: string): Promise<boolean> => {
    const originalTemplate = state.templates.find(t => t.id === id);
    if (!originalTemplate) return false;

    const duplicatedTemplate: DocumentTemplate = {
      ...originalTemplate,
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${originalTemplate.name} (副本)`,
      usageCount: 0,
      rating: 0,
      reviews: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    updateState({
      templates: [...state.templates, duplicatedTemplate],
      lastUpdate: new Date()
    });

    return true;
  }, [state.templates, updateState]);

  // 切换模板状态
  const toggleTemplateStatus = useCallback(async (id: string): Promise<boolean> => {
    const template = state.templates.find(t => t.id === id);
    if (!template) return false;

    return await updateTemplate(id, { active: !template.active });
  }, [state.templates, updateTemplate]);

  // 切换推荐状态
  const toggleFeaturedStatus = useCallback(async (id: string): Promise<boolean> => {
    const template = state.templates.find(t => t.id === id);
    if (!template) return false;

    return await updateTemplate(id, { featured: !template.featured });
  }, [state.templates, updateTemplate]);

  // 设置选中模板
  const setSelectedTemplate = useCallback((template: DocumentTemplate | null) => {
    updateState({ selectedTemplate: template });
  }, [updateState]);

  // 设置编辑模板
  const setEditingTemplate = useCallback((template: Partial<DocumentTemplate> | null) => {
    updateState({ editingTemplate: template });
  }, [updateState]);

  // 设置编辑器显示状态
  const setShowTemplateEditor = useCallback((show: boolean) => {
    updateState({ showTemplateEditor: show });
  }, [updateState]);

  // 设置搜索查询
  const setSearchQuery = useCallback((query: string) => {
    updateState({ searchQuery: query });
  }, [updateState]);

  // 设置分类过滤
  const setFilterCategory = useCallback((category: string) => {
    updateState({ filterCategory: category });
  }, [updateState]);

  // 设置行业过滤
  const setFilterIndustry = useCallback((industry: string) => {
    updateState({ filterIndustry: industry });
  }, [updateState]);

  // 设置类型过滤
  const setFilterType = useCallback((type: string) => {
    updateState({ filterType: type });
  }, [updateState]);

  // 设置排序方式
  const setSortBy = useCallback((sort: 'name' | 'usage' | 'rating' | 'updated' | 'created') => {
    updateState({ sortBy: sort });
  }, [updateState]);

  // 设置排序顺序
  const setSortOrder = useCallback((order: 'asc' | 'desc') => {
    updateState({ sortOrder: order });
  }, [updateState]);

  // 获取过滤后的模板
  const getFilteredTemplates = useCallback((): DocumentTemplate[] => {
    let filtered = [...state.templates];

    // 搜索过滤
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query)) ||
        template.category.toLowerCase().includes(query)
      );
    }

    // 分类过滤
    if (state.filterCategory) {
      filtered = filtered.filter(template => template.category === state.filterCategory);
    }

    // 行业过滤
    if (state.filterIndustry) {
      filtered = filtered.filter(template => template.industry === state.filterIndustry);
    }

    // 类型过滤
    if (state.filterType) {
      filtered = filtered.filter(template => template.templateType === state.filterType);
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (state.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'usage':
          aValue = a.usageCount;
          bValue = b.usageCount;
          break;
        case 'rating':
          aValue = a.rating;
          bValue = b.rating;
          break;
        case 'updated':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case 'created':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }

      if (typeof aValue === 'string') {
        return state.sortOrder === 'asc' 
          ? aValue.localeCompare(bValue as string)
          : (bValue as string).localeCompare(aValue);
      } else {
        return state.sortOrder === 'asc' 
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });

    return filtered;
  }, [state.templates, state.searchQuery, state.filterCategory, state.filterIndustry, state.filterType, state.sortBy, state.sortOrder]);

  // 按分类分组
  const getTemplatesByCategory = useCallback((): { [category: string]: DocumentTemplate[] } => {
    return state.templates.reduce((acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push(template);
      return acc;
    }, {} as { [category: string]: DocumentTemplate[] });
  }, [state.templates]);

  // 按行业分组
  const getTemplatesByIndustry = useCallback((): { [industry: string]: DocumentTemplate[] } => {
    return state.templates.reduce((acc, template) => {
      if (!acc[template.industry]) {
        acc[template.industry] = [];
      }
      acc[template.industry].push(template);
      return acc;
    }, {} as { [industry: string]: DocumentTemplate[] });
  }, [state.templates]);

  // 获取所有分类
  const getCategories = useCallback((): string[] => {
    return [...new Set(state.templates.map(template => template.category))];
  }, [state.templates]);

  // 获取所有行业
  const getIndustries = useCallback((): string[] => {
    return [...new Set(state.templates.map(template => template.industry))];
  }, [state.templates]);

  // 获取所有模板类型
  const getTemplateTypes = useCallback((): string[] => {
    return [...new Set(state.templates.map(template => template.templateType))];
  }, [state.templates]);

  // 验证模板
  const validateTemplate = useCallback((template: Partial<DocumentTemplate>): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!template.name?.trim()) {
      errors.push('模板名称不能为空');
    }

    if (!template.category?.trim()) {
      errors.push('模板分类不能为空');
    }

    if (!template.industry?.trim()) {
      errors.push('所属行业不能为空');
    }

    if (!template.content?.trim()) {
      errors.push('模板内容不能为空');
    }

    if (!template.templateType) {
      errors.push('模板类型不能为空');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }, []);

  // 预览模板
  const previewTemplate = useCallback((template: DocumentTemplate, variables: { [key: string]: any }): string => {
    let preview = template.content;
    
    template.variables.forEach(variable => {
      const value = variables[variable.name] || variable.defaultValue || `{${variable.name}}`;
      preview = preview.replace(new RegExp(`{${variable.name}}`, 'g'), String(value));
    });

    return preview;
  }, []);

  // 导出模板
  const exportTemplate = useCallback(async (id: string, format: 'json' | 'yaml' | 'docx'): Promise<boolean> => {
    const template = state.templates.find(t => t.id === id);
    if (!template) return false;

    try {
      // 这里可以添加实际的导出逻辑
      console.log(`导出模板 ${template.name} 为 ${format} 格式`);
      return true;
    } catch (error) {
      return false;
    }
  }, [state.templates]);

  // 导入模板
  const importTemplates = useCallback(async (file: File): Promise<boolean> => {
    try {
      // 这里可以添加实际的导入逻辑
      console.log(`导入模板文件: ${file.name}`);
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  // 初始化时加载数据
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return {
    ...state,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    toggleTemplateStatus,
    toggleFeaturedStatus,
    setSelectedTemplate,
    setEditingTemplate,
    setShowTemplateEditor,
    setSearchQuery,
    setFilterCategory,
    setFilterIndustry,
    setFilterType,
    setSortBy,
    setSortOrder,
    getFilteredTemplates,
    getTemplatesByCategory,
    getTemplatesByIndustry,
    getCategories,
    getIndustries,
    getTemplateTypes,
    validateTemplate,
    previewTemplate,
    exportTemplate,
    importTemplates
  };
}