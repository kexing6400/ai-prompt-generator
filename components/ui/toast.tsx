"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

// Toast utility functions for easy usage
import { toast } from "sonner"

export const showToast = {
  success: (message: string, description?: string) => 
    toast.success(message, { description }),
  error: (message: string, description?: string) => 
    toast.error(message, { description }),
  warning: (message: string, description?: string) => 
    toast.warning(message, { description }),
  info: (message: string, description?: string) => 
    toast.info(message, { description }),
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => toast.promise(promise, messages)
}