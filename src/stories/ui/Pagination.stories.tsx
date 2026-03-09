import type { Meta, StoryObj } from '@storybook/react'
import { Pagination } from '@/components/ui/Pagination'
import { useState } from 'react'

const meta = {
  title: 'UI/Pagination',
  component: Pagination,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A pagination component with page navigation and result summary.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    currentPage: {
      control: 'number',
      description: 'Current active page',
      table: {
        type: { summary: 'number' },
      },
    },
    totalPages: {
      control: 'number',
      description: 'Total number of pages',
      table: {
        type: { summary: 'number' },
      },
    },
    pageSize: {
      control: 'number',
      description: 'Items per page',
      table: {
        type: { summary: 'number' },
      },
    },
    totalCount: {
      control: 'number',
      description: 'Total number of items',
      table: {
        type: { summary: 'number' },
      },
    },
    showSummary: {
      control: 'boolean',
      description: 'Show result summary',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
  },
} satisfies Meta<typeof Pagination>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: args => {
    const [page, setPage] = useState(1)
    return (
      <Pagination
        currentPage={page}
        totalPages={10}
        pageSize={10}
        totalCount={100}
        onPageChange={setPage}
        {...args}
      />
    )
  },
  args: {},
}

export const FewPages: Story = {
  render: args => {
    const [page, setPage] = useState(1)
    return (
      <Pagination
        currentPage={page}
        totalPages={3}
        pageSize={10}
        totalCount={30}
        onPageChange={setPage}
        {...args}
      />
    )
  },
  args: {},
}

export const ManyPages: Story = {
  render: args => {
    const [page, setPage] = useState(5)
    return (
      <Pagination
        currentPage={page}
        totalPages={20}
        pageSize={10}
        totalCount={200}
        onPageChange={setPage}
        {...args}
      />
    )
  },
  args: {},
}

export const WithoutSummary: Story = {
  render: args => {
    const [page, setPage] = useState(1)
    return (
      <Pagination
        currentPage={page}
        totalPages={10}
        pageSize={10}
        totalCount={100}
        onPageChange={setPage}
        showSummary={false}
        {...args}
      />
    )
  },
  args: {},
}

export const FirstPage: Story = {
  render: args => {
    const [page, setPage] = useState(1)
    return (
      <Pagination
        currentPage={page}
        totalPages={10}
        pageSize={10}
        totalCount={100}
        onPageChange={setPage}
        {...args}
      />
    )
  },
  args: {},
}

export const LastPage: Story = {
  render: args => {
    const [page, setPage] = useState(10)
    return (
      <Pagination
        currentPage={page}
        totalPages={10}
        pageSize={10}
        totalCount={100}
        onPageChange={setPage}
        {...args}
      />
    )
  },
  args: {},
}
