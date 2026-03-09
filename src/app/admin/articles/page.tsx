'use client'

import { PostList } from '@/components/admin/post/PostList'
import { PostStats } from '@/components/admin/post/PostStats'
import { PostType } from '@/types/post'

export default function ArticlesPage() {
  return (
    <div className="space-y-6">
      <PostStats type={PostType.ARTICLE} />
      <PostList type={PostType.ARTICLE} />
    </div>
  )
}
