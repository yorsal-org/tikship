'use client'

import { InputHTMLAttributes, ReactNode, forwardRef } from 'react'
import { cn } from '@/lib/utils/common'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode
  error?: string
  hint?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  containerClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, containerClassName, className, ...props }, ref) => {
    return (
      <div className={cn('form-control w-full', containerClassName)}>
        {label && (
          <label className="label">
            <span className="label-text font-medium">{label}</span>
          </label>
        )}
        <div
          className={cn(
            'flex items-center gap-0 border border-base-300 rounded-lg bg-base-100 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
            error && 'border-error focus-within:border-error focus-within:ring-error/20'
          )}
        >
          {leftIcon && (
            <div className="pl-3 flex items-center justify-center text-base-content/40 shrink-0">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'input border-none focus:ring-0 focus:outline-none grow bg-transparent h-10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="pr-3 flex items-center justify-center shrink-0">{rightIcon}</div>
          )}
        </div>
        {(error || hint) && (
          <label className="label">
            {error ? (
              <span className="label-text-alt text-error">{error}</span>
            ) : (
              <span className="label-text-alt text-base-content/50">{hint}</span>
            )}
          </label>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
