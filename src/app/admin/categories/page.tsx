'use client'

import { useState, useEffect, useCallback } from 'react'
import { useApi } from '@/hooks/useApi'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  ChevronRight,
  ChevronDown,
  Trash2,
  Plus,
  FolderOpen,
  Folder,
  Pencil,
  X,
  GripVertical,
  Save,
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslations, useLocale } from 'next-intl'
import { siteConfig } from '@/config/site'
import { DeleteConfirmModal } from '@/components/admin/common/DeleteConfirmModal'
import { useModalState } from '@/hooks/useModalState'
import { toast } from '@/lib/utils/toast'
import { validationConfig } from '@/config/validation'
import { Category } from '@/types/post'

interface CategoryTree extends Category {
  order?: number
  _count?: { posts: number }
  children: CategoryTree[]
}

interface FlatCategory {
  id: string
  name: string
  parentId: string | null
  depth: number
  locale?: string
}

/** Flatten tree for parent selector dropdown */
function flattenTree(nodes: CategoryTree[], depth = 0): FlatCategory[] {
  const result: FlatCategory[] = []
  for (const node of nodes) {
    result.push({
      id: node.id,
      name: node.name,
      parentId: node.parentId ?? null,
      depth,
      locale: node.locale,
    })
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
  onEdit: (cat: CategoryTree) => void
  onReorderChildren: (parentId: string | null, newChildren: CategoryTree[]) => void
  t: ReturnType<typeof useTranslations<'admin.posts.categories'>>
}

function SortableCategoryRow({ node, depth, onDelete, onEdit, onReorderChildren, t }: CategoryRowProps) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children && node.children.length > 0
  const levelLabel = t(`level_${(depth + 1) as 1 | 2 | 3}` as const)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <>
      <tr ref={setNodeRef} style={style} className="hover:bg-base-200/50 transition-colors">
        <td style={{ paddingLeft: `${LEVEL_INDENT[depth] + 16}px` }}>
          <div className="flex items-center gap-2">
            <span {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing opacity-30 hover:opacity-70 shrink-0 touch-none">
              <GripVertical size={14} />
            </span>
            {hasChildren ? (
              <button onClick={() => setExpanded(!expanded)} className="btn btn-ghost btn-xs btn-square">
                {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="w-6" />
            )}
            {hasChildren ? <FolderOpen size={15} className="opacity-60 shrink-0" /> : <Folder size={15} className="opacity-40 shrink-0" />}
            <span className="font-semibold text-sm">{node.name}</span>
            {node.locale && (
              <span className="badge badge-xs badge-ghost opacity-50 font-mono">{node.locale}</span>
            )}
          </div>
        </td>
        <td width="100">
          <span className={`badge badge-sm border text-xs font-medium ${LEVEL_COLORS[depth] || LEVEL_COLORS[0]}`}>
            {levelLabel}
          </span>
        </td>
        <td><span className="text-xs opacity-60 line-clamp-1 max-w-[200px]">{node.description || '-'}</span></td>
        <td><span className="text-sm">{node._count?.posts || 0}</span></td>
        <td className="text-right">
          <div className="flex items-center justify-end gap-1">
            <button className="btn btn-ghost btn-xs btn-square" onClick={() => onEdit(node)} title={t('edit')}>
              <Pencil size={14} />
            </button>
            <button className="btn btn-ghost btn-xs text-error btn-square" onClick={() => onDelete(node)}>
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      </tr>
      {hasChildren && expanded && (
        <SortableGroup
          nodes={node.children}
          parentId={node.id}
          depth={depth + 1}
          onDelete={onDelete}
          onEdit={onEdit}
          onReorderChildren={onReorderChildren}
          t={t}
        />
      )}
    </>
  )
}

interface SortableGroupProps {
  nodes: CategoryTree[]
  parentId: string | null
  depth: number
  onDelete: (cat: Category) => void
  onEdit: (cat: CategoryTree) => void
  onReorderChildren: (parentId: string | null, newChildren: CategoryTree[]) => void
  t: ReturnType<typeof useTranslations<'admin.posts.categories'>>
}

function SortableGroup({ nodes, parentId, depth, onDelete, onEdit, onReorderChildren, t }: SortableGroupProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = nodes.findIndex(n => n.id === active.id)
    const newIndex = nodes.findIndex(n => n.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    onReorderChildren(parentId, arrayMove(nodes, oldIndex, newIndex))
  }, [nodes, parentId, onReorderChildren])

  // DndContext renders an inaccessible <div> which is invalid inside <tbody>.
  // Render it via a portal so it mounts outside the table DOM.
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      accessibility={{ container: typeof document !== 'undefined' ? document.body : undefined }}
    >
      <SortableContext items={nodes.map(n => n.id)} strategy={verticalListSortingStrategy}>
        {nodes.map(node => (
          <SortableCategoryRow
            key={node.id}
            node={node}
            depth={depth}
            onDelete={onDelete}
            onEdit={onEdit}
            onReorderChildren={onReorderChildren}
            t={t}
          />
        ))}
      </SortableContext>
    </DndContext>
  )
}

