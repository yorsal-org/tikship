import type { Meta, StoryObj } from '@storybook/react'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { useState } from 'react'

const meta = {
  title: 'UI/DateTimePicker',
  component: DateTimePicker,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A date and time picker component with localization support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    selected: {
      control: 'date',
      description: 'Selected date',
      table: {
        type: { summary: 'Date | null' },
      },
    },
    minDate: {
      control: 'date',
      description: 'Minimum selectable date',
      table: {
        type: { summary: 'Date' },
      },
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
      table: {
        type: { summary: 'string' },
      },
    },
  },
} satisfies Meta<typeof DateTimePicker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: args => {
    const [date, setDate] = useState<Date | null>(null)
    return <DateTimePicker selected={date} onChange={setDate} {...args} />
  },
  args: {},
}

export const WithPlaceholder: Story = {
  render: args => {
    const [date, setDate] = useState<Date | null>(null)
    return (
      <DateTimePicker
        selected={date}
        onChange={setDate}
        placeholder="Select date and time"
        {...args}
      />
    )
  },
  args: {},
}

export const WithDefaultValue: Story = {
  render: args => {
    const [date, setDate] = useState<Date | null>(new Date())
    return <DateTimePicker selected={date} onChange={setDate} {...args} />
  },
  args: {},
}

export const WithMinDate: Story = {
  render: args => {
    const [date, setDate] = useState<Date | null>(null)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return (
      <DateTimePicker
        selected={date}
        onChange={setDate}
        minDate={tomorrow}
        placeholder="Select future date"
        {...args}
      />
    )
  },
  args: {},
}

export const FutureOnly: Story = {
  render: args => {
    const [date, setDate] = useState<Date | null>(null)
    return (
      <DateTimePicker
        selected={date}
        onChange={setDate}
        minDate={new Date()}
        placeholder="Schedule for future"
        {...args}
      />
    )
  },
  args: {},
}

export const InForm: Story = {
  render: args => {
    const [date, setDate] = useState<Date | null>(null)
    return (
      <div className="w-96 space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Event Name</span>
          </label>
          <input type="text" placeholder="Enter event name" className="input input-bordered" />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Event Date & Time</span>
          </label>
          <DateTimePicker
            selected={date}
            onChange={setDate}
            placeholder="Select date and time"
            {...args}
          />
        </div>
      </div>
    )
  },
  args: {},
  parameters: {
    layout: 'padded',
  },
}
