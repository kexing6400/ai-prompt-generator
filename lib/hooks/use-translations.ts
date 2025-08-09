import { Dictionary, getDictionary, Locale, defaultLocale } from '../i18n'

/**
 * 直接获取翻译字典的同步版本（用于服务端组件）
 * @param locale 语言区域设置
 * @returns Promise<翻译工具函数>
 */
export async function getTranslations(locale: Locale) {
  const dictionary = await getDictionary(locale)
  
  const t = (path: string): string => {
    const keys = path.split('.')
    let value: any = dictionary

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key]
      } else {
        return path
      }
    }

    return typeof value === 'string' ? value : path
  }

  const tArray = (path: string): string[] => {
    const keys = path.split('.')
    let value: any = dictionary

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key]
      } else {
        return []
      }
    }

    return Array.isArray(value) ? value : []
  }

  return {
    dictionary,
    t,
    tArray,
    locale
  }
}