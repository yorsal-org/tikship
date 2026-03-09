import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewProps } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react'
import { ExternalLink, X } from 'lucide-react'
import Image from 'next/image'

export interface ProductNodeAttributes {
  slug: string
  name: string
  price: number
  currency: string
  image?: string
  description?: string
}

// React component for rendering the product node
export function ProductNodeView({ node, deleteNode }: NodeViewProps) {
  const { slug, name, price, currency, image, description } = node.attrs as ProductNodeAttributes

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price / 100)
  }

  const productUrl = `/products/${slug}`

  return (
    <NodeViewWrapper className="product-node">
      <div className="border-2 border-primary/30 rounded-lg p-4 bg-base-100 my-4 relative group">
        <button
          onClick={deleteNode}
          className="absolute top-2 right-2 btn btn-ghost btn-xs btn-circle opacity-0 group-hover:opacity-100 transition-opacity"
          contentEditable={false}
        >
          <X size={14} />
        </button>
        <div className="flex gap-4">
          {image && (
            <div className="relative w-24 h-24 flex-shrink-0" contentEditable={false}>
              <Image
                src={image}
                alt={name}
                fill
                className="object-cover rounded"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-lg mb-1" contentEditable={false}>
              {name}
            </h4>
            {description && (
              <p className="text-sm opacity-70 line-clamp-2 mb-2" contentEditable={false}>
                {description}
              </p>
            )}
            <div className="flex items-center justify-between" contentEditable={false}>
              <span className="text-lg font-bold text-primary">
                {formatPrice(price, currency)}
              </span>
              <a
                href={productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm gap-1"
                contentEditable={false}
              >
                <ExternalLink size={14} />
                View Product
              </a>
            </div>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  )
}

// Tiptap extension definition
export const ProductNode = Node.create({
  name: 'productNode',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      slug: {
        default: '',
      },
      name: {
        default: '',
      },
      price: {
        default: 0,
      },
      currency: {
        default: 'usd',
      },
      image: {
        default: null,
      },
      description: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="product-node"]',
        getAttrs: (dom) => {
          if (typeof dom === 'string') return false
          const element = dom as HTMLElement
          return {
            slug: element.getAttribute('data-slug'),
            name: element.getAttribute('data-name'),
            price: parseInt(element.getAttribute('data-price') || '0'),
            currency: element.getAttribute('data-currency'),
            image: element.getAttribute('data-image') || null,
            description: element.getAttribute('data-description') || null,
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = mergeAttributes(HTMLAttributes, {
      'data-type': 'product-node',
      'data-slug': HTMLAttributes.slug,
      'data-name': HTMLAttributes.name,
      'data-price': HTMLAttributes.price,
      'data-currency': HTMLAttributes.currency,
      'data-image': HTMLAttributes.image || '',
      'data-description': HTMLAttributes.description || '',
    })
    
    // Return a div with data attributes and a placeholder text
    return ['div', attrs, `[Product: ${HTMLAttributes.name}]`]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ProductNodeView)
  },

  addCommands() {
    return {
      insertProduct:
        (attributes: ProductNodeAttributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          })
        },
    }
  },
})

// Extend the Commands type
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    productNode: {
      insertProduct: (attributes: ProductNodeAttributes) => ReturnType
    }
  }
}
