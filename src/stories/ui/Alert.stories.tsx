import type { Meta, StoryObj } from '@storybook/react'
import { Alert } from '@/components/ui/Alert'
import { Star } from 'lucide-react'

const meta = {
  title: 'UI/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'An alert component for displaying important messages with different severity levels.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'error'],
      description: 'Alert variant/severity',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'info' },
      },
    },
    children: {
      control: 'text',
      description: 'Alert message content',
      table: {
        type: { summary: 'ReactNode' },
      },
    },
  },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Info: Story = {
  args: {
    variant: 'info',
    children: 'This is an informational message.',
  },
}

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Your changes have been saved successfully!',
  },
}

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Please review your information before submitting.',
  },
}

export const Error: Story = {
  args: {
    variant: 'error',
    children: 'An error occurred while processing your request.',
  },
}

export const AllVariants: Story = {
  render: args => (
    <div className="flex flex-col gap-4 w-96">
      <Alert variant="info" {...args}>
        This is an informational message.
      </Alert>
      <Alert variant="success" {...args}>
        Operation completed successfully!
      </Alert>
      <Alert variant="warning" {...args}>
        Please proceed with caution.
      </Alert>
      <Alert variant="error" {...args}>
        Something went wrong.
      </Alert>
    </div>
  ),
  args: {},
  parameters: {
    layout: 'padded',
  },
}

export const CustomIcon: Story = {
  args: {
    variant: 'info',
    icon: <Star className="h-5 w-5" />,
    children: 'This alert has a custom icon.',
  },
}

export const LongMessage: Story = {
  args: {
    variant: 'warning',
    children:
      'This is a longer alert message that demonstrates how the component handles multiple lines of text. It should wrap properly and maintain good readability.',
  },
}
