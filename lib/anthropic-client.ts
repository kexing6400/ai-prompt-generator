/**
 * Anthropic Claude API直接客户端
 * 使用您的Anthropic API密钥直接访问Claude模型
 * 兼容现有的OpenRouter接口设计
 */

interface AnthropicConfig {
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

// Claude模型映射配置 - 使用正确的模型名称
const CLAUDE_MODEL_MAP: Record<string, string> = {
  'anthropic/claude-3-haiku': 'claude-3-5-haiku-20241022',
  'anthropic/claude-3-sonnet': 'claude-3-5-sonnet-20241022', 
  'anthropic/claude-3-opus': 'claude-3-opus-20240229',
  // Fallback到可用模型
  'google/gemini-pro': 'claude-3-5-haiku-20241022',
  'openai/gpt-3.5-turbo': 'claude-3-5-haiku-20241022',
  'openai/gpt-4-turbo': 'claude-3-5-sonnet-20241022',
  'meta-llama/llama-3-8b-instruct': 'claude-3-5-haiku-20241022',
  'mistral/mistral-medium': 'claude-3-5-sonnet-20241022',
  'google/gemini-pro-1.5': 'claude-3-5-sonnet-20241022'
};

// 模型成本配置（每100万token的美元价格）
const CLAUDE_MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'claude-3-5-haiku-20241022': { input: 0.25, output: 1.25 },
  'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
  'claude-3-opus-20240229': { input: 15, output: 75 }
};

export class AnthropicClient {
  private config: Required<AnthropicConfig>;
  
  constructor(config: AnthropicConfig) {
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://api.anthropic.com',
      siteUrl: config.siteUrl || 'https://www.aiprompts.ink',
      siteName: config.siteName || 'AI Prompt Generator',
      defaultModel: config.defaultModel || 'claude-3-5-haiku-20241022',
      maxRetries: config.maxRetries || 3,
      timeout: config.timeout || 30000,
      debug: config.debug || false
    };
    
    if (!this.config.apiKey || !this.config.apiKey.startsWith('sk-')) {
      throw new Error('无效的Anthropic API密钥');
    }
  }
  
  /**
   * 生成文本内容（兼容OpenRouter接口）
   */
  async generate(prompt: string, options: GenerateOptions = {}): Promise<GenerateResult> {
    const startTime = Date.now();
    
    // 将OpenRouter模型名称映射到Claude模型
    const requestedModel = options.model || this.config.defaultModel;
    const claudeModel = CLAUDE_MODEL_MAP[requestedModel] || 
                       CLAUDE_MODEL_MAP['anthropic/claude-3-haiku'] ||
                       'claude-3-5-haiku-20241022';
    
    if (this.config.debug) {
      console.log('[Anthropic] 生成请求:', { 
        requestedModel, 
        claudeModel, 
        promptLength: prompt.length 
      });
    }
    
    const messages = [];
    
    // 添加用户消息
    messages.push({
      role: 'user',
      content: prompt
    });
    
    const requestBody = {
      model: claudeModel,
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.7,
      top_p: options.topP || 1,
      messages,
      ...(options.systemPrompt && { system: options.systemPrompt })
    };
    
    let lastError: Error | null = null;
    
    // 重试逻辑
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        
        const response = await fetch(`${this.config.baseUrl}/v1/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
            'x-api-key': this.config.apiKey,
            'anthropic-version': '2023-06-01',
            'User-Agent': this.config.siteName
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        }).finally(() => clearTimeout(timeoutId));
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || 
                             errorData.message || 
                             `HTTP ${response.status}: ${response.statusText}`;
          
          if (response.status === 429) {
            // 速率限制，等待后重试
            const retryAfter = parseInt(response.headers.get('retry-after') || '5');
            if (this.config.debug) {
              console.log(`[Anthropic] 速率限制，${retryAfter}秒后重试...`);
            }
            await this.sleep(retryAfter * 1000);
            continue;
          }
          
          throw new Error(`Anthropic API错误: ${errorMessage}`);
        }
        
        const data = await response.json();
        
        if (!data.content || data.content.length === 0) {
          throw new Error('Claude API返回了空响应');
        }
        
        const content = data.content[0].text || '';
        
        // 计算token使用量
        const usage = {
          prompt_tokens: data.usage?.input_tokens || Math.ceil(prompt.length / 4),
          completion_tokens: data.usage?.output_tokens || Math.ceil(content.length / 4),
          total_tokens: (data.usage?.input_tokens || Math.ceil(prompt.length / 4)) + 
                       (data.usage?.output_tokens || Math.ceil(content.length / 4))
        };
        
        // 计算成本
        const modelCosts = CLAUDE_MODEL_COSTS[claudeModel] || CLAUDE_MODEL_COSTS['claude-3-5-haiku-20241022'];
        const cost = (usage.prompt_tokens * modelCosts.input + usage.completion_tokens * modelCosts.output) / 1000000;
        
        if (this.config.debug) {
          console.log('[Anthropic] 生成成功:', {
            model: claudeModel,
            usage,
            cost: cost.toFixed(6),
            responseTime: `${Date.now() - startTime}ms`
          });
        }
        
        return {
          content,
          model: claudeModel,
          usage,
          cost,
          provider: 'anthropic',
          id: data.id
        };
        
      } catch (error: any) {
        lastError = error;
        
        if (error.name === 'AbortError') {
          lastError = new Error('请求超时');
        }
        
        if (this.config.debug) {
          console.error(`[Anthropic] 尝试 ${attempt}/${this.config.maxRetries} 失败:`, error.message);
        }
        
        // 如果不是最后一次尝试，等待后重试
        if (attempt < this.config.maxRetries) {
          await this.sleep(Math.pow(2, attempt) * 1000); // 指数退避
        }
      }
    }
    
    throw lastError || new Error('Claude API生成失败');
  }
  
  /**
   * 获取可用模型列表（模拟OpenRouter接口）
   */
  async getModels(): Promise<any[]> {
    return [
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        description: '快速、经济的Claude模型',
        context_length: 200000,
        pricing: CLAUDE_MODEL_COSTS['claude-3-haiku-20240307']
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        description: '平衡性能与成本的Claude模型',
        context_length: 200000,
        pricing: CLAUDE_MODEL_COSTS['claude-3-sonnet-20240229']
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        description: '最强大的Claude模型',
        context_length: 200000,
        pricing: CLAUDE_MODEL_COSTS['claude-3-opus-20240229']
      }
    ];
  }
  
  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ connected: boolean; responseTime: number; timestamp: string }> {
    const startTime = Date.now();
    
    try {
      // 发送一个简单的测试请求
      const result = await this.generate('测试连接，请回复"连接正常"', {
        model: 'claude-3-haiku-20240307',
        maxTokens: 50
      });
      
      return {
        connected: result.content.length > 0,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[Anthropic] 健康检查失败:', error);
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
 * 创建Anthropic客户端实例
 */
export function createAnthropicClient(config?: Partial<AnthropicConfig>): AnthropicClient {
  const apiKey = config?.apiKey || 
    process.env.ANTHROPIC_API_KEY || 
    'sk-ant-oat01-ee0f35df8f630aae92f9a6561dd9be32edfe84a1e5f0f6e4636923a0e7ad5aca';
  
  return new AnthropicClient({
    apiKey,
    ...config
  });
}

export default AnthropicClient;