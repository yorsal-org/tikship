import type { Preview } from '@storybook/nextjs-vite'
import React from 'react'
import { NextIntlClientProvider } from 'next-intl'
import '../src/app/globals.css'
import '../src/styles/datepicker.css'

// Mock messages for next-intl
const messages = {
  common: {
    pagination: {
      showing_results: 'Showing {from} to {to} of {total} results',
    },
  },
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
    nextjs: {
      appDirectory: true,
    },
  },
  decorators: [
    Story => (
      <NextIntlClientProvider locale="en" messages={messages}>
        <div data-theme="light" className="min-h-screen bg-base-100 p-8">
          <Story />
        </div>
      </NextIntlClientProvider>
    ),
  ],
}

export default preview
