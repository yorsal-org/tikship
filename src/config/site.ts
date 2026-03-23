export const siteConfig = {
  // Basic site information
  name: 'Tikship',
  description: 'A SaaS boilerplate for startup',
  keywords: [
    'SaaS boilerplate',
    'Next.js starter',
    'Next.js SaaS template',
    'Stripe integration',
    'PayPal integration',
    'authentication boilerplate',
    'admin dashboard',
    'i18n Next.js',
  ] as string[],
  supportEmail: 'support@tikship.top',
  favicon: '/favicon.svg',

  // API docs is enabled or disabled
  enable_api_docs: true,

  // Theme configuration
  theme: {
    // Default theme mode: 'light', 'dark', or 'system'
    default: 'system',
    // DaisyUI light theme name
    lightTheme: 'silk',
    // DaisyUI dark theme name
    darkTheme: 'sunset',
  },

  // Locale configuration
  locale: {
    // Default application language
    default: 'en',
    // List of supported languages with display names
    supported: [
      { value: 'en', label: 'English', nativeName: 'English' },
      { value: 'zh', label: 'Chinese', nativeName: '简体中文' },
      { value: 'es', label: 'Spanish', nativeName: 'Español' },
    ],
  },

  // Upload configuration
  upload: {
    image: {
      // Maximum file size for image uploads in bytes (e.g., 5MB)
      maxSize: 1024 * 1024 * 5,
      // Allowed MIME types for image images
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    },
  },

  // User Auth configuration
  auth: {
    loginLimits: {
      // Whether to enable login attempt limits
      enabled: true,
      // Maximum failed login attempts allowed before rate limiting
      maxAttempts: 10,
      // Duration of the rate limit window in minutes
      windowMinutes: 15,
    },
    password: {
      // Minimum password strength level required: 'weak', 'medium', or 'strong'
      minStrength: 'medium',
    },
  },

  // Admin configuration
  admin: {
    // Admin path prefix
    path: '/admin',
    pageSize: 10,
    password: {
      // Minimum password strength level required: 'weak', 'medium', or 'strong'
      minStrength: 'medium',
    },
    articlesImportLimits: 10,
  },

  // Payment configuration
  payment: {
    // Supported currencies
    currencies: [
      { value: 'usd', label: 'USD' },
      { value: 'eur', label: 'EUR' },
      { value: 'gbp', label: 'GBP' },
      { value: 'cny', label: 'CNY' },
      { value: 'hkd', label: 'HKD' },
    ],
    // Default currency
    defaultCurrency: 'usd',
    // Payment modes
    modes: [
      { value: 'payment', label: 'One-time Payment' },
      { value: 'subscription', label: 'Subscription' },
    ],
    // Default payment mode
    defaultMode: 'payment',
    // Subscription intervals
    intervals: [
      { value: 'day', label: 'Day' },
      { value: 'week', label: 'Week' },
      { value: 'month', label: 'Month' },
      { value: 'year', label: 'Year' },
    ],
    // Default subscription interval
    defaultInterval: 'month',
    // Default interval count
    defaultIntervalCount: 1,
  },
} as const

// i18n constants
export const locales = siteConfig.locale.supported.map(lang => lang.value) as string[]
export const defaultLocale = siteConfig.locale.default
