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
    
    // 添加系统提示（如果有）
    if (options.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt
      });
    }
    
    // 添加用户消息
    messages.push({
      role: 'user',
      content: prompt
    });
    
    const requestBody = {
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2000,
      top_p: options.topP ?? 1,
      stream: options.stream ?? false,
      stop: options.stop
    };
    
    let lastError: Error | null = null;
    
    // 重试逻辑
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        
        const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': this.config.siteUrl,
            'X-Title': this.config.siteName
          },
          body: JSON.stringify(requestBody),
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
        
        if (!data.choices || data.choices.length === 0) {
          throw new Error('API返回了空响应');
        }
        
        const content = data.choices[0].message?.content || '';
        
        if (this.config.debug) {
          console.log('[OpenRouter] 生成成功:', {
            model: data.model,
            usage: data.usage,
            responseTime: `${Date.now() - startTime}ms`
          });
        }
        
        return {
          content,
          model: data.model || model,
          usage: data.usage,
          cost: data.usage?.total_cost,
          provider: data.provider,
          id: data.id
        };
        
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
      const response = await fetch(`${this.config.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`获取模型列表失败: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data || [];
      
    } catch (error: any) {
      console.error('[OpenRouter] 获取模型列表失败:', error);
      return [];
    }
  }
  
  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ connected: boolean; responseTime: number; timestamp: string }> {
    const startTime = Date.now();
    
    try {
      const models = await this.getModels();
      
      return {
        connected: models.length > 0,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        connected: false,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
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
 * 创建OpenRouter客户端实例
 */
export function createOpenRouterClient(config?: Partial<OpenRouterConfig>): OpenRouterClient {
  const apiKey = config?.apiKey || 
    process.env.OPENROUTER_API_KEY || 
    process.env.ANTHROPIC_API_KEY || // 兼容您提供的密钥
    'sk-ant-oat01-ee0f35df8f630aae92f9a6561dd9be32edfe84a1e5f0f6e4636923a0e7ad5aca';
  
  return new OpenRouterClient({
    apiKey,
    ...config
  });
}

// 推荐的模型列表（按性价比排序）
export const RECOMMENDED_MODELS = [
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    description: '快速、经济的选择',
    costPer1MTokens: 0.25
  },
  {
    id: 'anthropic/claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    description: '平衡性能和成本',
    costPer1MTokens: 3
  },
  {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: '经典选择，速度快',
    costPer1MTokens: 0.5
  },
  {
    id: 'openai/gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: '最强大但较贵',
    costPer1MTokens: 10
  },
  {
    id: 'google/gemini-pro',
    name: 'Gemini Pro',
    description: 'Google的先进模型',
    costPer1MTokens: 0.125
  },
  {
    id: 'meta-llama/llama-3-70b-instruct',
    name: 'Llama 3 70B',
    description: '开源强大模型',
    costPer1MTokens: 0.7
  }
];

export default OpenRouterClient;