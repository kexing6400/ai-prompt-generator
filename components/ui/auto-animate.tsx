"use client"

import { useEffect, useRef } from "react"
import { autoAnimate, type AutoAnimateOptions, getTransitionSizes } from "@formkit/auto-animate"
import { cn } from "@/lib/utils"

// Auto-animate hook
export function useAutoAnimate<T extends Element>(
  options?: Partial<AutoAnimateOptions>
): [React.RefObject<T>, (enabled: boolean) => void] {
  const ref = useRef<T>(null)
  const enabledRef = useRef(true)

  useEffect(() => {
    if (ref.current && enabledRef.current) {
      return autoAnimate(ref.current, {
        duration: 250,
        easing: "ease-in-out",
        ...options,
      })
    }
  })

  const setEnabled = (enabled: boolean) => {
    enabledRef.current = enabled
  }

  return [ref, setEnabled]
}

// Auto-animate container component
interface AutoAnimateProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: keyof JSX.IntrinsicElements
  duration?: number
  easing?: string
  disrespectUserMotionPreference?: boolean
}

export function AutoAnimate({
  children,
  as: Tag = "div",
  className,
  duration = 250,
  easing = "ease-in-out",
  disrespectUserMotionPreference = false,
  ...props
}: AutoAnimateProps) {
  const [ref] = useAutoAnimate<HTMLElement>({
    duration,
    easing,
    disrespectUserMotionPreference,
  })

  return (
    <Tag ref={ref} className={className} {...props}>
      {children}
    </Tag>
  )
}

// 预设动画配置
export const autoAnimatePresets = {
  // 快速淡入淡出
  fade: {
    duration: 200,
    easing: "ease-out",
  },
  // 弹性效果
  spring: {
    duration: 400,
    easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  },
  // 平滑过渡
  smooth: {
    duration: 300,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
  // 快速响应
  snappy: {
    duration: 150,
    easing: "cubic-bezier(0.25, 1, 0.5, 1)",
  },
} satisfies Record<string, Partial<AutoAnimateOptions>>

// 特殊用途的Auto-animate组件

// 列表容器 - 适用于动态添加/删除项目
export function AutoAnimateList({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLUListElement>) {
  const [ref] = useAutoAnimate<HTMLUListElement>(autoAnimatePresets.smooth)
  
  return (
    <ul ref={ref} className={cn("space-y-2", className)} {...props}>
      {children}
    </ul>
  )
}

// 网格容器 - 适用于卡片布局
export function AutoAnimateGrid({
  className,
  children,
  cols = 3,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { cols?: number }) {
  const [ref] = useAutoAnimate<HTMLDivElement>(autoAnimatePresets.spring)
  
  return (
    <div 
      ref={ref} 
      className={cn(
        "grid gap-4",
        {
          "grid-cols-1": cols === 1,
          "grid-cols-2": cols === 2,
          "grid-cols-3": cols === 3,
          "grid-cols-4": cols === 4,
        },
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
}

// 表单字段容器 - 适用于动态表单
export function AutoAnimateForm({
  className,
  children,
  ...props
}: React.FormHTMLAttributes<HTMLFormElement>) {
  const [ref] = useAutoAnimate<HTMLFormElement>(autoAnimatePresets.smooth)
  
  return (
    <form ref={ref} className={cn("space-y-4", className)} {...props}>
      {children}
    </form>
  )
}

// 手风琴内容 - 适用于展开/收起内容
export function AutoAnimateAccordion({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const [ref] = useAutoAnimate<HTMLDivElement>({
    duration: 200,
    easing: "ease-in-out",
    // 自定义进入/退出动画
    keyframes: (el: Element, action: "add" | "remove" | "remain") => {
      if (action === "add") {
        return [
          { opacity: "0", height: "0px" },
          { opacity: "1", height: `${el.scrollHeight}px` },
        ]
      }
      if (action === "remove") {
        return [
          { opacity: "1", height: `${el.scrollHeight}px` },
          { opacity: "0", height: "0px" },
        ]
      }
      return []
    },
  })
  
  return (
    <div ref={ref} className={cn("overflow-hidden", className)} {...props}>
      {children}
    </div>
  )
}