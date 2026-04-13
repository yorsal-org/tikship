import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { RangeSlider } from '@/components/ui/RangeSlider'

const meta = {
  title: 'UI/RangeSlider',
  component: RangeSlider,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A dual-handle range slider for filtering numeric ranges (e.g., price, quantity).',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    min: {
      control: 'number',
      description: 'Minimum value',
      table: {
        type: { summary: 'number' },
      },
    },
    max: {
      control: 'number',
      description: 'Maximum value',
      table: {
        type: { summary: 'number' },
      },
    },
    step: {
      control: 'number',
      description: 'Step increment',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '1' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Disable interaction',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
  },
} satisfies Meta<typeof RangeSlider>

export default meta
type Story = StoryObj<typeof meta>

const RangeSliderWrapper = (args: React.ComponentProps<typeof RangeSlider>) => {
  const [value, setValue] = useState<[number, number]>(args.value as [number, number])
  return <RangeSlider {...args} value={value} onChange={setValue} />
}

export const Default: Story = {
  render: (args) => <RangeSliderWrapper {...args} />,
  args: {
    min: 0,
    max: 100,
    step: 1,
    value: [25, 75],
  },
}

export const PriceRange: Story = {
  render: (args) => <RangeSliderWrapper {...args} />,
  args: {
    min: 0,
    max: 10000,
    step: 100,
    value: [1000, 5000],
    formatLabel: (v: number) => `¥${v}`,
  },
}

export const QuantityRange: Story = {
  render: (args) => <RangeSliderWrapper {...args} />,
  args: {
    min: 0,
    max: 500,
    step: 10,
    value: [100, 400],
    formatLabel: (v: number) => `${v} units`,
  },
}

export const Disabled: Story = {
  render: (args) => <RangeSliderWrapper {...args} />,
  args: {
    min: 0,
    max: 100,
    step: 1,
    value: [25, 75],
    disabled: true,
  },
}

export const SmallRange: Story = {
  render: (args) => <RangeSliderWrapper {...args} />,
  args: {
    min: 1,
    max: 10,
    step: 1,
    value: [3, 7],
  },
}
