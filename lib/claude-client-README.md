# Claude API 客户端使用文档

## 概述

这是一个企业级的 Claude API 客户端实现，专为 AI Prompt Generator 项目设计。它提供了完整的类型安全、错误处理、重试机制和速率限制功能。

## 核心特性

- ✅ **TypeScript 类型安全** - 完整的类型定义和智能提示
- ✅ **自动重试机制** - 指数退避策略，自动处理临时故障
- ✅ **请求速率限制** - 内置令牌桶算法，防止超出API限额
- ✅ **完整错误处理** - 分类错误处理和用户友好的错误消息
- ✅ **请求/响应拦截** - 统一的请求头和响应处理
- ✅ **详细日志记录** - 支持调试模式和性能监控
- ✅ **超时控制** - 可配置的请求超时时间
- ✅ **健康检查** - API服务状态监控

## 安装和配置

### 1. 导入客户端

```typescript
import { 
  createClaudeClient, 
  ClaudeClient,
  ClaudeClientConfig,
  ClaudeApiError,
  ClaudeErrorType
} from './lib/claude-client';
```

### 2. 创建客户端实例

#### 使用默认配置

```typescript
const client = createClaudeClient();
```

#### 使用自定义配置

```typescript
const customConfig: ClaudeClientConfig = {
  apiKey: 'sk-ant-oat01-your-api-key-here',
  baseUrl: 'https://gaccode.com/claudecode',
  timeout: 30000,           // 30秒超时
  maxRetries: 3,           // 最多重试3次
  retryDelayMs: 1000,      // 重试基础延迟1秒
  debug: true,             // 启用调试日志
  rateLimitPerMinute: 50,  // 每分钟最多50个请求
  userAgent: 'MyApp/1.0.0' // 自定义用户代理
};

const client = new ClaudeClient(customConfig);
```

## 基本使用方法

### 1. 生成简单提示词

```typescript
async function generateSimplePrompt() {
  try {
    const result = await client.generatePrompt(
      '请帮我创建一个房地产销售的专业话术'
    );
    
    console.log('生成的内容：', result.content);
    console.log('使用Token数：', result.metadata.usage.totalTokens);
    console.log('响应时间：', result.metadata.responseTimeMs, 'ms');
    
  } catch (error) {
    if (error instanceof ClaudeApiError) {
      console.error('生成失败：', error.getUserFriendlyMessage());
    }
  }
}
```

### 2. 带上下文的生成

```typescript
async function generateWithContext() {
  const context = {
    industry: '房地产',
    target_audience: '首次购房者',
    tone: '专业且友好',
    length: '500-800字'
  };
  
  const result = await client.generatePrompt(
    '基于上下文信息，生成销售话术模板',
    context
  );
  
  return result;
}
```

### 3. 高级参数配置

```typescript
import { GeneratePromptRequest } from './lib/claude-client';

async function advancedGeneration() {
  const request: GeneratePromptRequest = {
    prompt: '创建专业的保险销售话术',
    context: {
      product_type: '人寿保险',
      client_age: '25-45岁'
    },
    model: 'claude-3-sonnet-20240229',
    maxTokens: 2048,
    temperature: 0.5,
    systemPrompt: '你是一个专业的保险销售顾问'
  };
  
  const result = await client.generatePromptAdvanced(request);
  return result;
}
```

## 错误处理

### 错误类型

```typescript
enum ClaudeErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',           // 网络连接错误
  INVALID_API_KEY = 'INVALID_API_KEY',       // API密钥无效
  INVALID_REQUEST = 'INVALID_REQUEST',       // 请求格式错误
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED', // 速率限制
  SERVER_ERROR = 'SERVER_ERROR',             // 服务器错误
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',           // 请求超时
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'            // 未知错误
}
```

### 完整错误处理示例

```typescript
async function handleErrors() {
  try {
    const result = await client.generatePrompt('测试提示词');
    return result;
    
  } catch (error) {
    if (error instanceof ClaudeApiError) {
      // 根据错误类型进行不同的处理
      switch (error.type) {
        case ClaudeErrorType.INVALID_API_KEY:
          console.error('❌ API密钥无效，请检查配置');
          // 可能需要重新获取API密钥
          break;
          
        case ClaudeErrorType.RATE_LIMIT_EXCEEDED:
          console.error('⏱️ 请求频率过高，稍后再试');
          // 可以实现更智能的退避策略
          break;
          
        case ClaudeErrorType.TIMEOUT_ERROR:
          console.error('⏰ 请求超时，可能需要增加timeout配置');
          break;
          
        case ClaudeErrorType.NETWORK_ERROR:
          console.error('🌐 网络连接失败，请检查网络状态');
          break;
          
        default:
          console.error('💥 其他错误：', error.getUserFriendlyMessage());
      }
      
      // 记录详细错误信息用于调试
      console.debug('错误详情：', {
        type: error.type,
        statusCode: error.statusCode,
        requestId: error.requestId,
        message: error.message
      });
    } else {
      console.error('未知错误：', error);
    }
  }
}
```

## 健康检查和监控

