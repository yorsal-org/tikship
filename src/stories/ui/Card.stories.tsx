import type { Meta, StoryObj } from '@storybook/react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A card container component with optional title, actions, and various shadow levels.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Card title',
      table: {
        type: { summary: 'ReactNode' },
      },
    },
    shadow: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'none'],
      description: 'Shadow size',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'xl' },
      },
    },
    glass: {
      control: 'boolean',
      description: 'Enable glass effect',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: <p>This is a simple card with default styling.</p>,
  },
}

export const WithTitle: Story = {
  args: {
    title: 'Card Title',
    children: <p>This card has a title at the top.</p>,
  },
}

export const WithActions: Story = {
  args: {
    title: 'Card with Actions',
    children: <p>This card has action buttons at the bottom.</p>,
    actions: (
      <>
        <Button variant="ghost">Cancel</Button>
        <Button variant="primary">Save</Button>
      </>
    ),
  },
}

export const AllShadows: Story = {
  render: args => (
    <div className="flex flex-col gap-6">
      <Card shadow="none" title="No Shadow" {...args}>
        <p>Card without shadow</p>
      </Card>
      <Card shadow="sm" title="Small Shadow" {...args}>
        <p>Card with small shadow</p>
      </Card>
      <Card shadow="md" title="Medium Shadow" {...args}>
        <p>Card with medium shadow</p>
      </Card>
      <Card shadow="lg" title="Large Shadow" {...args}>
        <p>Card with large shadow</p>
      </Card>
      <Card shadow="xl" title="Extra Large Shadow" {...args}>
        <p>Card with extra large shadow (default)</p>
      </Card>
    </div>
  ),
  args: {},
  parameters: {
    layout: 'padded',
  },
}

export const Glass: Story = {
  args: {
    title: 'Glass Card',
    glass: true,
    children: <p>This card has a glass effect.</p>,
  },
}

export const ComplexContent: Story = {
  args: {
    title: 'User Profile',
    children: (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="avatar placeholder">
            <div className="bg-neutral text-neutral-content rounded-full w-16">
              <span className="text-xl">JD</span>
            </div>
          </div>
          <div>
            <h3 className="font-bold">John Doe</h3>
            <p className="text-sm opacity-60">john@example.com</p>
          </div>
        </div>
        <div className="divider"></div>
        <p className="text-sm">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt
          ut labore.
        </p>
      </div>
    ),
    actions: (
      <>
        <Button variant="outline">View Profile</Button>
        <Button variant="primary">Edit</Button>
      </>
    ),
  },
}
