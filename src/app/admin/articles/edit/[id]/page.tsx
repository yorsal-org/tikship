import { postService } from '@/lib/post/service'
import { PostEditor } from '@/components/admin/post/PostEditor'
import { PostType } from '@/types/post'
import { notFound } from 'next/navigation'

interface EditArticleProps {
  params: Promise<{ id: string }>
}

export default async function EditArticlePage(props: EditArticleProps) {
  const params = await props.params
  const { id } = params
  const post = await postService.getPost(id)

  if (!post || post.type !== PostType.ARTICLE) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Article</h1>
      <PostEditor initialData={post} type={PostType.ARTICLE} />
    </div>
  )
}
