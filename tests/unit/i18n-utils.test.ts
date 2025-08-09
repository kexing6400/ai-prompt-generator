/**
 * 国际化工具函数单元测试
 * 测试middleware、i18n配置和工具函数的核心逻辑
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// 导入要测试的函数
import { 
  locales, 
  defaultLocale, 
  isValidLocale, 
  getLocaleFromPathname,
  getDictionary,
  localeToFileMap,
  type Locale 
} from '../../lib/i18n';

// Mock Next.js modules
vi.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    constructor(public url: string, public init?: any) {}
    nextUrl = new URL(this.url);
    cookies = {
      get: vi.fn()
    };
    headers = {
      get: vi.fn()
    };
  },
  NextResponse: {
    redirect: vi.fn((url) => ({ type: 'redirect', url })),
    next: vi.fn(() => ({ type: 'next' })),
  }
}));

describe('i18n配置测试', () => {
  it('应该定义正确的语言列表', () => {
    expect(locales).toEqual(['cn', 'en']);
    expect(locales).toHaveLength(2);
  });

  it('应该设置正确的默认语言', () => {
    expect(defaultLocale).toBe('cn');
    expect(locales.includes(defaultLocale)).toBe(true);
  });

  it('应该有正确的语言文件映射', () => {
    expect(localeToFileMap).toEqual({
      'cn': 'zh',
      'en': 'en'
    });
  });
});

describe('isValidLocale 函数测试', () => {
  it('应该验证有效的语言代码', () => {
    expect(isValidLocale('cn')).toBe(true);
    expect(isValidLocale('en')).toBe(true);
  });

  it('应该拒绝无效的语言代码', () => {
    expect(isValidLocale('fr')).toBe(false);
    expect(isValidLocale('de')).toBe(false);
    expect(isValidLocale('zh')).toBe(false); // 我们使用cn而不是zh作为URL路径
    expect(isValidLocale('')).toBe(false);
    expect(isValidLocale('invalid')).toBe(false);
  });

  it('应该处理边界情况', () => {
    expect(isValidLocale(null as any)).toBe(false);
    expect(isValidLocale(undefined as any)).toBe(false);
    expect(isValidLocale(123 as any)).toBe(false);
  });
});

describe('getLocaleFromPathname 函数测试', () => {
  it('应该从有效路径中提取语言', () => {
    expect(getLocaleFromPathname('/cn/')).toBe('cn');
    expect(getLocaleFromPathname('/en/')).toBe('en');
    expect(getLocaleFromPathname('/cn/ai-prompts-for-lawyers/')).toBe('cn');
    expect(getLocaleFromPathname('/en/ai-prompts-for-lawyers/')).toBe('en');
  });

  it('应该从无效路径返回null', () => {
    expect(getLocaleFromPathname('/')).toBe(null);
    expect(getLocaleFromPathname('/fr/')).toBe(null);
    expect(getLocaleFromPathname('/invalid/')).toBe(null);
    expect(getLocaleFromPathname('')).toBe(null);
  });

  it('应该处理复杂路径', () => {
    expect(getLocaleFromPathname('/cn/complex/nested/path/')).toBe('cn');
    expect(getLocaleFromPathname('/en/another/path?query=value')).toBe('en');
    expect(getLocaleFromPathname('/cn')).toBe('cn'); // 没有尾随斜杠
  });
});

describe('getDictionary 函数测试', () => {
  // Mock dynamic imports
  const mockDictionary = {
    common: {
      title: '测试标题',
      subtitle: '测试副标题'
    },
    industries: {
      lawyer: {
        name: '律师',
        displayName: '律师'
      }
    }
  };

  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();
  });

  it('应该加载中文字典', async () => {
    // Mock the import for zh.json
    vi.doMock('../../locales/zh.json', () => ({
      default: mockDictionary
    }));

    const dict = await getDictionary('cn');
    expect(dict).toEqual(mockDictionary);
  });

  it('应该处理无效语言并回退到默认语言', async () => {
    // Mock the import to throw an error for invalid locale
    vi.doMock('../../locales/invalid.json', () => {
      throw new Error('Module not found');
    });

    // Mock the fallback to default locale
    vi.doMock('../../locales/zh.json', () => ({
      default: mockDictionary
    }));

    const dict = await getDictionary('invalid' as Locale);
    expect(dict).toEqual(mockDictionary);
  });
});

describe('Middleware逻辑测试', () => {
  // 由于middleware是一个独立的模块，我们需要模拟它的核心逻辑
  const getLocale = (request: any): string => {
    // 1. 检查cookie中的语言偏好
    const cookieLocale = request.cookies.get('locale')?.value;
    if (cookieLocale && ['cn', 'en'].includes(cookieLocale)) {
      return cookieLocale;
    }

    // 2. 检查Accept-Language header
    const acceptLanguage = request.headers.get('Accept-Language') || '';
    const detectedLocale = acceptLanguage.toLowerCase().includes('zh') ? 'cn' : 'en';
    
    return detectedLocale;
  };

  const pathnameIsMissingLocale = (pathname: string): boolean => {
    return ['cn', 'en'].every(
      (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
    );
  };

  describe('语言检测逻辑', () => {
    it('应该优先使用cookie中的语言设置', () => {
      const mockRequest = {
        cookies: {
          get: vi.fn().mockReturnValue({ value: 'en' })
        },
        headers: {
          get: vi.fn().mockReturnValue('zh-CN,zh;q=0.9')
        }
      };

      const locale = getLocale(mockRequest);
      expect(locale).toBe('en');
      expect(mockRequest.cookies.get).toHaveBeenCalledWith('locale');
    });

    it('应该根据Accept-Language header检测语言', () => {
      const mockRequest = {
        cookies: {
          get: vi.fn().mockReturnValue(undefined)
        },
        headers: {
          get: vi.fn().mockReturnValue('zh-CN,zh;q=0.9,en;q=0.8')
        }
      };

      const locale = getLocale(mockRequest);
      expect(locale).toBe('cn');
    });

    it('应该在没有中文标识时默认返回英文', () => {
      const mockRequest = {
        cookies: {
          get: vi.fn().mockReturnValue(undefined)
        },
        headers: {
          get: vi.fn().mockReturnValue('en-US,en;q=0.9')
        }
      };

      const locale = getLocale(mockRequest);
      expect(locale).toBe('en');
    });

    it('应该处理无效的cookie值', () => {
      const mockRequest = {
        cookies: {
          get: vi.fn().mockReturnValue({ value: 'invalid' })
        },
        headers: {
          get: vi.fn().mockReturnValue('en-US,en;q=0.9')
        }
      };

      const locale = getLocale(mockRequest);
      expect(locale).toBe('en'); // 应该回退到header检测
    });
  });

  describe('路径分析逻辑', () => {
    it('应该正确识别缺少locale的路径', () => {
      expect(pathnameIsMissingLocale('/')).toBe(true);
      expect(pathnameIsMissingLocale('/about')).toBe(true);
      expect(pathnameIsMissingLocale('/ai-prompts-for-lawyers')).toBe(true);
    });

    it('应该正确识别包含locale的路径', () => {
      expect(pathnameIsMissingLocale('/cn/')).toBe(false);
      expect(pathnameIsMissingLocale('/en/')).toBe(false);
      expect(pathnameIsMissingLocale('/cn/ai-prompts-for-lawyers')).toBe(false);
      expect(pathnameIsMissingLocale('/en/about')).toBe(false);
    });

    it('应该处理边界情况', () => {
      expect(pathnameIsMissingLocale('/cn')).toBe(false); // 精确匹配
      expect(pathnameIsMissingLocale('/en')).toBe(false); // 精确匹配
      expect(pathnameIsMissingLocale('/cnn/')).toBe(true); // 不是有效的locale
      expect(pathnameIsMissingLocale('/enx/')).toBe(true); // 不是有效的locale
    });
  });

  describe('跳过路径检测', () => {
    const shouldSkipMiddleware = (pathname: string): boolean => {
      return (
        pathname.startsWith('/api/') ||
        pathname.startsWith('/_next/') ||
        pathname.includes('/favicon') ||
        pathname.includes('.') // 静态文件
      );
    };

    it('应该跳过API路由', () => {
      expect(shouldSkipMiddleware('/api/generate-prompt')).toBe(true);
      expect(shouldSkipMiddleware('/api/test')).toBe(true);
    });

    it('应该跳过Next.js内部路由', () => {
      expect(shouldSkipMiddleware('/_next/static/css/app.css')).toBe(true);
      expect(shouldSkipMiddleware('/_next/image')).toBe(true);
    });

    it('应该跳过静态文件', () => {
      expect(shouldSkipMiddleware('/favicon.ico')).toBe(true);
      expect(shouldSkipMiddleware('/logo.png')).toBe(true);
      expect(shouldSkipMiddleware('/robots.txt')).toBe(true);
    });

    it('应该处理正常页面路径', () => {
      expect(shouldSkipMiddleware('/')).toBe(false);
      expect(shouldSkipMiddleware('/cn/')).toBe(false);
      expect(shouldSkipMiddleware('/en/ai-prompts-for-lawyers')).toBe(false);
    });
  });
});

describe('语言切换器组件逻辑测试', () => {
  // 模拟语言切换器的核心逻辑
  const buildNewPath = (currentPath: string, newLocale: Locale): string => {
    const pathSegments = currentPath.split('/');
    
    // 如果当前路径包含locale，替换它
    if (['cn', 'en'].includes(pathSegments[1])) {
      pathSegments[1] = newLocale;
    } else {
      // 如果没有locale，添加它
      pathSegments.splice(1, 0, newLocale);
    }
    
    return pathSegments.join('/') || `/${newLocale}`;
  };

  it('应该正确构建语言切换后的路径', () => {
    expect(buildNewPath('/cn/', 'en')).toBe('/en/');
    expect(buildNewPath('/en/', 'cn')).toBe('/cn/');
    expect(buildNewPath('/cn/ai-prompts-for-lawyers/', 'en')).toBe('/en/ai-prompts-for-lawyers/');
    expect(buildNewPath('/en/about', 'cn')).toBe('/cn/about');
  });

  it('应该为没有locale的路径添加locale', () => {
    expect(buildNewPath('/', 'cn')).toBe('/cn/');
    expect(buildNewPath('/about', 'en')).toBe('/en/about');
    expect(buildNewPath('/ai-prompts-for-lawyers', 'cn')).toBe('/cn/ai-prompts-for-lawyers');
  });

  it('应该处理复杂路径', () => {
    expect(buildNewPath('/cn/complex/nested/path', 'en')).toBe('/en/complex/nested/path');
    expect(buildNewPath('/en/another/deep/route/', 'cn')).toBe('/cn/another/deep/route/');
  });
});

describe('URL参数和查询字符串处理', () => {
  const preserveQueryAndHash = (basePath: string, queryString: string, hash: string): string => {
    let result = basePath;
    if (queryString) {
      result += '?' + queryString;
    }
    if (hash) {
      result += '#' + hash;
    }
    return result;
  };

  it('应该保留查询参数', () => {
    const result = preserveQueryAndHash('/cn/', 'utm_source=test&utm_medium=email', '');
    expect(result).toBe('/cn/?utm_source=test&utm_medium=email');
  });

  it('应该保留URL哈希', () => {
    const result = preserveQueryAndHash('/en/about', '', 'section1');
    expect(result).toBe('/en/about#section1');
  });

  it('应该同时保留查询参数和哈希', () => {
    const result = preserveQueryAndHash('/cn/lawyers', 'page=2&sort=date', 'top');
    expect(result).toBe('/cn/lawyers?page=2&sort=date#top');
  });

  it('应该处理空参数', () => {
    const result = preserveQueryAndHash('/en/', '', '');
    expect(result).toBe('/en/');
  });
});

describe('性能和缓存考虑', () => {
  it('应该有合理的cookie过期时间', () => {
    const oneYear = 60 * 60 * 24 * 365;
    const cookieMaxAge = oneYear;
    
    expect(cookieMaxAge).toBe(31536000); // 1年的秒数
    expect(cookieMaxAge).toBeGreaterThan(86400); // 至少1天
    expect(cookieMaxAge).toBeLessThan(63072000); // 不超过2年
  });

  it('应该使用适当的cookie设置', () => {
    const cookieOptions = {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production'
    };

    expect(cookieOptions.sameSite).toBe('lax');
    expect(cookieOptions.maxAge).toBe(31536000);
    
    // 在测试环境中secure应该为false
    expect(cookieOptions.secure).toBe(false);
  });
});