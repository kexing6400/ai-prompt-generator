/**
 * 模型管理Hook - OpenRouter模型生态管理
 * 提供318个模型的分类视图和管理功能
 * 作者：Claude Code (AI专家工厂架构师)
 */

import { useState, useEffect, useCallback } from 'react';

// 模型信息接口
export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
  top_provider?: {
    name: string;
    max_completion_tokens?: number;
  };
  architecture?: {
    modality: string;
    tokenizer: string;
  };
  per_request_limits?: any;
}

// 模型分类接口
export interface ModelCategories {
  free: ModelInfo[];              // 💰 完全免费
  costEffective: ModelInfo[];     // 🏆 性价比之王  
  premium: ModelInfo[];           // 💎 顶级效果
  latest: ModelInfo[];            // 🚀 最新2024
  fastest: ModelInfo[];           // ⚡ 最快响应
  longContext: ModelInfo[];       // 📄 长文档处理
  coding: ModelInfo[];            // 💻 编程专家
  creative: ModelInfo[];          // 🎨 创意写作
  reasoning: ModelInfo[];         // 🧠 逻辑推理
  multimodal: ModelInfo[];        // 👁️ 多模态
}

// 模型统计分析
export interface ModelAnalysis {
  overview: {
    totalModels: number;
    avgCostPer1KTokens: number;
    cheapestModel: number;
    maxContextLength: number;
    lastAnalyzed: string;
  };
  providers: {
    total: number;
    distribution: Array<{ provider: string; modelCount: number; }>;
  };
  pricing: {
    distribution: { free: number; low: number; medium: number; high: number; premium: number; };
    analysis: {
      freeModels: string;
      budgetFriendly: string;
      enterprise: string;
    };
  };
  contextLength: {
    distribution: Array<{ length: string; count: number; }>;
  };
}

// 专业推荐
export interface ModelRecommendations {
  scenarios: {
    [key: string]: {
      title: string;
      description: string;
      primaryModel: ModelInfo;
      fallbackModel: ModelInfo;
      reasoning: string;
    };
  };
  industries: {
    [key: string]: {
      title: string;
      models: ModelInfo[];
      reason: string;
    };
  };
}

// API响应接口
interface ModelsApiResponse {
  success: boolean;
  error?: string;
  totalModels?: number;
  categories?: ModelCategories;
  analysis?: ModelAnalysis;
  recommendations?: ModelRecommendations;
  responseTime?: string;
  lastUpdated?: string;
  message?: string;
}

// Hook状态
interface UseAdminModelsState {
  categories: ModelCategories | null;
  analysis: ModelAnalysis | null;
  recommendations: ModelRecommendations | null;
  loading: boolean;
  lastError: string | null;
  lastUpdate: Date | null;
  totalModels: number;
  selectedCategory: keyof ModelCategories;
  searchQuery: string;
  sortBy: 'name' | 'price' | 'context' | 'provider';
  sortOrder: 'asc' | 'desc';
}

// Hook返回值
interface UseAdminModelsReturn extends UseAdminModelsState {
  error: string | null;  // 添加error属性以匹配组件期望
  loadModels: () => Promise<void>;
  setSelectedCategory: (category: keyof ModelCategories) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: 'name' | 'price' | 'context' | 'provider') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  getFilteredModels: () => ModelInfo[];
  getCategoryIcon: (category: keyof ModelCategories) => string;
  getCategoryDescription: (category: keyof ModelCategories) => string;
  getModelPriceLevel: (model: ModelInfo) => 'free' | 'low' | 'medium' | 'high' | 'premium';
  getModelContextLevel: (model: ModelInfo) => 'short' | 'medium' | 'long' | 'ultra';
}

// 分类图标和描述映射
const CATEGORY_INFO: Record<keyof ModelCategories, { icon: string; description: string; }> = {
  free: { icon: '💰', description: '完全免费的AI模型，适合测试和轻量使用' },
  costEffective: { icon: '🏆', description: '性价比最优，平衡成本与效果' },
  premium: { icon: '💎', description: '顶级性能模型，适合关键业务场景' },
  latest: { icon: '🚀', description: '2024年最新发布的前沿模型' },
  fastest: { icon: '⚡', description: '响应速度最快，适合实时应用' },
  longContext: { icon: '📄', description: '超长文档处理能力，32K+上下文' },
  coding: { icon: '💻', description: '编程和代码生成专用优化模型' },
  creative: { icon: '🎨', description: '创意写作和内容生成专家' },
  reasoning: { icon: '🧠', description: '逻辑推理和复杂问题解决' },
  multimodal: { icon: '👁️', description: '多模态能力，支持图像、音频等' }
};

