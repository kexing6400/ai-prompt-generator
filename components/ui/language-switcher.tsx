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
  const [currentLocale, setCurrentLocale] = useState<Locale>('zh');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 从 localStorage 或 cookie 获取当前语言
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && locales.includes(savedLocale)) {
      setCurrentLocale(savedLocale);
    } else {
      // 检测浏览器语言
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('zh')) {
        setCurrentLocale('zh');
      } else {
        setCurrentLocale('en');
      }
    }
  }, []);

  const switchLanguage = (locale: Locale) => {
    if (locale === currentLocale) return;
    
    // 保存到 localStorage
    localStorage.setItem('locale', locale);
    setCurrentLocale(locale);
    
    // 更新 URL（如果使用路径前缀）
    // const newPathname = pathname.replace(/^\/[a-z]{2}/, `/${locale}`);
    // router.push(newPathname);
    
    // 暂时使用刷新页面的方式
    window.location.reload();
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