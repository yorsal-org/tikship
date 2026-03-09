import type { Meta, StoryObj } from '@storybook/react'
import { LanguageSelector } from '@/components/locale/LanguageSelector'
import { NextIntlClientProvider } from 'next-intl'

// Mock translations
const messages = {
  common: {
    language: 'Language',
  },
}

const meta = {
  title: 'Locale/LanguageSelector',
  component: LanguageSelector,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A language selector component for switching between supported locales.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <NextIntlClientProvider locale="en" messages={messages}>
        <Story />
      </NextIntlClientProvider>
    ),
  ],
} satisfies Meta<typeof LanguageSelector>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const InForm: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Language</span>
        </label>
        <LanguageSelector />
      </div>
    </div>
  ),
}

export const WithCard: Story = {
  render: () => (
    <div className="card bg-base-100 shadow-xl w-96">
      <div className="card-body">
        <h2 className="card-title">Language Settings</h2>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Preferred Language</span>
          </label>
          <LanguageSelector />
        </div>
        <p className="text-sm opacity-60 mt-2">
          Select your preferred language. The page will reload to apply changes.
        </p>
      </div>
    </div>
  ),
}
