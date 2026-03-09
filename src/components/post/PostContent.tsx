'use client'

import { useEffect, useRef, useState } from 'react'

interface ProductNodeData {
  slug: string
  name: string
  price: number
  currency: string
  image?: string
  description?: string
}

export function PostContent({ content }: { content: string }) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Use setTimeout to avoid setState during render
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!mounted || !contentRef.current) return

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (!contentRef.current) return

      // Find all product nodes in the content
      const productNodes = contentRef.current.querySelectorAll('[data-type="product-node"]')
      console.log('PostContent: Found product nodes:', productNodes.length)

      productNodes.forEach((node, index) => {
        const slug = node.getAttribute('slug')
        const name = node.getAttribute('name')
        const price = node.getAttribute('price')
        const currency = node.getAttribute('currency')
        const image = node.getAttribute('image')
        const description = node.getAttribute('description')

        if (!slug || !name || !price || !currency) {
          console.warn(`PostContent: Product node ${index} missing required attributes`)
          return
        }

        const productData: ProductNodeData = {
          slug,
          name,
          price: parseInt(price),
          currency,
          image: image || undefined,
          description: description || undefined,
        }

        // Create product card element
        const card = createProductCard(productData)
        node.replaceWith(card)
        console.log(`PostContent: Product node ${index} replaced with card`)
      })
    }, 100)

    return () => clearTimeout(timer)
  }, [content, mounted])

  if (!mounted) {
    return null
  }

  return (
    <div
      ref={contentRef}
      className="prose prose-base max-w-none prose-headings:font-bold prose-a:text-primary prose-img:rounded-xl prose-pre:bg-base-300 prose-pre:text-base-content"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}

function createProductCard(data: ProductNodeData): HTMLElement {
  const card = document.createElement('div')
  card.className = 'not-prose border-2 border-primary/30 rounded-lg p-4 bg-base-100 my-6'

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price / 100)
  }

  const productUrl = `/products/${data.slug}`

  card.innerHTML = `
    <div class="flex gap-4 flex-col sm:flex-row">
      ${
        data.image
          ? `<img 
          src="${data.image}" 
          alt="${data.name}" 
          class="w-full sm:w-24 h-48 sm:h-24 object-cover rounded flex-shrink-0"
        />`
          : ''
      }
      <div class="flex-1 min-w-0">
        <h4 class="font-semibold text-lg mb-1">${data.name}</h4>
        ${
          data.description
            ? `<p class="text-sm opacity-70 line-clamp-2 mb-2">${data.description}</p>`
            : ''
        }
        <div class="flex items-center justify-between flex-wrap gap-2">
          <span class="text-lg font-bold text-primary">
            ${formatPrice(data.price, data.currency)}
          </span>
          <a
            href="${productUrl}"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-primary btn-sm gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            View Product
          </a>
        </div>
      </div>
    </div>
  `

  return card
}
