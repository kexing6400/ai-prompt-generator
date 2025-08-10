/**
 * 配置变更通知服务
 * 实现配置热更新机制，确保配置变更实时生效
 * 作者：Claude Code (后端架构师)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DynamicConfigService, ConfigChangeEvent } from './dynamic-config-service';
import { ConfigManager } from './config-manager';

// 变更通知类型
interface ConfigChangeNotification {
  table: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: any;
  old?: any;
  timestamp: number;
}

/**
 * 配置变更通知器
 * 监听数据库配置表变更并通知相关服务
 */
export class ConfigChangeNotifier {
  private static instance: ConfigChangeNotifier;
  private supabase: SupabaseClient | null = null;
  private dynamicConfigService: DynamicConfigService;
  private configManager: ConfigManager;
  private subscriptions: any[] = [];
  private isInitialized = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1秒

  private constructor() {
    this.dynamicConfigService = DynamicConfigService.getInstance();
    this.configManager = ConfigManager.getInstance();
    this.initializeSupabase();
  }

  public static getInstance(): ConfigChangeNotifier {
    if (!ConfigChangeNotifier.instance) {
      ConfigChangeNotifier.instance = new ConfigChangeNotifier();
    }
    return ConfigChangeNotifier.instance;
  }

  /**
   * 初始化Supabase客户端
   */
  private initializeSupabase(): void {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('[ConfigNotifier] Supabase配置缺失，跳过实时通知初始化');
      return;
    }

