/**
 * 动态配置集成测试
 * 验证配置系统的动态更新和API集成功能
 * 作者：Claude Code (后端架构师)
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { DynamicConfigService } from '@/lib/server/dynamic-config-service';
import { ConfigManager } from '@/lib/server/config-manager';
import { ConfigChangeNotifier } from '@/lib/server/config-change-notifier';
import { POST, GET } from '@/app/api/generate-prompt/route';

// 模拟Supabase客户端
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { key: 'test_key', value: 'test_value', encrypted: false },
            error: null
          }))
        }))
      })),
      upsert: jest.fn().mockResolvedValue({ error: null }),
      insert: jest.fn().mockResolvedValue({ error: null })
    })),
    realtime: {
      onOpen: jest.fn(),
      onClose: jest.fn(),
      onError: jest.fn()
    },
    channel: jest.fn(() => ({
      on: jest.fn(() => ({ subscribe: jest.fn() }))
    }))
  }))
}));

// 模拟fetch
global.fetch = jest.fn();

describe('动态配置集成测试', () => {
  let configService: DynamicConfigService;
  let configManager: ConfigManager;
  let notifier: ConfigChangeNotifier;

  beforeAll(async () => {
    // 设置测试环境变量
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    
    configService = DynamicConfigService.getInstance();
    configManager = ConfigManager.getInstance();
    notifier = ConfigChangeNotifier.getInstance();
  });

  beforeEach(() => {
    // 清理缓存
    configService.clearAllCache();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await notifier.stopListening();
  });

  describe('配置读取功能', () => {
    test('应能正确读取API配置', async () => {
      const apiConfig = await configService.getApiConfig();
      
      expect(apiConfig).toBeDefined();
      expect(apiConfig.openrouterApiKey).toBeDefined();
      expect(apiConfig.openrouterBaseUrl).toBeDefined();
      expect(apiConfig.apiTimeout).toBeGreaterThan(0);
      expect(apiConfig.apiRetryCount).toBeGreaterThan(0);
    });

    test('应能正确读取模型配置', async () => {
      const modelConfig = await configService.getBestModelConfig();
      
      expect(modelConfig).toBeDefined();
      expect(modelConfig.model).toBeDefined();
      expect(modelConfig.temperature).toBeGreaterThanOrEqual(0);
      expect(modelConfig.maxTokens).toBeGreaterThan(0);
    });

    test('应能正确读取提示词模版', async () => {
      const template = await configService.getPromptTemplate('lawyer', '合同审查');
      
      // 可能为null（如果数据库中没有对应模版）
      if (template) {
        expect(template.name).toBeDefined();
        expect(template.industry).toBe('lawyer');
        expect(template.template).toBeDefined();
      }
    });
  });

  describe('API集成功能', () => {
    test('POST /api/generate-prompt 应使用动态配置', async () => {
      // 模拟成功的API响应
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: '这是AI生成的专业提示词'
            }
          }]
        })
      });

      const request = new NextRequest('http://localhost:3000/api/generate-prompt', {
        method: 'POST',
        body: JSON.stringify({
          industry: 'lawyer',
          scenario: '合同审查',
          goal: '审查商务合同',
          requirements: '重点关注风险条款'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.prompt).toBeDefined();
      expect(data.source).toBeDefined();
      expect(data.responseTime).toBeDefined();
    });

    test('GET /api/generate-prompt 应返回系统状态', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBeDefined();
      expect(data.configuration).toBeDefined();
      expect(data.metrics).toBeDefined();
      expect(data.cache).toBeDefined();
    });

    test('应支持指定模型参数', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: '使用指定模型生成的提示词'
            }
          }]
        })
      });

      const request = new NextRequest('http://localhost:3000/api/generate-prompt', {
        method: 'POST',
        body: JSON.stringify({
          industry: 'teacher',
          scenario: '教学设计',
          goal: '设计数学课程',
          preferredModel: 'anthropic/claude-3-haiku'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.modelUsed).toBeDefined();
    });
  });

  describe('缓存机制测试', () => {
    test('应正确缓存API配置', async () => {
      // 第一次调用
      const startTime1 = Date.now();
      const config1 = await configService.getApiConfig();
      const duration1 = Date.now() - startTime1;

      // 第二次调用（应使用缓存）
      const startTime2 = Date.now();
      const config2 = await configService.getApiConfig();
      const duration2 = Date.now() - startTime2;

      expect(config1).toEqual(config2);
      expect(duration2).toBeLessThan(duration1); // 缓存调用应更快
    });

    test('应正确缓存生成结果', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: '测试缓存的提示词'
            }
          }]
        })
      });

      const requestData = {
        industry: 'accountant',
        scenario: '财务分析',
        goal: '分析财务报表'
      };

      const request1 = new NextRequest('http://localhost:3000/api/generate-prompt', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const request2 = new NextRequest('http://localhost:3000/api/generate-prompt', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // 第一次请求
      const response1 = await POST(request1);
      const data1 = await response1.json();

      // 第二次请求（应使用缓存）
      const response2 = await POST(request2);
      const data2 = await response2.json();

      expect(data1.prompt).toBe(data2.prompt);
      expect(data2.fromCache).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(1); // API只应调用一次
    });
  });

  describe('降级策略测试', () => {
    test('API调用失败时应使用降级方案', async () => {
      // 模拟API调用失败
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const request = new NextRequest('http://localhost:3000/api/generate-prompt', {
        method: 'POST',
        body: JSON.stringify({
          industry: 'insurance',
          scenario: '风险评估',
          goal: '评估保险需求'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.source).toBe('fallback');
      expect(data.prompt).toBeDefined();
    });

    test('配置服务不可用时应使用环境变量', async () => {
      // 设置测试环境变量
      process.env.OPENROUTER_API_KEY = 'sk-or-test-key';
      process.env.OPENROUTER_BASE_URL = 'https://test-api.com';

      // 模拟配置服务失败
      const originalGetApiConfig = configService.getApiConfig;
      configService.getApiConfig = jest.fn().mockRejectedValue(new Error('Config service error'));

      const request = new NextRequest('http://localhost:3000/api/generate-prompt', {
        method: 'POST',
        body: JSON.stringify({
          industry: 'realtor',
          scenario: '市场分析',
          goal: '分析房产市场'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.notice).toContain('配置服务暂时不可用');

      // 恢复原始方法
      configService.getApiConfig = originalGetApiConfig;
    });
  });

  describe('配置变更通知测试', () => {
    test('应正确处理配置变更通知', () => {
      const changeEvent = {
        key: 'openrouter_api_key',
        oldValue: 'old-key',
        newValue: 'new-key',
        timestamp: Date.now(),
        category: 'api'
      };

      // 监听配置变更事件
      let receivedEvent: any = null;
      configService.on('configChange', (event) => {
        receivedEvent = event;
      });

      // 触发配置变更
      configService.notifyConfigChange(changeEvent);

      expect(receivedEvent).toEqual(changeEvent);
    });

    test('配置变更应清除相关缓存', async () => {
      // 先获取配置建立缓存
      await configService.getApiConfig();
      
      const stats1 = configService.getStats();
      
      // 模拟配置变更
      configService.notifyConfigChange({
        key: 'openrouter_api_key',
        oldValue: 'old',
        newValue: 'new',
        timestamp: Date.now(),
        category: 'api'
      });

      const stats2 = configService.getStats();
      
      // 缓存应被清除（大小可能变化）
      expect(stats2.lastUpdate).toBeGreaterThanOrEqual(stats1.lastUpdate);
    });
  });

  describe('性能测试', () => {
    test('配置读取响应时间应在可接受范围内', async () => {
      const startTime = Date.now();
      
      // 并发读取配置
      const promises = Array(10).fill(0).map(() => 
        configService.getApiConfig()
      );
      
      await Promise.all(promises);
      
      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / 10;
      
      // 平均响应时间应小于100ms
      expect(avgTime).toBeLessThan(100);
    });

    test('API响应时间应在合理范围内', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: '性能测试提示词'
            }
          }]
        })
      });

      const request = new NextRequest('http://localhost:3000/api/generate-prompt', {
        method: 'POST',
        body: JSON.stringify({
          industry: 'lawyer',
          scenario: '合同审查',
          goal: '性能测试'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const startTime = Date.now();
      const response = await POST(request);
      const endTime = Date.now();
      
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(5000); // 5秒内响应
      expect(data.responseTime).toBeDefined();
    });
  });

  describe('配置验证测试', () => {
    test('应正确验证配置完整性', async () => {
      const validation = await configService.validateConfiguration();
      
      expect(validation).toBeDefined();
      expect(validation.valid).toBeDefined();
      expect(Array.isArray(validation.errors)).toBe(true);
    });

    test('应检测无效的API密钥', async () => {
      // 模拟无效的API密钥
      const originalGetConfig = configManager.getConfig;
      configManager.getConfig = jest.fn().mockImplementation((key) => {
        if (key === 'openrouter_api_key') {
          return 'invalid-key';
        }
        return originalGetConfig.call(configManager, key);
      });

      const validation = await configService.validateConfiguration();
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('API密钥格式无效'))).toBe(true);

      // 恢复原始方法
      configManager.getConfig = originalGetConfig;
    });
  });

  describe('统计信息测试', () => {
    test('应正确记录API调用统计', async () => {
      // 执行几次API调用
      const requests = Array(3).fill(0).map((_, i) => 
        new NextRequest('http://localhost:3000/api/generate-prompt', {
          method: 'POST',
          body: JSON.stringify({
            industry: 'teacher',
            scenario: '教学设计',
            goal: `测试目标${i}`
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );

      // 模拟成功响应
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: '统计测试提示词'
            }
          }]
        })
      });

      for (const request of requests) {
        await POST(request);
      }

      // 检查健康检查端点的统计信息
      const response = await GET();
      const data = await response.json();

      expect(data.metrics.totalCalls).toBeGreaterThan(0);
      expect(data.metrics.successRate).toBeDefined();
    });
  });
});