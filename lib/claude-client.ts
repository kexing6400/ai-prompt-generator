/**
 * Claude API 客户端 - 生产级别实现
 * 
 * 功能特性：
 * - TypeScript 类型安全
 * - 自动重试机制（指数退避）
 * - 请求速率限制保护
 * - 完整的错误处理体系
 * - 请求/响应拦截器
 * - 详细的日志记录
 * - 超时控制
 * - 请求取消支持
 * 
 * @author AI Prompt Generator Team
 * @version 1.0.0
 */

// ==================== 类型定义 ====================

/**
 * Claude API 配置选项
 */
export interface ClaudeClientConfig {
  /** API 密钥 */
  apiKey: string;
  /** API 基础URL */
  baseUrl: string;
  /** 请求超时时间（毫秒），默认30秒 */
  timeout?: number;
  /** 最大重试次数，默认3次 */
  maxRetries?: number;
  /** 重试延迟基数（毫秒），默认1000ms */
  retryDelayMs?: number;
  /** 是否启用调试日志，默认false */
  debug?: boolean;
  /** 每分钟最大请求数，默认50 */
  rateLimitPerMinute?: number;
  /** 用户代理字符串 */
  userAgent?: string;
}

/**
 * 生成提示词的请求参数
 */
export interface GeneratePromptRequest {
  /** 用户输入的提示词 */
  prompt: string;
  /** 上下文信息（可选） */
  context?: Record<string, any>;
  /** 模型名称，默认 claude-3-sonnet-20240229 */
  model?: string;
  /** 最大输出token数，默认4096 */
  maxTokens?: number;
  /** 温度参数，控制创造性，0.0-1.0，默认0.7 */
  temperature?: number;
  /** 系统提示词（可选） */
  systemPrompt?: string;
  /** 流式响应，默认false */
  stream?: boolean;
}

/**
 * Claude API 响应结构
 */
export interface ClaudeApiResponse {
  /** 响应内容 */
  content: Array<{
    type: 'text';
    text: string;
  }>;
  /** 响应ID */
  id: string;
  /** 模型名称 */
  model: string;
  /** 角色 */
  role: 'assistant';
  /** 停止原因 */
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence';
  /** 停止序列 */
  stop_sequence?: string;
  /** 使用情况统计 */
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * 生成提示词的响应
 */
export interface GeneratePromptResponse {
  /** 生成的提示词内容 */
  content: string;
  /** 响应元数据 */
  metadata: {
    /** 请求ID */
    requestId: string;
    /** 使用的模型 */
    model: string;
    /** Token使用统计 */
    usage: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
    };
    /** 响应时间（毫秒） */
    responseTimeMs: number;
  };
}

// ==================== 错误处理 ====================

/**
 * Claude API 错误类型枚举
 */
enum ClaudeErrorType {
  /** 网络错误 */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** API密钥无效 */
  INVALID_API_KEY = 'INVALID_API_KEY',
  /** 请求格式错误 */
  INVALID_REQUEST = 'INVALID_REQUEST',
  /** 速率限制 */
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  /** 服务器错误 */
  SERVER_ERROR = 'SERVER_ERROR',
  /** 超时错误 */
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  /** 未知错误 */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Claude API 自定义错误类
 */
class ClaudeApiError extends Error {
  public readonly type: ClaudeErrorType;
  public readonly statusCode?: number;
  public readonly response?: any;
  public readonly requestId?: string;

  constructor(
    message: string,
    type: ClaudeErrorType,
    statusCode?: number,
    response?: any,
    requestId?: string
  ) {
    super(message);
    this.name = 'ClaudeApiError';
    this.type = type;
    this.statusCode = statusCode;
    this.response = response;
    this.requestId = requestId;
  }

  /**
   * 获取用户友好的错误消息
   */
  getUserFriendlyMessage(): string {
    switch (this.type) {
      case ClaudeErrorType.INVALID_API_KEY:
        return 'API密钥无效，请检查配置';
      case ClaudeErrorType.RATE_LIMIT_EXCEEDED:
        return '请求频率过高，请稍后再试';
      case ClaudeErrorType.NETWORK_ERROR:
        return '网络连接失败，请检查网络状态';
      case ClaudeErrorType.TIMEOUT_ERROR:
        return '请求超时，请重试';
      case ClaudeErrorType.SERVER_ERROR:
        return 'Claude服务暂时不可用，请稍后重试';
      default:
        return '未知错误，请联系技术支持';
    }
  }
}

// ==================== 速率限制器 ====================

/**
 * 简单的令牌桶速率限制器
 */
class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per millisecond

  constructor(maxRequestsPerMinute: number) {
    this.maxTokens = maxRequestsPerMinute;
    this.tokens = maxRequestsPerMinute;
    this.lastRefill = Date.now();
    this.refillRate = maxRequestsPerMinute / (60 * 1000); // 每毫秒补充的token数
  }

  /**
   * 尝试消费一个token
   */
  async tryConsume(): Promise<boolean> {
    this.refill();
    
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    
    return false;
  }

