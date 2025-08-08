import { NextRequest } from 'next/server';
import { locales, defaultLocale, isValidLocale, type Locale } from './i18n';

// 从Accept-Language头部获取首选语言
export function getLocaleFromAcceptLanguage(acceptLanguage: string | null): Locale | null {
  if (!acceptLanguage) return null;
  
  // 解析Accept-Language头部，例如: "zh-CN,zh;q=0.9,en;q=0.8"
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [locale, quality = 'q=1'] = lang.trim().split(';');
      const q = parseFloat(quality.replace('q=', ''));
      return { locale: locale.toLowerCase(), quality: q };
    })
    .sort((a, b) => b.quality - a.quality);

  // 检查是否有直接匹配的语言
  for (const { locale } of languages) {
    if (locale.startsWith('zh')) return 'cn';
    if (locale.startsWith('en')) return 'en';
  }

  return null;
}

// 从Cookie获取保存的语言设置
export function getLocaleFromCookie(request: NextRequest): Locale | null {
  const cookieLocale = request.cookies.get('locale')?.value;
  return cookieLocale && isValidLocale(cookieLocale) ? cookieLocale : null;
}

// 获取最佳匹配的语言
export function getBestMatchingLocale(request: NextRequest): Locale {
  // 优先级顺序：Cookie > Accept-Language > 默认语言
  
  // 1. 检查Cookie
  const cookieLocale = getLocaleFromCookie(request);
  if (cookieLocale) return cookieLocale;
  
  // 2. 检查Accept-Language
  const acceptLanguage = request.headers.get('accept-language');
  const browserLocale = getLocaleFromAcceptLanguage(acceptLanguage);
  if (browserLocale) return browserLocale;
  
  // 3. 返回默认语言
  return defaultLocale;
}

// 检查路径是否已包含语言前缀
export function hasLocalePrefix(pathname: string): boolean {
  const segments = pathname.split('/');
  const firstSegment = segments[1];
  return firstSegment ? isValidLocale(firstSegment) : false;
}

// 为路径添加语言前缀
export function addLocalePrefix(pathname: string, locale: Locale): string {
  if (hasLocalePrefix(pathname)) return pathname;
  return `/${locale}${pathname === '/' ? '' : pathname}`;
}

// 从路径移除语言前缀
export function removeLocalePrefix(pathname: string): string {
  if (!hasLocalePrefix(pathname)) return pathname;
  const segments = pathname.split('/');
  segments.splice(1, 1); // 移除语言段
  return segments.join('/') || '/';
}

// 获取当前路径的其他语言版本
export function getAlternateUrls(pathname: string, currentLocale: Locale, baseUrl: string) {
  const pathWithoutLocale = removeLocalePrefix(pathname);
  
  return locales.reduce((acc, locale) => {
    if (locale !== currentLocale) {
      acc[locale] = `${baseUrl}/${locale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;
    }
    return acc;
  }, {} as Record<string, string>);
}