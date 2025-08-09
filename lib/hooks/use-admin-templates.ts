/**
 * 管理后台提示词模版管理Hook
 * 提供模版的增删改查和状态管理
 */

import { useState, useEffect, useCallback } from 'react';

// 提示词模版接口
export interface PromptTemplate {
  id: string;
  name: string;
  industry: string;
  scenario: string;
  template: string;
  variables: string[];
  active: boolean;
  description?: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

// API响应接口
interface TemplateApiResponse<T = any> {
  success: boolean;
  error?: string;
  templates?: PromptTemplate[];
  template?: PromptTemplate;
  count?: number;
  industries?: string[];
  industriesStats?: Record<string, number>;
  responseTime?: string;
}

// 创建/更新模版的数据
interface TemplateData {
  name: string;
  industry: string;
  scenario: string;
  template: string;
  variables: string[];
  active: boolean;
  description?: string;
}

// Hook状态
interface UseAdminTemplatesState {
  templates: PromptTemplate[];
  filteredTemplates: PromptTemplate[];
  loading: boolean;
  saving: boolean;
  deleting: boolean;
  lastError: string | null;
  industries: string[];
  industriesStats: Record<string, number>;
  // 筛选和搜索
  activeFilter: 'all' | 'active' | 'inactive';
  industryFilter: string;
  searchQuery: string;
  // 统计信息
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
}

// Hook返回值
interface UseAdminTemplatesReturn extends UseAdminTemplatesState {
  loadTemplates: () => Promise<void>;
  createTemplate: (data: TemplateData) => Promise<boolean>;
  updateTemplate: (id: string, data: Partial<TemplateData>) => Promise<boolean>;
  deleteTemplate: (id: string) => Promise<boolean>;
  batchOperation: (action: 'activate' | 'deactivate' | 'delete', templateIds: string[]) => Promise<boolean>;
  // 筛选和搜索方法
  setActiveFilter: (filter: 'all' | 'active' | 'inactive') => void;
  setIndustryFilter: (industry: string) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
  // 工具方法
  getTemplateById: (id: string) => PromptTemplate | undefined;
  getTemplatesByIndustry: (industry: string) => PromptTemplate[];
  validateTemplate: (data: Partial<TemplateData>) => string | null;
}

export function useAdminTemplates(): UseAdminTemplatesReturn {
  const [state, setState] = useState<UseAdminTemplatesState>({
    templates: [],
    filteredTemplates: [],
    loading: false,
    saving: false,
    deleting: false,
    lastError: null,
    industries: [],
    industriesStats: {},
    activeFilter: 'all',
    industryFilter: '',
    searchQuery: '',
    totalCount: 0,
    activeCount: 0,
    inactiveCount: 0
  });

  // 更新状态的辅助函数
  const updateState = useCallback((updates: Partial<UseAdminTemplatesState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // 应用筛选和搜索
  const applyFilters = useCallback(() => {
    let filtered = [...state.templates];

    // 活跃状态筛选
    if (state.activeFilter === 'active') {
      filtered = filtered.filter(t => t.active);
    } else if (state.activeFilter === 'inactive') {
      filtered = filtered.filter(t => !t.active);
    }

    // 行业筛选
    if (state.industryFilter) {
      filtered = filtered.filter(t => t.industry === state.industryFilter);
    }

    // 搜索查询
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.scenario.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.template.toLowerCase().includes(query)
      );
    }

    // 更新统计
    const activeCount = state.templates.filter(t => t.active).length;
    const inactiveCount = state.templates.length - activeCount;

    updateState({
      filteredTemplates: filtered,
      totalCount: state.templates.length,
      activeCount,
      inactiveCount
    });
  }, [state.templates, state.activeFilter, state.industryFilter, state.searchQuery, updateState]);

  // 加载模版列表
  const loadTemplates = useCallback(async () => {
    updateState({ loading: true, lastError: null });

    try {
      const response = await fetch('/api/admin/templates?active=false'); // 获取所有模版
      const data: TemplateApiResponse = await response.json();

      if (data.success && data.templates) {
        updateState({
          templates: data.templates,
          industries: data.industries || [],
          industriesStats: data.industriesStats || {},
          loading: false
        });
      } else {
        updateState({
          loading: false,
          lastError: data.error || '加载模版失败'
        });
      }
    } catch (error) {
      updateState({
        loading: false,
        lastError: '网络错误，请检查连接'
      });
    }
  }, [updateState]);

  // 创建新模版
  const createTemplate = useCallback(async (data: TemplateData): Promise<boolean> => {
    // 验证数据
    const validationError = validateTemplate(data);
    if (validationError) {
      updateState({ lastError: validationError });
      return false;
    }

    updateState({ saving: true, lastError: null });

    try {
      const response = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: TemplateApiResponse = await response.json();

      if (result.success) {
        updateState({ saving: false });
        await loadTemplates(); // 重新加载列表
        return true;
      } else {
        updateState({
          saving: false,
          lastError: result.error || '创建模版失败'
        });
        return false;
      }
    } catch (error) {
      updateState({
        saving: false,
        lastError: '网络错误，创建失败'
      });
      return false;
    }
  }, [loadTemplates, updateState]);

  // 更新模版
  const updateTemplate = useCallback(async (id: string, data: Partial<TemplateData>): Promise<boolean> => {
    updateState({ saving: true, lastError: null });

    try {
      const response = await fetch('/api/admin/templates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...data }),
      });

      const result: TemplateApiResponse = await response.json();

      if (result.success) {
        updateState({ saving: false });
        await loadTemplates(); // 重新加载列表
        return true;
      } else {
        updateState({
          saving: false,
          lastError: result.error || '更新模版失败'
        });
        return false;
      }
    } catch (error) {
      updateState({
        saving: false,
        lastError: '网络错误，更新失败'
      });
      return false;
    }
  }, [loadTemplates, updateState]);

