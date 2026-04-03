export const siteConfig = {
  supportEmail: 'support@tikship.top',
  favicon: '/favicon.svg',

  // API docs is enabled or disabled
  enable_api_docs: process.env.NEXT_PUBLIC_ENABLE_API_DOCS,

  // Theme configuration
  theme: {
    // Default theme mode: 'light', 'dark', or 'system'
    default: process.env.NEXT_PUBLIC_SYTEM_THEME ?? 'system',
    // DaisyUI light theme name
    lightTheme: process.env.NEXT_PUBLIC_LIGHT_THEME ?? 'silk',
    // DaisyUI dark theme name
    darkTheme: process.env.NEXT_PUBLIC_DARK_THEME ?? 'sunset',
  },

  // Locale configuration
  locale: {
    // Default application language, if empty, will load cookie , then Accept-Language header
    default: '',
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
      maxSize: 5,
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
    // change Admin path
    path: process.env.NEXT_PUBLIC_ADMIN_PATH ?? '/admin',
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
