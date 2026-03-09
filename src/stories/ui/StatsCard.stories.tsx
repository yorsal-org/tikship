import type { Meta, StoryObj } from '@storybook/react'
import { StatCard, StatsGrid } from '@/components/ui/StatsCard'
import { Users, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react'

const meta = {
  title: 'UI/StatsCard',
  component: StatCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A statistics card component for displaying key metrics with optional icons.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Stat label/description',
      table: {
        type: { summary: 'string' },
      },
    },
    value: {
      control: 'text',
      description: 'Stat value',
      table: {
        type: { summary: 'string | number' },
      },
    },
    color: {
      control: 'text',
      description: 'Icon color class',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'text-primary' },
      },
    },
  },
} satisfies Meta<typeof StatCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: 'Total Users',
    value: '1,234',
  },
}

export const WithIcon: Story = {
  args: {
    label: 'Total Users',
    value: '1,234',
    icon: Users,
    color: 'text-primary',
  },
}

export const DifferentColors: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <StatCard label="Total Users" value="1,234" icon={Users} color="text-primary" />
      <StatCard label="Total Orders" value="567" icon={ShoppingCart} color="text-success" />
      <StatCard label="Revenue" value="$12,345" icon={DollarSign} color="text-warning" />
      <StatCard label="Growth" value="+23%" icon={TrendingUp} color="text-info" />
    </div>
  ),
}

export const InGrid: Story = {
  render: () => (
    <StatsGrid columns={4}>
      <StatCard label="Total Users" value="1,234" icon={Users} color="text-primary" />
      <StatCard label="Total Orders" value="567" icon={ShoppingCart} color="text-success" />
      <StatCard label="Revenue" value="$12,345" icon={DollarSign} color="text-warning" />
      <StatCard label="Growth" value="+23%" icon={TrendingUp} color="text-info" />
    </StatsGrid>
  ),
  parameters: {
    layout: 'padded',
  },
}

export const GridVariants: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold mb-4">2 Columns</h3>
        <StatsGrid columns={2}>
          <StatCard label="Users" value="1,234" icon={Users} />
          <StatCard label="Orders" value="567" icon={ShoppingCart} />
        </StatsGrid>
      </div>
      <div>
        <h3 className="text-lg font-bold mb-4">3 Columns</h3>
        <StatsGrid columns={3}>
          <StatCard label="Users" value="1,234" icon={Users} />
          <StatCard label="Orders" value="567" icon={ShoppingCart} />
          <StatCard label="Revenue" value="$12,345" icon={DollarSign} />
        </StatsGrid>
      </div>
      <div>
        <h3 className="text-lg font-bold mb-4">4 Columns</h3>
        <StatsGrid columns={4}>
          <StatCard label="Users" value="1,234" icon={Users} />
          <StatCard label="Orders" value="567" icon={ShoppingCart} />
          <StatCard label="Revenue" value="$12,345" icon={DollarSign} />
          <StatCard label="Growth" value="+23%" icon={TrendingUp} />
        </StatsGrid>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
}