  // 删除模版
  const deleteTemplate = useCallback(async (id: string): Promise<boolean> => {
    updateState({ deleting: true, lastError: null });

    try {
      const response = await fetch(`/api/admin/templates?id=${id}`, {
        method: 'DELETE',
      });

      const result: TemplateApiResponse = await response.json();

      if (result.success) {
        updateState({ deleting: false });
        await loadTemplates(); // 重新加载列表
        return true;
      } else {
        updateState({
          deleting: false,
          lastError: result.error || '删除模版失败'
        });
        return false;
      }
    } catch (error) {
      updateState({
        deleting: false,
        lastError: '网络错误，删除失败'
      });
      return false;
    }
  }, [loadTemplates, updateState]);

  // 批量操作
  const batchOperation = useCallback(async (
    action: 'activate' | 'deactivate' | 'delete', 
    templateIds: string[]
  ): Promise<boolean> => {
    if (templateIds.length === 0) {
      updateState({ lastError: '请选择要操作的模版' });
      return false;
    }

    updateState({ saving: true, lastError: null });

    try {
      const response = await fetch('/api/admin/templates', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, templateIds }),
      });

      const result: TemplateApiResponse = await response.json();

      if (result.success) {
        updateState({ saving: false });
        await loadTemplates(); // 重新加载列表
        return true;
      } else {
        updateState({
          saving: false,
          lastError: result.error || `批量${action}失败`
        });
        return false;
      }
    } catch (error) {
      updateState({
        saving: false,
        lastError: '网络错误，批量操作失败'
      });
      return false;
    }
  }, [loadTemplates, updateState]);

  // 筛选方法
  const setActiveFilter = useCallback((filter: 'all' | 'active' | 'inactive') => {
    updateState({ activeFilter: filter });
  }, [updateState]);

  const setIndustryFilter = useCallback((industry: string) => {
    updateState({ industryFilter: industry });
  }, [updateState]);

  const setSearchQuery = useCallback((query: string) => {
    updateState({ searchQuery: query });
  }, [updateState]);

  const resetFilters = useCallback(() => {
    updateState({
      activeFilter: 'all',
      industryFilter: '',
      searchQuery: ''
    });
  }, [updateState]);

  // 工具方法
  const getTemplateById = useCallback((id: string): PromptTemplate | undefined => {
    return state.templates.find(t => t.id === id);
  }, [state.templates]);

  const getTemplatesByIndustry = useCallback((industry: string): PromptTemplate[] => {
    return state.templates.filter(t => t.industry === industry);
  }, [state.templates]);

  // 验证模版数据
  const validateTemplate = useCallback((data: Partial<TemplateData>): string | null => {
    if (!data.name?.trim()) {
      return '模版名称不能为空';
    }

    if (!data.industry?.trim()) {
      return '请选择行业';
    }

    if (!data.scenario?.trim()) {
      return '场景描述不能为空';
    }

    if (!data.template?.trim()) {
      return '模版内容不能为空';
    }

    if (data.template && data.template.length < 50) {
      return '模版内容至少需要50个字符';
    }

    return null;
  }, []);

  // 当模版数据或筛选条件变化时应用筛选
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // 初始化时加载模版
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return {
    ...state,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    batchOperation,
    setActiveFilter,
    setIndustryFilter,
    setSearchQuery,
    resetFilters,
    getTemplateById,
    getTemplatesByIndustry,
    validateTemplate
  };
}