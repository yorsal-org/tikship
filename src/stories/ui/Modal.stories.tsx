import type { Meta, StoryObj } from '@storybook/react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useState } from 'react'

const meta = {
  title: 'UI/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A modal dialog component with customizable size and close button.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Control modal visibility',
      table: {
        type: { summary: 'boolean' },
      },
    },
    title: {
      control: 'text',
      description: 'Modal title',
      table: {
        type: { summary: 'string | ReactNode' },
      },
    },
    maxWidth: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'],
      description: 'Maximum width of modal',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'md' },
      },
    },
    showCloseButton: {
      control: 'boolean',
      description: 'Show close button in header',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
  },
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof meta>

const ModalWrapper = ({
  title,
  maxWidth,
  showCloseButton,
  children,
}: {
  title?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
  showCloseButton?: boolean
  children: React.ReactNode
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={title}
        maxWidth={maxWidth}
        showCloseButton={showCloseButton}
      >
        {children}
      </Modal>
    </>
  )
}

export const Default: Story = {
  render: args => (
    <ModalWrapper title="Modal Title" {...args}>
      <p>This is the modal content. Click outside or press ESC to close.</p>
    </ModalWrapper>
  ),
  args: {},
}

export const WithCloseButton: Story = {
  render: args => (
    <ModalWrapper title="Modal with Close Button" showCloseButton {...args}>
      <p>This modal has a close button in the header.</p>
    </ModalWrapper>
  ),
  args: {},
}

export const NoTitle: Story = {
  render: args => (
    <ModalWrapper {...args}>
      <h3 className="text-lg font-bold mb-4">Custom Content</h3>
      <p>This modal has no title prop, so you can use custom content.</p>
    </ModalWrapper>
  ),
  args: {},
}

export const SmallSize: Story = {
  render: args => (
    <ModalWrapper title="Small Modal" maxWidth="sm" {...args}>
      <p>This is a small modal.</p>
    </ModalWrapper>
  ),
  args: {},
}

export const LargeSize: Story = {
  render: args => (
    <ModalWrapper title="Large Modal" maxWidth="2xl" {...args}>
      <p>This is a large modal with more content space.</p>
      <div className="mt-4 space-y-2">
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
        <p>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
        <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco.</p>
      </div>
    </ModalWrapper>
  ),
  args: {},
}

export const WithForm: Story = {
  render: args => (
    <ModalWrapper title="Edit Profile" showCloseButton maxWidth="lg" {...args}>
      <div className="space-y-4">
        <fieldset className="fieldset">
          <label className="label" htmlFor="modal-name">
            <span>Name</span>
          </label>
          <input id="modal-name" type="text" placeholder="John Doe" className="input" />
        </fieldset>
        <fieldset className="fieldset">
          <label className="label" htmlFor="modal-email">
            <span>Email</span>
          </label>
          <input id="modal-email" type="email" placeholder="john@example.com" className="input" />
        </fieldset>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary">Save Changes</Button>
        </div>
      </div>
    </ModalWrapper>
  ),
  args: {},
}
