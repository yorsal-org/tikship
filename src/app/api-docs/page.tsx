'use client'

import { ApiReferenceReact } from '@scalar/api-reference-react'
import '@scalar/api-reference-react/style.css'

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-base-100">
      <style jsx global>{`
        /* Override Scalar styles to match daisyUI theme */
        .scalar-app {
          --scalar-font: 'SpaceGrotesk', sans-serif !important;
          --scalar-font-code: ui-monospace, monospace !important;
        }

        /* Light theme colors from daisyUI */
        [data-theme='light'] .scalar-app,
        .scalar-app[data-theme='light'] {
          --scalar-color-1: hsl(var(--b1)) !important;
          --scalar-color-2: hsl(var(--b2)) !important;
          --scalar-color-3: hsl(var(--b3)) !important;
          --scalar-background-1: hsl(var(--b1)) !important;
          --scalar-background-2: hsl(var(--b2)) !important;
          --scalar-background-3: hsl(var(--b3)) !important;
          --scalar-color-accent: hsl(var(--p)) !important;
          --scalar-border-color: hsl(var(--bc) / 0.2) !important;
        }

        /* Dark theme colors from daisyUI */
        [data-theme='dark'] .scalar-app,
        .scalar-app[data-theme='dark'] {
          --scalar-color-1: hsl(var(--b1)) !important;
          --scalar-color-2: hsl(var(--b2)) !important;
          --scalar-color-3: hsl(var(--b3)) !important;
          --scalar-background-1: hsl(var(--b1)) !important;
          --scalar-background-2: hsl(var(--b2)) !important;
          --scalar-background-3: hsl(var(--b3)) !important;
          --scalar-color-accent: hsl(var(--p)) !important;
          --scalar-border-color: hsl(var(--bc) / 0.2) !important;
        }
      `}</style>

      <ApiReferenceReact
        configuration={{
          _integration: 'nextjs',
          url: '/openapi.json',
          layout: 'modern',
          showSidebar: true,
          searchHotKey: 'k',
          metaData: {
            title: 'TikShip API Documentation',
            description: 'Complete API documentation for TikShip platform',
          },
        }}
      />
    </div>
  )
}
