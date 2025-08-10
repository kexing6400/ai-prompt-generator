'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LanguageSwitcher } from '../ui/language-switcher';
import { locales, type Locale } from '../../lib/i18n';
import { Sparkles } from 'lucide-react';

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
          
          {/* 导航菜单 */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link 
              href={`/${currentLocale}`}
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              首页
            </Link>
            <Link 
              href="/world-class-ui"
              className="flex items-center gap-1.5 transition-colors hover:text-foreground/80 text-foreground/60 hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:bg-clip-text hover:text-transparent"
            >
              <Sparkles className="h-4 w-4" />
              世界级UI展示
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* 移动端菜单按钮 */}
          <div className="md:hidden">
            <Link 
              href="/world-class-ui"
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
            >
              <Sparkles className="h-3 w-3" />
              UI展示
            </Link>
          </div>
          
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}