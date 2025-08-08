import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  // 支持行业主题
  industry?: 'lawyer' | 'realtor' | 'insurance' | 'teacher' | 'accountant'
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, industry, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          // 行业主题的聚焦状态
          industry === 'lawyer' && "focus-visible:ring-lawyer/20",
          industry === 'realtor' && "focus-visible:ring-realtor/20",
          industry === 'insurance' && "focus-visible:ring-insurance/20", 
          industry === 'teacher' && "focus-visible:ring-teacher/20",
          industry === 'accountant' && "focus-visible:ring-accountant/20",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }