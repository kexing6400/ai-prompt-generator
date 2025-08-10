"use client"

import { motion, AnimatePresence, Variants } from "framer-motion"
import { forwardRef } from "react"
import { cn } from "@/lib/utils"

// 基础动画变量
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
}

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
}

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 }
}

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
}

export const staggerChildren: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

// 通用动画容器组件
interface MotionDivProps extends React.HTMLAttributes<HTMLDivElement> {
  variants?: Variants
  initial?: string
  animate?: string
  exit?: string
  duration?: number
  delay?: number
  className?: string
  children: React.ReactNode
}

export const MotionDiv = forwardRef<HTMLDivElement, MotionDivProps>(
  ({ variants = fadeInUp, initial = "initial", animate = "animate", exit = "exit", 
     duration = 0.3, delay = 0, className, children, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={variants}
      initial={initial}
      animate={animate}
      exit={exit}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
)
MotionDiv.displayName = "MotionDiv"

// 卡片动画组件
export const MotionCard = forwardRef<HTMLDivElement, MotionDivProps>(
  ({ className, children, ...props }, ref) => (
    <MotionDiv
      ref={ref}
      variants={scaleIn}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </MotionDiv>
  )
)
MotionCard.displayName = "MotionCard"

// 按钮动画组件
export const MotionButton = forwardRef<HTMLButtonElement, 
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
  }
>(({ className, variant = "default", size = "default", children, ...props }, ref) => (
  <motion.button
    ref={ref}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    transition={{ type: "spring", stiffness: 400, damping: 17 }}
    className={cn(
      "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      {
        "bg-primary text-primary-foreground hover:bg-primary/90": variant === "default",
        "bg-destructive text-destructive-foreground hover:bg-destructive/90": variant === "destructive",
        "border border-input bg-background hover:bg-accent hover:text-accent-foreground": variant === "outline",
        "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
        "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
        "text-primary underline-offset-4 hover:underline": variant === "link"
      },
      {
        "h-10 px-4 py-2": size === "default",
        "h-9 rounded-md px-3": size === "sm",
        "h-11 rounded-md px-8": size === "lg",
        "h-10 w-10": size === "icon"
      },
      className
    )}
    {...props}
  >
    {children}
  </motion.button>
))
MotionButton.displayName = "MotionButton"

// 列表项动画组件
export const MotionListItem = forwardRef<HTMLLIElement, 
  React.LiHTMLAttributes<HTMLLIElement> & MotionDivProps
>(({ className, children, ...props }, ref) => (
  <motion.li
    ref={ref}
    variants={fadeInUp}
    whileHover={{ x: 8, transition: { duration: 0.2 } }}
    className={cn("cursor-pointer transition-colors hover:text-primary", className)}
    {...props}
  >
    {children}
  </motion.li>
))
MotionListItem.displayName = "MotionListItem"

// 页面过渡组件
export const PageTransition = ({ children, className }: { 
  children: React.ReactNode
  className?: string 
}) => (
  <AnimatePresence mode="wait">
    <MotionDiv
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      duration={0.4}
      className={cn("min-h-screen", className)}
    >
      {children}
    </MotionDiv>
  </AnimatePresence>
)

// Stagger 容器 - 子元素依次出现
export const StaggerContainer = ({ children, className }: { 
  children: React.ReactNode
  className?: string 
}) => (
  <motion.div
    variants={staggerChildren}
    initial="initial"
    animate="animate"
    className={className}
  >
    {children}
  </motion.div>
)

// 导出原始组件以备高级用法
export { motion, AnimatePresence } from "framer-motion"