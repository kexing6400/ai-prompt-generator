'use client'

import { useEffect, useState } from 'react'
import { Dictionary, Locale, defaultLocale } from '../i18n'

/**
 * 客户端翻译Hook - 用于客户端组件
 * @param locale 当前语言区域设置
 * @returns 翻译字典和翻译函数
 */
export function useClientTranslations(locale: Locale) {
  const [dictionary, setDictionary] = useState<Dictionary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDictionary = async () => {
      try {
        setLoading(true)
        // 客户端动态导入翻译文件
        const fileName = locale === 'cn' ? 'zh' : 'en'
        let dict
        
        try {
          if (fileName === 'zh') {
            dict = await import(`../../locales/zh.json`)
          } else {
            dict = await import(`../../locales/en.json`)
          }
          setDictionary(dict.default)
        } catch (error) {
          console.error(`Failed to load ${fileName}.json:`, error)
          // 降级到默认语言
          const defaultDict = await import(`../../locales/zh.json`)
          setDictionary(defaultDict.default)
        }
      } catch (error) {
        console.error('Failed to load dictionary:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDictionary()
  }, [locale])

  /**
   * 获取嵌套翻译键的值
   * @param path 翻译键路径，如 'common.title'
   * @returns 翻译后的文本
   */
  const t = (path: string): string => {
    if (!dictionary) return path // 降级显示键名

    const keys = path.split('.')
    let value: any = dictionary

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key]
      } else {
        return path // 如果键不存在，返回原始路径
      }
    }

    return typeof value === 'string' ? value : path
  }

  /**
   * 获取翻译数组
   * @param path 翻译键路径
   * @returns 翻译后的字符串数组
   */
  const tArray = (path: string): string[] => {
    if (!dictionary) return []

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
    loading,
    t,
    tArray,
    locale
  }
}