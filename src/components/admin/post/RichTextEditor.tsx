'use client'

import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { useTranslations } from 'next-intl'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Code,
  Package,
} from 'lucide-react'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { ProductNode } from './extensions/ProductNode'
import { ProductSelector } from './ProductSelector'
import { Product } from '@/types/product'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const t = useTranslations('admin.posts')
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [showProductSelector, setShowProductSelector] = useState(false)
  const [imageUrl, setImageUrl] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      ProductNode,
      Placeholder.configure({
        placeholder: placeholder || t('editor.content_placeholder'),
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose-base lg:prose-base m-5 focus:outline-none min-h-[300px] max-w-none',
      },
    },
  })

  if (!editor) return null

  const addImage = () => {
    setImageUrl('')
    setShowImageUpload(true)
  }

  const handleImageInsert = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run()
      setShowImageUpload(false)
      setImageUrl('')
    }
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt(t('editor.link_url_prompt') || 'URL', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const handleProductSelect = (product: Product) => {
    editor
      .chain()
      .focus()
      .insertProduct({
        slug: product.slug,
        name: product.name,
        price: product.price,
        currency: product.currency,
        image: product.image || undefined,
        description: product.description || undefined,
      })
      .run()
    setShowProductSelector(false)
  }

  return (
    <>
      <div className="border border-base-content/20 rounded-lg overflow-hidden bg-base-100 focus-within:border-primary transition-colors">
        <div className="bg-base-200/50 p-2 border-b border-base-content/10 flex flex-wrap gap-0">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`btn btn-sm btn-ghost ${editor.isActive('bold') ? 'btn-active' : ''}`}
            type="button"
          >
            <Bold size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`btn btn-sm btn-ghost ${editor.isActive('italic') ? 'btn-active' : ''}`}
            type="button"
          >
            <Italic size={18} />
          </button>
          <div className="divider divider-horizontal mx-0 h-8"></div>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`btn btn-sm btn-ghost ${editor.isActive('heading', { level: 1 }) ? 'btn-active' : ''}`}
            type="button"
          >
            <Heading1 size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`btn btn-sm btn-ghost ${editor.isActive('heading', { level: 2 }) ? 'btn-active' : ''}`}
            type="button"
          >
            <Heading2 size={18} />
          </button>
          <div className="divider divider-horizontal mx-0 h-8"></div>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`btn btn-sm btn-ghost ${editor.isActive('bulletList') ? 'btn-active' : ''}`}
            type="button"
          >
            <List size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`btn btn-sm btn-ghost ${editor.isActive('orderedList') ? 'btn-active' : ''}`}
            type="button"
          >
            <ListOrdered size={18} />
          </button>
          <div className="divider divider-horizontal mx-0 h-8"></div>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`btn btn-sm btn-ghost ${editor.isActive('blockquote') ? 'btn-active' : ''}`}
            type="button"
          >
            <Quote size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`btn btn-sm btn-ghost ${editor.isActive('code') ? 'btn-active' : ''}`}
            type="button"
          >
            <Code size={18} />
          </button>
          <div className="divider divider-horizontal mx-0 h-8"></div>
          <button
            onClick={setLink}
            className={`btn btn-sm btn-ghost ${editor.isActive('link') ? 'btn-active' : ''}`}
            type="button"
          >
            <LinkIcon size={18} />
          </button>
          <button onClick={addImage} className="btn btn-sm btn-ghost" type="button">
            <ImageIcon size={18} />
          </button>
          <button
            onClick={() => setShowProductSelector(true)}
            className="btn btn-sm btn-ghost"
            type="button"
            title={t('editor.add_product')}
          >
            <Package size={18} />
          </button>
          <div className="flex-1"></div>
          <button
            onClick={() => editor.chain().focus().undo().run()}
            className="btn btn-sm btn-ghost"
            disabled={!editor.can().undo()}
            type="button"
          >
            <Undo size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            className="btn btn-sm btn-ghost"
            disabled={!editor.can().redo()}
            type="button"
          >
            <Redo size={18} />
          </button>
        </div>
        <div className="tiptap-editor-content bg-base-100">
          <EditorContent editor={editor} />
        </div>

        <style jsx global>{`
          .tiptap p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            color: #adb5bd;
            pointer-events: none;
            height: 0;
          }
          .tiptap-editor-content .tiptap {
            outline: none;
            padding: 1rem;
            min-height: 400px;
          }
          .tiptap-editor-content .tiptap h1 {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 1rem;
          }
          .tiptap-editor-content .tiptap h2 {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 0.75rem;
          }
          .tiptap-editor-content .tiptap ul {
            list-style-type: disc;
            padding-left: 1.5rem;
            margin-bottom: 1rem;
          }
          .tiptap-editor-content .tiptap ol {
            list-style-type: decimal;
            padding-left: 1.5rem;
            margin-bottom: 1rem;
          }
          .tiptap-editor-content .tiptap blockquote {
            border-left: 4px solid #ccc;
            padding-left: 1rem;
            font-style: italic;
            margin-bottom: 1rem;
          }
          .tiptap-editor-content .tiptap img {
            max-width: 100%;
            height: auto;
            border-radius: 0.5rem;
          }
          .tiptap-editor-content .product-node {
            margin: 1rem 0;
          }
          .tiptap-editor-content .product-node [contenteditable='false'] {
            user-select: none;
          }
        `}</style>
      </div>

      {/* Image Upload Modal */}
      {showImageUpload && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">{t('editor.insert_image')}</h3>
            <ImageUpload
              value={imageUrl}
              onChange={setImageUrl}
              label={t('editor.upload_image')}
              placeholder="https://example.com/image.jpg"
            />
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setShowImageUpload(false)
                  setImageUrl('')
                }}
              >
                {t('editor.cancel')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleImageInsert}
                disabled={!imageUrl}
              >
                {t('editor.insert')}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowImageUpload(false)}></div>
        </div>
      )}

      {/* Product Selector Modal */}
      {showProductSelector && (
        <ProductSelector
          onSelect={handleProductSelect}
          onClose={() => setShowProductSelector(false)}
        />
      )}
    </>
  )
}
