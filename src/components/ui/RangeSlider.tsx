'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils/common'

interface RangeSliderProps {
  min: number
  max: number
  step?: number
  value: [number, number]
  onChange: (value: [number, number]) => void
  formatLabel?: (value: number) => string
  disabled?: boolean
  className?: string
}

export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  formatLabel = (v) => String(v),
  disabled = false,
  className,
}: RangeSliderProps) {
  const [localValue, setLocalValue] = useState<[number, number]>(value)
  const trackRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef<'min' | 'max' | null>(null)

  // Sync with external value
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const getPercentFromEvent = useCallback(
    (e: React.PointerEvent<Element>) => {
      if (!trackRef.current) return 0
      const rect = trackRef.current.getBoundingClientRect()
      const percent = ((e.clientX - rect.left) / rect.width) * 100
      return Math.max(0, Math.min(100, percent))
    },
    []
  )

  const percentToValue = useCallback(
    (percent: number) => {
      const rawValue = (percent / 100) * (max - min) + min
      const stepped = Math.round(rawValue / step) * step
      return Math.max(min, Math.min(max, stepped))
    },
    [min, max, step]
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, target: 'min' | 'max') => {
      if (disabled) return
      e.preventDefault()
      draggingRef.current = target
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

      const percent = getPercentFromEvent(e)
      const newVal = percentToValue(percent)

      if (target === 'min') {
        const constrained = Math.min(newVal, localValue[1] - step)
        const newValue: [number, number] = [constrained, localValue[1]]
        setLocalValue(newValue)
        onChange(newValue)
      } else {
        const constrained = Math.max(newVal, localValue[0] + step)
        const newValue: [number, number] = [localValue[0], constrained]
        setLocalValue(newValue)
        onChange(newValue)
      }
    },
    [disabled, getPercentFromEvent, percentToValue, localValue, onChange, step]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<Element>) => {
      if (!draggingRef.current || disabled) return

      const percent = getPercentFromEvent(e)
      const newVal = percentToValue(percent)
      const target = draggingRef.current

      if (target === 'min') {
        const constrained = Math.min(newVal, localValue[1] - step)
        const newValue: [number, number] = [constrained, localValue[1]]
        setLocalValue(newValue)
        onChange(newValue)
      } else {
        const constrained = Math.max(newVal, localValue[0] + step)
        const newValue: [number, number] = [localValue[0], constrained]
        setLocalValue(newValue)
        onChange(newValue)
      }
    },
    [disabled, getPercentFromEvent, percentToValue, localValue, onChange, step]
  )

  const handlePointerUp = useCallback(() => {
    draggingRef.current = null
  }, [])

  const minPercent = ((localValue[0] - min) / (max - min)) * 100
  const maxPercent = ((localValue[1] - min) / (max - min)) * 100

  return (
    <div
      className={cn(
        'relative w-full h-12 flex items-center select-none',
        disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer',
        className
      )}
    >
      {/* Track background */}
      <div ref={trackRef} className="absolute left-0 right-0 h-2 bg-base-300 rounded-full">

        {/* Active track highlight */}
        <div
          className="absolute h-2 bg-primary rounded-full pointer-events-none"
          style={{
            left: `${minPercent}%`,
            right: `${100 - maxPercent}%`,
          }}
        />
      </div>

      {/* Min handle */}
      <div
        className="absolute w-5 h-5 rounded-full bg-primary border-2 border-white shadow-md z-10"
        style={{
          left: `calc(${minPercent}% - 10px)`,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
        onPointerDown={(e) => handlePointerDown(e, 'min')}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      {/* Max handle */}
      <div
        className="absolute w-5 h-5 rounded-full bg-primary border-2 border-white shadow-md z-10"
        style={{
          left: `calc(${maxPercent}% - 10px)`,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
        onPointerDown={(e) => handlePointerDown(e, 'max')}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      {/* Value labels */}
      <div className="absolute left-0 right-0 flex justify-between items-center top-full mt-2">
        <span className="text-sm text-base-content/70">{formatLabel(localValue[0])}</span>
        <span className="text-sm text-base-content/70">{formatLabel(localValue[1])}</span>
      </div>
    </div>
  )
}