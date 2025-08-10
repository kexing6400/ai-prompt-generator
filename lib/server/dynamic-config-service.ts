/**
 * 动态配置服务层
 * 封装ConfigManager调用逻辑，提供统一的配置管理接口
 * 作者：Claude Code (后端架构师)
 */

import { ConfigManager, AIModel, PromptTemplate } from './config-manager';
import EventEmitter from 'events';

// 配置变更事件接口
export interface ConfigChangeEvent {
  key: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
  category: string;
}

// 动态配置接口
export interface DynamicApiConfig {
  openrouterApiKey: string;
  openrouterBaseUrl: string;
  apiTimeout: number;
  apiRetryCount: number;
  defaultModel: string;
  defaultTemperature: number;
  defaultMaxTokens: number;
}

// AI模型调用配置
export interface ModelCallConfig {
  model: AIModel;
  temperature: number;
  maxTokens: number;
  timeout: number;
  retryCount: number;
}

/**
 * 动态配置服务单例类
 * 提供简化的配置读取API和配置变更通知
 */
export class DynamicConfigService extends EventEmitter {
  private static instance: DynamicConfigService;
  private configManager: ConfigManager;
  private configCache: Map<string, { value: any; timestamp: number; ttl: number }> = new Map();
  private readonly DEFAULT_CACHE_TTL = 30 * 1000; // 30秒本地缓存

  private constructor() {
    super();
    this.configManager = ConfigManager.getInstance();
    this.setupEventHandlers();
  }

  public static getInstance(): DynamicConfigService {
    if (!DynamicConfigService.instance) {
      DynamicConfigService.instance = new DynamicConfigService();
    }
    return DynamicConfigService.instance;
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    // 监听配置变更事件（可以通过Supabase实时订阅实现）
    // TODO: 实现Supabase实时订阅配置变更
  }

  /**
   * 检查本地缓存是否有效
   */
  private isValidLocalCache(key: string): boolean {
    const cached = this.configCache.get(key);
    if (!cached) return false;
    
    return Date.now() - cached.timestamp < cached.ttl;
  }

