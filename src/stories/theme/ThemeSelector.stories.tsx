import type { Meta, StoryObj } from '@storybook/react'
import { ThemeSelector } from '@/components/theme/ThemeSelector'
import { ThemeProvider } from '@/components/providers/ThemeProvider'

const meta = {
  title: 'Theme/ThemeSelector',
  component: ThemeSelector,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A theme selector component that allows users to switch between DaisyUI themes.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof ThemeSelector>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const InForm: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Choose Theme</span>
        </label>
        <ThemeSelector />
      </div>
    </div>
  ),
}

export const WithCard: Story = {
  render: () => (
    <div className="card bg-base-100 shadow-xl w-96">
      <div className="card-body">
        <h2 className="card-title">Appearance Settings</h2>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Theme</span>
          </label>
          <ThemeSelector />
        </div>
        <p className="text-sm opacity-60 mt-2">
          Choose your preferred theme. Changes will be applied immediately.
        </p>
      </div>
    </div>
  ),
}
