/**
 * 🔐 企业级速率限制实现
 * 防止API滥用、DDoS攻击和恶意爬虫
 */

// 内存存储 (生产环境建议使用Redis)
interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
  blockUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const suspiciousIPs = new Set<string>();

// 🔐 速率限制配置
const RATE_LIMIT_CONFIG = {
  // API请求限制
  api: {
    windowMs: 15 * 60 * 1000, // 15分钟
    maxRequests: 100, // 最多100次请求
    blockDurationMs: 60 * 60 * 1000, // 封禁1小时
  },
  
  // AI生成限制 (更严格)
  aiGenerate: {
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 5, // 最多5次请求
    blockDurationMs: 5 * 60 * 1000, // 封禁5分钟
  },
  
  // 静态资源限制
  static: {
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 200, // 最多200次请求
    blockDurationMs: 2 * 60 * 1000, // 封禁2分钟
  }
};

/**
 * 🔐 获取客户端IP地址
 */
function getClientIP(request: Request): string {
  // 按优先级检查各种IP头部
  const headers = [
    'cf-connecting-ip', // Cloudflare
    'x-real-ip', // Nginx
    'x-forwarded-for', // 代理
    'x-client-ip',
    'x-forwarded',
    'x-cluster-client-ip',
    'forwarded-for',
    'forwarded'
  ];

  for (const header of headers) {
    const ip = request.headers.get(header);
    if (ip) {
      // 处理逗号分隔的IP列表，取第一个
      const firstIP = ip.split(',')[0].trim();
      if (firstIP && firstIP !== 'unknown') {
        return firstIP;
      }
    }
  }

  return 'unknown';
}

/**
 * 🔐 检测速率限制类型
 */
function getRateLimitType(pathname: string): keyof typeof RATE_LIMIT_CONFIG {
  if (pathname.includes('/api/generate-prompt')) {
    return 'aiGenerate';
  } else if (pathname.startsWith('/api/')) {
    return 'api';
  } else {
    return 'static';
  }
}

/**
 * 🔐 清理过期的限制记录
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      if (entry.blocked && entry.blockUntil && now > entry.blockUntil) {
        // 解除封禁
        rateLimitStore.delete(key);
        suspiciousIPs.delete(key.split(':')[0]);
      } else if (!entry.blocked) {
        // 重置计数器
        entry.count = 0;
        entry.resetTime = now + RATE_LIMIT_CONFIG.api.windowMs;
      }
    }
  }
}

/**
 * 🔐 记录可疑活动
 */
function logSuspiciousActivity(ip: string, reason: string, details: any): void {
  console.warn('🚨 检测到可疑活动:', {
    ip,
    reason,
    details,
    timestamp: new Date().toISOString()
  });
  
  suspiciousIPs.add(ip);
  
  // 这里可以集成外部监控系统
  // await sendAlert({ ip, reason, details });
}

/**
 * 🔐 主要速率限制函数
 */
export async function rateLimit(request: Request): Promise<{
  success: boolean;
  remaining: number;
  resetTime: number;
  blocked?: boolean;
  error?: string;
}> {
  // 定期清理过期记录
  cleanupExpiredEntries();
  
  const ip = getClientIP(request);
  const url = new URL(request.url);
  const pathname = url.pathname;
  const limitType = getRateLimitType(pathname);
  const config = RATE_LIMIT_CONFIG[limitType];
  
  // 生成唯一键
  const key = `${ip}:${limitType}`;
  const now = Date.now();
  
  // 检查是否为已知的可疑IP
  if (suspiciousIPs.has(ip)) {
    logSuspiciousActivity(ip, 'Known suspicious IP attempting request', {
      pathname,
      userAgent: request.headers.get('user-agent')
    });
  }
  
  let entry = rateLimitStore.get(key);
  
  // 初始化新条目
  if (!entry) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
      blocked: false
    };
    rateLimitStore.set(key, entry);
  }
  
  // 检查是否仍在封禁期内
  if (entry.blocked && entry.blockUntil && now < entry.blockUntil) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.blockUntil,
      blocked: true,
      error: `IP被临时封禁，请于${new Date(entry.blockUntil).toLocaleString()}后重试`
    };
  }
  
  // 重置计数器（如果时间窗口已过）
  if (now > entry.resetTime) {
    entry.count = 0;
    entry.resetTime = now + config.windowMs;
    entry.blocked = false;
    delete entry.blockUntil;
  }
  
  // 增加请求计数
  entry.count++;
  
  // 检查是否超过限制
  if (entry.count > config.maxRequests) {
    // 封禁IP
    entry.blocked = true;
    entry.blockUntil = now + config.blockDurationMs;
    
    logSuspiciousActivity(ip, 'Rate limit exceeded', {
      pathname,
      count: entry.count,
      limit: config.maxRequests,
      limitType,
      userAgent: request.headers.get('user-agent')
    });
    
    return {
      success: false,
      remaining: 0,
      resetTime: entry.blockUntil,
      blocked: true,
      error: `请求过于频繁，已被临时封禁${Math.round(config.blockDurationMs / 1000 / 60)}分钟`
    };
  }
  
  // 返回成功结果
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime
  };
}

/**
 * 🔐 获取速率限制统计信息 (仅开发环境)
 */
export function getRateLimitStats(): any {
  if (process.env.NODE_ENV !== 'development') {
    return { error: '仅开发环境可用' };
  }
  
  return {
    totalEntries: rateLimitStore.size,
    suspiciousIPs: Array.from(suspiciousIPs),
    activeBlocks: Array.from(rateLimitStore.entries())
      .filter(([_, entry]) => entry.blocked)
      .map(([key, entry]) => ({
        key,
        blockUntil: entry.blockUntil ? new Date(entry.blockUntil).toISOString() : null
      }))
  };
}

/**
 * 🔐 清除速率限制记录 (仅开发环境)
 */
export function clearRateLimitRecords(): boolean {
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }
  
  rateLimitStore.clear();
  suspiciousIPs.clear();
  return true;
}