    try {
      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      });

      console.log('[ConfigNotifier] Supabase客户端初始化成功');
    } catch (error) {
      console.error('[ConfigNotifier] Supabase客户端初始化失败:', error);
    }
  }

  /**
   * 启动配置变更监听
   */
  public async startListening(): Promise<void> {
    if (!this.supabase) {
      console.warn('[ConfigNotifier] Supabase未初始化，无法启动配置监听');
      return;
    }

    if (this.isInitialized) {
      console.log('[ConfigNotifier] 配置监听已启动');
      return;
    }

    try {
      // 监听admin_config表变更
      const configSubscription = this.supabase
        .channel('admin_config_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'admin_config'
          },
          (payload) => this.handleConfigChange('admin_config', payload)
        )
        .subscribe((status) => {
          console.log(`[ConfigNotifier] admin_config订阅状态: ${status}`);
        });

      // 监听ai_models表变更
      const modelsSubscription = this.supabase
        .channel('ai_models_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ai_models'
          },
          (payload) => this.handleConfigChange('ai_models', payload)
        )
        .subscribe((status) => {
          console.log(`[ConfigNotifier] ai_models订阅状态: ${status}`);
        });

      // 监听prompt_templates表变更
      const templatesSubscription = this.supabase
        .channel('prompt_templates_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'prompt_templates'
          },
          (payload) => this.handleConfigChange('prompt_templates', payload)
        )
        .subscribe((status) => {
          console.log(`[ConfigNotifier] prompt_templates订阅状态: ${status}`);
        });

      this.subscriptions = [configSubscription, modelsSubscription, templatesSubscription];
      this.isInitialized = true;
      this.reconnectAttempts = 0;

      console.log('[ConfigNotifier] 配置变更监听启动成功');

      // 设置连接状态监听
      this.setupConnectionMonitoring();

    } catch (error) {
      console.error('[ConfigNotifier] 启动配置监听失败:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * 处理配置变更事件
   */
  private async handleConfigChange(table: string, payload: any): Promise<void> {
    try {
      const notification: ConfigChangeNotification = {
        table,
        eventType: payload.eventType,
        new: payload.new,
        old: payload.old,
        timestamp: Date.now()
      };

      console.log(`[ConfigNotifier] 收到${table}表变更通知:`, {
        eventType: notification.eventType,
        affectedKey: notification.new?.key || notification.old?.key,
        timestamp: new Date(notification.timestamp).toISOString()
      });

      // 根据表类型处理变更
      switch (table) {
        case 'admin_config':
          await this.handleAdminConfigChange(notification);
          break;
        
        case 'ai_models':
          await this.handleAiModelsChange(notification);
          break;
        
        case 'prompt_templates':
          await this.handlePromptTemplatesChange(notification);
          break;
      }

      // 记录变更统计
      this.recordChangeStats(notification);

    } catch (error) {
      console.error(`[ConfigNotifier] 处理${table}变更失败:`, error);
    }
  }

  /**
   * 处理系统配置变更
   */
  private async handleAdminConfigChange(notification: ConfigChangeNotification): Promise<void> {
    const configKey = notification.new?.key || notification.old?.key;
    const newValue = notification.new?.value;
    const oldValue = notification.old?.value;

    if (!configKey) return;

    // 创建配置变更事件
    const changeEvent: ConfigChangeEvent = {
      key: configKey,
      oldValue,
      newValue,
      timestamp: notification.timestamp,
      category: notification.new?.category || 'unknown'
    };

    // 通知DynamicConfigService
    this.dynamicConfigService.notifyConfigChange(changeEvent);

    // 特殊处理某些关键配置
    if (this.isCriticalConfig(configKey)) {
      console.log(`[ConfigNotifier] 关键配置变更: ${configKey}`);
      
      // 可以在这里添加特殊的处理逻辑
      // 例如重启某些服务、发送告警等
    }

    console.log(`[ConfigNotifier] 系统配置变更处理完成: ${configKey}`);
  }

  /**
   * 处理AI模型配置变更
   */
  private async handleAiModelsChange(notification: ConfigChangeNotification): Promise<void> {
    // 清除模型相关缓存
    this.dynamicConfigService['configCache']?.delete('available_models');
    this.dynamicConfigService['configCache']?.delete('api_config_bundle');
    
    // 通知配置变更
    const changeEvent: ConfigChangeEvent = {
      key: 'ai_models',
      oldValue: notification.old,
      newValue: notification.new,
      timestamp: notification.timestamp,
      category: 'models'
    };

    this.dynamicConfigService.notifyConfigChange(changeEvent);
    
    console.log('[ConfigNotifier] AI模型配置变更处理完成');
  }

  /**
   * 处理提示词模版变更
   */
  private async handlePromptTemplatesChange(notification: ConfigChangeNotification): Promise<void> {
    // 清除模版相关缓存
    const templateKey = `template_${notification.new?.industry}_${notification.new?.scenario}`;
    this.dynamicConfigService['configCache']?.delete(templateKey);
    
    // 通知配置变更
    const changeEvent: ConfigChangeEvent = {
      key: 'prompt_templates',
      oldValue: notification.old,
      newValue: notification.new,
      timestamp: notification.timestamp,
      category: 'templates'
    };

    this.dynamicConfigService.notifyConfigChange(changeEvent);
    
    console.log('[ConfigNotifier] 提示词模版变更处理完成');
  }

  /**
   * 判断是否为关键配置
   */
  private isCriticalConfig(key: string): boolean {
    const criticalKeys = [
      'openrouter_api_key',
      'openrouter_base_url',
      'default_model',
      'admin_password_hash',
      'jwt_secret'
    ];
    
    return criticalKeys.includes(key);
  }

  /**
   * 设置连接监控
   */
  private setupConnectionMonitoring(): void {
    if (!this.supabase) return;

    // 监听连接状态 - 注释掉，因为新版Supabase SDK API变更
    // this.supabase.realtime.onOpen(() => {
    //   console.log('[ConfigNotifier] 实时连接已建立');
    //   this.reconnectAttempts = 0;
    // });

    // this.supabase.realtime.onClose(() => {
    //   console.warn('[ConfigNotifier] 实时连接已关闭');
    //   this.scheduleReconnect();
    // });

    // this.supabase.realtime.onError((error) => {
    //   console.error('[ConfigNotifier] 实时连接错误:', error);
    //   this.scheduleReconnect();
    // });
  }

  /**
   * 计划重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[ConfigNotifier] 超过最大重连次数，停止重连');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // 指数退避

    console.log(`[ConfigNotifier] 计划在${delay}ms后进行第${this.reconnectAttempts}次重连`);

    setTimeout(() => {
      this.reconnect();
    }, delay);
  }

  /**
   * 重新连接
   */
  private async reconnect(): Promise<void> {
    try {
      console.log('[ConfigNotifier] 尝试重新连接...');
      
      // 关闭现有订阅
      await this.stopListening();
      
      // 重新初始化
      this.isInitialized = false;
      this.initializeSupabase();
      
      // 重新启动监听
      await this.startListening();
      
    } catch (error) {
      console.error('[ConfigNotifier] 重连失败:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * 记录变更统计
   */
  private recordChangeStats(notification: ConfigChangeNotification): void {
    // 这里可以记录配置变更统计信息
    // 例如变更频率、影响范围等，用于监控和分析
    console.log(`[ConfigNotifier] 变更统计: ${notification.table} ${notification.eventType}`);
  }

  /**
   * 停止配置变更监听
   */
  public async stopListening(): Promise<void> {
    try {
      // 取消所有订阅
      for (const subscription of this.subscriptions) {
        if (subscription && subscription.unsubscribe) {
          await subscription.unsubscribe();
        }
      }
      
      this.subscriptions = [];
      this.isInitialized = false;
      
      console.log('[ConfigNotifier] 配置监听已停止');
      
    } catch (error) {
      console.error('[ConfigNotifier] 停止配置监听失败:', error);
    }
  }

  /**
   * 手动触发配置刷新
   */
  public async forceRefresh(configKey?: string): Promise<void> {
    try {
      if (configKey) {
        // 刷新特定配置
        this.configManager.invalidateCache(configKey);
        this.dynamicConfigService['configCache']?.delete(configKey);
        
        console.log(`[ConfigNotifier] 手动刷新配置: ${configKey}`);
      } else {
        // 刷新所有配置
        this.configManager.invalidateCache();
        this.dynamicConfigService.clearAllCache();
        
        console.log('[ConfigNotifier] 手动刷新所有配置');
      }
    } catch (error) {
      console.error('[ConfigNotifier] 手动刷新配置失败:', error);
    }
  }

  /**
   * 获取通知器状态
   */
  public getStatus() {
    return {
      isInitialized: this.isInitialized,
      subscriptionsCount: this.subscriptions.length,
      reconnectAttempts: this.reconnectAttempts,
      hasSupabaseClient: !!this.supabase,
      lastUpdate: Date.now()
    };
  }
}

// 自动启动配置变更监听（仅在服务端）
if (typeof window === 'undefined') {
  const notifier = ConfigChangeNotifier.getInstance();
  
  // 延迟启动，确保应用完全初始化
  setTimeout(() => {
    notifier.startListening().catch(error => {
      console.error('[ConfigNotifier] 自动启动失败:', error);
    });
  }, 2000);
}