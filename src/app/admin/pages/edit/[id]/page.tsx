import { postService } from '@/lib/post/service'
import { PostEditor } from '@/components/admin/post/PostEditor'
import { PostType } from '@/types/post'
import { notFound } from 'next/navigation'

interface EditPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPage(props: EditPageProps) {
  const params = await props.params
  const { id } = params
  const post = await postService.getPost(id)

  if (!post || post.type !== PostType.PAGE) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Page</h1>
      <PostEditor initialData={post} type={PostType.PAGE} />
    </div>
  )
}
