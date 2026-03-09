import { Post, PostStatus } from '@/types/post'

/**
 * Get the effective status of a post
 * If scheduled but publishedAt is in the past, treat as published
 */
export function getEffectivePostStatus(post: Post): PostStatus {
  if (post.status === PostStatus.SCHEDULED && post.publishedAt) {
    const publishedAt = new Date(post.publishedAt)
    const now = new Date()
    if (publishedAt <= now) {
      return PostStatus.PUBLISHED
    }
  }
  return post.status as PostStatus
}
