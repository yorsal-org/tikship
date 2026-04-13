'use client'

import { useState } from 'react'
import { RangeSlider } from '@/components/ui/RangeSlider'

export default function RangeSliderDemo() {
  const [priceRange, setPriceRange] = useState<[number, number]>([100, 1000])
  const [quantityRange, setQuantityRange] = useState<[number, number]>([0, 100])

  return (
    <div className="p-8 space-y-12">
      <div className="max-w-xl space-y-4">
        <h1 className="text-2xl font-bold">Range Slider Demo</h1>

        {/* Price Range */}
        <div className="card bg-base-200 p-6">
          <h2 className="font-semibold mb-4">Price Range (¥)</h2>
          <RangeSlider
            min={0}
            max={10000}
            step={100}
            value={priceRange}
            onChange={setPriceRange}
            formatLabel={(v) => `¥${v}`}
          />
          <p className="text-sm text-base-content/60 mt-6">
            Selected: ¥{priceRange[0]} - ¥{priceRange[1]}
          </p>
        </div>

        {/* Quantity Range */}
        <div className="card bg-base-200 p-6">
          <h2 className="font-semibold mb-4">Quantity Range</h2>
          <RangeSlider
            min={0}
            max={500}
            step={10}
            value={quantityRange}
            onChange={setQuantityRange}
            formatLabel={(v) => `${v} units`}
          />
          <p className="text-sm text-base-content/60 mt-6">
            Selected: {quantityRange[0]} - {quantityRange[1]} units
          </p>
        </div>

        {/* Disabled State */}
        <div className="card bg-base-200 p-6">
          <h2 className="font-semibold mb-4">Disabled State</h2>
          <RangeSlider
            min={0}
            max={100}
            step={1}
            value={[25, 75]}
            onChange={() => {}}
            disabled
          />
        </div>
      </div>
    </div>
  )
}