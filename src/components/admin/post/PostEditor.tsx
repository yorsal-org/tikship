'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RichTextEditor } from '@/components/admin/post/RichTextEditor'
import { Post, PostInput, PostStatus, PostType } from '@/types/post'
import { CategoriesTreeResponse } from '@/types/admin'

type CategoryTreeNode = CategoriesTreeResponse['categories'][number]
import { ApiResponse } from '@/types/api'
import { useApi } from '@/hooks/useApi'
import { Globe, History } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/utils/toast'
import { generateSlug } from '@/lib/utils/common'
import {
  PublishCard,
  FeaturedImageCard,
  CategoryCard,
  TagCard,
} from '@/components/admin/post/PostSidebar'
import { validationConfig } from '@/config/validation'
import { siteConfig } from '@/config/site'

interface PostEditorProps {
  initialData?: Post
  type: PostType
}

export function PostEditor({ initialData, type }: PostEditorProps) {
  const router = useRouter()
  const t = useTranslations('admin.posts')
  const isEditing = !!initialData

  // Determine initial status: if scheduled but time has passed, treat as published
  const getInitialStatus = (): PostStatus => {
    if (initialData?.status === PostStatus.SCHEDULED && initialData?.publishedAt) {
      const publishedAt = new Date(initialData.publishedAt)
      const now = new Date()
      if (publishedAt <= now) {
        return PostStatus.PUBLISHED
      }
    }
    return (initialData?.status as PostStatus) || PostStatus.DRAFT
  }

  const [title, setTitle] = useState(initialData?.title || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [status, setStatus] = useState<PostStatus>(getInitialStatus())
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '')
  const [featuredImage, setFeaturedImage] = useState(initialData?.featuredImage || '')
  const [seoTitle, setSeoTitle] = useState(initialData?.seoTitle || '')
  const [seoDescription, setSeoDescription] = useState(initialData?.seoDescription || '')
  const [publishedAt, setPublishedAt] = useState<string>(
    initialData?.publishedAt
      ? new Date(initialData.publishedAt).toISOString()
      : new Date().toISOString()
  )

  // For categories and tags (ARTICLE only)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialData?.categories?.map(c => c.category.id) || []
  )
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(initialData?.tags?.map(t => t.tag.name) || [])

  const [allCategories, setAllCategories] = useState<CategoryTreeNode[]>([])

  // API Hooks
  const { request: savePost, loading: saving } = useApi<Post>(
    '/api/admin/posts',
    isEditing ? 'PUT' : 'POST'
  )
  const { request: fetchCategories } = useApi<CategoriesTreeResponse>(
    '/api/admin/categories',
    'GET'
  )

  useEffect(() => {
    if (type === PostType.ARTICLE) {
      fetchCategories(undefined, {
        onSuccess: (res: ApiResponse<CategoriesTreeResponse>) => {
          if (res.data?.categories) {
            setAllCategories(res.data.categories)
          }
        },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type])

  // Slug generation logic - only auto-generate when creating new post and slug is empty
  useEffect(() => {
    if (!isEditing && title) {
      setSlug(generateSlug(title))
    }
  }, [title, isEditing])

  const handleSave = async (overriddenStatus?: PostStatus) => {
    // Validation
    if (!title.trim()) {
      toast.error(t('editor.title_required'))
      return
    }
    if (!content.trim()) {
      toast.error(t('editor.content_required'))
      return
    }
    if (!slug.trim()) {
      toast.error(t('editor.slug_required'))
      return
    }

    const finalStatus = overriddenStatus || status

    const data: PostInput = {
      title,
      content,
      slug,
      excerpt,
      featuredImage,
      type,
      status: finalStatus,
      seoTitle,
      seoDescription,
      publishedAt:
        finalStatus === PostStatus.SCHEDULED ? new Date(publishedAt).toISOString() : undefined,
      categoryIds: type === PostType.ARTICLE ? selectedCategories : undefined,
      tagNames: type === PostType.ARTICLE ? tags : undefined,
    }

    await savePost(data, {
      urlOverride: isEditing ? `/api/admin/posts/${initialData.id}` : undefined,
      onSuccess: () => {
        toast.success(isEditing ? t('save_success') : t('created_success'))
        router.refresh()
        if (!isEditing) {
          router.push(`${siteConfig.admin.path}/${type.toLowerCase()}s`)
        }
      },
      onError: (error: string) => {
        toast.error(error)
      },
    })
  }

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev => (prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]))
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-1">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <div className="form-control">
          <input
            type="text"
            placeholder={t('editor.title_placeholder')}
            className="input input-ghost input-lg w-full text-3xl font-bold px-0 focus:bg-transparent focus:outline-none placeholder:opacity-50"
            value={title}
            onChange={e => setTitle(e.target.value)}
            minLength={validationConfig.post.title.minLength}
            maxLength={validationConfig.post.title.maxLength}
          />
          <div className="text-xs opacity-50 mt-1 text-right">
            {title.length}/{validationConfig.post.title.maxLength}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm opacity-70">
          <span className="font-mono">{t('editor.permalink')}:</span>
          <span>/{type === PostType.ARTICLE ? 'blog' : 'p'}/</span>
          <input
            type="text"
            className="input input-xs input-bordered w-auto"
            value={slug}
            onChange={e => setSlug(e.target.value)}
            minLength={validationConfig.post.slug.minLength}
            maxLength={validationConfig.post.slug.maxLength}
          />
          <span className="text-xs opacity-50">
            {slug.length}/{validationConfig.post.slug.maxLength}
          </span>
        </div>

        <RichTextEditor
          content={content}
          onChange={setContent}
          placeholder={t('editor.content_placeholder')}
        />

        {/* Excerpt */}
        <div className="collapse collapse-arrow bg-base-100 border border-base-content/10 shadow-sm">
          <input type="checkbox" />
          <div className="collapse-title font-medium flex items-center gap-2">
            <History size={18} />
            {t('editor.summary')}
            <span className="text-xs opacity-50 ml-auto">
              {excerpt.length}/{validationConfig.post.excerpt.maxLength}
            </span>
          </div>
          <div className="collapse-content">
            <textarea
              className="textarea textarea-bordered w-full h-24"
              placeholder={t('editor.summary_placeholder')}
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              maxLength={validationConfig.post.excerpt.maxLength}
            />
          </div>
        </div>

        {/* SEO Settings */}
        <div className="collapse collapse-arrow bg-base-100 border border-base-content/10 shadow-sm overflow-visible">
          <input type="checkbox" defaultChecked />
          <div className="collapse-title font-medium flex items-center gap-2">
            <Globe size={18} />
            {t('editor.seo')}
          </div>
          <div className="collapse-content space-y-6 pt-2">
            {/* Search Engine Preview */}
            <div className="p-4 bg-base-100 rounded-xl border border-base-content/10 shadow-sm max-w-2xl">
              <div className="text-xs text-base-content/50 mb-2 flex items-center gap-1 uppercase font-bold tracking-wider">
                <Globe size={12} /> {t('editor.seo_preview')}
              </div>
              <div className="space-y-1">
                <div className="text-primary text-xl font-medium hover:underline cursor-pointer truncate">
                  {seoTitle || title || 'Example Title'}
                </div>
                <div className="text-success text-sm flex items-center gap-1">
                  {type === PostType.ARTICLE ? 'blog' : 'p'}/
                  <span className="font-medium">{slug || 'your-slug'}</span>
                </div>
                <div className="text-base-content/70 text-sm line-clamp-2">
                  {seoDescription ||
                    excerpt ||
                    (content
                      ? content.substring(0, 160).replace(/<[^>]*>/g, '')
                      : 'No description provided.')}
                </div>
              </div>
            </div>

            <div className="divider opacity-10 my-0"></div>

            <div className="grid grid-cols-1 gap-6">
              <div className="form-control">
                <div className="flex justify-between items-end mb-2">
                  <label className="text-xs uppercase font-bold opacity-60">
                    {t('editor.seo_title')}
                  </label>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      seoTitle.length > validationConfig.post.seoTitle.maxLength
                        ? 'bg-error/20 text-error'
                        : seoTitle.length > 50
                          ? 'bg-success/20 text-success'
                          : 'opacity-40'
                    }`}
                  >
                    {seoTitle.length} / {validationConfig.post.seoTitle.maxLength}
                  </span>
                </div>
                <input
                  type="text"
                  placeholder={t('editor.seo_title_hint')}
                  className={`input input-bordered h-10 w-full text-sm ${seoTitle.length > validationConfig.post.seoTitle.maxLength ? 'input-error' : ''}`}
                  value={seoTitle}
                  onChange={e => setSeoTitle(e.target.value)}
                  maxLength={validationConfig.post.seoTitle.maxLength}
                />
              </div>

              <div className="form-control">
                <div className="flex justify-between items-end mb-2">
                  <label className="text-xs uppercase font-bold opacity-60">
                    {t('editor.seo_description')}
                  </label>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      seoDescription.length > validationConfig.post.seoDescription.maxLength
                        ? 'bg-error/20 text-error'
                        : seoDescription.length > 140
                          ? 'bg-success/20 text-success'
                          : 'opacity-40'
                    }`}
                  >
                    {seoDescription.length} / {validationConfig.post.seoDescription.maxLength}
                  </span>
                </div>
                <textarea
                  className={`textarea textarea-bordered min-h-24 w-full text-sm py-3 leading-relaxed ${seoDescription.length > validationConfig.post.seoDescription.maxLength ? 'textarea-error' : ''}`}
                  placeholder={t('editor.seo_description_hint')}
                  value={seoDescription}
                  onChange={e => setSeoDescription(e.target.value)}
                  maxLength={validationConfig.post.seoDescription.maxLength}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-80 space-y-6">
        <PublishCard
          status={status}
          initialStatus={initialData?.status as PostStatus}
          onStatusChange={setStatus}
          onSave={handleSave}
          publishedAt={publishedAt}
          onPublishedAtChange={setPublishedAt}
          loading={saving}
          isEditing={isEditing}
        />

        <FeaturedImageCard image={featuredImage} onImageChange={setFeaturedImage} />

        {type === PostType.ARTICLE && (
          <>
            <CategoryCard
              categories={allCategories}
              selectedIds={selectedCategories}
              onToggle={toggleCategory}
            />
            <TagCard
              tags={tags}
              tagInput={tagInput}
              onInputChange={setTagInput}
              onAdd={() => {
                const val = tagInput.trim()
                if (val && !tags.includes(val)) {
                  setTags([...tags, val])
                }
                setTagInput('')
              }}
              onRemove={removeTag}
            />
          </>
        )}
      </div>
    </div>
  )
}
