'use client'

import { useState, useEffect } from 'react'
import { useApi } from '@/hooks/useApi'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ChevronRight, ChevronDown, Trash2, Plus, FolderOpen, Folder } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { DeleteConfirmModal } from '@/components/admin/common/DeleteConfirmModal'
import { useModalState } from '@/hooks/useModalState'
import { toast } from '@/lib/utils/toast'
import { validationConfig } from '@/config/validation'
import { Category } from '@/types/post'

interface CategoryTree extends Category {
  _count?: { posts: number }
  children: CategoryTree[]
}

interface FlatCategory {
  id: string
  name: string
  parentId: string | null
  depth: number
}

/** Flatten tree for parent selector dropdown */
function flattenTree(nodes: CategoryTree[], depth = 0): FlatCategory[] {
  const result: FlatCategory[] = []
  for (const node of nodes) {
    result.push({ id: node.id, name: node.name, parentId: node.parentId ?? null, depth })
    if (node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children, depth + 1))
    }
  }
  return result
}

const LEVEL_COLORS = [
  'bg-primary/10 text-primary border-primary/20',
  'bg-secondary/10 text-secondary border-secondary/20',
  'bg-accent/10 text-accent border-accent/20',
]

const LEVEL_INDENT = [0, 24, 48]

interface CategoryRowProps {
  node: CategoryTree
  depth: number
  onDelete: (cat: Category) => void
  t: ReturnType<typeof useTranslations<'admin.posts.categories'>>
}

function CategoryRow({ node, depth, onDelete, t }: CategoryRowProps) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children && node.children.length > 0
  const levelLabel = t(`level_${(depth + 1) as 1 | 2 | 3}` as const)

  return (
    <>
      <tr className="hover:bg-base-200/50 transition-colors">
        <td style={{ paddingLeft: `${LEVEL_INDENT[depth] + 16}px` }}>
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <button
                onClick={() => setExpanded(!expanded)}
                className="btn btn-ghost btn-xs btn-square"
              >
                {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="w-6" />
            )}
            {hasChildren ? (
              <FolderOpen size={15} className="opacity-60 shrink-0" />
            ) : (
              <Folder size={15} className="opacity-40 shrink-0" />
            )}
            <span className="font-semibold text-sm">{node.name}</span>
          </div>
        </td>
        <td width="100">
          <span
            className={`badge badge-sm border text-xs font-medium ${
              LEVEL_COLORS[depth] || LEVEL_COLORS[0]
            }`}
          >
            {levelLabel}
          </span>
        </td>
        <td>
          <span className="text-xs opacity-60 line-clamp-1 max-w-[200px]">
            {node.description || '-'}
          </span>
        </td>
        <td>
          <span className="text-sm">{node._count?.posts || 0}</span>
        </td>
        <td className="text-right">
          <button
            className="btn btn-ghost btn-xs text-error btn-square"
            onClick={() => onDelete(node)}
          >
            <Trash2 size={16} />
          </button>
        </td>
      </tr>
      {hasChildren &&
        expanded &&
        node.children.map(child => (
          <CategoryRow key={child.id} node={child} depth={depth + 1} onDelete={onDelete} t={t} />
        ))}
    </>
  )
}

export default function CategoriesPage() {
  const t = useTranslations('admin.posts.categories')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [parentId, setParentId] = useState<string>('')

  const deleteModal = useModalState<Category>()

  const {
    request: fetchCategories,
    data: catData,
    loading,
  } = useApi<{ categories: CategoryTree[] }>('/api/admin/categories', 'GET')

  const { request: createCategory, loading: creating } = useApi('/api/admin/categories', 'POST')
  const { request: deleteCategory, loading: deleting } = useApi('/api/admin/categories', 'DELETE')

  useEffect(() => {
    fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tree = catData?.categories || []
  const flatList = flattenTree(tree)

  // Determine which parent options are valid (can only add child if depth < 2, i.e. level 1 or 2)
  const parentOptions = flatList.filter(c => c.depth < 2)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return
    await createCategory(
      { name, description, parentId: parentId || undefined },
      {
        onSuccess: () => {
          setName('')
          setDescription('')
          setParentId('')
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Create form */}
      <div className="md:col-span-1">
        <Card className="p-4 border border-base-content/10">
          <h2 className="text-xl font-bold mb-4">{t('add_new')}</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            {/* Parent selector */}
            <div className="form-control">
              <label className="label text-xs uppercase font-bold opacity-60 px-0">
                {t('parent')}
              </label>
              <select
                className="select select-bordered h-10 min-h-0 text-sm"
                value={parentId}
                onChange={e => setParentId(e.target.value)}
              >
                <option value="">{t('parent_none')}</option>
                {parentOptions.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {'\u00A0'.repeat(cat.depth * 4)}
                    {cat.depth > 0 ? '└ ' : ''}
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Name */}
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

            {/* Description */}
            <div className="form-control">
              <label className="label text-xs uppercase font-bold opacity-60 px-0">
                {t('description')}
                <span className="text-xs font-normal opacity-50 ml-auto">
                  {description.length}/{validationConfig.category.description.maxLength}
                </span>
              </label>
              <textarea
                className="textarea textarea-bordered min-h-20"
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

        {/* Legend */}
        <Card className="p-4 border border-base-content/10 mt-4">
          <p className="text-xs font-bold uppercase opacity-50 mb-3">{t('depth_label')}</p>
          <div className="space-y-2">
            {([1, 2, 3] as const).map(level => (
              <div key={level} className="flex items-center gap-2">
                <span
                  className={`badge badge-sm border shrink-0 ${
                    LEVEL_COLORS[level - 1]
                  }`}
                >
                  {t(`level_${level}`)}
                </span>
                <span className="text-xs opacity-50">
                  {level === 1 && t('parent_none')}
                  {level === 2 && t('subcategories')}
                  {level === 3 && t('max_depth_exceeded').replace('.', '')}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Category tree table */}
      <div className="md:col-span-2">
        <Card className="border border-base-content/10 overflow-hidden">
          {loading ? (
            <div className="p-8 flex justify-center">
              <span className="loading loading-spinner loading-md" />
            </div>
          ) : tree.length === 0 ? (
            <div className="p-10 text-center opacity-40">
              <FolderOpen size={40} className="mx-auto mb-3" />
              <p className="text-sm">{t('no_found')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm w-full">
                <thead>
                  <tr className="text-xs uppercase opacity-50 border-b border-base-content/10">
                    <th>{t('name')}</th>
                    <th>{t('level')}</th>
                    <th>{t('description')}</th>
                    <th>{t('count')}</th>
                    <th className="text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {tree.map(root => (
                    <CategoryRow
                      key={root.id}
                      node={root}
                      depth={0}
                      onDelete={handleDelete}
                      t={t}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
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
