export interface PricingFeature {
  text: string
  included: boolean
  tag?: string // e.g., "New", "Popular"
}

export interface PricingPlan {
  id: string
  name: string
  description?: string
  price: number
  originalPrice?: number
  currency: string
  interval: 'month' | 'year' | 'once'
  features: PricingFeature[]
  isFeatured?: boolean
  buttonText?: string
  stripePriceId: string
}


