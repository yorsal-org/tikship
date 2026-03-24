/**
 * Content Management System Types
 */

/**
 * Type of content
 */
export enum PostType {
  ARTICLE = 'ARTICLE',
  PAGE = 'PAGE',
}

/**
 * Status of content
 */
export enum PostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  SCHEDULED = 'SCHEDULED',
  TRASH = 'TRASH',
}

/**
 * Base Post metadata
 */
export interface PostMeta {
  id: string
  postId: string
  key: string
  value: string
}

/**
 * Content Category
 */
export interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  parentId?: string | null
  parent?: Category | null
  children?: Category[] | null
  createdAt: Date | string
  updatedAt: Date | string
}

/**
 * Content Tag
 */
export interface Tag {
  id: string
  name: string
  slug: string
  createdAt: Date | string
  updatedAt: Date | string
}

/**
 * Content Version Snapshot
 */

/**
 * Main Post Entity
 */
export interface Post {
  id: string
  title: string
  content: string
  slug: string
  excerpt?: string | null
  featuredImage?: string | null
  type: PostType | string
  status: PostStatus | string

  seoTitle?: string | null
  seoDescription?: string | null

  publishedAt?: Date | string | null
  modifiedAt: Date | string
  createdAt: Date | string
  updatedAt: Date | string

  authorId: string
  author?: {
    id: string
    username: string
    name?: string | null
    avatar?: string | null
  }

  categories?: {
    category: Category
  }[]
  tags?: {
    tag: Tag
  }[]
  metas?: PostMeta[]
}

/**
 * Data for creating/updating a Post
 */
export interface PostInput {
  title: string
  content: string
  slug?: string
  excerpt?: string
  featuredImage?: string
  type?: PostType
  status?: PostStatus
  seoTitle?: string
  seoDescription?: string
  publishedAt?: Date | string | null
  categoryIds?: string[]
  tagNames?: string[] // Tags can often be created on the fly
  metas?: Record<string, string> // Key-value pairs for metadata
}
/**
 * Stats for Content
 */
export interface PostStatsData {
  total: number
  published: number
  draft: number
  trash: number
}

/**
 * Posts list API response
 */
export interface PostsListResponse {
  items: Post[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type PostBulkAction = 'publish' | 'trash' | 'delete' | 'restore'

/**
 * Props for content editor components
 */
export interface EditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export interface PostEditorProps {
  initialData?: unknown
  type: string
}
