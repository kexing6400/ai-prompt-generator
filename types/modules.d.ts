/**
 * 模块类型声明文件
 * 为没有TypeScript声明的第三方库提供基本类型定义
 */

// 为@react-pdf/renderer提供基本声明
declare module '@react-pdf/renderer' {
  import { ReactNode } from 'react'
  
  export interface DocumentProps {
    title?: string
    author?: string
    subject?: string
    keywords?: string
    creator?: string
    producer?: string
    children?: ReactNode
  }
  
  export interface PageProps {
    size?: 'A4' | 'A3' | 'LETTER'
    orientation?: 'portrait' | 'landscape'
    style?: any
    children?: ReactNode
  }
  
  export interface ViewProps {
    style?: any
    children?: ReactNode
  }
  
  export interface TextProps {
    style?: any
    children?: ReactNode
  }
  
  export const Document: React.FC<DocumentProps>
  export const Page: React.FC<PageProps>
  export const View: React.FC<ViewProps>
  export const Text: React.FC<TextProps>
  export const pdf: any
}

// 为vitest/config提供基本声明
declare module 'vitest/config' {
  import { UserConfig } from 'vite'
  
  export function defineConfig(config: UserConfig): UserConfig
  export * from 'vite'
}