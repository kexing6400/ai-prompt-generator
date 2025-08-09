/**
 * 配置管理服务
 * 提供配置的读取、缓存、热更新功能
 * 作者：Claude Code (后端架构师)
 */

import { ConfigCrypto } from './crypto';
import { createClient } from '@supabase/supabase-js';

// 配置接口定义
export interface AdminConfig {
  id: string;
  key: string;
  value: string;
  encrypted: boolean;
  description?: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  model_id: string;
  max_tokens: number;
  temperature: number;
  cost_per_1k_tokens: number;
  enabled: boolean;
  is_default: boolean;
  description?: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  industry: string;
  scenario: string;
  template: string;
  variables: string[];
  active: boolean;
  usage_count: number;
}

/**
 * 配置管理器单例类
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private cache: Map<string, any> = new Map();
  private lastUpdated: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存
  private supabase: any;

  private constructor() {
    this.initializeSupabase();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * 初始化Supabase客户端
   */
  private initializeSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase配置缺失，将使用默认配置');
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  /**
   * 检查缓存是否有效
   */
  private isValidCache(key: string): boolean {
    if (!this.cache.has(key)) return false;
    
    const lastUpdate = this.lastUpdated.get(key) || 0;
    return Date.now() - lastUpdate < this.CACHE_TTL;
  }

  /**
   * 更新缓存
   */
  private updateCache(key: string, value: any): void {
    this.cache.set(key, value);
    this.lastUpdated.set(key, Date.now());
  }

  /**
   * 从数据库获取配置
   */
  private async fetchConfigFromDB(key: string): Promise<any> {
    if (!this.supabase) {
      return this.getFallbackConfig(key);
    }

    try {
      const { data, error } = await this.supabase
        .from('admin_config')
        .select('*')
        .eq('key', key)
        .single();

      if (error) throw error;

      if (data && data.encrypted) {
        try {
          data.value = ConfigCrypto.decrypt(data.value);
        } catch (decryptError) {
          console.error(`解密配置失败 ${key}:`, decryptError);
          return this.getFallbackConfig(key);
        }
      }

      return data?.value || this.getFallbackConfig(key);
    } catch (error) {
      console.error(`获取配置失败 ${key}:`, error);
      return this.getFallbackConfig(key);
    }
  }

  /**
   * 获取降级配置
   */
  private getFallbackConfig(key: string): any {
    const fallbacks: Record<string, any> = {
      'openrouter_api_key': process.env.OPENROUTER_API_KEY || '',
      'openrouter_base_url': process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      'api_timeout': '15000',
      'api_retry_count': '3',
      'cache_ttl': '3600000',
      'default_model': 'anthropic/claude-3.5-sonnet',
      'default_temperature': '0.7',
      'default_max_tokens': '2000'
    };

    return fallbacks[key] || '';
  }

  /**
   * 获取单个配置值
   */
  public async getConfig(key: string): Promise<any> {
    // 1. 检查缓存
    if (this.isValidCache(key)) {
      return this.cache.get(key);
    }

    // 2. 从数据库获取
    const value = await this.fetchConfigFromDB(key);
    this.updateCache(key, value);
    
    return value;
  }

  /**
   * 获取分类配置
   */
  public async getConfigByCategory(category: string): Promise<Record<string, any>> {
    if (!this.supabase) {
      return {};
    }

    try {
      const { data, error } = await this.supabase
        .from('admin_config')
        .select('*')
        .eq('category', category);

      if (error) throw error;

      const result: Record<string, any> = {};
      
      for (const item of data || []) {
        let value = item.value;
        if (item.encrypted) {
          try {
            value = ConfigCrypto.decrypt(value);
          } catch (decryptError) {
            console.error(`解密配置失败 ${item.key}:`, decryptError);
            value = this.getFallbackConfig(item.key);
          }
        }
        result[item.key] = value;
      }

      return result;
    } catch (error) {
      console.error(`获取分类配置失败 ${category}:`, error);
      return {};
    }
  }

  /**
   * 更新配置
   */
  public async updateConfig(key: string, value: string, encrypted: boolean = false): Promise<boolean> {
    if (!this.supabase) {
      console.error('Supabase未初始化，无法更新配置');
      return false;
    }

    try {
      let finalValue = value;
      if (encrypted) {
        finalValue = ConfigCrypto.encrypt(value);
      }

      const { error } = await this.supabase
        .from('admin_config')
        .upsert({
          key,
          value: finalValue,
          encrypted,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) throw error;

      // 更新缓存
      this.updateCache(key, value);
      
      return true;
    } catch (error) {
      console.error(`更新配置失败 ${key}:`, error);
      return false;
    }
  }

  /**
   * 批量更新配置
   */
  public async batchUpdateConfig(configs: Array<{key: string, value: string, encrypted?: boolean}>): Promise<boolean> {
    if (!this.supabase) {
      console.error('Supabase未初始化，无法批量更新配置');
      return false;
    }

    try {
      const updates = configs.map(config => ({
        key: config.key,
        value: config.encrypted ? ConfigCrypto.encrypt(config.value) : config.value,
        encrypted: config.encrypted || false,
        updated_at: new Date().toISOString()
      }));

      const { error } = await this.supabase
        .from('admin_config')
        .upsert(updates, {
          onConflict: 'key'
        });

      if (error) throw error;

      // 更新缓存
      configs.forEach(config => {
        this.updateCache(config.key, config.value);
      });

      return true;
    } catch (error) {
      console.error('批量更新配置失败:', error);
      return false;
    }
  }

  /**
   * 获取AI模型列表
   */
  public async getAIModels(enabledOnly: boolean = false): Promise<AIModel[]> {
    if (!this.supabase) {
      return [];
    }

    try {
      let query = this.supabase.from('ai_models').select('*');
      
      if (enabledOnly) {
        query = query.eq('enabled', true);
      }
      
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('获取AI模型列表失败:', error);
      return [];
    }
  }

  /**
   * 获取默认AI模型
   */
  public async getDefaultModel(): Promise<AIModel | null> {
    const models = await this.getAIModels(true);
    return models.find(model => model.is_default) || models[0] || null;
  }

  /**
   * 获取提示词模版
   */
  public async getPromptTemplates(industry?: string): Promise<PromptTemplate[]> {
    if (!this.supabase) {
      return [];
    }

    try {
      let query = this.supabase.from('prompt_templates').select('*');
      
      if (industry) {
        query = query.eq('industry', industry);
      }
      
      query = query.eq('active', true)
              .order('usage_count', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('获取提示词模版失败:', error);
      return [];
    }
  }

  /**
   * 清除缓存
   */
  public invalidateCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
      this.lastUpdated.delete(key);
    } else {
      this.cache.clear();
      this.lastUpdated.clear();
    }
  }

  /**
   * 获取缓存状态
   */
  public getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      lastCleanup: new Date()
    };
  }

  /**
   * 验证配置
   */
  public async validateConfig(key: string, value: string): Promise<{ valid: boolean, error?: string }> {
    switch (key) {
      case 'openrouter_api_key':
        if (!value.startsWith('sk-or-')) {
          return { valid: false, error: 'OpenRouter API密钥格式无效' };
        }
        break;
      
      case 'api_timeout':
        const timeout = parseInt(value);
        if (isNaN(timeout) || timeout < 1000 || timeout > 60000) {
          return { valid: false, error: '超时时间应在1000-60000ms之间' };
        }
        break;
      
      case 'default_temperature':
        const temp = parseFloat(value);
        if (isNaN(temp) || temp < 0 || temp > 2) {
          return { valid: false, error: '温度参数应在0-2之间' };
        }
        break;
    }
    
    return { valid: true };
  }
}