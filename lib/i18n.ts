// 国际化配置 - 使用cn/en作为URL路径
export const locales = ['cn', 'en'] as const;
export type Locale = typeof locales[number];

export const defaultLocale: Locale = 'cn';

// 语言代码到文件名的映射
export const localeToFileMap: Record<Locale, string> = {
  'cn': 'zh', // URL用cn，但文件名仍是zh.json
  'en': 'en'
};

// 语言名称映射
export const localeNames: Record<Locale, string> = {
  cn: '中文',
  en: 'English'
};

// 语言标志 emoji
export const localeFlags: Record<Locale, string> = {
  cn: '🇨🇳',
  en: '🇺🇸'
};

// 翻译字典类型
export interface Dictionary {
  common: {
    title: string;
    subtitle: string;
    description: string;
    getStarted: string;
    learnMore: string;
    contactAdvisor: string;
    freeStart: string;
    users: string;
    templates: string;
    generated: string;
    satisfaction: string;
    industries: string;
    selectIndustry: string;
    whyChooseUs: string;
    features: {
      intelligent: string;
      intelligentDesc: string;
      customized: string;
      customizedDesc: string;
      continuous: string;
      continuousDesc: string;
      instant: string;
      instantDesc: string;
    };
    cta: {
      title: string;
      subtitle: string;
    };
    footer: {
      tagline: string;
      copyright: string;
    };
  };
  industries: {
    lawyer: {
      name: string;
      displayName: string;
      description: string;
      features: string[];
      enter: string;
    };
    realtor: {
      name: string;
      displayName: string;
      description: string;
      features: string[];
      enter: string;
    };
    insurance: {
      name: string;
      displayName: string;
      description: string;
      features: string[];
      enter: string;
    };
    teacher: {
      name: string;
      displayName: string;
      description: string;
      features: string[];
      enter: string;
    };
    accountant: {
      name: string;
      displayName: string;
      description: string;
      features: string[];
      enter: string;
    };
  };
  forms: {
    scenarioType: string;
    taskGoal: string;
    specificRequirements: string;
    additionalContext: string;
    generatePrompt: string;
    generating: string;
    copyToClipboard: string;
    copied: string;
    regenerate: string;
    placeholder: {
      scenario: string;
      goal: string;
      requirements: string;
      context: string;
    };
  };
}

// 获取字典 - 支持URL路径到文件名的映射
export async function getDictionary(locale: Locale): Promise<Dictionary> {
  try {
    const fileName = localeToFileMap[locale];
    const dict = await import(`../locales/${fileName}.json`);
    return dict.default;
  } catch (error) {
    // 如果找不到对应语言，返回默认语言
    const defaultFileName = localeToFileMap[defaultLocale];
    const dict = await import(`../locales/${defaultFileName}.json`);
    return dict.default;
  }
}

// 验证locale是否有效
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

// 从URL路径获取locale
export function getLocaleFromPathname(pathname: string): Locale | null {
  const segments = pathname.split('/');
  const potentialLocale = segments[1];
  return isValidLocale(potentialLocale) ? potentialLocale : null;
}