'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { siteConfig } from '@/config/site'

const LIGHT_THEME = siteConfig.theme.lightTheme
const DARK_THEME = siteConfig.theme.darkTheme

interface ThemeContextType {
  theme: string
  setTheme: (theme: string) => void
  resolvedTheme: string
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Get system theme preference
  const getSystemTheme = (): string => {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  // Resolve the actual theme to apply
  const resolveTheme = (currentTheme: string): string => {
    if (currentTheme === 'system') {
      return getSystemTheme()
    }
    return currentTheme
  }

  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return siteConfig.theme.default
    const storedTheme = localStorage.getItem('theme') as string | null
    return storedTheme || siteConfig.theme.default
  })

  const [resolvedTheme, setResolvedTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    const storedTheme = localStorage.getItem('theme') as string | null
    const initialTheme = storedTheme || siteConfig.theme.default
    if (initialTheme === 'system') {
      return getSystemTheme()
    }
    return initialTheme
  })

  // Apply theme to document
  const applyTheme = (actualTheme: string) => {
    if (typeof window === 'undefined') return

    const themeValue = actualTheme === 'dark' ? DARK_THEME : LIGHT_THEME
    document.documentElement.setAttribute('data-theme', themeValue)
  }

  // Apply theme on mount
  useEffect(() => {
    applyTheme(resolvedTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Listen to system theme changes
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      const newResolvedTheme = e.matches ? 'dark' : 'light'
      setResolvedTheme(newResolvedTheme)
      applyTheme(newResolvedTheme)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  // Set theme function
  const setTheme = (newTheme: string) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)

    const resolved = resolveTheme(newTheme)
    setResolvedTheme(resolved)
    applyTheme(resolved)
  }

  // Always provide context to avoid "useTheme must be used within ThemeProvider" error
  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
