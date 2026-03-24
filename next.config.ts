import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import { siteConfig } from './src/config/site'

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/config.ts')

// The alias path configured in siteConfig (e.g. '/secret-admin')
// Pages physically live at /admin but are only reachable via this alias path.
const adminAlias = siteConfig.admin.path

const nextConfig: NextConfig = {
  async rewrites() {
    // Only add alias rewrites when admin.path differs from the physical '/admin' directory
    if (adminAlias === ('/admin' as never)) return []
    return [
      {
        source: `${adminAlias}`,
        destination: '/admin',
      },
      {
        source: `${adminAlias}/:path*`,
        destination: '/admin/:path*',
      },
    ]
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.hailuoai.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's.coze.cn',
        pathname: '/**',
      },
    ],
  },
}

export default withNextIntl(nextConfig)
