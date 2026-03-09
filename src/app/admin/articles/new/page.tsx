import { PostEditor } from '@/components/admin/post/PostEditor'
import { PostType } from '@/types/post'

export default function NewArticlePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">New Article</h1>
      <PostEditor type={PostType.ARTICLE} />
    </div>
  )
}
