import type { Meta, StoryObj } from '@storybook/react'
import { Input } from '@/components/ui/Input'
import { Mail, Lock, Search, Eye } from 'lucide-react'

const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible input component with label, error, hint, and icon support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Input label',
      table: {
        type: { summary: 'ReactNode' },
      },
    },
    error: {
      control: 'text',
      description: 'Error message to display',
      table: {
        type: { summary: 'string' },
      },
    },
    hint: {
      control: 'text',
      description: 'Hint text to display',
      table: {
        type: { summary: 'string' },
      },
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
      table: {
        type: { summary: 'string' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Disable input',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
}

export const WithLabel: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'your@email.com',
    type: 'email',
  },
}

export const WithError: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter username',
    error: 'Username is required',
    value: '',
  },
}

export const WithHint: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter password',
    hint: 'Must be at least 8 characters',
  },
}

export const WithLeftIcon: Story = {
  args: {
    label: 'Email',
    placeholder: 'your@email.com',
    leftIcon: <Mail className="w-5 h-5" />,
  },
}

export const WithRightIcon: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter password',
    rightIcon: <Eye className="w-5 h-5 cursor-pointer" />,
  },
}

export const WithBothIcons: Story = {
  args: {
    label: 'Search',
    placeholder: 'Search...',
    leftIcon: <Search className="w-5 h-5" />,
    rightIcon: <span className="text-xs text-base-content/40">⌘K</span>,
  },
}

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'Cannot edit',
    disabled: true,
    value: 'Disabled value',
  },
}

export const AllTypes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-96">
      <Input label="Text" type="text" placeholder="Text input" />
      <Input
        label="Email"
        type="email"
        placeholder="email@example.com"
        leftIcon={<Mail className="w-5 h-5" />}
      />
      <Input
        label="Password"
        type="password"
        placeholder="Password"
        leftIcon={<Lock className="w-5 h-5" />}
      />
      <Input label="Number" type="number" placeholder="123" />
      <Input label="Date" type="date" />
      <Input
        label="Search"
        type="search"
        placeholder="Search..."
        leftIcon={<Search className="w-5 h-5" />}
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
}
