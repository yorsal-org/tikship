'use client'

import { forwardRef } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import { useLocale } from 'next-intl'
import { zhCN } from 'date-fns/locale/zh-CN'
import { enUS } from 'date-fns/locale/en-US'
import { DateTimePickerProps } from '@/types/ui'

/**
 * DateTimePicker component with DaisyUI styling
 * Supports both date and time selection
 */
export const DateTimePicker = forwardRef<DatePicker, DateTimePickerProps>(
  ({ selected, onChange, minDate, placeholder, className }, ref) => {
    const locale = useLocale()
    const dateLocale = locale === 'zh' ? zhCN : enUS

    return (
      <div className="relative w-full">
        <DatePicker
          ref={ref}
          selected={selected}
          onChange={onChange}
          showTimeSelect
          timeFormat="HH:mm"
          timeIntervals={15}
          dateFormat="yyyy-MM-dd HH:mm"
          minDate={minDate}
          placeholderText={placeholder}
          locale={dateLocale}
          className={`input w-full bg-base-100 pr-10 focus:outline-offset-0 ${className || ''}`}
          calendarClassName="!font-sans"
          wrapperClassName="w-full"
          popperClassName="!z-50"
          // Customizing internal react-datepicker styles via portal or global CSS is sometimes needed,
          // but here we try to use as many built-in class overrides as possible.
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-base-content/50">
          <Calendar size={16} />
        </div>
      </div>
    )
  }
)

DateTimePicker.displayName = 'DateTimePicker'
