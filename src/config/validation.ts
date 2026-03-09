/**
 * Form validation configuration
 * Defines min/max length constraints for form inputs across the admin panel
 */

export const validationConfig = {
  // Category fields
  category: {
    name: {
      minLength: 2,
      maxLength: 50,
    },
    description: {
      minLength: 0,
      maxLength: 200,
    },
  },

  // Permission fields
  permission: {
    code: {
      minLength: 3,
      maxLength: 100,
    },
    name: {
      minLength: 2,
      maxLength: 100,
    },
    description: {
      minLength: 0,
      maxLength: 300,
    },
  },

  // Role fields
  role: {
    name: {
      minLength: 2,
      maxLength: 50,
    },
    description: {
      minLength: 0,
      maxLength: 200,
    },
  },

  // User fields
  user: {
    username: {
      minLength: 3,
      maxLength: 30,
    },
    email: {
      minLength: 5,
      maxLength: 100,
    },
    name: {
      minLength: 0,
      maxLength: 50,
    },
    password: {
      minLength: 8,
      maxLength: 128,
    },
  },

  // Product fields
  product: {
    name: {
      minLength: 2,
      maxLength: 100,
    },
    description: {
      minLength: 0,
      maxLength: 500,
    },
    slug: {
      minLength: 1,
      maxLength: 200,
    },
    stripePriceId: {
      minLength: 0,
      maxLength: 100,
    },
    stripeProductId: {
      minLength: 0,
      maxLength: 100,
    },
    paypalPlanId: {
      minLength: 0,
      maxLength: 100,
    },
    paypalProductId: {
      minLength: 0,
      maxLength: 100,
    },
    metadata: {
      minLength: 0,
      maxLength: 1000,
    },
  },

  // Post/Article/Page fields
  post: {
    title: {
      minLength: 1,
      maxLength: 200,
    },
    slug: {
      minLength: 1,
      maxLength: 200,
    },
    excerpt: {
      minLength: 0,
      maxLength: 500,
    },
    seoTitle: {
      minLength: 0,
      maxLength: 60,
    },
    seoDescription: {
      minLength: 0,
      maxLength: 160,
    },
    featuredImage: {
      minLength: 0,
      maxLength: 500,
    },
    tagName: {
      minLength: 1,
      maxLength: 30,
    },
  },
} as const
