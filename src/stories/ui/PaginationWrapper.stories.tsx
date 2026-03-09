import type { Meta, StoryObj } from '@storybook/react'
import { PaginationWrapper } from '@/components/ui/PaginationWrapper'
import { useState, useEffect, useRef } from 'react'

const meta = {
  title: 'UI/PaginationWrapper',
  component: PaginationWrapper,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A flexible pagination wrapper component that supports three pagination types: traditional page-based navigation, load more button, and infinite scroll.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    items: {
      control: false,
      description: 'Array of items to display',
      table: {
        type: { summary: 'unknown[]' },
      },
    },
    totalCount: {
      control: 'number',
      description: 'Total number of items',
      table: {
        type: { summary: 'number' },
      },
    },
    currentPage: {
      control: 'number',
      description: 'Current active page (for traditional pagination)',
      table: {
        type: { summary: 'number' },
      },
    },
    pageSize: {
      control: 'number',
      description: 'Number of items per page',
      table: {
        type: { summary: 'number' },
      },
    },
    type: {
      control: 'select',
      options: ['traditional', 'loadMore', 'infinite'],
      description: 'Pagination type',
      table: {
        type: { summary: "'traditional' | 'loadMore' | 'infinite'" },
      },
    },
    onPageChange: {
      action: 'pageChanged',
      description: 'Callback when page changes',
      table: {
        type: { summary: '(page: number) => void' },
      },
    },
    onLoadMore: {
      action: 'loadMore',
      description: 'Callback when load more button is clicked',
      table: {
        type: { summary: '() => void' },
      },
    },
    loading: {
      control: 'boolean',
      description: 'Loading state',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    hasMore: {
      control: 'boolean',
      description: 'Whether there are more items to load',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    renderData: {
      control: false,
      description: 'Function to render the data items',
      table: {
        type: { summary: '(data: unknown[]) => ReactNode' },
      },
    },
    containerClassName: {
      control: 'text',
      description: 'Additional CSS classes for container',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
      },
    },
    showSummary: {
      control: 'boolean',
      description: 'Show result summary (for traditional pagination)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    loadMoreText: {
      control: 'text',
      description: 'Text for load more button',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "'Load More'" },
      },
    },
    loadingText: {
      control: 'text',
      description: 'Text shown when loading',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "'Loading...'" },
      },
    },
    noMoreText: {
      control: 'text',
      description: 'Text shown when no more items',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "'No more items'" },
      },
    },
    observerTarget: {
      control: false,
      description: 'Ref for intersection observer (infinite scroll)',
      table: {
        type: { summary: 'React.RefObject<HTMLDivElement | null>' },
      },
    },
  },
} satisfies Meta<typeof PaginationWrapper>

export default meta
type Story = StoryObj<typeof meta>

// Mock data generator
interface MockItem {
  id: number
  title: string
  description: string
}

const generateMockData = (count: number, offset = 0): MockItem[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: offset + i + 1,
    title: `Item ${offset + i + 1}`,
    description: `This is the description for item ${offset + i + 1}`,
  }))
}