  /**
   * 等待直到可以消费token
   */
  async waitForToken(): Promise<void> {
    let waitTime = 0;
    
    while (!await this.tryConsume()) {
      waitTime = Math.min(waitTime + 100, 5000); // 最多等5秒
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = Math.floor(timePassed * this.refillRate);
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }
}

// ==================== 重试机制 ====================

/**
 * 重试配置
 */
interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

/**
 * 指数退避重试函数
 */
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig,
  shouldRetry: (error: any) => boolean = () => true
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === config.maxRetries || !shouldRetry(error)) {
        throw error;
      }
      
      // 计算退避延迟
      const delay = Math.min(
        config.baseDelayMs * Math.pow(2, attempt),
        config.maxDelayMs
      );
      
      // 添加随机抖动，避免雷群效应
      const jitter = Math.random() * 0.1 * delay;
      const totalDelay = delay + jitter;
      
      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }
  
  throw lastError;
}

// ==================== 主要客户端类 ====================

/**
 * Claude API 客户端
 */
export class ClaudeClient {
  private readonly config: Required<ClaudeClientConfig>;
  private readonly rateLimiter: RateLimiter;
  private readonly logger: Console;

  constructor(config: ClaudeClientConfig) {
    // 合并默认配置
    this.config = {
      timeout: 30000,
      maxRetries: 3,
      retryDelayMs: 1000,
      debug: false,
      rateLimitPerMinute: 50,
      userAgent: 'AI-Prompt-Generator/1.0.0 Claude-Client',
      ...config,
    };

    this.rateLimiter = new RateLimiter(this.config.rateLimitPerMinute);
    this.logger = console;

    this.validateConfig();
  }

  /**
   * 验证配置
   */
  private validateConfig(): void {
    if (!this.config.apiKey) {
      throw new ClaudeApiError(
        'API密钥不能为空',
        ClaudeErrorType.INVALID_REQUEST
      );
    }

    if (!this.config.baseUrl) {
      throw new ClaudeApiError(
        'API基础URL不能为空',
        ClaudeErrorType.INVALID_REQUEST
      );
    }

    // 验证URL格式
    try {
      new URL(this.config.baseUrl);
    } catch {
      throw new ClaudeApiError(
        'API基础URL格式无效',
        ClaudeErrorType.INVALID_REQUEST
      );
    }
  }

  /**
   * 生成AI提示词
   */
  async generatePrompt(
    prompt: string,
    context?: Record<string, any>
  ): Promise<GeneratePromptResponse> {
    if (!prompt || prompt.trim().length === 0) {
      throw new ClaudeApiError(
        '提示词不能为空',
        ClaudeErrorType.INVALID_REQUEST
      );
    }

    const request: GeneratePromptRequest = {
      prompt: prompt.trim(),
      context,
      model: 'claude-3-sonnet-20240229',
      maxTokens: 4096,
      temperature: 0.7,
    };

    return await this.makeRequest(request);
  }

  /**
   * 高级生成提示词方法，支持更多参数
   */
  async generatePromptAdvanced(
    request: GeneratePromptRequest
  ): Promise<GeneratePromptResponse> {
    if (!request.prompt || request.prompt.trim().length === 0) {
      throw new ClaudeApiError(
        '提示词不能为空',
        ClaudeErrorType.INVALID_REQUEST
      );
    }

    return await this.makeRequest(request);
  }

  /**
   * 发起API请求的核心方法
   */
  private async makeRequest(
    request: GeneratePromptRequest
  ): Promise<GeneratePromptResponse> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      // 速率限制检查
      await this.rateLimiter.waitForToken();

      // 构建Claude API请求体
      const claudeRequest = this.buildClaudeRequest(request);

      if (this.config.debug) {
        this.logger.log(`[Claude Client] 发起请求 ${requestId}:`, claudeRequest);
      }

      // 执行重试请求
      const response = await retryWithBackoff(
        () => this.executeRequest(claudeRequest, requestId),
        {
          maxRetries: this.config.maxRetries,
          baseDelayMs: this.config.retryDelayMs,
          maxDelayMs: 30000,
        },
        (error) => this.shouldRetry(error)
      );

      const responseTimeMs = Date.now() - startTime;

      if (this.config.debug) {
        this.logger.log(`[Claude Client] 请求成功 ${requestId}:`, {
          responseTimeMs,
          usage: response.usage,
        });
      }

      return this.formatResponse(response, requestId, responseTimeMs, request.model || 'claude-3-sonnet-20240229');

    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      
      if (this.config.debug) {
        this.logger.error(`[Claude Client] 请求失败 ${requestId}:`, {
          error: error instanceof Error ? error.message : error,
          responseTimeMs,
        });
      }

