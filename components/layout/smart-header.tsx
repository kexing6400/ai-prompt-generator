'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LanguageSwitcher } from '../ui/language-switcher';
import { locales, type Locale } from '../../lib/i18n';

export function SmartHeader() {
  const pathname = usePathname();
  
  // 从路径中提取当前locale
  const getCurrentLocale = (): Locale => {
    const pathSegments = pathname.split('/');
    const pathLocale = pathSegments[1] as Locale;
    
    if (locales.includes(pathLocale)) {
      return pathLocale;
    }
    
    // 默认返回中文
    return 'cn';
  };

  const currentLocale = getCurrentLocale();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4 sm:px-6 lg:px-8">
        <div className="mr-4 flex flex-1">
          <Link href={`/${currentLocale}`} className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Prompt Generator
            </span>
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}