```typescript
async function monitorApiHealth() {
  try {
    const health = await client.healthCheck();
    
    console.log('API健康状态：', health.status);
    console.log('客户端版本：', health.version);
    console.log('配置信息：', health.config);
    
    if (health.status === 'healthy') {
      console.log('✅ Claude API 服务正常');
    } else {
      console.log('❌ Claude API 服务异常，请检查');
    }
    
  } catch (error) {
    console.error('健康检查失败：', error);
  }
}
```

## 批量处理

```typescript
async function batchProcessing() {
  const prompts = [
    '律师咨询话术',
    '房地产销售文案', 
    '保险产品推销',
    '教师培训大纲',
    '会计服务脚本'
  ];
  
  // 顺序处理，自动遵守速率限制
  for (const [index, prompt] of prompts.entries()) {
    try {
      console.log(`处理第 ${index + 1} 个...`);
      
      const result = await client.generatePrompt(prompt);
      
      console.log(`✅ 成功 - 长度: ${result.content.length}字符`);
      
      // 客户端内置了速率限制，这里的延迟是可选的
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ 第 ${index + 1} 个失败:`, error);
    }
  }
}
```

## 与现有系统集成

```typescript
// 在您的服务层中使用
class PromptService {
  private claudeClient: ClaudeClient;
  
  constructor() {
    this.claudeClient = createClaudeClient({
      debug: process.env.NODE_ENV === 'development',
      timeout: 45000, // 45秒，适合复杂的生成任务
    });
  }
  
  async generateIndustryPrompt(
    industry: string, 
    scenario: string, 
    requirements: any
  ): Promise<string> {
    const prompt = `
为${industry}行业的${scenario}场景创建专业模板。

要求：
${Object.entries(requirements)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n')}
    `.trim();
    
    const result = await this.claudeClient.generatePrompt(
      prompt,
      {
        industry,
        scenario,
        requirements,
        timestamp: new Date().toISOString()
      }
    );
    
    return result.content;
  }
}
```

## 性能优化建议

### 1. 合理配置速率限制

```typescript
// 根据您的API配额调整
const client = createClaudeClient({
  rateLimitPerMinute: 30, // 如果您的配额较低
});
```

### 2. 适当的超时时间

```typescript
const client = createClaudeClient({
  timeout: 60000, // 复杂任务可能需要更长时间
});
```

### 3. 启用调试模式进行优化

```typescript
const client = createClaudeClient({
  debug: true, // 监控响应时间和Token使用
});
```

### 4. 缓存常用结果

```typescript
class CachedPromptService {
  private cache = new Map<string, GeneratePromptResponse>();
  private client = createClaudeClient();
  
  async generateWithCache(prompt: string): Promise<string> {
    const cacheKey = this.hashPrompt(prompt);
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!.content;
    }
    
    const result = await this.client.generatePrompt(prompt);
    this.cache.set(cacheKey, result);
    
    return result.content;
  }
  
  private hashPrompt(prompt: string): string {
    // 实现提示词哈希
    return btoa(prompt).slice(0, 20);
  }
}
```

## 故障排除

### 常见问题

1. **API密钥无效**
   ```
   错误: ClaudeApiError: API密钥无效
   解决: 检查配置中的apiKey是否正确
   ```

2. **请求超时**
   ```
   错误: ClaudeApiError: 请求超时
   解决: 增加timeout配置或检查网络状态
   ```

3. **速率限制**
   ```
   错误: ClaudeApiError: 请求频率过高
   解决: 降低rateLimitPerMinute配置或等待重试
   ```

### 调试技巧

1. **启用调试日志**
   ```typescript
   const client = createClaudeClient({ debug: true });
   ```

2. **监控请求详情**
   ```typescript
   try {
     const result = await client.generatePrompt(prompt);
     console.log('请求成功:', result.metadata);
   } catch (error) {
     console.log('请求ID:', error.requestId);
     console.log('状态码:', error.statusCode);
   }
   ```

## API参考

### ClaudeClientConfig

```typescript
interface ClaudeClientConfig {
  apiKey: string;                    // 必需：API密钥
  baseUrl: string;                   // 必需：API基础URL
  timeout?: number;                  // 可选：超时时间（毫秒）
  maxRetries?: number;               // 可选：最大重试次数
  retryDelayMs?: number;             // 可选：重试延迟基数
  debug?: boolean;                   // 可选：调试模式
  rateLimitPerMinute?: number;       // 可选：每分钟请求限制
  userAgent?: string;                // 可选：用户代理字符串
}
```

### GeneratePromptResponse

```typescript
interface GeneratePromptResponse {
  content: string;                   // 生成的内容
  metadata: {
    requestId: string;               // 请求ID
    model: string;                   // 使用的模型
    usage: {
      inputTokens: number;           // 输入Token数
      outputTokens: number;          // 输出Token数
      totalTokens: number;           // 总Token数
    };
    responseTimeMs: number;          // 响应时间
  };
}
```

## 最佳实践

1. **始终使用错误处理** - 永远不要忽略可能的API错误
2. **合理配置重试** - 根据业务需求调整重试策略
3. **监控使用量** - 跟踪Token使用和响应时间
4. **缓存结果** - 对于相似的请求考虑缓存
5. **分批处理** - 大量请求时使用批处理避免速率限制
6. **记录请求** - 保存重要的请求ID用于问题追踪

---

**版本**: 1.0.0  
**维护者**: AI Prompt Generator Team  
**最后更新**: 2025-01-10