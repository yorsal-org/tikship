import type { Meta, StoryObj } from '@storybook/react'
import { StatusBadge } from '@/components/ui/StatusBadge'

const meta = {
  title: 'UI/StatusBadge',
  component: StatusBadge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A badge component for displaying status information with different variants and sizes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'text',
      description: 'Status value (used as fallback if label not provided)',
      table: {
        type: { summary: 'string' },
      },
    },
    label: {
      control: 'text',
      description: 'Display label (overrides status)',
      table: {
        type: { summary: 'string' },
      },
    },
    variant: {
      control: 'select',
      options: ['success', 'error', 'warning', 'info', 'ghost'],
      description: 'Badge color variant',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'ghost' },
      },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Badge size',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'md' },
      },
    },
  },
} satisfies Meta<typeof StatusBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    status: 'active',
    variant: 'ghost',
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <StatusBadge status="success" variant="success" label="Success" />
      <StatusBadge status="error" variant="error" label="Error" />
      <StatusBadge status="warning" variant="warning" label="Warning" />
      <StatusBadge status="info" variant="info" label="Info" />
      <StatusBadge status="default" variant="ghost" label="Ghost" />
    </div>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <StatusBadge status="small" size="sm" label="Small" />
      <StatusBadge status="medium" size="md" label="Medium" />
      <StatusBadge status="large" size="lg" label="Large" />
    </div>
  ),
}

export const OrderStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <StatusBadge status="pending" variant="warning" label="Pending" />
      <StatusBadge status="processing" variant="info" label="Processing" />
      <StatusBadge status="shipped" variant="info" label="Shipped" />
      <StatusBadge status="delivered" variant="success" label="Delivered" />
      <StatusBadge status="cancelled" variant="error" label="Cancelled" />
    </div>
  ),
}

export const UserStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <StatusBadge status="active" variant="success" label="Active" />
      <StatusBadge status="inactive" variant="ghost" label="Inactive" />
      <StatusBadge status="suspended" variant="warning" label="Suspended" />
      <StatusBadge status="banned" variant="error" label="Banned" />
    </div>
  ),
}

export const WithoutLabel: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <StatusBadge status="ACTIVE" variant="success" />
      <StatusBadge status="PENDING" variant="warning" />
      <StatusBadge status="FAILED" variant="error" />
    </div>
  ),
}
