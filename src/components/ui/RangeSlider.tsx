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
  const minRef = useRef(value[0])
  const maxRef = useRef(value[1])

  // Sync with external value
  useEffect(() => {
    setLocalValue(value)
    minRef.current = value[0]
    maxRef.current = value[1]
  }, [value])

  // Calculate track highlight positions
  const getLeftPercent = (val: number) => ((val - min) / (max - min)) * 100
  const getRightPercent = (val: number) => 100 - ((val - min) / (max - min)) * 100

  const leftPercent = getLeftPercent(localValue[0])
  const rightPercent = getRightPercent(localValue[1])

  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMin = Math.min(Number(e.target.value), localValue[1] - step)
      minRef.current = newMin
      const newValue: [number, number] = [newMin, localValue[1]]
      setLocalValue(newValue)
      onChange(newValue)
    },
    [localValue, onChange, step]
  )

  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMax = Math.max(Number(e.target.value), localValue[0] + step)
      maxRef.current = newMax
      const newValue: [number, number] = [localValue[0], newMax]
      setLocalValue(newValue)
      onChange(newValue)
    },
    [localValue, onChange, step]
  )

  return (
    <div className={cn('relative w-full h-12 flex items-center', disabled && 'opacity-50 pointer-events-none', className)}>
      {/* Track background */}
      <div className="absolute left-0 right-0 h-2 bg-base-300 rounded-full" />

      {/* Active track highlight - using absolute positioning and z-index */}
      <div
        className="absolute h-2 bg-primary rounded-full pointer-events-none"
        style={{
          left: `${leftPercent}%`,
          right: `${rightPercent}%`,
        }}
      />

      {/* Hidden range inputs for accessibility */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={localValue[0]}
        onChange={handleMinChange}
        disabled={disabled}
        className="absolute w-full h-2 opacity-0 cursor-pointer z-20"
        aria-label="Minimum value"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={localValue[1]}
        onChange={handleMaxChange}
        disabled={disabled}
        className="absolute w-full h-2 opacity-0 cursor-pointer z-20"
        aria-label="Maximum value"
      />

      {/* Visual slider handles - stacked on top */}
      <div
        className="absolute w-5 h-5 rounded-full bg-primary border-2 border-white shadow-md z-10 pointer-events-none transform -translate-x-1/2"
        style={{ left: `${leftPercent}%` }}
      />
      <div
        className="absolute w-5 h-5 rounded-full bg-primary border-2 border-white shadow-md z-10 pointer-events-none transform -translate-x-1/2"
        style={{ left: `${100 - rightPercent}%` }}
      />

      {/* Value labels */}
      <div className="absolute left-0 right-0 flex justify-between items-center top-full mt-2">
        <span className="text-sm text-base-content/70">{formatLabel(localValue[0])}</span>
        <span className="text-sm text-base-content/70">{formatLabel(localValue[1])}</span>
      </div>
    </div>
  )
}