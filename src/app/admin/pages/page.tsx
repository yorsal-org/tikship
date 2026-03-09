'use client'

import { PostList } from '@/components/admin/post/PostList'
import { PostStats } from '@/components/admin/post/PostStats'
import { PostType } from '@/types/post'

export default function PagesPage() {
  return (
    <div className="space-y-6">
      <PostStats type={PostType.PAGE} />
      <PostList type={PostType.PAGE} />
    </div>
  )
}
