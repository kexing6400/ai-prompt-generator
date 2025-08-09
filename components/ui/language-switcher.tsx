'use client';

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { locales, localeNames, localeFlags, type Locale } from '../../lib/i18n';
import { useRouter, usePathname } from 'next/navigation';

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentLocale, setCurrentLocale] = useState<Locale>('cn');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 从URL路径获取当前语言
    const pathSegments = pathname.split('/');
    const pathLocale = pathSegments[1] as Locale;
    
    if (locales.includes(pathLocale)) {
      setCurrentLocale(pathLocale);
    } else {
      // 从localStorage获取保存的语言偏好
      const savedLocale = localStorage.getItem('locale') as Locale;
      if (savedLocale && locales.includes(savedLocale)) {
        setCurrentLocale(savedLocale);
      } else {
        // 检测浏览器语言
        const browserLang = navigator.language.toLowerCase();
        if (browserLang.startsWith('zh')) {
          setCurrentLocale('cn');
        } else {
          setCurrentLocale('en');
        }
      }
    }
  }, [pathname]);

  const switchLanguage = (locale: Locale) => {
    if (locale === currentLocale) return;
    
    // 保存到 localStorage 和 cookie
    localStorage.setItem('locale', locale);
    document.cookie = `locale=${locale};path=/;max-age=${365 * 24 * 60 * 60};SameSite=Lax`;
    
    // 构建新的URL路径
    const pathSegments = pathname.split('/');
    
    // 如果当前路径包含locale，替换它
    if (locales.includes(pathSegments[1] as Locale)) {
      pathSegments[1] = locale;
    } else {
      // 如果没有locale，添加它
      pathSegments.splice(1, 0, locale);
    }
    
    const newPath = pathSegments.join('/') || `/${locale}`;
    
    // 使用router进行客户端导航
    router.push(newPath);
    router.refresh();
    setCurrentLocale(locale);
  };

  if (!mounted) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 hover:bg-accent/50 transition-colors"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline-block">
            {localeFlags[currentLocale]} {localeNames[currentLocale]}
          </span>
          <span className="sm:hidden">{localeFlags[currentLocale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => switchLanguage(locale)}
            className={`cursor-pointer ${
              locale === currentLocale ? 'bg-accent' : ''
            }`}
          >
            <span className="mr-2">{localeFlags[locale]}</span>
            <span>{localeNames[locale]}</span>
            {locale === currentLocale && (
              <span className="ml-auto text-xs">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}