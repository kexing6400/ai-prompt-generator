// 国际化配置
export const locales = ['zh', 'en'] as const;
export type Locale = typeof locales[number];

export const defaultLocale: Locale = 'zh';

// 语言名称映射
export const localeNames: Record<Locale, string> = {
  zh: '中文',
  en: 'English'
};

// 语言标志 emoji
export const localeFlags: Record<Locale, string> = {
  zh: '🇨🇳',
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

// 获取字典
export async function getDictionary(locale: Locale): Promise<Dictionary> {
  try {
    const dict = await import(`../locales/${locale}.json`);
    return dict.default;
  } catch (error) {
    // 如果找不到对应语言，返回默认语言
    const dict = await import(`../locales/${defaultLocale}.json`);
    return dict.default;
  }
}