  /**
   * 更新本地缓存
   */
  private updateLocalCache(key: string, value: any, ttl: number = this.DEFAULT_CACHE_TTL): void {
    this.configCache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * 获取API配置（核心方法）
   */
  public async getApiConfig(): Promise<DynamicApiConfig> {
    const cacheKey = 'api_config_bundle';
    
    // 检查本地缓存
    if (this.isValidLocalCache(cacheKey)) {
      return this.configCache.get(cacheKey)!.value;
    }

    try {
      // 并发获取所有API相关配置
      const [
        openrouterApiKey,
        openrouterBaseUrl,
        apiTimeout,
        apiRetryCount,
        defaultModel,
        defaultTemperature,
        defaultMaxTokens
      ] = await Promise.all([
        this.configManager.getConfig('openrouter_api_key'),
        this.configManager.getConfig('openrouter_base_url'),
        this.configManager.getConfig('api_timeout'),
        this.configManager.getConfig('api_retry_count'),
        this.configManager.getConfig('default_model'),
        this.configManager.getConfig('default_temperature'),
        this.configManager.getConfig('default_max_tokens')
      ]);

      const config: DynamicApiConfig = {
        openrouterApiKey: openrouterApiKey || '',
        openrouterBaseUrl: openrouterBaseUrl || 'https://openrouter.ai/api/v1',
        apiTimeout: parseInt(apiTimeout) || 15000,
        apiRetryCount: parseInt(apiRetryCount) || 3,
        defaultModel: defaultModel || 'anthropic/claude-3.5-sonnet',
        defaultTemperature: parseFloat(defaultTemperature) || 0.7,
        defaultMaxTokens: parseInt(defaultMaxTokens) || 2000
      };

      // 更新本地缓存
      this.updateLocalCache(cacheKey, config);
      
      return config;
      
    } catch (error) {
      console.error('[DynamicConfigService] 获取API配置失败:', error);
      
      // 降级到环境变量
      return this.getFallbackApiConfig();
    }
  }

  /**
   * 获取降级API配置
   */
  private getFallbackApiConfig(): DynamicApiConfig {
    return {
      openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
      openrouterBaseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      apiTimeout: parseInt(process.env.API_TIMEOUT || '15000'),
      apiRetryCount: parseInt(process.env.API_RETRY_COUNT || '3'),
      defaultModel: process.env.DEFAULT_MODEL || 'anthropic/claude-3.5-sonnet',
      defaultTemperature: parseFloat(process.env.DEFAULT_TEMPERATURE || '0.7'),
      defaultMaxTokens: parseInt(process.env.DEFAULT_MAX_TOKENS || '2000')
    };
  }

  /**
   * 获取最佳AI模型配置
   */
  public async getBestModelConfig(preferredModel?: string): Promise<ModelCallConfig> {
    try {
      const [models, apiConfig] = await Promise.all([
        this.configManager.getAIModels(true), // 只获取启用的模型
        this.getApiConfig()
      ]);

      let selectedModel: AIModel;

      if (preferredModel) {
        // 查找指定的模型
        selectedModel = models.find(m => 
          m.model_id === preferredModel || 
          m.name === preferredModel
        ) || await this.configManager.getDefaultModel() || models[0];
      } else {
        // 使用默认模型
        selectedModel = await this.configManager.getDefaultModel() || models[0];
      }

      if (!selectedModel) {
        throw new Error('没有可用的AI模型配置');
      }

      return {
        model: selectedModel,
        temperature: selectedModel.temperature || apiConfig.defaultTemperature,
        maxTokens: selectedModel.max_tokens || apiConfig.defaultMaxTokens,
        timeout: apiConfig.apiTimeout,
        retryCount: apiConfig.apiRetryCount
      };

    } catch (error) {
      console.error('[DynamicConfigService] 获取模型配置失败:', error);
      
      // 返回降级配置
      const apiConfig = await this.getApiConfig();
      return {
        model: {
          id: 'fallback',
          name: 'Fallback Model',
          provider: 'openrouter',
          model_id: apiConfig.defaultModel,
          max_tokens: apiConfig.defaultMaxTokens,
          temperature: apiConfig.defaultTemperature,
          cost_per_1k_tokens: 0.001,
          enabled: true,
          is_default: true
        } as AIModel,
        temperature: apiConfig.defaultTemperature,
        maxTokens: apiConfig.defaultMaxTokens,
        timeout: apiConfig.apiTimeout,
        retryCount: apiConfig.apiRetryCount
      };
    }
  }

  /**
   * 获取提示词模版
   */
  public async getPromptTemplate(industry: string, scenario: string): Promise<PromptTemplate | null> {
    const cacheKey = `template_${industry}_${scenario}`;
    
    // 检查本地缓存
    if (this.isValidLocalCache(cacheKey)) {
      return this.configCache.get(cacheKey)!.value;
    }

    try {
      const templates = await this.configManager.getPromptTemplates(industry);
      
      // 查找匹配的模版
      const matchedTemplate = templates.find(template => 
        template.scenario.toLowerCase().includes(scenario.toLowerCase()) ||
        scenario.toLowerCase().includes(template.scenario.toLowerCase())
      );

      // 更新本地缓存
      this.updateLocalCache(cacheKey, matchedTemplate || null);
      
      return matchedTemplate || null;
      
    } catch (error) {
      console.error('[DynamicConfigService] 获取提示词模版失败:', error);
      return null;
    }
  }

  /**
   * 获取所有可用的AI模型
   */
  public async getAvailableModels(): Promise<AIModel[]> {
    const cacheKey = 'available_models';
    
    // 检查本地缓存
    if (this.isValidLocalCache(cacheKey)) {
      return this.configCache.get(cacheKey)!.value;
    }

    try {
      const models = await this.configManager.getAIModels(true);
      
      // 更新本地缓存
      this.updateLocalCache(cacheKey, models, 60 * 1000); // 1分钟缓存
      
      return models;
      
    } catch (error) {
      console.error('[DynamicConfigService] 获取可用模型失败:', error);
      return [];
    }
  }

  /**
   * 通知配置变更
   */
  public notifyConfigChange(event: ConfigChangeEvent): void {
    // 清除相关缓存
    this.invalidateRelatedCache(event.key);
    
    // 发送变更事件
    this.emit('configChange', event);
    
    console.log(`[DynamicConfigService] 配置变更通知: ${event.key}`, event);
  }

  /**
   * 清除相关缓存
   */
  private invalidateRelatedCache(key: string): void {
    // 根据配置键清除相关缓存
    const relatedKeys: string[] = [];
    
    if (key.startsWith('api_') || key.includes('openrouter') || key.includes('default_')) {
      relatedKeys.push('api_config_bundle');
    }
    
    if (key.includes('model')) {
      relatedKeys.push('available_models');
    }
    
    // 清除所有相关缓存
    relatedKeys.forEach(cacheKey => {
      this.configCache.delete(cacheKey);
    });
    
    // 同时清除ConfigManager缓存
    this.configManager.invalidateCache(key);
  }

  /**
   * 验证配置完整性
   */
  public async validateConfiguration(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      const apiConfig = await this.getApiConfig();
      
      // 验证API密钥
      if (!apiConfig.openrouterApiKey) {
        errors.push('OpenRouter API密钥未配置');
      } else if (!apiConfig.openrouterApiKey.startsWith('sk-or-')) {
        errors.push('OpenRouter API密钥格式无效');
      }
      
      // 验证API基础URL
      if (!apiConfig.openrouterBaseUrl) {
        errors.push('API基础URL未配置');
      }
      
      // 验证超时时间
      if (apiConfig.apiTimeout < 1000 || apiConfig.apiTimeout > 60000) {
        errors.push('API超时时间应在1000-60000ms之间');
      }
      
      // 验证温度参数
      if (apiConfig.defaultTemperature < 0 || apiConfig.defaultTemperature > 2) {
        errors.push('默认温度参数应在0-2之间');
      }
      
      // 验证可用模型
      const models = await this.getAvailableModels();
      if (models.length === 0) {
        errors.push('没有可用的AI模型配置');
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
      
    } catch (error) {
      console.error('[DynamicConfigService] 配置验证失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      errors.push(`配置验证异常: ${errorMessage}`);
      
      return {
        valid: false,
        errors
      };
    }
  }

  /**
   * 获取配置统计信息
   */
  public getStats() {
    return {
      localCacheSize: this.configCache.size,
      configManagerStats: this.configManager.getCacheStats(),
      lastUpdate: new Date(),
      uptime: process.uptime()
    };
  }

  /**
   * 清除所有缓存
   */
  public clearAllCache(): void {
    this.configCache.clear();
    this.configManager.invalidateCache();
  }
}