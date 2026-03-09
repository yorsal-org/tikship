import { useEffect, useState, useRef } from 'react'
import { Save, Image as ImageIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PostStatus, Category } from '@/types/post'
import { useTranslations } from 'next-intl'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { Trash2 } from 'lucide-react'
import { validationConfig } from '@/config/validation'

interface PublishCardProps {
  status: PostStatus
  initialStatus?: PostStatus
  onStatusChange: (status: PostStatus) => void
  onSave: (status?: PostStatus) => void
  publishedAt: string
  onPublishedAtChange: (date: string) => void
  loading: boolean
  isEditing?: boolean
}

export function PublishCard({
  status,
  initialStatus,
  onStatusChange,
  onSave,
  publishedAt,
  onPublishedAtChange,
  loading,
  isEditing,
}: PublishCardProps) {
  const t = useTranslations('admin.posts')
  const isScheduled = status === PostStatus.SCHEDULED

  // Convert publishedAt string to Date object for DateTimePicker
  const [selectedDate, setSelectedDate] = useState<Date | null>(() =>
    publishedAt ? new Date(publishedAt) : new Date()
  )

  // Update selectedDate when publishedAt changes externally
  const prevPublishedAtRef = useRef(publishedAt)
  useEffect(() => {
    if (publishedAt && publishedAt !== prevPublishedAtRef.current) {
      prevPublishedAtRef.current = publishedAt
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedDate(new Date(publishedAt))
    }
  }, [publishedAt])

  // Handle date change from DateTimePicker
  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date)
    if (date) {
      // Convert to ISO string format for datetime-local compatibility
      onPublishedAtChange(date.toISOString().slice(0, 16))
    }
  }

  return (
    <Card className="p-4 shadow-sm border border-base-content/10 bg-base-100">
      <h3 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase opacity-70">
        <Save size={18} /> {t('editor.publish')}
      </h3>
      <div className="space-y-4 text-sm">
        <div className="flex justify-between items-center bg-base-200/50 p-2 rounded">
          <span className="opacity-70">{t('editor.status')}:</span>
          <div
            className={`badge badge-sm font-bold ${
              status === PostStatus.PUBLISHED
                ? 'badge-success'
                : status === PostStatus.DRAFT
                  ? 'badge-ghost'
                  : 'badge-info'
            }`}
          >
            {status}
          </div>
        </div>

        <div className="form-control">
          <select
            className="select select-bordered select-sm w-full font-medium"
            value={status}
            onChange={e => onStatusChange(e.target.value as PostStatus)}
            disabled={isEditing && initialStatus === PostStatus.PUBLISHED}
          >
            {/* Draft status: show all options when editing (same as create) */}
            {(!isEditing || initialStatus === PostStatus.DRAFT) && (
              <option value={PostStatus.DRAFT}>Draft</option>
            )}

            {/* Published status: cannot change when editing (disabled select) */}
            {/* Scheduled status: only show published and scheduled options */}
            {(!isEditing || initialStatus !== PostStatus.PUBLISHED) && (
              <option value={PostStatus.PUBLISHED}>Published</option>
            )}

            <option value={PostStatus.SCHEDULED}>Scheduled</option>
          </select>
        </div>

        {isScheduled && (
          <div className="form-control">
            <label className="label text-[10px] uppercase font-bold opacity-50 pb-1">
              {t('editor.scheduled_at')}
            </label>
            <DateTimePicker
              selected={selectedDate}
              onChange={handleDateChange}
              minDate={new Date()}
              placeholder={t('editor.select_date_time')}
            />
          </div>
        )}

        <div className="divider my-0 opacity-10"></div>

        <div className="flex gap-2">
          <Button
            className="btn-sm flex-1 btn-primary"
            onClick={() => onSave()}
            loading={loading}
            disabled={loading}
          >
            {!isEditing
              ? // Create mode: button text changes based on status
                status === PostStatus.DRAFT
                ? t('editor.save_draft')
                : status === PostStatus.SCHEDULED
                  ? `${t('editor.schedule_btn')} ${publishedAt ? new Date(publishedAt).toLocaleString() : ''}`
                  : t('editor.publish_btn')
              : // Edit mode: different logic
                status === PostStatus.PUBLISHED
                ? t('editor.update')
                : status === PostStatus.SCHEDULED
                  ? t('editor.scheduled')
                  : t('editor.save_draft')}
          </Button>
        </div>
      </div>
    </Card>
  )
}

interface FeaturedImageCardProps {
  image: string
  onImageChange: (url: string) => void
}

export function FeaturedImageCard({ image, onImageChange }: FeaturedImageCardProps) {
  const t = useTranslations('admin.posts')

  return (
    <Card className="p-4 shadow-sm border border-base-content/10 bg-base-100">
      <h3 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase opacity-70">
        <ImageIcon size={18} /> {t('editor.featured_image')}
      </h3>
      <ImageUpload
        uploadEndpoint="/api/admin/upload/image"
        value={image}
        onChange={onImageChange}
        label=""
        placeholder={t('editor.image_url_prompt')}
      />
    </Card>
  )
}

interface CategoryCardProps {
  categories: Category[]
  selectedIds: string[]
  onToggle: (id: string) => void
}

export function CategoryCard({ categories, selectedIds, onToggle }: CategoryCardProps) {
  const t = useTranslations('admin.posts')
  return (
    <Card className="p-4 shadow-sm border border-base-content/10 bg-base-100">
      <h3 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase opacity-70">
        {t('editor.categories')}
      </h3>
      <div className="max-h-60 overflow-y-auto space-y-1 p-1">
        {categories.map(cat => (
          <label
            key={cat.id}
            className="label cursor-pointer justify-start gap-3 py-1.5 hover:bg-base-200/50 rounded-lg px-2 transition-colors"
          >
            <input
              type="checkbox"
              className="checkbox checkbox-xs checkbox-primary"
              checked={selectedIds.includes(cat.id)}
              onChange={() => onToggle(cat.id)}
            />
            <span className="label-text text-xs font-medium">{cat.name}</span>
          </label>
        ))}
        {categories.length === 0 && (
          <p className="text-xs opacity-50 italic text-center py-4">{t('editor.no_categories')}</p>
        )}
      </div>
    </Card>
  )
}

interface TagCardProps {
  tags: string[]
  tagInput: string
  onInputChange: (val: string) => void
  onAdd: () => void
  onRemove: (tag: string) => void
}

export function TagCard({ tags, tagInput, onInputChange, onAdd, onRemove }: TagCardProps) {
  const t = useTranslations('admin.posts')
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onAdd()
    }
  }

  return (
    <Card className="p-4 shadow-sm border border-base-content/10 bg-base-100">
      <h3 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase opacity-70">
        {t('editor.tags')}
        <span className="text-xs font-normal opacity-50 ml-auto">
          {tagInput.length}/{validationConfig.post.tagName.maxLength}
        </span>
      </h3>
      <div className="space-y-3">
        <input
          type="text"
          placeholder={t('editor.add_tag')}
          className="input input-bordered h-9 w-full text-xs"
          value={tagInput}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          minLength={validationConfig.post.tagName.minLength}
          maxLength={validationConfig.post.tagName.maxLength}
        />
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <div
              key={tag}
              className="badge badge-outline badge-md gap-1 pr-1 pl-2 py-3 border-base-content/20 text-xs"
            >
              {tag}
              <button
                className="btn btn-ghost btn-xs btn-circle h-4 w-4 min-h-0"
                onClick={() => onRemove(tag)}
              >
                <Trash2 size={10} className="text-error" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
