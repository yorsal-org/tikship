import type { Meta, StoryObj } from '@storybook/react'
import { ToastContainer } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { toast } from '@/lib/utils/toast'

const meta = {
  title: 'UI/Toast',
  component: ToastContainer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A toast notification system with different variants and positions.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ToastContainer>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <ToastContainer />
      <Button onClick={() => toast.info('This is an info message')}>Show Info Toast</Button>
      <Button onClick={() => toast.success('Operation completed successfully!')} variant="success">
        Show Success Toast
      </Button>
      <Button onClick={() => toast.warning('Please review your input')} variant="warning">
        Show Warning Toast
      </Button>
      <Button onClick={() => toast.error('An error occurred')} variant="error">
        Show Error Toast
      </Button>
    </div>
  ),
}

export const DifferentPositions: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <ToastContainer />
      <Button onClick={() => toast.info('Top Start', { position: 'top-start' })}>Top Start</Button>
      <Button onClick={() => toast.info('Top Center', { position: 'top-center' })}>
        Top Center
      </Button>
      <Button onClick={() => toast.info('Top End', { position: 'top-end' })}>Top End</Button>
      <Button onClick={() => toast.info('Bottom Start', { position: 'bottom-start' })}>
        Bottom Start
      </Button>
      <Button onClick={() => toast.info('Bottom Center', { position: 'bottom-center' })}>
        Bottom Center
      </Button>
      <Button onClick={() => toast.info('Bottom End', { position: 'bottom-end' })}>
        Bottom End
      </Button>
    </div>
  ),
}

export const CustomDuration: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <ToastContainer />
      <Button onClick={() => toast.info('Short duration (1s)', { duration: 1000 })}>
        1 Second
      </Button>
      <Button onClick={() => toast.info('Default duration (3s)')}>3 Seconds (Default)</Button>
      <Button onClick={() => toast.info('Long duration (5s)', { duration: 5000 })}>
        5 Seconds
      </Button>
      <Button onClick={() => toast.info('Very long (10s)', { duration: 10000 })}>10 Seconds</Button>
    </div>
  ),
}

export const LongMessages: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <ToastContainer />
      <Button
        onClick={() =>
          toast.info(
            'This is a longer message that demonstrates how the toast component handles multiple lines of text.'
          )
        }
      >
        Show Long Message
      </Button>
      <Button
        onClick={() =>
          toast.error(
            'An error occurred while processing your request. Please check your input and try again.'
          )
        }
        variant="error"
      >
        Show Long Error
      </Button>
    </div>
  ),
}

export const RealWorldExamples: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <ToastContainer />
      <Button onClick={() => toast.success('Profile updated successfully!')} variant="success">
        Save Profile
      </Button>
      <Button
        onClick={() => toast.error('Failed to upload image. File too large.')}
        variant="error"
      >
        Upload Large File
      </Button>
      <Button
        onClick={() => toast.warning('Your session will expire in 5 minutes')}
        variant="warning"
      >
        Session Warning
      </Button>
      <Button onClick={() => toast.info('New message from John Doe')} variant="info">
        New Message
      </Button>
    </div>
  ),
}
