import * as React from "react"

import { cn } from "../../lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  // 支持行业主题
  industry?: 'lawyer' | 'realtor' | 'insurance' | 'teacher' | 'accountant'
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, industry, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
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
Textarea.displayName = "Textarea"

export { Textarea }