'use client'

import { useState, useEffect } from 'react'
import { useApi } from '@/hooks/useApi'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Table, Column } from '@/components/ui/Table'
import { Trash2, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { DeleteConfirmModal } from '@/components/admin/common/DeleteConfirmModal'

import { Category } from '@/types/post'
import { CategoriesListResponse } from '@/types/admin'
import { useModalState } from '@/hooks/useModalState'
import { toast } from '@/lib/utils/toast'
import { validationConfig } from '@/config/validation'

type CategoryWithCount = Category & { _count?: { posts: number } }

export default function CategoriesPage() {
  const t = useTranslations('admin.posts.categories')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  // Delete Modal State using custom hook
  const deleteModal = useModalState<Category>()

  const {
    request: fetchCategories,
    data: catData,
    loading,
  } = useApi<CategoriesListResponse>('/api/admin/categories', 'GET')
  const { request: createCategory, loading: creating } = useApi('/api/admin/categories', 'POST')
  const { request: deleteCategory, loading: deleting } = useApi('/api/admin/categories', 'DELETE')

  useEffect(() => {
    fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return
    await createCategory(
      { name, description },
      {
        onSuccess: () => {
          setName('')
          setDescription('')
          fetchCategories()
        },
        onError: (error: string) => {
          toast.error(error)
        },
      }
    )
  }

  const handleDelete = (cat: Category) => {
    deleteModal.open(cat)
  }

  const handleConfirmDelete = async () => {
    if (!deleteModal.selectedItem) return
    await deleteCategory(undefined, {
      params: { id: deleteModal.selectedItem.id },
      onSuccess: () => {
        deleteModal.close()
        fetchCategories()
      },
    })
  }

  const categories = (catData?.categories || []) as CategoryWithCount[]

  const columns: Column<CategoryWithCount>[] = [
    {
      key: 'name',
      label: t('name'),
      render: cat => <span className="font-bold text-sm">{cat.name}</span>,
    },
    {
      key: 'description',
      label: t('description'),
      render: cat => (
        <span className="text-xs opacity-70 line-clamp-1 max-w-xs">{cat.description || '-'}</span>
      ),
    },
    {
      key: 'count',
      label: t('count'),
      render: cat => <span className="text-sm font-mono">{cat._count?.posts || 0}</span>,
    },
    {
      key: 'actions',
      label: t('actions'),
      className: 'text-right',
      render: cat => (
        <button
          className="btn btn-ghost btn-xs text-error btn-square"
          onClick={() => handleDelete(cat)}
        >
          <Trash2 size={16} />
        </button>
      ),
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <Card className="p-4 border border-base-content/10">
          <h2 className="text-xl font-bold mb-4">{t('add_new')}</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="form-control">
              <label className="label text-xs uppercase font-bold opacity-60 px-0">
                {t('name')}
                <span className="text-xs font-normal opacity-50 ml-auto">
                  {name.length}/{validationConfig.category.name.maxLength}
                </span>
              </label>
              <input
                className="input input-bordered h-10 min-h-0"
                value={name}
                onChange={e => setName(e.target.value)}
                minLength={validationConfig.category.name.minLength}
                maxLength={validationConfig.category.name.maxLength}
                required
              />
            </div>
            <div className="form-control">
              <label className="label text-xs uppercase font-bold opacity-60 px-0">
                {t('description')}
                <span className="text-xs font-normal opacity-50 ml-auto">
                  {description.length}/{validationConfig.category.description.maxLength}
                </span>
              </label>
              <textarea
                className="textarea textarea-bordered min-h-24"
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={validationConfig.category.description.maxLength}
              />
            </div>
            <Button type="submit" variant="primary" className="w-full btn-sm" loading={creating}>
              <Plus size={16} /> {t('add_btn')}
            </Button>
          </form>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Table
          columns={columns}
          data={categories}
          loading={loading}
          emptyMessage={t('no_found')}
          getRowKey={cat => cat.id}
          variant="card"
        />
      </div>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title={t('delete')}
        message={t('delete_confirm', {
          name: deleteModal.selectedItem?.name || '',
        })}
        confirmText={t('delete')}
      />
    </div>
  )
}