// Render function for mock data
const renderMockData = (items: unknown[]) => {
  const typedItems = items as MockItem[]
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {typedItems.map(item => (
        <div key={item.id} className="card bg-base-200 shadow-md">
          <div className="card-body">
            <h3 className="card-title text-lg">{item.title}</h3>
            <p className="text-sm text-base-content/70">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export const TraditionalPagination: Story = {
  render: args => {
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 9
    const totalCount = 100
    const [loading, setLoading] = useState(false)

    const handlePageChange = (page: number) => {
      setLoading(true)
      setCurrentPage(page)
      // Simulate API call
      setTimeout(() => {
        setLoading(false)
      }, 500)
    }

    const items = generateMockData(pageSize, (currentPage - 1) * pageSize)

    return (
      <div className="w-full max-w-6xl">
        <PaginationWrapper
          items={items}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          type="traditional"
          onPageChange={handlePageChange}
          loading={loading}
          renderData={renderMockData}
          {...args}
        />
      </div>
    )
  },
  args: {},
}

export const LoadMoreButton: Story = {
  render: args => {
    const [items, setItems] = useState<MockItem[]>(generateMockData(9))
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const totalCount = 50

    const handleLoadMore = () => {
      setLoading(true)
      // Simulate API call
      setTimeout(() => {
        const newItems = generateMockData(9, items.length)
        setItems([...items, ...newItems])
        setLoading(false)
        if (items.length + 9 >= totalCount) {
          setHasMore(false)
        }
      }, 1000)
    }

    return (
      <div className="w-full max-w-6xl">
        <PaginationWrapper
          items={items}
          totalCount={totalCount}
          currentPage={1}
          pageSize={9}
          type="loadMore"
          onPageChange={() => {}}
          onLoadMore={handleLoadMore}
          loading={loading}
          hasMore={hasMore}
          renderData={renderMockData}
          {...args}
        />
      </div>
    )
  },
  args: {},
}

export const InfiniteScroll: Story = {
  render: args => {
    const [items, setItems] = useState<MockItem[]>(generateMockData(9))
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const observerTarget = useRef<HTMLDivElement>(null)
    const totalCount = 50

    useEffect(() => {
      const observer = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting && hasMore && !loading) {
            setLoading(true)
            // Simulate API call
            setTimeout(() => {
              const newItems = generateMockData(9, items.length)
              setItems(prev => [...prev, ...newItems])
              setLoading(false)
              if (items.length + 9 >= totalCount) {
                setHasMore(false)
              }
            }, 1000)
          }
        },
        { threshold: 0.1 }
      )

      if (observerTarget.current) {
        observer.observe(observerTarget.current)
      }

      return () => observer.disconnect()
    }, [items.length, hasMore, loading])

    return (
      <div className="w-full max-w-6xl">
        <PaginationWrapper
          items={items}
          totalCount={totalCount}
          currentPage={1}
          pageSize={9}
          type="infinite"
          onPageChange={() => {}}
          loading={loading}
          hasMore={hasMore}
          renderData={renderMockData}
          observerTarget={observerTarget}
          {...args}
        />
      </div>
    )
  },
  args: {},
}

export const EmptyState: Story = {
  render: args => {
    return (
      <div className="w-full max-w-6xl">
        <PaginationWrapper
          items={[]}
          totalCount={0}
          currentPage={1}
          pageSize={9}
          type="traditional"
          onPageChange={() => {}}
          renderData={renderMockData}
          {...args}
        />
      </div>
    )
  },
  args: {},
}

export const LoadingState: Story = {
  render: args => {
    return (
      <div className="w-full max-w-6xl">
        <PaginationWrapper
          items={[]}
          totalCount={100}
          currentPage={1}
          pageSize={9}
          type="traditional"
          onPageChange={() => {}}
          loading={true}
          renderData={renderMockData}
          {...args}
        />
      </div>
    )
  },
  args: {},
}

export const WithoutSummary: Story = {
  render: args => {
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 9
    const totalCount = 100

    const items = generateMockData(pageSize, (currentPage - 1) * pageSize)

    return (
      <div className="w-full max-w-6xl">
        <PaginationWrapper
          items={items}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          type="traditional"
          onPageChange={setCurrentPage}
          renderData={renderMockData}
          showSummary={false}
          {...args}
        />
      </div>
    )
  },
  args: {},
}

export const CustomText: Story = {
  render: args => {
    const [items, setItems] = useState<MockItem[]>(generateMockData(9))
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const totalCount = 50

    const handleLoadMore = () => {
      setLoading(true)
      setTimeout(() => {
        const newItems = generateMockData(9, items.length)
        setItems([...items, ...newItems])
        setLoading(false)
        if (items.length + 9 >= totalCount) {
          setHasMore(false)
        }
      }, 1000)
    }

    return (
      <div className="w-full max-w-6xl">
        <PaginationWrapper
          items={items}
          totalCount={totalCount}
          currentPage={1}
          pageSize={9}
          type="loadMore"
          onPageChange={() => {}}
          onLoadMore={handleLoadMore}
          loading={loading}
          hasMore={hasMore}
          renderData={renderMockData}
          loadMoreText="Show More Items"
          loadingText="Please wait..."
          noMoreText="That's all folks!"
          {...args}
        />
      </div>
    )
  },
  args: {},
}
