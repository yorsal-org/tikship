import type { Meta, StoryObj } from '@storybook/react'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { useState } from 'react'

const meta = {
  title: 'UI/ImageUpload',
  component: ImageUpload,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'An image upload component with drag-and-drop support, file validation, and URL input.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    maxSize: {
      control: 'number',
      description: 'Maximum file size in MB',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '5' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Disable upload',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    label: {
      control: 'text',
      description: 'Input label',
      table: {
        type: { summary: 'string' },
      },
    },
    placeholder: {
      control: 'text',
      description: 'URL input placeholder',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'https://...' },
      },
    },
  },
} satisfies Meta<typeof ImageUpload>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: args => {
    const [url, setUrl] = useState('')
    return <ImageUpload value={url} onChange={setUrl} {...args} />
  },
  args: {},
}

export const WithLabel: Story = {
  render: args => {
    const [url, setUrl] = useState('')
    return <ImageUpload value={url} onChange={setUrl} label="Product Image" {...args} />
  },
  args: {},
}

export const WithExistingImage: Story = {
  render: args => {
    const [url, setUrl] = useState('https://picsum.photos/800/600')
    return <ImageUpload value={url} onChange={setUrl} label="Product Image" {...args} />
  },
  args: {},
}

export const Disabled: Story = {
  render: args => {
    const [url, setUrl] = useState('https://picsum.photos/800/600')
    return <ImageUpload value={url} onChange={setUrl} label="Product Image" disabled {...args} />
  },
  args: {},
}

export const CustomMaxSize: Story = {
  render: args => {
    const [url, setUrl] = useState('')
    return <ImageUpload value={url} onChange={setUrl} label="Avatar" maxSize={2} {...args} />
  },
  args: {},
}

export const CustomPlaceholder: Story = {
  render: args => {
    const [url, setUrl] = useState('')
    return (
      <ImageUpload
        value={url}
        onChange={setUrl}
        label="Banner Image"
        placeholder="Enter image URL or upload file"
        {...args}
      />
    )
  },
  args: {},
}

export const MockUploadEndpoint: Story = {
  render: args => {
    const [url, setUrl] = useState('')
    return (
      <ImageUpload
        value={url}
        onChange={setUrl}
        label="Upload Image"
        uploadEndpoint="/api/mock/upload"
        {...args}
      />
    )
  },
  args: {},
}
