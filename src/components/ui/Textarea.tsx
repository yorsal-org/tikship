import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/common'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'textarea textarea-bordered w-full resize-none',
          error && 'textarea-error',
          className
        )}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'
