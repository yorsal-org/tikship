import type { Meta, StoryObj } from '@storybook/react'

const meta = {
  title: 'Welcome',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Introduction: Story = {
  render: () => (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Tikship Component Library</h1>

      <p className="text-lg mb-6">
        Welcome to the Tikship component library documentation. This Storybook contains all the
        reusable UI components used throughout the application.
      </p>

      <h2 className="text-2xl font-bold mt-8 mb-4">Component Categories</h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-3">UI Components</h3>
          <p className="mb-2">Basic building blocks for the user interface:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>
              <strong>Button</strong> - Versatile button with multiple variants and sizes
            </li>
            <li>
              <strong>Input</strong> - Text input with label, error, and icon support
            </li>
            <li>
              <strong>Card</strong> - Container component with title and actions
            </li>
            <li>
              <strong>Alert</strong> - Display important messages with different severity levels
            </li>
            <li>
              <strong>Modal</strong> - Dialog component for overlays
            </li>
            <li>
              <strong>Table</strong> - Data table with pagination support
            </li>
            <li>
              <strong>StatusBadge</strong> - Display status information
            </li>
            <li>
              <strong>StatsCard</strong> - Show key metrics and statistics
            </li>
            <li>
              <strong>Pagination</strong> - Navigate through paginated data
            </li>
            <li>
              <strong>ImageUpload</strong> - Upload images with drag-and-drop
            </li>
            <li>
              <strong>DateTimePicker</strong> - Select date and time
            </li>
            <li>
              <strong>Toast</strong> - Notification system
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-3">Theme Components</h3>
          <ul className="list-disc list-inside ml-4">
            <li>
              <strong>ThemeSelector</strong> - Switch between DaisyUI themes
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-3">Locale Components</h3>
          <ul className="list-disc list-inside ml-4">
            <li>
              <strong>LanguageSelector</strong> - Switch between supported languages
            </li>
          </ul>
        </div>
      </div>

      <h2 className="text-2xl font-bold mt-8 mb-4">Design System</h2>
      <p className="mb-2">This component library is built on top of:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>
          <strong>DaisyUI</strong> - Tailwind CSS component library
        </li>
        <li>
          <strong>Tailwind CSS</strong> - Utility-first CSS framework
        </li>
        <li>
          <strong>Lucide React</strong> - Icon library
        </li>
        <li>
          <strong>Next.js</strong> - React framework
        </li>
      </ul>

      <h2 className="text-2xl font-bold mt-8 mb-4">Usage</h2>
      <p className="mb-2">All components are designed to be:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>
          <strong>Accessible</strong> - Following WCAG guidelines
        </li>
        <li>
          <strong>Responsive</strong> - Mobile-first design
        </li>
        <li>
          <strong>Themeable</strong> - Support for multiple DaisyUI themes
        </li>
        <li>
          <strong>Type-safe</strong> - Full TypeScript support
        </li>
      </ul>

      <h2 className="text-2xl font-bold mt-8 mb-4">Getting Started</h2>
      <p className="mb-4">
        Browse the components in the sidebar to see examples and API documentation. Each component
        includes:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Interactive examples</li>
        <li>Props documentation</li>
        <li>Usage guidelines</li>
        <li>Multiple variants and states</li>
      </ul>

      <h2 className="text-2xl font-bold mt-8 mb-4">Development</h2>
      <div className="bg-base-200 p-4 rounded-lg">
        <p className="mb-2">To run Storybook locally:</p>
        <code className="block bg-base-300 p-2 rounded">npm run storybook</code>

        <p className="mt-4 mb-2">To build Storybook:</p>
        <code className="block bg-base-300 p-2 rounded">npm run build-storybook</code>
      </div>
    </div>
  ),
}
