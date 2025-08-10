'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Industry, INDUSTRIES, getIndustryById } from '@/lib/constants/industries';

interface IndustryThemeContextType {
  currentIndustry: Industry | null;
  setCurrentIndustry: (industry: Industry | string) => void;
  isLoading: boolean;
}

const IndustryThemeContext = createContext<IndustryThemeContextType | undefined>(undefined);

interface IndustryThemeProviderProps {
  children: ReactNode;
  defaultIndustry?: string;
}

export function IndustryThemeProvider({ 
  children, 
  defaultIndustry 
}: IndustryThemeProviderProps) {
  const [currentIndustry, setCurrentIndustryState] = useState<Industry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setCurrentIndustry = (industry: Industry | string) => {
    const industryObj = typeof industry === 'string' 
      ? getIndustryById(industry) 
      : industry;
    
    if (industryObj) {
      setCurrentIndustryState(industryObj);
      
      // 更新CSS变量以支持主题切换
      const root = document.documentElement;
      root.style.setProperty('--industry-primary', industryObj.color.primary);
      root.style.setProperty('--industry-secondary', industryObj.color.secondary);
      root.style.setProperty('--industry-accent', industryObj.color.accent);
      
      // 存储到localStorage
      localStorage.setItem('selectedIndustry', industryObj.id);
    }
  };

  // 初始化时从localStorage或defaultIndustry加载
  useEffect(() => {
    const savedIndustry = localStorage.getItem('selectedIndustry');
    const industryToLoad = savedIndustry || defaultIndustry;
    
    if (industryToLoad) {
      const industry = getIndustryById(industryToLoad);
      if (industry) {
        setCurrentIndustry(industry);
      }
    }
    
    setIsLoading(false);
  }, [defaultIndustry]);

  return (
    <IndustryThemeContext.Provider value={{
      currentIndustry,
      setCurrentIndustry,
      isLoading
    }}>
      {children}
    </IndustryThemeContext.Provider>
  );
}

export function useIndustryTheme() {
  const context = useContext(IndustryThemeContext);
  if (context === undefined) {
    throw new Error('useIndustryTheme must be used within an IndustryThemeProvider');
  }
  return context;
}

// 工具函数：获取当前行业的CSS类名
export function getIndustryClasses(industryId?: string) {
  if (!industryId) return '';
  
  const industry = getIndustryById(industryId);
  if (!industry) return '';
  
  return {
    primary: `text-[${industry.color.primary}]`,
    primaryBg: `bg-[${industry.color.primary}]`,
    secondary: `text-[${industry.color.secondary}]`,
    secondaryBg: `bg-[${industry.color.secondary}]`,
    accent: `bg-[${industry.color.accent}]`,
    gradient: `bg-gradient-to-br ${industry.color.background}`,
    border: `border-[${industry.color.primary}]`,
    hover: `hover:bg-[${industry.color.accent}]`,
  };
}