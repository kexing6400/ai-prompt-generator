/**
 * API密钥验证工具
 * 提供安全的API密钥格式验证和基础健康检查
 */

/**
 * 验证OpenRouter API密钥格式
 */
export function validateOpenRouterKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }

  // OpenRouter API密钥基本格式检查
  // 通常以 sk- 开头，后跟字符串
  const openRouterPattern = /^sk-[a-zA-Z0-9-_]{20,}$/;
  
  return openRouterPattern.test(apiKey.trim());
}

/**
 * 验证API密钥是否为空或未设置
 */
export function isApiKeyMissing(apiKey?: string): boolean {
  return !apiKey || apiKey.trim() === '' || apiKey === 'your-api-key-here';
}

/**
 * 安全地隐藏API密钥用于日志记录
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) {
    return '***';
  }
  
  const start = apiKey.substring(0, 4);
  const end = apiKey.substring(apiKey.length - 4);
  return `${start}****${end}`;
}

/**
 * 验证请求来源（基本的安全检查）
 */
export function validateRequestOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  // 在开发环境允许localhost
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // 生产环境验证域名
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_SITE_URL,
    'https://prompt-generator.com',
    'https://www.prompt-generator.com'
  ].filter(Boolean);
  
  return allowedOrigins.some(allowed => 
    (allowed && origin?.startsWith(allowed)) || (allowed && referer?.startsWith(allowed))
  );
}

/**
 * 验证请求体是否包含必需字段
 */
export function validateChatRequest(body: any): {
  valid: boolean;
  error?: string;
} {
  if (!body) {
    return { valid: false, error: '请求体不能为空' };
  }

  if (!Array.isArray(body.messages)) {
    return { valid: false, error: 'messages字段必须是数组' };
  }

  if (body.messages.length === 0) {
    return { valid: false, error: 'messages数组不能为空' };
  }

  // 验证每个消息的格式
  for (let i = 0; i < body.messages.length; i++) {
    const message = body.messages[i];
    
    if (!message.role || !message.content) {
      return { 
        valid: false, 
        error: `消息 ${i + 1} 缺少必需的 role 或 content 字段` 
      };
    }

    if (!['system', 'user', 'assistant'].includes(message.role)) {
      return { 
        valid: false, 
        error: `消息 ${i + 1} 的 role 字段值无效: ${message.role}` 
      };
    }

    if (typeof message.content !== 'string') {
      return { 
        valid: false, 
        error: `消息 ${i + 1} 的 content 字段必须是字符串` 
      };
    }
  }

  return { valid: true };
}

/**
 * 速率限制检查（简单实现）
 */
class RateLimiter {
  private requests = new Map<string, number[]>();
  private readonly maxRequests = 30; // 每分钟最大请求数
  private readonly windowMs = 60 * 1000; // 1分钟窗口

  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // 清理过期的请求记录
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return true;
    }
    
    // 记录当前请求
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return false;
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

// 全局速率限制器实例
export const rateLimiter = new RateLimiter();

/**
 * 获取客户端IP地址（用于速率限制）
 */
export function getClientIP(request: Request): string {
  // 检查代理头部
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // 开发环境默认IP
  return '127.0.0.1';
}