      throw this.handleError(error, requestId);
    }
  }

  /**
   * 构建Claude API请求体
   */
  private buildClaudeRequest(request: GeneratePromptRequest): any {
    const messages = [
      {
        role: 'user',
        content: request.prompt,
      },
    ];

    // 如果有上下文，添加到消息中
    if (request.context && Object.keys(request.context).length > 0) {
      const contextString = `上下文信息：\n${JSON.stringify(request.context, null, 2)}\n\n用户请求：${request.prompt}`;
      messages[0].content = contextString;
    }

    const claudeRequest: any = {
      model: request.model || 'claude-3-sonnet-20240229',
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature || 0.7,
      messages,
    };

    // 添加系统提示词
    if (request.systemPrompt) {
      claudeRequest.system = request.systemPrompt;
    }

    // 流式响应支持
    if (request.stream) {
      claudeRequest.stream = true;
    }

    return claudeRequest;
  }

  /**
   * 执行HTTP请求
   */
  private async executeRequest(
    requestBody: any,
    requestId: string
  ): Promise<ClaudeApiResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.timeout
    );

    try {
      const response = await fetch(`${this.config.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'User-Agent': this.config.userAgent,
          'X-Request-ID': requestId,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData: any;
        
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        throw new ClaudeApiError(
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          this.mapHttpStatusToErrorType(response.status),
          response.status,
          errorData,
          requestId
        );
      }

      const responseData: ClaudeApiResponse = await response.json();
      return responseData;

    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ClaudeApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ClaudeApiError(
          '请求超时',
          ClaudeErrorType.TIMEOUT_ERROR,
          undefined,
          undefined,
          requestId
        );
      }

      const errorMessage = error instanceof Error ? error.message : '未知错误';
      throw new ClaudeApiError(
        `网络请求失败: ${errorMessage}`,
        ClaudeErrorType.NETWORK_ERROR,
        undefined,
        error,
        requestId
      );
    }
  }

  /**
   * 格式化响应数据
   */
  private formatResponse(
    response: ClaudeApiResponse,
    requestId: string,
    responseTimeMs: number,
    model: string
  ): GeneratePromptResponse {
    const content = response.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('');

    return {
      content,
      metadata: {
        requestId,
        model,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        responseTimeMs,
      },
    };
  }

  /**
   * 错误处理
   */
  private handleError(error: any, requestId: string): ClaudeApiError {
    if (error instanceof ClaudeApiError) {
      return error;
    }

    return new ClaudeApiError(
      error.message || '未知错误',
      ClaudeErrorType.UNKNOWN_ERROR,
      undefined,
      error,
      requestId
    );
  }

  /**
   * 判断是否应该重试
   */
  private shouldRetry(error: any): boolean {
    if (error instanceof ClaudeApiError) {
      // 这些错误类型不应该重试
      const noRetryTypes = [
        ClaudeErrorType.INVALID_API_KEY,
        ClaudeErrorType.INVALID_REQUEST,
      ];
      
      return !noRetryTypes.includes(error.type);
    }
    
    return true;
  }

  /**
   * HTTP状态码映射到错误类型
   */
  private mapHttpStatusToErrorType(statusCode: number): ClaudeErrorType {
    switch (statusCode) {
      case 401:
        return ClaudeErrorType.INVALID_API_KEY;
      case 400:
        return ClaudeErrorType.INVALID_REQUEST;
      case 429:
        return ClaudeErrorType.RATE_LIMIT_EXCEEDED;
      case 500:
      case 502:
      case 503:
      case 504:
        return ClaudeErrorType.SERVER_ERROR;
      default:
        return ClaudeErrorType.UNKNOWN_ERROR;
    }
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `claude_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取客户端健康状态
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    version: string;
    timestamp: number;
    config: {
      baseUrl: string;
      timeout: number;
      maxRetries: number;
      rateLimitPerMinute: number;
    };
  }> {
    try {
      // 发起一个简单的测试请求
      await this.generatePrompt('健康检查');
      
      return {
        status: 'healthy',
        version: '1.0.0',
        timestamp: Date.now(),
        config: {
          baseUrl: this.config.baseUrl,
          timeout: this.config.timeout,
          maxRetries: this.config.maxRetries,
          rateLimitPerMinute: this.config.rateLimitPerMinute,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        version: '1.0.0',
        timestamp: Date.now(),
        config: {
          baseUrl: this.config.baseUrl,
          timeout: this.config.timeout,
          maxRetries: this.config.maxRetries,
          rateLimitPerMinute: this.config.rateLimitPerMinute,
        },
      };
    }
  }
}

// ==================== 工厂函数和便捷导出 ====================

/**
 * 创建Claude客户端实例的工厂函数
 */
export function createClaudeClient(config?: Partial<ClaudeClientConfig>): ClaudeClient {
  const defaultConfig: ClaudeClientConfig = {
    apiKey: config?.apiKey || 'sk-ant-oat01-ee0f35df8f630aae92f9a6561dd9be32edfe84a1e5f0f6e4636923a0e7ad5aca',
    baseUrl: config?.baseUrl || 'https://gaccode.com/claudecode',
    timeout: 30000,
    maxRetries: 3,
    retryDelayMs: 1000,
    debug: process.env.NODE_ENV === 'development',
    rateLimitPerMinute: 50,
    userAgent: 'AI-Prompt-Generator/1.0.0',
  };

  const mergedConfig = { ...defaultConfig, ...config };
  return new ClaudeClient(mergedConfig);
}

/**
 * 默认Claude客户端实例
 */
export const defaultClaudeClient = createClaudeClient();

// ==================== 导出 ====================

export { ClaudeErrorType, ClaudeApiError };