export function useAdminModels(): UseAdminModelsReturn {
  const [state, setState] = useState<UseAdminModelsState>({
    categories: null,
    analysis: null,
    recommendations: null,
    loading: false,
    lastError: null,
    lastUpdate: null,
    totalModels: 0,
    selectedCategory: 'free',
    searchQuery: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  // 状态更新辅助函数
  const updateState = useCallback((updates: Partial<UseAdminModelsState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // 加载模型数据
  const loadModels = useCallback(async () => {
    updateState({ loading: true, lastError: null });

    try {
      console.log('🔄 开始加载OpenRouter模型数据...');
      const response = await fetch('/api/admin/models/openrouter');
      const data: ModelsApiResponse = await response.json();

      if (data.success && data.categories) {
        updateState({
          categories: data.categories,
          analysis: data.analysis || null,
          recommendations: data.recommendations || null,
          totalModels: data.totalModels || 0,
          loading: false,
          lastUpdate: new Date(),
          lastError: null
        });
        console.log(`✅ 成功加载${data.totalModels}个模型`);
      } else {
        updateState({
          loading: false,
          lastError: data.error || '加载模型数据失败'
        });
      }
    } catch (error: any) {
      console.error('❌ 加载模型数据失败:', error);
      updateState({
        loading: false,
        lastError: `加载失败: ${error.message || '网络错误'}`
      });
    }
  }, [updateState]);

  // 设置选中分类
  const setSelectedCategory = useCallback((category: keyof ModelCategories) => {
    updateState({ selectedCategory: category });
  }, [updateState]);

  // 设置搜索查询
  const setSearchQuery = useCallback((query: string) => {
    updateState({ searchQuery: query });
  }, [updateState]);

  // 设置排序方式
  const setSortBy = useCallback((sort: 'name' | 'price' | 'context' | 'provider') => {
    updateState({ sortBy: sort });
  }, [updateState]);

  // 设置排序顺序
  const setSortOrder = useCallback((order: 'asc' | 'desc') => {
    updateState({ sortOrder: order });
  }, [updateState]);

  // 获取过滤和排序后的模型
  const getFilteredModels = useCallback((): ModelInfo[] => {
    if (!state.categories) return [];

    let models = state.categories[state.selectedCategory] || [];

    // 搜索过滤
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      models = models.filter(model => 
        model.name.toLowerCase().includes(query) ||
        model.id.toLowerCase().includes(query) ||
        (model.description && model.description.toLowerCase().includes(query)) ||
        (model.top_provider?.name && model.top_provider.name.toLowerCase().includes(query))
      );
    }

    // 排序
    models.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (state.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = (parseFloat(a.pricing?.prompt || '0') + parseFloat(a.pricing?.completion || '0')) / 2;
          bValue = (parseFloat(b.pricing?.prompt || '0') + parseFloat(b.pricing?.completion || '0')) / 2;
          break;
        case 'context':
          aValue = a.context_length || 0;
          bValue = b.context_length || 0;
          break;
        case 'provider':
          aValue = (a.top_provider?.name || '').toLowerCase();
          bValue = (b.top_provider?.name || '').toLowerCase();
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

    return models;
  }, [state.categories, state.selectedCategory, state.searchQuery, state.sortBy, state.sortOrder]);

  // 获取分类图标
  const getCategoryIcon = useCallback((category: keyof ModelCategories): string => {
    return CATEGORY_INFO[category]?.icon || '📊';
  }, []);

  // 获取分类描述
  const getCategoryDescription = useCallback((category: keyof ModelCategories): string => {
    return CATEGORY_INFO[category]?.description || '';
  }, []);

  // 获取模型价格等级
  const getModelPriceLevel = useCallback((model: ModelInfo): 'free' | 'low' | 'medium' | 'high' | 'premium' => {
    const avgPrice = (parseFloat(model.pricing?.prompt || '0') + parseFloat(model.pricing?.completion || '0')) / 2;
    
    if (avgPrice === 0) return 'free';
    if (avgPrice <= 0.001) return 'low';
    if (avgPrice <= 0.01) return 'medium';
    if (avgPrice <= 0.05) return 'high';
    return 'premium';
  }, []);

  // 获取模型上下文等级
  const getModelContextLevel = useCallback((model: ModelInfo): 'short' | 'medium' | 'long' | 'ultra' => {
    const contextLength = model.context_length || 0;
    
    if (contextLength <= 4000) return 'short';
    if (contextLength <= 16000) return 'medium';
    if (contextLength <= 64000) return 'long';
    return 'ultra';
  }, []);

  // 初始化时加载数据
  useEffect(() => {
    loadModels();
  }, [loadModels]);

  return {
    ...state,
    error: state.lastError,  // 将lastError映射到error属性
    loadModels,
    setSelectedCategory,
    setSearchQuery,
    setSortBy,
    setSortOrder,
    getFilteredModels,
    getCategoryIcon,
    getCategoryDescription,
    getModelPriceLevel,
    getModelContextLevel
  };
}