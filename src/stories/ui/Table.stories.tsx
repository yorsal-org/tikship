import type { Meta, StoryObj } from '@storybook/react'
import { Table, Column } from '@/components/ui/Table'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Edit, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface User {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
}

const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'active',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'User',
    status: 'active',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'User',
    status: 'inactive',
  },
  {
    id: '4',
    name: 'Alice Brown',
    email: 'alice@example.com',
    role: 'Editor',
    status: 'active',
  },
  {
    id: '5',
    name: 'Charlie Wilson',
    email: 'charlie@example.com',
    role: 'User',
    status: 'active',
  },
]

const columns: Column<User>[] = [
  {
    key: 'name',
    label: 'Name',
    render: user => <span className="font-medium">{user.name}</span>,
  },
  {
    key: 'email',
    label: 'Email',
    render: user => <span className="text-sm opacity-70">{user.email}</span>,
  },
  {
    key: 'role',
    label: 'Role',
    render: user => <span className="badge badge-ghost whitespace-nowrap">{user.role}</span>,
  },
  {
    key: 'status',
    label: 'Status',
    render: user => (
      <StatusBadge
        status={user.status}
        variant={user.status === 'active' ? 'success' : 'ghost'}
        label={user.status}
      />
    ),
  },
  {
    key: 'actions',
    label: 'Actions',
    render: () => (
      <div className="flex gap-2">
        <Button size="xs" variant="ghost" leftIcon={<Edit className="w-3 h-3" />}>
          Edit
        </Button>
        <Button size="xs" variant="error" leftIcon={<Trash2 className="w-3 h-3" />}>
          Delete
        </Button>
      </div>
    ),
  },
]

const meta = {
  title: 'UI/Table',
  component: Table<User>,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A flexible table component with pagination support and customizable columns.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    loading: {
      control: 'boolean',
      description: 'Show loading state',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    emptyMessage: {
      control: 'text',
      description: 'Message to show when no data',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'No data available' },
      },
    },
    variant: {
      control: 'select',
      options: ['card', 'plain'],
      description: 'Table wrapper variant',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'card' },
      },
    },
  },
} satisfies Meta<typeof Table<User>>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    columns,
    data: mockUsers,
    getRowKey: user => user.id,
  },
}

export const Loading: Story = {
  args: {
    columns,
    data: [],
    loading: true,
    getRowKey: user => user.id,
  },
}

export const Empty: Story = {
  args: {
    columns,
    data: [],
    emptyMessage: 'No users found',
    getRowKey: user => user.id,
  },
}

export const PlainVariant: Story = {
  args: {
    columns,
    data: mockUsers,
    variant: 'plain',
    getRowKey: user => user.id,
  },
}

export const WithPagination: Story = {
  render: () => {
    const [page, setPage] = useState(1)
    const pageSize = 3
    const totalPages = Math.ceil(mockUsers.length / pageSize)
    const paginatedData = mockUsers.slice((page - 1) * pageSize, page * pageSize)

    return (
      <Table
        columns={columns}
        data={paginatedData}
        getRowKey={user => user.id}
        pagination={{
          page,
          pageSize,
          total: mockUsers.length,
          totalPages,
        }}
        onPageChange={setPage}
      />
    )
  },
}

export const SimpleColumns: Story = {
  args: {
    columns: [
      {
        key: 'name',
        label: 'Name',
        render: user => user.name,
      },
      {
        key: 'email',
        label: 'Email',
        render: user => user.email,
      },
      {
        key: 'role',
        label: 'Role',
        render: user => user.role,
      },
    ],
    data: mockUsers,
    getRowKey: user => user.id,
  },
}
