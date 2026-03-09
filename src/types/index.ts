export interface SiteConfig {
  name: string
  description: string
  url: string
  ogImage: string
  links: {
    twitter: string
    github: string
  }
}

// Re-export all types
export * from './admin'
export * from './api'
export * from './email'
export * from './post'
export * from './pricing'
export * from './stripe'
export * from './ui'
export * from './upload'
export * from './product'
export * from './order'
