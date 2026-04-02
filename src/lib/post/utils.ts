// Content module utilities
// This file is part of the Content Management module

import { postService } from '@/lib/post/service'
import { PostType } from '@/types/post'
import { isAdmin } from '@/lib/admin'

/**
 * Get post by slug with proper URL decoding and admin permission check
 */
export async function getPostBySlug(slug: string, type: PostType) {
  const decodedSlug = decodeURIComponent(slug)
  const isAdminUser = await isAdmin()
  return await postService.getPublicPost(decodedSlug, type, isAdminUser)
}