interface EditModalProps {
  cat: CategoryTree
  onClose: () => void
  onSaved: () => void
  t: ReturnType<typeof useTranslations<'admin.posts.categories'>>
}

function EditCategoryModal({ cat, onClose, onSaved, t }: EditModalProps) {
  const [name, setName] = useState(cat.name)
  const [description, setDescription] = useState(cat.description || '')
  const [locale, setLocale] = useState(cat.locale || 'en')

  const { request: updateCategory, loading: saving } = useApi(`/api/admin/categories`, 'PATCH')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return
    await updateCategory(
      { name, description, locale },
      {
        params: { id: cat.id },
        onSuccess: () => {
          toast.success(t('update_success'))
          onSaved()
          onClose()
        },
        onError: (error: string) => {
          toast.error(error)
        },
      }
    )
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{t('edit_title')}</h3>
          <button className="btn btn-ghost btn-sm btn-square" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Locale selector */}
          <div className="form-control">
            <label className="label block text-xs uppercase font-bold opacity-60 px-0">
              {t('locale')}
            </label>
            <select
              className="select select-bordered h-10 min-h-0 text-sm"
              value={locale}
              onChange={e => setLocale(e.target.value)}
            >
              {siteConfig.locale.supported.map(lang => (
                <option key={lang.value} value={lang.value}>
                  {lang.nativeName} ({lang.label})
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div className="form-control">
            <label className="label block text-xs uppercase font-bold opacity-60 px-0">
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
            <label className="label block text-xs uppercase font-bold opacity-60 px-0">
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

          <div className="modal-action mt-2">
            <Button type="submit" variant="primary" className="btn-sm" loading={saving}>
              {t('edit_btn')}
            </Button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  )
}

export default function CategoriesPage() {
  const t = useTranslations('admin.posts.categories')
  const currentLocale = useLocale()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [parentId, setParentId] = useState<string>('')
  const [locale, setLocale] = useState<string>(currentLocale)
  const [localTree, setLocalTree] = useState<CategoryTree[]>([])
  const [pendingReorder, setPendingReorder] = useState(false)

  const deleteModal = useModalState<Category>()
  const [editTarget, setEditTarget] = useState<CategoryTree | null>(null)

  const {
    request: fetchCategories,
    data: catData,
    loading,
  } = useApi<{ categories: CategoryTree[] }>('/api/admin/categories', 'GET')

  const { request: createCategory, loading: creating } = useApi('/api/admin/categories', 'POST')
  const { request: deleteCategory, loading: deleting } = useApi('/api/admin/categories', 'DELETE')
  const { request: saveReorder, loading: reordering } = useApi('/api/admin/categories/reorder', 'PUT')

  useEffect(() => {
    fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (catData?.categories) {
      setLocalTree(catData.categories)
      setPendingReorder(false)
    }
  }, [catData])

  const flatList = flattenTree(localTree)
  const parentOptions = flatList.filter(c => c.depth < 2 && c.locale === locale)
  const groupedTrees = siteConfig.locale.supported
    .map(lang => ({
      lang,
      nodes: localTree.filter(cat => (cat.locale || siteConfig.locale.default) === lang.value),
    }))
    .filter(group => group.nodes.length > 0)

  const updateTreeChildren = useCallback(
    (tree: CategoryTree[], parentId: string | null, newChildren: CategoryTree[]): CategoryTree[] => {
      if (parentId === null) return newChildren
      return tree.map(node => {
        if (node.id === parentId) return { ...node, children: newChildren }
        if (node.children.length > 0)
          return { ...node, children: updateTreeChildren(node.children, parentId, newChildren) }
        return node
      })
    },
    []
  )

  const handleReorderChildren = useCallback(
    (parentId: string | null, newChildren: CategoryTree[]) => {
      setLocalTree(prev => updateTreeChildren(prev, parentId, newChildren))
      setPendingReorder(true)
    },
    [updateTreeChildren]
  )

  const handleSaveOrder = async () => {
    const orders: { id: string; order: number }[] = []
    const collect = (nodes: CategoryTree[]) => {
      nodes.forEach((node, idx) => {
        orders.push({ id: node.id, order: idx })
        if (node.children.length > 0) collect(node.children)
      })
    }
    collect(localTree)
    await saveReorder(
      { orders },
      {
        onSuccess: () => {
          toast.success(t('reorder_success'))
          setPendingReorder(false)
          fetchCategories()
        },
        onError: (error: string) => toast.error(error),
      }
    )
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return
    await createCategory(
      { name, description, parentId: parentId || undefined, locale },
      {
        onSuccess: () => {
          setName('')
          setDescription('')
          setParentId('')
          setLocale(currentLocale)
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

  const handleEdit = (cat: CategoryTree) => {
    setEditTarget(cat)
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
            {/* Locale selector */}
            <div className="form-control">
              <label className="label text-xs uppercase font-bold opacity-60 px-0">
                {t('locale')}
              </label>
              <select
                className="select select-bordered h-10 min-h-0 text-sm"
                value={locale}
                onChange={e => setLocale(e.target.value)}
              >
                {siteConfig.locale.supported.map(lang => (
                  <option key={lang.value} value={lang.value}>
                    {lang.nativeName} ({lang.label})
                  </option>
                ))}
              </select>
            </div>

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
                <span className={`badge badge-sm border shrink-0 ${LEVEL_COLORS[level - 1]}`}>
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
      <div className="md:col-span-2 space-y-6">
        {loading ? (
          <Card className="border border-base-content/10 overflow-hidden">
            <div className="p-8 flex justify-center">
              <span className="loading loading-spinner loading-md" />
            </div>
          </Card>
        ) : groupedTrees.length === 0 ? (
          <Card className="border border-base-content/10 overflow-hidden">
            <div className="p-10 text-center opacity-40">
              <FolderOpen size={40} className="mx-auto mb-3" />
              <p className="text-sm">{t('no_found')}</p>
            </div>
          </Card>
        ) : (
          groupedTrees.map(({ lang, nodes }) => (
            <Card key={lang.value} className="border border-base-content/10 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-base-content/10 bg-base-200/30">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">{lang.nativeName}</h3>
                  <span className="badge badge-sm badge-outline">{lang.label}</span>
                </div>
                <span className="text-xs opacity-50 font-mono">{lang.value}</span>
              </div>

              {pendingReorder && nodes.length > 0 && (
                <div className="flex items-center justify-end px-4 py-2 border-b border-base-content/10 bg-warning/5">
                  <span className="text-xs opacity-60 mr-3">{t('reorder_hint')}</span>
                  <Button
                    variant="primary"
                    className="btn-sm"
                    loading={reordering}
                    onClick={handleSaveOrder}
                  >
                    <Save size={14} /> {t('reorder_save')}
                  </Button>
                </div>
              )}

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
                    <SortableGroup
                      nodes={nodes}
                      parentId={null}
                      depth={0}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                      onReorderChildren={handleReorderChildren}
                      t={t}
                    />
                  </tbody>
                </table>
              </div>
            </Card>
          ))
        )}
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

      {editTarget && (
        <EditCategoryModal
          cat={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => fetchCategories()}
          t={t}
        />
      )}
    </div>
  )
}
