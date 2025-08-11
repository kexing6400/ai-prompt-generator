/**
 * 专业角色管理Hook
 * 管理6个预设的专业AI角色配置和参数
 * 作者：Claude Code (AI专家工厂架构师)
 */

import { useState, useEffect, useCallback } from 'react';
import { ProfessionalRole } from '@/types/professional';

// 角色统计信息使用本地接口
export interface LocalProfessionalRoleExtended extends ProfessionalRole {
  icon?: string;
  contextPrompts?: {
    greeting: string;
    instructions: string;
    examples: string[];
  };
  active?: boolean;
  usageCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

// 角色统计信息
export interface RoleStats {
  totalRoles: number;
  activeRoles: number;
  inactiveRoles: number;
  totalUsage: number;
  avgUsagePerRole: number;
  mostUsedRole: LocalProfessionalRoleExtended | null;
  recentlyUpdated: LocalProfessionalRoleExtended[];
}

// API响应接口
interface RolesApiResponse {
  success: boolean;
  error?: string;
  roles?: LocalProfessionalRoleExtended[];
  stats?: RoleStats;
  message?: string;
}

// Hook状态
interface UseAdminRolesState {
  roles: LocalProfessionalRoleExtended[];
  stats: RoleStats | null;
  loading: boolean;
  saving: boolean;
  lastError: string | null;
  lastUpdate: Date | null;
  selectedRole: LocalProfessionalRoleExtended | null;
  editingRole: Partial<LocalProfessionalRoleExtended> | null;
  showRoleEditor: boolean;
  searchQuery: string;
  filterIndustry: string;
  sortBy: 'name' | 'usage' | 'updated' | 'industry';
  sortOrder: 'asc' | 'desc';
}

// Hook返回值
interface UseAdminRolesReturn extends UseAdminRolesState {
  loadRoles: () => Promise<void>;
  createRole: (role: Partial<LocalProfessionalRoleExtended>) => Promise<boolean>;
  updateRole: (id: string, updates: Partial<LocalProfessionalRoleExtended>) => Promise<boolean>;
  deleteRole: (id: string) => Promise<boolean>;
  toggleRoleStatus: (id: string) => Promise<boolean>;
  setSelectedRole: (role: LocalProfessionalRoleExtended | null) => void;
  setEditingRole: (role: Partial<LocalProfessionalRoleExtended> | null) => void;
  setShowRoleEditor: (show: boolean) => void;
  setSearchQuery: (query: string) => void;
  setFilterIndustry: (industry: string) => void;
  setSortBy: (sort: 'name' | 'usage' | 'updated' | 'industry') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  getFilteredRoles: () => LocalProfessionalRoleExtended[];
  getRolesByIndustry: () => { [industry: string]: LocalProfessionalRoleExtended[] };
  getIndustries: () => string[];
  testRoleConfiguration: (role: Partial<LocalProfessionalRoleExtended>) => Promise<boolean>;
  duplicateRole: (id: string) => void;
  resetRoleUsage: (id: string) => Promise<boolean>;
}

// 默认的6个专业角色模板
const DEFAULT_ROLES: Partial<LocalProfessionalRoleExtended>[] = [
  {
    name: '法律专家',
    industry: 'legal',
    icon: '⚖️',
    description: '专业法律咨询顾问，提供法律条文解释、合同审查、案例分析等服务',
    expertise: ['法律条文解释', '合同审查', '案例分析', '法律风险评估', '诉讼策略'],
    defaultModel: 'anthropic/claude-3.5-sonnet',
    modelConfig: {
      temperature: 0.3,
      maxTokens: 3000,
      topP: 0.9,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1
    },
    systemPrompt: '你是一位资深的法律专家，拥有丰富的法律实践经验。请以专业、严谨的态度提供准确的法律建议，并始终提醒用户咨询专业律师获取正式法律意见。',
    contextPrompts: {
      greeting: '您好，我是您的法律咨询顾问。请描述您需要咨询的法律问题，我将为您提供专业的分析和建议。',
      instructions: '请提供详细的案件背景、相关文件或具体问题，以便我为您提供更精准的法律分析。',
      examples: [
        '合同条款审查和风险评估',
        '劳动纠纷处理建议',
        '知识产权保护策略'
      ]
    },
    tools: ['legal_database', 'contract_analyzer', 'case_search'],
    active: true
  },
  {
    name: '房产顾问',
    industry: 'realEstate',
    icon: '🏠',
    description: '专业房地产投资顾问，提供市场分析、投资建议、交易指导等服务',
    expertise: ['市场分析', '投资评估', '交易流程', '税务优化', '风险控制'],
    defaultModel: 'openai/gpt-4-turbo',
    modelConfig: {
      temperature: 0.7,
      maxTokens: 2500,
      topP: 0.95,
      frequencyPenalty: 0.2,
      presencePenalty: 0.1
    },
    systemPrompt: '你是一位经验丰富的房地产专家，熟悉房地产市场动态、投资策略和交易流程。请提供专业、实用的房地产建议。',
    contextPrompts: {
      greeting: '您好，我是您的房地产投资顾问。请告诉我您的投资需求或房产相关问题，我将为您提供专业建议。',
      instructions: '请提供房产位置、预算范围、投资目标等信息，以便我为您制定最优的投资策略。',
      examples: [
        '住宅投资价值分析',
        '商业地产投资建议',
        '房产交易流程指导'
      ]
    },
    tools: ['market_analyzer', 'property_valuer', 'mortgage_calculator'],
    active: true
  },
  {
    name: '保险顾问',
    industry: 'insurance',
    icon: '🛡️',
    description: '专业保险规划师，提供风险评估、保险产品对比、理赔指导等服务',
    expertise: ['风险评估', '保险规划', '产品对比', '理赔协助', '保费优化'],
    defaultModel: 'anthropic/claude-3-haiku',
    modelConfig: {
      temperature: 0.5,
      maxTokens: 2000,
      topP: 0.9,
      frequencyPenalty: 0.1,
      presencePenalty: 0.05
    },
    systemPrompt: '你是一位专业的保险顾问，具有丰富的保险产品知识和风险管理经验。请为客户提供客观、专业的保险建议。',
    contextPrompts: {
      greeting: '您好，我是您的保险规划顾问。请分享您的保险需求或疑问，我将为您提供专业的保险规划建议。',
      instructions: '请描述您的家庭状况、收入情况、现有保险以及关注的风险领域，以便我为您定制保险方案。',
      examples: [
        '家庭保险组合规划',
        '企业员工保险设计',
        '保险理赔流程协助'
      ]
    },
    tools: ['risk_calculator', 'policy_comparer', 'claims_assistant'],
    active: true
  },
  {
    name: '教育专家',
    industry: 'education',
    icon: '📚',
    description: '专业教育顾问，提供课程设计、学习规划、教学方法等服务',
    expertise: ['课程设计', '学习规划', '教学方法', '考试指导', '职业发展'],
    defaultModel: 'google/gemini-pro',
    modelConfig: {
      temperature: 0.8,
      maxTokens: 3500,
      topP: 0.95,
      frequencyPenalty: 0.2,
      presencePenalty: 0.3
    },
    systemPrompt: '你是一位资深教育专家，拥有丰富的教学经验和教育理论基础。请以启发性、个性化的方式提供教育建议。',
    contextPrompts: {
      greeting: '您好，我是您的教育顾问。无论是学习规划还是教学设计，我都很乐意为您提供专业建议。',
      instructions: '请告诉我学习者的基本情况、学习目标、当前水平等信息，我将为您制定个性化的教育方案。',
      examples: [
        '个性化学习路径设计',
        '在线课程内容规划',
        '学习效果评估方法'
      ]
    },
    tools: ['curriculum_designer', 'learning_tracker', 'assessment_generator'],
    active: true
  },
  {
    name: '财务会计',
    industry: 'accounting',
    icon: '💼',
    description: '专业财务会计师，提供财务分析、税务规划、审计指导等服务',
    expertise: ['财务分析', '税务规划', '成本控制', '审计准备', '合规检查'],
    defaultModel: 'anthropic/claude-3.5-sonnet',
    modelConfig: {
      temperature: 0.2,
      maxTokens: 2500,
      topP: 0.85,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1
    },
    systemPrompt: '你是一位专业的财务会计师，具备扎实的财务理论基础和丰富的实务经验。请提供准确、合规的财务建议。',
    contextPrompts: {
      greeting: '您好，我是您的财务顾问。请描述您的财务问题或需求，我将为您提供专业的会计和税务建议。',
      instructions: '请提供相关财务数据、业务情况或具体问题，以便我为您进行准确的财务分析和建议。',
      examples: [
        '财务报表分析解读',
        '税务筹划优化方案',
        '内控制度设计建议'
      ]
    },
    tools: ['financial_analyzer', 'tax_calculator', 'compliance_checker'],
    active: true
  },
  {
    name: '营销专家',
    industry: 'marketing',
    icon: '📈',
    description: '专业数字营销顾问，提供品牌策略、内容营销、数据分析等服务',
    expertise: ['品牌策略', '内容营销', '数据分析', '社媒运营', '广告投放'],
    defaultModel: 'openai/gpt-4-turbo',
    modelConfig: {
      temperature: 0.9,
      maxTokens: 3000,
      topP: 0.95,
      frequencyPenalty: 0.3,
      presencePenalty: 0.2
    },
    systemPrompt: '你是一位创新的数字营销专家，紧跟市场趋势，具有丰富的营销策划和执行经验。请提供创意且实用的营销建议。',
    contextPrompts: {
      greeting: '您好，我是您的营销策略顾问。请分享您的品牌或产品情况，我将为您制定有效的营销策略。',
      instructions: '请描述您的目标市场、产品特点、竞争环境和营销预算，以便我为您定制营销方案。',
      examples: [
        '品牌定位与传播策略',
        '社交媒体营销计划',
        '用户增长策略设计'
      ]
    },
    tools: ['market_research', 'content_generator', 'analytics_tracker'],
    active: true
  }
];

export function useAdminRoles(): UseAdminRolesReturn {
  const [state, setState] = useState<UseAdminRolesState>({
    roles: [],
    stats: null,
    loading: false,
    saving: false,
    lastError: null,
    lastUpdate: null,
    selectedRole: null,
    editingRole: null,
    showRoleEditor: false,
    searchQuery: '',
    filterIndustry: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  // 状态更新辅助函数
  const updateState = useCallback((updates: Partial<UseAdminRolesState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // 加载角色数据
  const loadRoles = useCallback(async () => {
    updateState({ loading: true, lastError: null });

    try {
      // 如果没有角色数据，初始化默认角色
      if (state.roles.length === 0) {
        const defaultRoles = DEFAULT_ROLES.map((role, index) => ({
          ...role,
          id: `role_${Date.now()}_${index}`,
          usageCount: Math.floor(Math.random() * 100),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as ProfessionalRole));

        const stats: RoleStats = {
          totalRoles: defaultRoles.length,
          activeRoles: defaultRoles.filter(r => r.active).length,
          inactiveRoles: defaultRoles.filter(r => !r.active).length,
          totalUsage: defaultRoles.reduce((sum, r) => sum + r.usageCount, 0),
          avgUsagePerRole: defaultRoles.reduce((sum, r) => sum + r.usageCount, 0) / defaultRoles.length,
          mostUsedRole: defaultRoles.sort((a, b) => b.usageCount - a.usageCount)[0],
          recentlyUpdated: defaultRoles.slice(0, 3)
        };

        updateState({
          roles: defaultRoles,
          stats,
          loading: false,
          lastUpdate: new Date()
        });
      }

      // 这里可以添加实际的API调用
      // const response = await fetch('/api/admin/roles');
      // const data: RolesApiResponse = await response.json();
      // ... 处理API响应

    } catch (error: any) {
      console.error('❌ 加载角色数据失败:', error);
      updateState({
        loading: false,
        lastError: `加载失败: ${error.message || '网络错误'}`
      });
    }
  }, [state.roles.length, updateState]);

  // 创建角色
  const createRole = useCallback(async (role: Partial<ProfessionalRole>): Promise<boolean> => {
    updateState({ saving: true, lastError: null });

    try {
      const newRole: ProfessionalRole = {
        ...role,
        id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        active: role.active ?? true
      } as ProfessionalRole;

      updateState({
        roles: [...state.roles, newRole],
        saving: false,
        lastUpdate: new Date()
      });

      return true;
    } catch (error: any) {
      updateState({
        saving: false,
        lastError: `创建角色失败: ${error.message || '未知错误'}`
      });
      return false;
    }
  }, [state.roles, updateState]);

  // 更新角色
  const updateRole = useCallback(async (id: string, updates: Partial<ProfessionalRole>): Promise<boolean> => {
    updateState({ saving: true, lastError: null });

    try {
      const updatedRoles = state.roles.map(role => 
        role.id === id 
          ? { ...role, ...updates, updatedAt: new Date().toISOString() }
          : role
      );

      updateState({
        roles: updatedRoles,
        saving: false,
        lastUpdate: new Date()
      });

      return true;
    } catch (error: any) {
      updateState({
        saving: false,
        lastError: `更新角色失败: ${error.message || '未知错误'}`
      });
      return false;
    }
  }, [state.roles, updateState]);

  // 删除角色
  const deleteRole = useCallback(async (id: string): Promise<boolean> => {
    updateState({ saving: true, lastError: null });

    try {
      const updatedRoles = state.roles.filter(role => role.id !== id);
      updateState({
        roles: updatedRoles,
        saving: false,
        lastUpdate: new Date()
      });
      return true;
    } catch (error: any) {
      updateState({
        saving: false,
        lastError: `删除角色失败: ${error.message || '未知错误'}`
      });
      return false;
    }
  }, [state.roles, updateState]);

  // 切换角色状态
  const toggleRoleStatus = useCallback(async (id: string): Promise<boolean> => {
    const role = state.roles.find(r => r.id === id);
    if (!role) return false;

    return await updateRole(id, { active: !role.active });
  }, [state.roles, updateRole]);

  // 设置选中角色
  const setSelectedRole = useCallback((role: ProfessionalRole | null) => {
    updateState({ selectedRole: role });
  }, [updateState]);

  // 设置编辑角色
  const setEditingRole = useCallback((role: Partial<ProfessionalRole> | null) => {
    updateState({ editingRole: role });
  }, [updateState]);

  // 设置编辑器显示状态
  const setShowRoleEditor = useCallback((show: boolean) => {
    updateState({ showRoleEditor: show });
  }, [updateState]);

  // 设置搜索查询
  const setSearchQuery = useCallback((query: string) => {
    updateState({ searchQuery: query });
  }, [updateState]);

  // 设置行业过滤
  const setFilterIndustry = useCallback((industry: string) => {
    updateState({ filterIndustry: industry });
  }, [updateState]);

  // 设置排序方式
  const setSortBy = useCallback((sort: 'name' | 'usage' | 'updated' | 'industry') => {
    updateState({ sortBy: sort });
  }, [updateState]);

  // 设置排序顺序
  const setSortOrder = useCallback((order: 'asc' | 'desc') => {
    updateState({ sortOrder: order });
  }, [updateState]);

  // 获取过滤后的角色
  const getFilteredRoles = useCallback((): ProfessionalRole[] => {
    let filteredRoles = [...state.roles];

    // 搜索过滤
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filteredRoles = filteredRoles.filter(role =>
        role.name.toLowerCase().includes(query) ||
        role.industry.toLowerCase().includes(query) ||
        role.description.toLowerCase().includes(query) ||
        role.expertise.some(exp => exp.toLowerCase().includes(query))
      );
    }

    // 行业过滤
    if (state.filterIndustry) {
      filteredRoles = filteredRoles.filter(role => role.industry === state.filterIndustry);
    }

    // 排序
    filteredRoles.sort((a, b) => {
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
        case 'updated':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case 'industry':
          aValue = a.industry.toLowerCase();
          bValue = b.industry.toLowerCase();
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

    return filteredRoles;
  }, [state.roles, state.searchQuery, state.filterIndustry, state.sortBy, state.sortOrder]);

  // 按行业分组角色
  const getRolesByIndustry = useCallback((): { [industry: string]: ProfessionalRole[] } => {
    return state.roles.reduce((acc, role) => {
      if (!acc[role.industry]) {
        acc[role.industry] = [];
      }
      acc[role.industry].push(role);
      return acc;
    }, {} as { [industry: string]: ProfessionalRole[] });
  }, [state.roles]);

  // 获取所有行业
  const getIndustries = useCallback((): string[] => {
    return [...new Set(state.roles.map(role => role.industry))];
  }, [state.roles]);

  // 测试角色配置
  const testRoleConfiguration = useCallback(async (role: Partial<ProfessionalRole>): Promise<boolean> => {
    try {
      // 这里可以添加实际的测试逻辑
      console.log('测试角色配置:', role);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟测试
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  // 复制角色
  const duplicateRole = useCallback((id: string) => {
    const originalRole = state.roles.find(r => r.id === id);
    if (!originalRole) return;

    const duplicatedRole: ProfessionalRole = {
      ...originalRole,
      id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${originalRole.name} (副本)`,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    updateState({
      roles: [...state.roles, duplicatedRole],
      lastUpdate: new Date()
    });
  }, [state.roles, updateState]);

  // 重置使用统计
  const resetRoleUsage = useCallback(async (id: string): Promise<boolean> => {
    return await updateRole(id, { usageCount: 0 });
  }, [updateRole]);

  // 初始化时加载数据
  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  return {
    ...state,
    loadRoles,
    createRole,
    updateRole,
    deleteRole,
    toggleRoleStatus,
    setSelectedRole,
    setEditingRole,
    setShowRoleEditor,
    setSearchQuery,
    setFilterIndustry,
    setSortBy,
    setSortOrder,
    getFilteredRoles,
    getRolesByIndustry,
    getIndustries,
    testRoleConfiguration,
    duplicateRole,
    resetRoleUsage
  };
}