/**
 * 国际化(i18n)类型定义
 * 
 * 定义多语言系统的类型结构，确保翻译内容的类型安全
 */

/**
 * 支持的语言类型
 */
export type Locale = 'zh' | 'en'

/**
 * 通用区块类型定义
 */
interface CommonDictionary {
  title: string
  subtitle: string
  description: string
  getStarted: string
  learnMore: string
  contactAdvisor: string
  freeStart: string
  users: string
  templates: string
  generated: string
  satisfaction: string
  industries: string
  footer: {
    tagline: string
    copyright: string
  }
  howItWorks: {
    title: string
    step1: string
    step2: string
    step3: string
    step4: string
  }
}

/**
 * 行业相关翻译类型
 */
interface IndustriesDictionary {
  lawyer: {
    name: string
    displayName: string
    description: string
    features: string[]
    enter: string
  }
  realtor: {
    name: string
    displayName: string
    description: string
    features: string[]
    enter: string
  }
  insurance: {
    name: string
    displayName: string
    description: string
    features: string[]
    enter: string
  }
  teacher: {
    name: string
    displayName: string
    description: string
    features: string[]
    enter: string
  }
  accountant: {
    name: string
    displayName: string
    description: string
    features: string[]
    enter: string
  }
}

/**
 * 表单相关翻译类型
 */
interface FormsDictionary {
  scenarioType: string
  taskGoal: string
  specificRequirements: string
  additionalContext: string
  generatePrompt: string
  generating: string
  copyToClipboard: string
  copied: string
  regenerate: string
  saveDraft: string
  loadDraft: string
  characters: string
  optional: string
  required: string
  quickStart: string
  professionalTip: string
  tipContent: string
  placeholder: {
    scenario: string
    goal: string
    requirements: string
    context: string
  }
}

/**
 * 页面相关翻译类型
 */
interface PagesDictionary {
  lawyer: {
    title: string
    subtitle: string
    breadcrumb: string
    categoriesTitle: string
    generatorTitle: string
    generatorSubtitle: string
    scenarioLabel: string
    scenarioPlaceholder: string
    requirementsLabel: string
    requirementsPlaceholder: string
    requirementsTip: string
    contextLabel: string
    contextPlaceholder: string
    generateButton: string
    metrics: {
      served: string
      generated: string
      timeSaved: string
      accuracy: string
    }
    categories: {
      contractReview: {
        name: string
        description: string
        templates: string[]
      }
      caseAnalysis: {
        name: string
        description: string
        templates: string[]
      }
      legalResearch: {
        name: string
        description: string
        templates: string[]
      }
      documentDrafting: {
        name: string
        description: string
        templates: string[]
      }
    }
    selectCategory: string
    popular: string
  }
}

/**
 * 导航相关翻译类型
 */
interface NavigationDictionary {
  home: string
}

/**
 * UI组件相关翻译类型
 */
interface UIDictionary {
  coreFeatures: string
}

/**
 * 完整的字典类型定义
 * 这个类型必须与实际的JSON结构完全匹配
 */
export interface Dictionary {
  common: CommonDictionary
  industries: IndustriesDictionary
  forms: FormsDictionary
  pages: PagesDictionary
  navigation: NavigationDictionary
  ui: UIDictionary
}

/**
 * 翻译函数类型
 */
export type TranslationFunction = (key: string, params?: Record<string, string>) => string

/**
 * 语言配置接口
 */
export interface LanguageConfig {
  code: Locale
  name: string
  nativeName: string
  direction: 'ltr' | 'rtl'
  dateFormat: string
  numberFormat: {
    decimal: string
    thousands: string
    currency: string
  }
}

/**
 * i18n上下文类型
 */
export interface I18nContextType {
  locale: Locale
  dictionary: Dictionary | null
  t: TranslationFunction
  setLocale: (locale: Locale) => void
  isLoading: boolean
}

/**
 * 导出类型以供其他模块使用
 */
export type {
  CommonDictionary,
  IndustriesDictionary, 
  FormsDictionary,
  PagesDictionary,
  NavigationDictionary,
  UIDictionary
}