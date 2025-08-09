/**
 * 管理后台配置管理Hook
 * 提供配置的增删改查和状态管理
 */

import { useState, useEffect, useCallback } from 'react';

// 配置分类接口
interface ConfigCategory {
  [key: string]: string;
}

interface AdminConfigs {
  [category: string]: ConfigCategory;
}

// API响应接口
interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  data?: T;
  configs?: AdminConfigs;
  responseTime?: string;
}

// 配置验证结果
interface ConfigValidation {
  valid: boolean;
  error?: string;
}

// Hook状态
interface UseAdminConfigState {
  configs: AdminConfigs;
  loading: boolean;
  saving: boolean;
  testing: boolean;
  unsavedChanges: { [key: string]: string };
  lastError: string | null;
  lastUpdate: Date | null;
}

// Hook返回值
interface UseAdminConfigReturn extends UseAdminConfigState {
  loadConfigs: () => Promise<void>;
  updateConfig: (key: string, value: string) => void;
  saveConfigs: () => Promise<boolean>;
  testConfiguration: (type: string) => Promise<boolean>;
  resetUnsavedChanges: () => void;
  getConfigValue: (category: string, key: string) => string;
  hasUnsavedChanges: boolean;
  validateConfig: (key: string, value: string) => ConfigValidation;
}

export function useAdminConfig(): UseAdminConfigReturn {
  const [state, setState] = useState<UseAdminConfigState>({
    configs: {},
    loading: false,
    saving: false,
    testing: false,
    unsavedChanges: {},
    lastError: null,
    lastUpdate: null
  });

  // 设置状态的辅助函数
  const updateState = useCallback((updates: Partial<UseAdminConfigState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // 加载配置
  const loadConfigs = useCallback(async () => {
    updateState({ loading: true, lastError: null });

    try {
      const response = await fetch('/api/admin/config');
      const data: ApiResponse = await response.json();

      if (data.success && data.configs) {
        updateState({
          configs: data.configs,
          loading: false,
          lastUpdate: new Date()
        });
      } else {
        updateState({
          loading: false,
          lastError: data.error || '加载配置失败'
        });
      }
    } catch (error) {
      updateState({
        loading: false,
        lastError: '网络错误，请检查连接'
      });
    }
  }, [updateState]);

  // 更新配置值（本地状态）
  const updateConfig = useCallback((key: string, value: string) => {
    setState(prev => ({
      ...prev,
      unsavedChanges: {
        ...prev.unsavedChanges,
        [key]: value
      }
    }));
  }, []);

  // 保存配置到服务器
  const saveConfigs = useCallback(async (): Promise<boolean> => {
    if (Object.keys(state.unsavedChanges).length === 0) {
      updateState({ lastError: '没有需要保存的变更' });
      return false;
    }

    updateState({ saving: true, lastError: null });

    try {
      const configsToUpdate = Object.entries(state.unsavedChanges).map(([key, value]) => ({
        key,
        value,
        encrypted: key.includes('key') || key.includes('secret') || key.includes('password')
      }));

      // 获取CSRF token
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('x-admin-csrf-token='))
        ?.split('=')[1];

      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-CSRF-Token': csrfToken || ''
        },
        body: JSON.stringify({ configs: configsToUpdate }),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        updateState({
          saving: false,
          unsavedChanges: {},
          lastUpdate: new Date()
        });
        // 重新加载配置确保同步
        await loadConfigs();
        return true;
      } else {
        updateState({
          saving: false,
          lastError: data.error || '保存失败'
        });
        return false;
      }
    } catch (error) {
      updateState({
        saving: false,
        lastError: '网络错误，保存失败'
      });
      return false;
    }
  }, [state.unsavedChanges, loadConfigs, updateState]);

  // 测试配置
  const testConfiguration = useCallback(async (type: string): Promise<boolean> => {
    updateState({ testing: true, lastError: null });

    try {
      const testConfig = {
        ...state.configs[type],
        ...state.unsavedChanges
      };

      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          config: testConfig
        }),
      });

      const data: ApiResponse = await response.json();

      updateState({ testing: false });

      if (data.success) {
        return true;
      } else {
        updateState({ lastError: `配置测试失败: ${data.error}` });
        return false;
      }
    } catch (error) {
      updateState({
        testing: false,
        lastError: '测试配置时发生网络错误'
      });
      return false;
    }
  }, [state.configs, state.unsavedChanges, updateState]);

  // 重置未保存的变更
  const resetUnsavedChanges = useCallback(() => {
    updateState({ unsavedChanges: {} });
  }, [updateState]);

  // 获取配置值（包括未保存的变更）
  const getConfigValue = useCallback((category: string, key: string): string => {
    if (state.unsavedChanges[key] !== undefined) {
      return state.unsavedChanges[key];
    }
    return state.configs[category]?.[key] || '';
  }, [state.configs, state.unsavedChanges]);

  // 配置验证
  const validateConfig = useCallback((key: string, value: string): ConfigValidation => {
    // 基本验证规则
    if (!value.trim()) {
      return { valid: false, error: '配置值不能为空' };
    }

    // 特定配置的验证规则
    if (key.includes('url')) {
      try {
        new URL(value);
      } catch {
        return { valid: false, error: '请输入有效的URL' };
      }
    }

    if (key.includes('timeout')) {
      const num = parseInt(value);
      if (isNaN(num) || num < 1000 || num > 60000) {
        return { valid: false, error: '超时值应在1000-60000ms之间' };
      }
    }

    if (key.includes('temperature')) {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0 || num > 2) {
        return { valid: false, error: '温度值应在0-2之间' };
      }
    }

    if (key.includes('max_tokens')) {
      const num = parseInt(value);
      if (isNaN(num) || num < 1 || num > 8000) {
        return { valid: false, error: '最大令牌数应在1-8000之间' };
      }
    }

    return { valid: true };
  }, []);

  // 初始化时加载配置
  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  return {
    ...state,
    loadConfigs,
    updateConfig,
    saveConfigs,
    testConfiguration,
    resetUnsavedChanges,
    getConfigValue,
    validateConfig,
    hasUnsavedChanges: Object.keys(state.unsavedChanges).length > 0
  };
}