/**
 * OpenRouter API客户端
 * 集成多个大模型的统一API平台
 * 文档：https://openrouter.ai/docs
 */

interface OpenRouterConfig {
  apiKey: string;
  baseUrl?: string;
  siteUrl?: string;
  siteName?: string;
  defaultModel?: string;
  maxRetries?: number;
  timeout?: number;
  debug?: boolean;
}

interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
  stop?: string[];
  systemPrompt?: string;
}

interface GenerateResult {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost?: number;
  provider?: string;
  id?: string;
}

export class OpenRouterClient {
  private config: Required<OpenRouterConfig>;
  
  constructor(config: OpenRouterConfig) {
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://openrouter.ai/api/v1',
      siteUrl: config.siteUrl || 'https://www.aiprompts.ink',
      siteName: config.siteName || 'AI Prompt Generator',
      defaultModel: config.defaultModel || 'anthropic/claude-3-sonnet',
      maxRetries: config.maxRetries || 3,
      timeout: config.timeout || 30000,
      debug: config.debug || false
    };
    
    if (!this.config.apiKey || !this.config.apiKey.startsWith('sk-')) {
      throw new Error('无效的OpenRouter API密钥');
    }
  }
  
  /**
   * 生成文本内容
   */
  async generate(prompt: string, options: GenerateOptions = {}): Promise<GenerateResult> {
    const model = options.model || this.config.defaultModel;
    const startTime = Date.now();
    
    if (this.config.debug) {
      console.log('[OpenRouter] 生成请求:', { model, promptLength: prompt.length });
    }
    
    const messages = [];
    
    // 只添加用户消息，系统提示作为顶级参数
    messages.push({
      role: 'user',
      content: prompt
    });
    
    // OpenRouter API正确格式
    const requestBody: any = {
      model: model || 'anthropic/claude-3-haiku', // 默认使用Claude Haiku
      messages,
      max_tokens: options.maxTokens ?? 2000,
      temperature: options.temperature ?? 0.7,
      stream: options.stream ?? false,
      // 启用使用统计
      usage: {
        include: true
      }
    };
    
    // OpenRouter支持系统提示作为消息
    if (options.systemPrompt) {
      messages.unshift({
        role: 'system',
        content: options.systemPrompt
      });
    }
    
    let lastError: Error | null = null;
    
    // 重试逻辑
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        
        // 根据baseURL调整认证方式和API格式
        const isGaccodeProxy = this.config.baseUrl.includes('gaccode.com');
        let apiUrl: string;
        let requestPayload: any;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (isGaccodeProxy) {
          // gaccode代理使用Anthropic API格式
          headers['x-api-key'] = this.config.apiKey;
          headers['anthropic-version'] = '2023-06-01';
          apiUrl = `${this.config.baseUrl}/v1/messages`;
          
          // 转换为Anthropic API格式
          // gaccode代理可能期望的模型名称格式
          let claudeModel = model.replace('anthropic/', '');
          if (claudeModel.includes('claude-3-haiku')) {
            claudeModel = 'claude-3-haiku-20240307';
          } else if (claudeModel.includes('claude-3-sonnet')) {
            claudeModel = 'claude-3-sonnet-20240229';
          } else if (claudeModel.includes('claude-3-opus')) {
            claudeModel = 'claude-3-opus-20240229';
          } else {
            claudeModel = 'claude-3-haiku-20240307'; // 默认使用Haiku
          }
          
          requestPayload = {
            model: claudeModel,
            max_tokens: options.maxTokens ?? 2000,
            temperature: options.temperature ?? 0.7,
            messages: messages.filter(m => m.role !== 'system'),
            ...(options.systemPrompt && { system: options.systemPrompt })
          };
        } else {
          // 标准OpenRouter使用OpenAI格式
          headers['Authorization'] = `Bearer ${this.config.apiKey}`;
          headers['HTTP-Referer'] = this.config.siteUrl || 'https://www.aiprompts.ink';
          headers['X-Title'] = this.config.siteName || 'AI Prompt Generator';
          headers['User-Agent'] = 'AI-Prompt-Generator/1.0';
          apiUrl = `${this.config.baseUrl}/chat/completions`;
          requestPayload = requestBody;
        }
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestPayload),
          signal: controller.signal
        }).finally(() => clearTimeout(timeoutId));
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
          
          if (response.status === 429) {
            // 速率限制，等待后重试
            const retryAfter = parseInt(response.headers.get('retry-after') || '5');
            if (this.config.debug) {
              console.log(`[OpenRouter] 速率限制，${retryAfter}秒后重试...`);
            }
            await this.sleep(retryAfter * 1000);
            continue;
          }
          
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        // 根据API类型解析响应
        let content: string;
        let usage: any;
        let cost = 0;
        
        if (isGaccodeProxy) {
          // Anthropic API响应格式
          if (!data.content || data.content.length === 0) {
            console.error('[OpenRouter] Anthropic API无效响应:', data);
            throw new Error('API返回了空响应');
          }
          
          content = data.content[0]?.text || '';
          usage = data.usage ? {
            total_tokens: data.usage.input_tokens + data.usage.output_tokens,
            prompt_tokens: data.usage.input_tokens,
            completion_tokens: data.usage.output_tokens
          } : undefined;
        } else {
          // OpenRouter/OpenAI响应格式
          if (!data.choices || data.choices.length === 0) {
            console.error('[OpenRouter] OpenAI API无效响应:', data);
            throw new Error('API返回了空响应');
          }
          
          content = data.choices[0]?.message?.content || '';
          usage = data.usage;
          cost = data.usage?.cost || 0;
        }
        
        if (!content.trim()) {
          console.error('[OpenRouter] 空内容响应:', data);
          throw new Error('API返回了空内容');
        }
        
        if (this.config.debug) {
          console.log('[OpenRouter] 生成成功:', {
            model: data.model,
            usage: data.usage,
            responseTime: `${Date.now() - startTime}ms`
          });
        }
        
        // 适配响应格式
        const result = {
          content,
          model: data.model || model,
          usage,
          cost,
          provider: isGaccodeProxy ? 'anthropic-proxy' : 'openrouter',
          id: data.id
        };
        
        if (this.config.debug) {
          console.log('[OpenRouter] 最终结果:', result);
        }
        
        return result;
        
      } catch (error: any) {
        lastError = error;
        
        if (error.name === 'AbortError') {
          lastError = new Error('请求超时');
        }
        
        if (this.config.debug) {
          console.error(`[OpenRouter] 尝试 ${attempt}/${this.config.maxRetries} 失败:`, error.message);
        }
        
        // 如果不是最后一次尝试，等待后重试
        if (attempt < this.config.maxRetries) {
          await this.sleep(Math.pow(2, attempt) * 1000); // 指数退避
        }
      }
    }
    
    throw lastError || new Error('生成失败');
  }
  
  /**
   * 获取可用模型列表
   */
  async getModels(): Promise<any[]> {
    try {
      const isGaccodeProxy = this.config.baseUrl.includes('gaccode.com');
      
      // gaccode代理可能不支持models端点，直接返回推荐模型
      if (isGaccodeProxy) {
        if (this.config.debug) {
          console.log('[OpenRouter] 使用gaccode代理，返回预定义模型列表');
        }
        return RECOMMENDED_MODELS;
      }
      
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'User-Agent': 'AI-Prompt-Generator/1.0'
      };
      
      const response = await fetch(`${this.config.baseUrl}/models`, {
        headers,
        timeout: 10000 // 10秒超时
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`获取模型列表失败 [${response.status}]: ${errorText}`);
      }
      
      const data = await response.json();
      const models = data.data || data || [];
      
      if (this.config.debug) {
        console.log(`[OpenRouter] 获取到 ${models.length} 个模型`);
      }
      
      return models;
      
    } catch (error: any) {
      console.error('[OpenRouter] 获取模型列表失败:', error);
      // 返回推荐模型作为备选
      return RECOMMENDED_MODELS;
    }
  }
  
  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ connected: boolean; responseTime: number; timestamp: string; details?: any }> {
    const startTime = Date.now();
    
    try {
      // 根据代理类型调整健康检查方式
      const isGaccodeProxy = this.config.baseUrl.includes('gaccode.com');
      let testResponse: Response;
      
      if (isGaccodeProxy) {
        // gaccode代理：尝试简单的聊天completions测试
        const testPayload = {
          model: 'anthropic/claude-3-haiku',
          messages: [{role: 'user', content: 'test'}],
          max_tokens: 1
        };
        
        testResponse = await fetch(`${this.config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.config.apiKey
          },
          body: JSON.stringify(testPayload),
          signal: AbortSignal.timeout(8000) // 8秒超时
        });
      } else {
        // 标准OpenRouter：使用models端点
        testResponse = await fetch(`${this.config.baseUrl}/models`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'User-Agent': 'AI-Prompt-Generator/1.0'
          },
          signal: AbortSignal.timeout(5000) // 5秒超时
        });
      }
      
      const responseTime = Date.now() - startTime;
      const connected = testResponse.ok;
      
      let details: any = {
        status: testResponse.status,
        statusText: testResponse.statusText
      };
      
      if (connected) {
        try {
          const data = await testResponse.json();
          details.modelsCount = data.data?.length || data?.length || 0;
        } catch (e) {
          details.parseError = 'Could not parse response';
        }
      } else {
        details.errorBody = await testResponse.text().catch(() => 'No error body');
      }
      
      return {
        connected,
        responseTime,
        timestamp: new Date().toISOString(),
        details
      };
      
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      return {
        connected: false,
        responseTime,
        timestamp: new Date().toISOString(),
        details: {
          error: error.message,
          name: error.name
        }
      };
    }
  }
  
  /**
   * 睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 创建OpenRouter客户端实例 - 修复：处理Claude Code专用密钥
 */
export function createOpenRouterClient(config?: Partial<OpenRouterConfig>): OpenRouterClient {
  const apiKey = config?.apiKey || process.env.OPENROUTER_API_KEY || '';
  
  // 检查是否为Claude Code专用密钥
  const isClaudeCodeKey = apiKey.startsWith('sk-ant-oat01-');
  
  let baseUrl: string;
  let defaultModel: string;
  
  if (isClaudeCodeKey && process.env.OPENROUTER_BASE_URL?.includes('gaccode.com')) {
    // Claude Code专用密钥不能用于直接API调用
    console.warn('[OpenRouter] 警告：检测到Claude Code专用密钥，但它不能用于直接API调用');
    console.warn('[OpenRouter] 建议：使用标准OpenRouter API密钥或其他兼容的API服务');
    
    // 回退到模拟模式或抛出错误
    throw new Error('Claude Code专用API密钥不能用于Web应用程序。请使用标准的OpenRouter API密钥。');
  } else {
    baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    defaultModel = 'anthropic/claude-3-haiku';
  }
  
  console.log('[OpenRouter] 初始化客户端:', {
    baseUrl,
    hasApiKey: !!apiKey,
    keyType: isClaudeCodeKey ? 'Claude Code专用' : '标准API',
    apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'N/A'
  });
  
  return new OpenRouterClient({
    apiKey,
    baseUrl,
    defaultModel,
    ...config
  });
}

// 推荐的模型列表（按性价比排序，支持代理API）
export const RECOMMENDED_MODELS = [
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    description: '快速、经济的选择，支持代理',
    costPer1MTokens: 0.25
  },
  {
    id: 'anthropic/claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    description: '平衡性能和成本，支持代理',
    costPer1MTokens: 3
  },
  {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    description: '最强大的Claude模型',
    costPer1MTokens: 15
  },
  {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: '经典选择，速度快',
    costPer1MTokens: 0.5
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    description: '最新GPT-4版本',
    costPer1MTokens: 5
  },
  {
    id: 'meta-llama/llama-3-70b-instruct',
    name: 'Llama 3 70B',
    description: '开源强大模型',
    costPer1MTokens: 0.7
  }
];

export default OpenRouterClient;